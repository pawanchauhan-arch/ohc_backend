import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Consultation } from '../../models/Consultation';
import { Request } from '../../models/Request';
import { Doctor } from '../../models/Doctor';
import { Center } from '../../models/Center';
import { Sequelize } from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { Prescription } from 'src/models/Prescription';
import { DRIVERMASTER } from 'src/models/DriverMaster';
import { CenterGroup } from 'src/models/CenterGroup';
import { Op, QueryTypes } from 'sequelize';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationPriority } from '../../models/notification.model';
import { ConsultationRecordingService } from '../consultationRecording/consultationRecording.service';
import { DailyVideoService } from '../dailyVideoCall/dailyVideo.service';
import { PaginationResponse } from '../../models/PaginationResponse';
import { getOperationalDateRangeWindow, getOperationalDayWindow } from '../../utils/operational-day.util';

@Injectable()
export class ConsultationService {
  constructor(
    @InjectModel(Consultation)
    private readonly consultationModel: typeof Consultation,

    @InjectModel(Request)
    private readonly requestModel: typeof Request,

    @InjectModel(Doctor)
    private readonly doctorModel: typeof Doctor,

    @InjectModel(Center)
    private readonly centerModel: typeof Center,

    @InjectModel(Prescription)  // ✅ Inject Prescription Model
    private readonly prescriptionModel: typeof Prescription,

    @InjectModel(DRIVERMASTER)  // ✅ Inject DRIVERMASTER Model
    private readonly driverMasterModel: typeof DRIVERMASTER,

    @InjectModel(CenterGroup)
    private readonly centerGroupModel: typeof CenterGroup,

    private readonly sequelize: Sequelize, // Inject Sequelize for transactions

    private readonly notificationsService: NotificationsService, // Inject the NotificationsService

    private consultationRecordingService: ConsultationRecordingService,

    private readonly dailyVideoService: DailyVideoService,
  ) { }

  /**
   * Creates a consultation with optional centerID validation
   */
  async createConsultation(data: Partial<Consultation>): Promise<Consultation> {
    console.log("📥 Incoming Data in createConsultation service:", data);

    return await this.sequelize.transaction(async (transaction) => {
      await this.validateRequestExists(data.request_id, transaction);
      await this.validateCenterExists(data.centerID, transaction);

      // Generate Consultation ID
      if (!data.consultation_id) {
        data.consultation_id = uuidv4();
      }

      const doctor = await this.validateDoctorExists(data.doctor_id, transaction);

      const timestamp = Date.now();
      const roomName = `consult_${data.driver_id}_${data.doctor_id}_${timestamp}`;
      const scheduledTime = data.scheduled_time;

      // ✅ Call Daily.co room creation
      const scheduledTimeString: string | undefined = data.scheduled_time
        ? (data.scheduled_time instanceof Date
          ? data.scheduled_time.toISOString()
          : String(data.scheduled_time))
        : undefined;

      const dailyRoom = await this.dailyVideoService.createRoom(roomName, scheduledTimeString);

      data.room_name = roomName;
      data.meet_link = dailyRoom.url; // Set Daily meeting link
      data.isBooked = true;

      console.log("💾 Storing to DB:", data);

      // ✅ Create consultation
      const consultation = await this.consultationModel.create(data, { transaction });
      console.log("📝 Created Consultation:", consultation.toJSON());

      // ✅ Create an empty prescription linked to this consultation
      const prescription = await this.prescriptionModel.create(
        {
          prescription_id: uuidv4(),
          consultation_id: consultation.consultation_id,
          doctor_id: consultation.doctor_id,
          driver_id: consultation.driver_id,
          instructions: [],
          lab: [],
          other_lab: "",
          chief_complaints: [],
          follow_up: null,
          preventive_advice: [],
          prescription_slip_image: "",
          prescription_slip_text: "",
          uploaded: false,
          vitals: {},
          health_conditions: {},
          drug_allergies: [],
          fitness_status: null,
        },
        { transaction }
      );

      // ✅ Update request status
      await this.requestModel.update(
        { status: true },
        { where: { request_id: data.request_id }, transaction }
      );

      // ✅ Notifications
      try {
        const driver = await this.driverMasterModel.findByPk(consultation.driver_id);

        if (driver?.contactNumber) {
          await this.notificationsService.create({
            phone_number: driver.contactNumber,
            title: 'New Consultation Scheduled',
            message: `A new consultation has been scheduled for you at ${consultation.scheduled_time || 'soon'}. Please check your schedule.`,
            priority: NotificationPriority.TYPE1,
          });
        }

        if (doctor?.contact_number) {
          await this.notificationsService.create({
            phone_number: doctor.contact_number,
            title: 'New Consultation Assigned',
            message: `You have been assigned a new consultation scheduled for ${consultation.scheduled_time || 'soon'}.`,
            priority: NotificationPriority.TYPE1,
          });
        }
      } catch (error) {
        console.error('Failed to send consultation notifications:', error);
      }

      return consultation;
    });
  }

  /**
   * Get all consultations with pagination and optional centerID filtering
   * Returns all consultations without time-based filtering
   */
  async getAllConsultations(limit = 1000, offset = 0, centerID?: number): Promise<Consultation[]> {
    // Fetch all consultations (no center filter at query level)
    const consultations = await this.consultationModel.findAll({
      limit,
      offset,
      order: [['createdAt', 'DESC']], // Sort by latest first
      include: [
        {
          model: DRIVERMASTER,
          as: 'consultation_driver', // Matches the alias in the model
          attributes: ['name', 'contactNumber'], // Fetch only required fields
          required: false, // Fix: Allow consultations without valid driver records
        },
        {
          model: this.centerModel,
          as: 'consultationCenter',
          attributes: ['id', 'project_name', 'center_shortcode'],
          required: false,
        },
      ],
    });

    // ------------------- QUEUE LOGIC -------------------
    // Group data by doctor + scheduled date
    const groups: { [key: string]: any[] } = {};

    consultations.forEach((item) => {
      const scheduledDate = new Date(item.scheduled_time).toISOString().split('T')[0];
      const key = `${item.doctor_id}-${scheduledDate}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    // For each doctor-center-date group → sort, assign queue, and current token
    Object.values(groups).forEach((group) => {
      group
        .sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime())
        .forEach((item, index) => {
          item.dataValues.queue_order = index + 1; // queue per doctor-center-date
        });
      const pendingConsultations = group.filter((item) => item.iscomplete === false);
      const currentTokenNumber = pendingConsultations.length > 0
        ? Math.min(...pendingConsultations.map((item) => item.dataValues.queue_order))
        : null;
      group.forEach((item) => {
        item.dataValues.current_token_number = currentTokenNumber;
      });
    });
    // ---------------------------------------------------

    // Apply center filter at the end
    if (centerID !== undefined && centerID !== null) {
      return consultations.filter((c) => c.centerID === centerID);
    }

    return consultations;
  }

  /**
   * Get consultations with full pagination metadata
   * Returns data wrapped in pagination object while maintaining the same consultation structure
   */

  async getAllConsultationsPaginated(
    page = 1,
    limit = 10,
    centerIDs?: number[],
    daysBack?: number,
    centerGroupIds?: number[],
    isCompleteBool?: boolean,
    startDate?: string,
    endDate?: string,
    doctorName?: string,
  ): Promise<PaginationResponse<Consultation>> {

    const whereClause: any = {};

    // Filter by completed status if specified
    if (isCompleteBool !== undefined && isCompleteBool !== null) {
      whereClause.iscomplete = isCompleteBool;
    }

    // Filter by Doctor Name if specified
    if (doctorName && doctorName.trim()) {
      whereClause.doctor_name = { [Op.iLike]: `%${doctorName.trim()}%` };
    }

    // Filter by date range (startDate & endDate) using operational day window (06:00 AM IST to 05:59:59 AM IST)
    if (startDate && endDate) {
      const window = getOperationalDateRangeWindow(startDate, endDate);
      whereClause.scheduled_time = { [Op.between]: [new Date(window.startUtc), new Date(window.endUtc)] };
    } else if (startDate) {
      const window = getOperationalDayWindow(startDate);
      whereClause.scheduled_time = { [Op.gte]: new Date(window.startUtc) };
    } else if (endDate) {
      const window = getOperationalDayWindow(endDate);
      whereClause.scheduled_time = { [Op.lte]: new Date(window.endUtc) };
    }

    // Filter by center groups if provided
    if (centerGroupIds && centerGroupIds.length > 0) {
      // Validate and fetch center groups
      const groups = await this.centerGroupModel.findAll({
        where: {
          id: { [Op.in]: centerGroupIds },
          is_active: true
        },
        attributes: ['id', 'center_ids']
      });

      if (groups.length === 0) {
        // No valid active groups found, return empty result
        return {
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        };
      }

      // Extract and flatten all center IDs from the groups
      const groupCenterIds: number[] = [];
      groups.forEach(group => {
        if (Array.isArray(group.center_ids)) {
          const centerIds = group.center_ids
            .map(value => Number(value))
            .filter((value): value is number => Number.isFinite(value));
          groupCenterIds.push(...centerIds);
        }
      });

      // Remove duplicates
      const uniqueCenterIds = Array.from(new Set(groupCenterIds));

      if (uniqueCenterIds.length === 0) {
        // No centers found in groups, return empty result
        return {
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        };
      }

      // If centerIDs is also provided, intersect with group center IDs
      if (centerIDs && centerIDs.length > 0) {
        const intersected = centerIDs.filter(id => uniqueCenterIds.includes(id));
        if (intersected.length > 0) {
          whereClause.centerID = intersected.length === 1 ? intersected[0] : { [Op.in]: intersected };
        } else {
          return {
            data: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0,
              hasNextPage: false,
              hasPreviousPage: false,
            },
          };
        }
      } else {
        // No centerIDs provided, filter by all centers from groups
        whereClause.centerID = { [Op.in]: uniqueCenterIds };
      }
    } else {
      // Filter by center (only if group filter is not applied)
      if (centerIDs && centerIDs.length > 0) {
        whereClause.centerID = centerIDs.length === 1 ? centerIDs[0] : { [Op.in]: centerIDs };
      }
    }

    // Apply createdAt filter only when daysBack > 0 and date range is not specified
    if (!startDate && !endDate && daysBack !== undefined && daysBack !== null && daysBack > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);
      whereClause.createdAt = { [Op.gte]: cutoffDate };
    }

    // Pagination offset
    const offset = (page - 1) * limit;

    // Count total matching rows
    const total = await this.consultationModel.count({ where: whereClause });

    // Fetch paginated data
    const consultations = await this.consultationModel.findAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: DRIVERMASTER,
          as: 'consultation_driver',
          attributes: ['name', 'contactNumber'],
        },
        {
          model: this.centerModel,
          as: 'consultationCenter',
          attributes: ['id', 'project_name', 'center_shortcode'],
        },
      ],
    });

    // ------------------- QUEUE LOGIC -------------------

    const isTodayQueue = daysBack === 0 || daysBack === undefined;

    if (isTodayQueue) {

      // Group data by doctor + center
      const groups: { [key: string]: any[] } = {};

      consultations.forEach((item) => {
        // const key = `${item.doctor_id}-${item.centerID}`;
        const scheduledDate = new Date(item.scheduled_time).toISOString().split('T')[0];
        const key = `${item.doctor_id}-${scheduledDate}`;

        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
      });

      // For each doctor-center group → sort & assign queue
      Object.values(groups).forEach((group) => {
        group
          .sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime())
          .forEach((item, index) => {
            item.dataValues.queue_order = index + 1; // queue per doctor
          });
      });
    }

    // ---------------------------------------------------


    const totalPages = Math.ceil(total / limit);

    return {
      data: consultations, // queue_order included inside each record
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }



  // Get all consultations for a specific driver
  async getConsultationsByDriverId(driverId: number): Promise<Consultation[]> {
    // Find consultations where driver_id matches
    const consultations = await this.consultationModel.findAll({ where: { driver_id: driverId } });

    if (consultations.length === 0) {
      throw new NotFoundException(`No consultations found for driver with ID ${driverId}`);
    }

    return consultations;
  }

  // Get consultation by ID
  async getConsultationById(id: string): Promise<Consultation> {
    const consultation = await this.consultationModel.findByPk(id);
    if (!consultation) {
      throw new NotFoundException(`Consultation with ID ${id} not found.`);
    }
    return consultation;
  }

  // Update consultation
  async updateConsultation(id: string, data: Partial<Consultation>): Promise<Consultation | null> {
    return await this.sequelize.transaction(async (transaction) => {
      const consultation = await this.consultationModel.findOne({
        where: { consultation_id: id },
        transaction,
      });

      if (!consultation) {
        throw new NotFoundException(`Consultation with ID ${id} not found.`);
      }

      const updateData: Partial<Consultation> = { ...data };

      if (updateData.doctor_id) {
        const doctor = await this.validateDoctorExists(updateData.doctor_id, transaction);
        if (doctor && !updateData.doctor_name) {
          updateData.doctor_name = doctor.user?.username || consultation.doctor_name;
        }
      }

      const [rowsUpdated, [updatedConsultation]] = await this.consultationModel.update(
        updateData,
        {
          where: { consultation_id: id },
          returning: true,
          transaction,
        },
      );

      if (rowsUpdated === 0) {
        throw new NotFoundException(`Consultation with ID ${id} not found.`);
      }

      if (updateData.doctor_id) {
        await this.prescriptionModel.update(
          { doctor_id: updateData.doctor_id },
          {
            where: { consultation_id: id },
            transaction,
          },
        );
      }

      return updatedConsultation;
    });
  }

  // Soft delete consultation
  async deleteConsultation(id: string): Promise<boolean> {
    const rowsDeleted = await this.consultationModel.destroy({
      where: { consultation_id: id },
    });

    if (rowsDeleted === 0) {
      throw new NotFoundException(`Consultation with ID ${id} not found.`);
    }

    return true;
  }
  // Get consultations for a specific driver with status = true
  async getCompletedConsultationsByDriverId(driverId: number): Promise<Consultation[]> {
    // Find consultations where driver_id matches and status = true
    const consultations = await this.consultationModel.findAll({
      where: {
        driver_id: driverId,
        isBooked: true, // Assuming `isBooked` indicates the consultation's status
      },
    });

    if (consultations.length === 0) {
      throw new NotFoundException(`No completed consultations found for driver with ID ${driverId}.`);
    }

    return consultations;
  }

  // Get the latest consultation by request ID
  async getLatestConsultationByRequestId(requestId: string): Promise<Consultation> {
    const consultation = await this.consultationModel.findOne({
      where: { request_id: requestId },
      order: [['createdAt', 'DESC']], // Sort by createdAt in descending order to get the latest one
    });

    if (!consultation) {
      throw new NotFoundException(`No consultations found for Request ID ${requestId}.`);
    }

    return consultation;
  }

  // ✅ Mark a consultation as complete
  async markConsultationComplete(id: string): Promise<Consultation> {
    const consultation = await this.consultationModel.findByPk(id);

    if (!consultation) {
      throw new NotFoundException(`Consultation with ID ${id} not found.`);
    }

    await consultation.update({ iscomplete: true });

    return consultation;
  }

  async getConsultationsByDoctorId(doctorId: number): Promise<Consultation[]> {
    console.log('Service - Doctor ID:', doctorId);

    // Calculate the timestamp for 24 hours ago
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // Fetch consultations created in the past 24 hours for the specific doctor, sorted by scheduled_time ascending
    const consultations = await this.consultationModel.findAll({
      where: {
        doctor_id: doctorId, // Match doctor_id in Consultation model
        createdAt: {
          [Op.gte]: twentyFourHoursAgo, // Only fetch consultations created in the past 24 hours
        },
      },
      include: [
        {
          model: this.driverMasterModel,
          as: 'consultation_driver',
          attributes: ['name', 'contactNumber'], // Include only the name and contactNumber
          required: false, // Fix: Allow consultations without valid driver records
        },
      ],
      order: [['scheduled_time', 'ASC']], // Sort by scheduled time in ascending order
    });

    // If no consultations are found, throw an error
    if (!consultations || consultations.length === 0) {
      throw new NotFoundException(
        `No consultations found for doctor with ID ${doctorId} in the last 24 hours`,
      );
    }

    // Process the results to ensure driver name is included in the response
    const processedConsultations = consultations.map(consultation => {
      const consultationJson = consultation.toJSON();

      // Add driver_name to the main object if consultation_driver exists
      if (consultationJson.consultation_driver && consultationJson.consultation_driver.name) {
        consultationJson.driver_name = consultationJson.consultation_driver.name;
      }

      return consultationJson;
    });

    return processedConsultations;
  }
  async getAllConsultationsByDoctorId(doctorId: number): Promise<Consultation[]> {
    console.log('Service - Doctor ID:', doctorId);

    // Fetch consultations for the specific doctor, sorted by scheduled_time ascending
    const consultations = await this.consultationModel.findAll({
      where: {
        doctor_id: doctorId, // Match doctor_id in Consultation model
      },
      include: [
        {
          model: this.driverMasterModel,
          as: 'consultation_driver',
          attributes: ['name', 'contactNumber'], // Include only the name and contactNumber
          required: false, // Fix: Allow consultations without valid driver records
        },
      ],
      order: [['scheduled_time', 'ASC']], // Sort by scheduled time in ascending order
    });

    // Process the results to ensure driver name is included in the response
    const processedConsultations = consultations.map(consultation => {
      const consultationJson = consultation.toJSON();

      // Add driver_name to the main object if consultation_driver exists
      if (consultationJson.consultation_driver && consultationJson.consultation_driver.name) {
        consultationJson.driver_name = consultationJson.consultation_driver.name;
      }

      return consultationJson;
    });

    return processedConsultations;
  }

  /**
   * Validates if request exists
   */
  private async validateRequestExists(requestId: string, transaction?: any): Promise<Request> {
    if (!requestId) {
      throw new NotFoundException('Request ID is required.');
    }

    const request = await this.requestModel.findByPk(requestId, { transaction });
    if (!request) {
      throw new NotFoundException(`Request with ID ${requestId} not found.`);
    }

    return request;
  }

  /**
   * Validates if center exists (when centerID is provided)
   */
  private async validateCenterExists(centerID?: number, transaction?: any): Promise<Center | null> {
    if (centerID !== undefined && centerID !== null) {
      const center = await this.centerModel.findByPk(centerID, { transaction });
      if (!center) {
        throw new NotFoundException(`Center with ID ${centerID} not found.`);
      }
      return center;
    }
    return null;
  }

  /**
   * Validates if doctor exists (when doctor_id is provided)
   */
  private async validateDoctorExists(doctorId?: number, transaction?: any): Promise<Doctor | null> {
    if (doctorId) {
      const doctor = await this.doctorModel.findByPk(doctorId, { transaction });
      if (!doctor) {
        throw new NotFoundException(`Doctor with ID ${doctorId} not found.`);
      }
      return doctor;
    }
    return null;
  }
  async getConsultationsForUser(userId: number, filters: any = {}) {
    const [user] = await this.sequelize.query<{ attributes: any }>(
      `SELECT attributes FROM "Users" WHERE id = :userId`,
      {
        replacements: { userId },
        type: QueryTypes.SELECT,
      }
    );

    const attributes = user?.attributes || {};
    const groupIds: number[] = attributes.center_groups?.map((g: any) => g.id) || [];

    let groupCenterIds: number[] = [];
    if (groupIds.length > 0) {
      const groupRows = await this.sequelize.query<{ center_ids: number[] | null }>(
        `SELECT center_ids FROM center_groups WHERE id IN (:groupIds)`,
        {
          replacements: { groupIds },
          type: QueryTypes.SELECT,
        }
      );
      groupCenterIds = groupRows.flatMap(r => r.center_ids || []);
    }

    const centerUserRows = await this.sequelize.query<{ center_id: number }>(
      `SELECT center_id FROM "Centerusers" WHERE user_id = :userId`,
      {
        replacements: { userId },
        type: QueryTypes.SELECT,
      }
    );
    const directCenterIds = centerUserRows.map(r => r.center_id);

    const allowedCenterIds = Array.from(new Set([...groupCenterIds, ...directCenterIds]));

    const centerDropDownData = allowedCenterIds.length > 0
      ? await this.sequelize.query<{ center_name: string, id: number }>(
        `SELECT "project_name" || '(' || "agency_district" || ')' AS center_name, id 
         FROM "Centers" WHERE id IN (:allowedCenterIds)`,
        {
          replacements: { allowedCenterIds },
          type: QueryTypes.SELECT,
        }
      )
      : [];

    if (allowedCenterIds.length === 0) {
      return { centerIds: [], data: [], centerDropDownData: [] };
    }

    const whereClauses: string[] = [];
    const replacements: any = {};

    let centerIds: number[] = [];

    if (filters.centerID !== undefined && filters.centerID !== null) {
      if (Array.isArray(filters.centerID)) {
        centerIds = filters.centerID
          .map(id => Number(id))
          .filter(id => !isNaN(id));
      } else {
        const id = Number(filters.centerID);
        if (!isNaN(id)) {
          centerIds = [id];
        }
      }
    }

    if (centerIds.length > 0) {
      whereClauses.push(`c."centerID" IN (:centerID)`);
      replacements.centerID = centerIds;
    } else {
      whereClauses.push(`c."centerID" IN (:allowedCenterIds)`);
      replacements.allowedCenterIds = allowedCenterIds;
    }


    if (filters.iscomplete !== undefined && filters.iscomplete !== null && filters.iscomplete !== "") {
      const iscompleteValue = Number(filters.iscomplete);
      if (!isNaN(iscompleteValue)) {
        whereClauses.push(`c."iscomplete" = :iscomplete`);
        replacements.iscomplete = iscompleteValue == 1 ? true : false;
      }
    }

    if (filters.isBooked !== undefined && filters.isBooked !== null && filters.isBooked !== "") {
      const isBookedValue = Number(filters.isBooked);
      if (!isNaN(isBookedValue)) {
        whereClauses.push(`c."isBooked" = :isBooked`);
        replacements.isBooked = isBookedValue == 1 ? true : false;
      }
    }

    if (filters.startDate && filters.endDate) {
      const window = getOperationalDateRangeWindow(filters.startDate, filters.endDate);
      whereClauses.push(`c."scheduled_time" BETWEEN :startUtc AND :endUtc`);
      replacements.startUtc = window.startUtc;
      replacements.endUtc = window.endUtc;
    }

    if (filters.lastHours) {
      const hours = Number(filters.lastHours);
      if (!isNaN(hours) && hours > 0) {
        whereClauses.push(`c."createdAt" >= NOW() - INTERVAL '1 hour' * :lastHours`);
        replacements.lastHours = hours;
      }
    }

    const whereSQL = "WHERE " + whereClauses.join(" AND ");

    const consultations = await this.sequelize.query(
      `
    SELECT 
      c.*, 
      d.name AS driver_name,
      d.gender AS driver_gender,
      d."localAddress" AS driver_local_address,
      d."contactNumber" AS driver_contact_number,
      ct.project_name as center_name
    FROM consultation c
    LEFT JOIN "DRIVERMASTERs" d ON c.driver_id = d.id
    LEFT JOIN "Centers" ct ON ct.id = c."centerID"
    ${whereSQL}
    ORDER BY c."createdAt" DESC
    `,
      { replacements, type: QueryTypes.SELECT }
    );

    return {
      centerIds: allowedCenterIds,
      data: consultations,
      centerDropDownData
    };
  }
}
