import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { FITNESS_STATUS_VALUES, Prescription } from '../../models/Prescription';
import { Consultation } from '../../models/Consultation';
import { v4 as uuidv4 } from 'uuid';
import { User } from 'src/models/User';
import { Doctor } from 'src/models/Doctor';
import * as AWS from 'aws-sdk';
import {
  BUCKET_NAME_PRESCRIPTION,
  PRESCRIPTION_GOV_GROUP_NAME,
} from 'config/envConfig';
import { uploadToS3 } from 'src/utils/s3-image-upload';
import { PrescriptionMedicine } from 'src/models/PrescriptionMedicine';
import { DRIVERMASTER } from 'src/models/DriverMaster';
import { generatePrescriptionPdf } from 'src/utils/pdf-generator.util';
import { PrescriptionEditLogsService } from 'src/modules/PrescriptionEditLogs/PrescriptionEditLogs.service';
import { driverhealthcheckup } from '../../models/DriverHealthCheckup';
import { FindOptions, Op } from 'sequelize';
import { CenterGroup } from 'src/models/CenterGroup';
import { Center } from 'src/models/Center';
import {
  CHECKUP_STATUS_DOCTOR_CONSULTATION,
} from '../instavans-parkflow/mappers/instavans-status.mapper';
import { InstavansParkflowService } from '../instavans-parkflow/instavans-parkflow.service';

@Injectable()
export class PrescriptionService {
  private s3: AWS.S3;
  private readonly BUCKET_NAME: string = BUCKET_NAME_PRESCRIPTION;
  private readonly logger = new Logger(PrescriptionService.name);
  private readonly allowedFitnessStatuses = new Set<string>(
    FITNESS_STATUS_VALUES,
  );

  constructor(
    @InjectModel(Prescription)
    private readonly prescriptionModel: typeof Prescription,

    @InjectModel(Consultation)
    private readonly consultationModel: typeof Consultation,

    @InjectModel(PrescriptionMedicine)
    private readonly prescriptionMedicineModel: typeof PrescriptionMedicine,

    @InjectModel(Doctor)
    private readonly doctorModel: typeof Doctor,

    private readonly prescriptionEditLogsService: PrescriptionEditLogsService,

    private readonly sequelize: Sequelize, // Inject Sequelize for transactions

    @InjectModel(DRIVERMASTER)
    private driverMasterModel: typeof DRIVERMASTER,

    @InjectModel(driverhealthcheckup)
    private readonly driverHealthCheckupModel: typeof driverhealthcheckup,
    private readonly instavansParkflowService: InstavansParkflowService,
  ) {}

  // Create a prescription
  // Create a prescription using consultation details
  async createPrescription(
    data: Partial<Prescription>,
    isInternal?: boolean,
  ): Promise<Prescription> {
    const prescription = await this.sequelize.transaction(async (transaction) => {
      // Validate consultation_id
      const internal = isInternal ?? false;
      if (!internal) {
        const consultation = await this.consultationModel.findByPk(
          data.consultation_id,
          { transaction },
        );
        if (!consultation) {
          throw new NotFoundException(
            `Consultation with ID ${data.consultation_id} not found.`,
          );
        }
      }

      if (!data.prescription_id) {
        data.prescription_id = uuidv4(); // Generate UUID if not provided
      }

      if (!internal) {
        if (!data.doctor_id || !data.driver_id || !data.consultation_id) {
          throw new NotFoundException(
            `Missing required fields: doctor_id, driver_id, consultation_id.`,
          );
        }
      }

      const normalizedFitnessStatus = this.normalizeFitnessStatus(
        data.fitness_status,
      );

      // Create the prescription entry
      const prescription = await this.prescriptionModel.create(
        {
          prescription_id: data.prescription_id,
          doctor_id: data.doctor_id,
          driver_id: data.driver_id,
          consultation_id: data.consultation_id,
          bill_no: data.bill_no || 0,
          fitness_status: normalizedFitnessStatus,
        },
        { transaction },
      );

      return prescription;
    });
    this.executeInstavansPrescriptionPush(prescription);
    return prescription;
  }

  // Get all prescriptions with pagination
  async getAllPrescriptions(limit = 10, offset = 0): Promise<Prescription[]> {
    return this.prescriptionModel.findAll({ limit, offset });
  }

  // Get prescription by ID
  async getPrescriptionById(id: string): Promise<Prescription> {
    const prescription = await this.prescriptionModel.findByPk(id);
    if (!prescription) {
      throw new NotFoundException(`Prescription with ID ${id} not found.`);
    }
    return prescription;
  }

  // Enhanced update prescription with change logging
  async updatePrescription(
    id: string,
    data: Partial<Prescription>,
  ): Promise<Prescription | null> {
    const result = await this.sequelize.transaction(async (transaction) => {
      // Get the current prescription state
      const currentPrescription = await this.prescriptionModel.findByPk(id);
      if (!currentPrescription) {
        throw new NotFoundException(`Prescription with ID ${id} not found.`);
      }

      // Store the previous state
      const previousState = currentPrescription.get({ plain: true });

      const updateData: Partial<Prescription> = { ...data };
      if (Object.prototype.hasOwnProperty.call(updateData, 'fitness_status')) {
        updateData.fitness_status = this.normalizeFitnessStatus(
          updateData.fitness_status,
        );
      }

      // Update the prescription
      const [rowsUpdated, [updatedPrescription]] =
        await this.prescriptionModel.update(updateData, {
          where: { prescription_id: id },
          returning: true,
          transaction,
        });

      if (rowsUpdated === 0) {
        throw new NotFoundException(`Prescription with ID ${id} not found.`);
      }

      // Log the changes
      await this.prescriptionEditLogsService.logChanges(
        id,
        'PRESCRIPTION',
        'UPDATE',
        previousState,
        updatedPrescription.get({ plain: true }),
        undefined,
        transaction,
      );

      const hasFitnessStatusUpdate: boolean = Object.prototype.hasOwnProperty.call(
        updateData,
        'fitness_status',
      );
      if (hasFitnessStatusUpdate) {
        this.executeInstavansPrescriptionPush(updatedPrescription);
      }

      return updatedPrescription;
    });
    return result;
  }

  // Soft delete prescription
  async deletePrescription(id: string): Promise<boolean> {
    const rowsDeleted = await this.prescriptionModel.destroy({
      where: { prescription_id: id },
    });

    if (rowsDeleted === 0) {
      throw new NotFoundException(`Prescription with ID ${id} not found.`);
    }

    return true;
  }
  // Get prescription by consultation ID
  // async getPrescriptionByConsultationId(consultationId: string): Promise<Prescription> {
  //   const prescription = await this.prescriptionModel.findOne({
  //     where: { consultation_id: consultationId },
  //   });

  //   if (!prescription) {
  //     throw new NotFoundException(`Prescription with Consultation ID ${consultationId} not found.`);
  //   }

  //   return prescription;
  // }

  async getPrescriptionByConsultationId(
    consultationId: string,
  ): Promise<Prescription> {
    // Fetch the prescription using consultationId
    const prescription = await this.prescriptionModel.findOne({
      where: { consultation_id: consultationId },
    });

    if (!prescription) {
      throw new NotFoundException(
        `Prescription with Consultation ID ${consultationId} not found.`,
      );
    }

    const PrescriptionMedicine = await this.prescriptionMedicineModel.findAll({
      where: { prescription_id: prescription.prescription_id },
    });

    // Fetch the doctor details using the doctor_id from the prescription
    const doctor = await this.doctorModel.findOne({
      where: { id: prescription.doctor_id },
      include: [{ model: User, as: 'user' }], // Include the associated user
    });

    if (!doctor) {
      throw new NotFoundException(
        `Doctor with ID ${prescription.doctor_id} not found.`,
      );
    }

    // Fetch the driver details using the driver_id from the prescription
    const driver = await this.driverMasterModel.findOne({
      where: { id: prescription.driver_id },
      attributes: ['id', 'name', 'contactNumber', 'dateOfBirthOrAge', 'gender'], // Fetch only required fields
    });

    if (!driver) {
      throw new NotFoundException(
        `Driver with ID ${prescription.driver_id} not found.`,
      );
    }

    // Return the prescription along with doctor, user, and driver details
    return {
      ...prescription.get(),
      doctor: {
        ...doctor.get(),
        user: doctor.user, // This will include the associated user
      },
      driver: {
        id: driver.id,
        name: driver.name,
        contactNumber: driver.contactNumber,
        dob: driver.dateOfBirthOrAge,
        gender: driver.gender,
      },
      medicines: {
        PrescriptionMedicine,
      },
    };
  }

  async uploadPrescriptionImage(
    prescriptionId: string,
    file: Express.Multer.File,
  ): Promise<Prescription> {
    // Fetch the prescription by ID
    const prescription = await this.prescriptionModel.findByPk(prescriptionId);
    if (!prescription) {
      throw new NotFoundException(
        `Prescription with ID ${prescriptionId} not found.`,
      );
    }

    // Upload the image to S3
    const imageUrl = await uploadToS3(file, this.BUCKET_NAME);

    // Update prescription with the image URL
    prescription.prescription_slip_image = imageUrl;
    await prescription.save();

    return prescription;
  }

  /**
   * Get all prescriptions for a specific driver
   * @param driverId The ID of the driver
   * @returns Array of prescriptions with associated data or empty array if none found
   */
  async getPrescriptionsByDriverId(driverId: number): Promise<Prescription[]> {
    const prescriptions = await this.prescriptionModel.findAll({
      where: { driver_id: driverId },
      include: [
        {
          model: Doctor,
          include: [{ model: User, as: 'user' }],
        },
        {
          model: Consultation,
          as: 'consultation',
        },
        {
          model: PrescriptionMedicine,
          as: 'medicines',
        },
      ],
      order: [['createdAt', 'DESC']], // Most recent prescriptions first
    });

    // Always return the prescriptions array, which may be empty
    return prescriptions;
  }

  private async uploadFileToS3(file: Express.Multer.File): Promise<string> {
    const params = {
      Bucket: this.BUCKET_NAME,
      Key: `${uuidv4()}-${file.originalname}`, // Use a unique file name based on UUID
      Body: file.buffer,
      ContentType: file.mimetype,
      // ACL: 'public-read', // Allow public read access
    };

    try {
      const data = await this.s3.upload(params).promise();
      return data.Location; // Return the S3 URL of the uploaded file
    } catch (error: any) {
      throw new Error('Error uploading file to S3: ' + error.message);
    }
  }

  /**
   * Generate a PDF for a prescription
   * @param prescriptionId The ID of the prescription
   * @returns Buffer containing the generated PDF
   */
  async generatePrescriptionPdf(id: string, type?: string): Promise<Buffer> {
    try {
      // Get prescription with all required relations
      const prescription = await this.prescriptionModel.findOne({
        where: { prescription_id: id },
        include: [
          {
            model: Doctor,
            include: [User],
          },
          {
            model: DRIVERMASTER,
            as: 'prescriptionDriver',
          },
          {
            model: Consultation,
            as: 'consultation',
            include: [{ model: Center, as: 'consultationCenter' }],
          },
        ],
      });

      if (!prescription) {
        throw new NotFoundException('Prescription not found');
      }

      if (!prescription.isReady) {
        throw new Error('Prescription is not marked as ready.');
      }

      console.log(
        'Prescription data:',
        JSON.stringify(prescription.toJSON(), null, 2),
      );

      // Handle vitals data specifically since it's likely the source of issues
      let vitalsData = {};
      try {
        if (prescription.vitals) {
          if (typeof prescription.vitals === 'string') {
            vitalsData = JSON.parse(prescription.vitals);
          } else {
            vitalsData = prescription.vitals;
          }
        }
        console.log(
          'Vitals data (processed):',
          JSON.stringify(vitalsData, null, 2),
        );
      } catch (vitalsError) {
        console.error('Error processing vitals data:', vitalsError);
      }

      // Get prescription medicines
      const medicines = await this.prescriptionMedicineModel.findAll({
        where: { prescription_id: id },
      });

      console.log('Medicines data:', JSON.stringify(medicines, null, 2));

      // Determine PDF template based on request type or center group membership
      let template: 'standard' | 'govJharkhand' = 'standard';
      if (type?.toLowerCase() === 'latehar') {
        template = 'govJharkhand';
      }

      try {
        if (template !== 'govJharkhand') {
          const centerId = prescription.consultation?.centerID;
          if (centerId != null) {
            const group = await CenterGroup.findOne({
              where: {
                is_active: true,
                group_name: PRESCRIPTION_GOV_GROUP_NAME,
              },
            });
            if (group && Array.isArray(group.center_ids)) {
              const centerIdStr = String(centerId);
              if (group.center_ids.map(String).includes(centerIdStr)) {
                template = 'govJharkhand';
              }
            }
          }
        }
      } catch (e: any) {
        this.logger.warn(
          `Template selection fallback to standard. Reason: ${e?.message}`,
        );
      }

      // Generate PDF with proper error handling
      try {
        // Create a plain object with only the data needed for the PDF generation
        const prescriptionData = {
          prescription_id: prescription.prescription_id,
          consultation_id: prescription.consultation_id,
          doctor_id: prescription.doctor_id,
          driver_id: prescription.driver_id,
          lab: prescription.lab,
          other_lab: prescription.other_lab,
          instructions: prescription.instructions,
          drug_allergies: prescription.drug_allergies,
          chief_complaints: prescription.chief_complaints,
          follow_up: prescription.follow_up,
          // preventive_advice: prescription.preventive_advice,
          preventive_advice: prescription.instructions,
          prescription_slip_image: prescription.prescription_slip_image,
          prescription_slip_text: prescription.prescription_slip_text,
          isReady: prescription.isReady,
          vitals: vitalsData,
          health_conditions: prescription.health_conditions,
          diagnose: prescription.diagnose,
          fitness_status: prescription.fitness_status,
          createdAt: prescription.createdAt,
          updatedAt: prescription.updatedAt,
        };

        return await generatePrescriptionPdf(
          prescriptionData as Prescription,
          prescription.doctor,
          prescription.prescriptionDriver,
          medicines,
          { template },
        );
      } catch (pdfError: any) {
        console.error('PDF generation error details:', pdfError);
        throw new Error(
          `Error generating prescription PDF: ${pdfError.message}`,
        );
      }
    } catch (error: any) {
      console.error('Error in generatePrescriptionPdf:', error);
      throw error;
    }
  }

  /**
   * Maps prescriptions to their corresponding driver health checkup records
   * based on the same driver and same calendar date.
   * @returns Summary of the mapping operation.
   */
  async mapPrescriptionsToHealthRecords(): Promise<{
    processed: number;
    mapped: number;
    failedToMap: Array<{ prescriptionId: string | number; reason: string }>;
  }> {
    this.logger.log('Starting prescription to health record mapping process.');
    const unmappedPrescriptions = await this.prescriptionModel.findAll({
      where: {
        driver_health_checkup_id: null,
        driver_id: { [Op.ne]: null }, // Ensure driver_id exists
      },
      include: [
        {
          model: DRIVERMASTER,
          as: 'prescriptionDriver', // Ensure this alias matches your Prescription model definition
          attributes: ['id'], // Only fetch driver_id if needed, or ensure driver_id is directly on Prescription
        },
      ],
    });

    let mappedCount = 0;
    const failedToMap: Array<{
      prescriptionId: string | number;
      reason: string;
    }> = [];

    if (unmappedPrescriptions.length === 0) {
      this.logger.log('No unmapped prescriptions found to process.');
      return { processed: 0, mapped: 0, failedToMap };
    }

    this.logger.log(
      `Found ${unmappedPrescriptions.length} unmapped prescriptions to process.`,
    );

    for (const prescription of unmappedPrescriptions) {
      const driverId = prescription.driver_id;
      const prescriptionDate = prescription.createdAt; // Using createdAt from Prescription

      if (!driverId || !prescriptionDate) {
        this.logger.warn(
          `Skipping prescription ID ${prescription.prescription_id} due to missing driver_id or date.`,
        );
        failedToMap.push({
          prescriptionId: prescription.prescription_id,
          reason: 'Missing driver_id or prescription date',
        });
        continue;
      }

      const startOfDay = new Date(prescriptionDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(prescriptionDate);
      endOfDay.setHours(23, 59, 59, 999);

      try {
        // Find health checkups for the same driver on the same calendar day
        const healthCheckups = await this.driverHealthCheckupModel.findAll({
          where: {
            driver_id: driverId,
            createdAt: {
              // Using createdAt from driverhealthcheckup
              [Op.gte]: startOfDay,
              [Op.lte]: endOfDay,
            },
          },
          order: [['createdAt', 'DESC']], // Get the most recent one on that day
          limit: 1,
        });

        if (healthCheckups.length > 0) {
          const healthCheckupToMap = healthCheckups[0];
          await prescription.update({
            driver_health_checkup_id: healthCheckupToMap.id,
          });
          mappedCount++;
          this.logger.log(
            `Mapped prescription ID ${prescription.prescription_id} to health checkup ID ${healthCheckupToMap.id}`,
          );
        } else {
          this.logger.log(
            `No matching health checkup found for prescription ID ${prescription.prescription_id} for driver ID ${driverId} on ${prescriptionDate.toDateString()}`,
          );
          failedToMap.push({
            prescriptionId: prescription.prescription_id,
            reason: 'No matching health checkup found',
          });
        }
      } catch (error: any) {
        this.logger.error(
          `Error processing prescription ID ${prescription.prescription_id}: ${error.message}`,
          error.stack,
        );
        failedToMap.push({
          prescriptionId: prescription.prescription_id,
          reason: `Error: ${error.message}`,
        });
      }
    }

    this.logger.log(
      `Mapping process completed. Processed: ${unmappedPrescriptions.length}, Mapped: ${mappedCount}, Failed: ${failedToMap.length}`,
    );
    return {
      processed: unmappedPrescriptions.length,
      mapped: mappedCount,
      failedToMap,
    };
  }

  private async triggerInstavansFromPrescription(
    prescription: Prescription,
  ): Promise<void> {
    try {
      const latestReadyCheckup = await this.driverHealthCheckupModel.findOne({
        where: {
          driver_id: prescription.driver_id,
          confirm_report: 'yes',
          is_submited: true,
        },
        include: [
          {
            model: DRIVERMASTER,
            as: 'driver',
          },
        ],
        order: [['updatedAt', 'DESC']],
      });
      if (!latestReadyCheckup) {
        return;
      }
      const checkupFitnessStatus: string =
        (latestReadyCheckup.get('fitness_status') as string) || '';
      if (checkupFitnessStatus !== CHECKUP_STATUS_DOCTOR_CONSULTATION) {
        return;
      }
      const checkupDriver = latestReadyCheckup.driver ?? null;
      await this.instavansParkflowService.pushFromPrescription({
        prescription,
        checkup: latestReadyCheckup,
        driver: checkupDriver,
      });
    } catch (error: unknown) {
      const message: string =
        error instanceof Error ? error.message : 'Unexpected error';
      this.logger.error(
        `Instavans prescription push failed for prescription=${prescription.prescription_id}: ${message}`,
      );
    }
  }

  private executeInstavansPrescriptionPush(prescription: Prescription): void {
    void this.triggerInstavansFromPrescription(prescription);
  }

  private normalizeFitnessStatus(
    rawFitnessStatus: string | null | undefined,
  ): string | null | undefined {
    if (rawFitnessStatus === undefined) {
      return undefined;
    }
    if (rawFitnessStatus === null) {
      return null;
    }
    const normalizedValue = rawFitnessStatus.trim().toUpperCase();
    if (!this.allowedFitnessStatuses.has(normalizedValue)) {
      throw new NotFoundException(
        `Invalid fitness_status. Allowed values are: ${FITNESS_STATUS_VALUES.join(', ')}`,
      );
    }
    return normalizedValue;
  }
  
  async getAllPrescriptionsDetails(query: any) {
    const {
      name,
      contactNumber,
      billNumber,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = query;
    const offset = (page - 1) * limit;

    const replacements: any = {};
    let whereClause = `WHERE 1=1`;

    if (name) {
      whereClause += ` AND d.name ILIKE :name`;
      replacements.name = `%${name}%`;
    }

    if (contactNumber) {
      whereClause += ` AND d."contactNumber" ILIKE :contactNumber`;
      replacements.contactNumber = `%${contactNumber}%`;
    }

    if (billNumber) {
      whereClause += ` AND CAST(p.bill_no AS TEXT) ILIKE :billNumber`;
      replacements.billNumber = `%${billNumber}%`;
    }

    if (startDate && endDate) {
      whereClause += ` AND p."createdAt"::date BETWEEN :startDate::date AND :endDate::date`;
      replacements.startDate = startDate;
      replacements.endDate = endDate;
    } else if (startDate) {
      whereClause += ` AND p."createdAt"::date >= :startDate::date`;
      replacements.startDate = startDate;
    } else if (endDate) {
      whereClause += ` AND p."createdAt"::date <= :endDate::date`;
      replacements.endDate = endDate;
    }

    const sql = `SELECT
    p.*,
    d.name AS patient_name,
    d.age,
    d.gender,
    d."localAddressDistrict",
    d."contactNumber",
    d.external_id AS uhid,
    u_doctor.name AS doctor_name,
    d.category, 
    dd.*,
    COALESCE(
        json_agg(
            json_build_object(
                'id', pm.prescription_medicine_id,
                'medicine_name', pm.medicine_name,
                'dosage', pm.dosage,
                'frequency', pm.frequency,
                'duration', pm.duration,
                'instructions',pm.instructions,
                'type',pm.medicine_type
            )
        ) FILTER (WHERE pm.prescription_medicine_id IS NOT NULL),
        '[]'
    ) AS medicines

FROM prescription p
JOIN "DRIVERMASTERs" d 
    ON d.id = p."driver_id"
JOIN "Doctors" dd 
    ON dd.id = p."doctor_id"
JOIN "Users" u_doctor 
    ON u_doctor.id = dd.user_id 
    AND u_doctor.role_id = 4
LEFT JOIN "prescriptionmedicine" pm 
    ON pm.prescription_id = p.prescription_id
${whereClause}
GROUP BY 
    p.prescription_id,
    d.id,
    dd.id,
    u_doctor.id
ORDER BY p."createdAt" DESC
LIMIT :limit OFFSET :offset
`;

    const [rows]: any = await this.sequelize.query(sql, {
      replacements: { ...replacements, limit, offset },
    });

    const countSql = `
      SELECT COUNT(*) AS total
      FROM prescription p
      JOIN "DRIVERMASTERs" d ON d.id = p."driver_id"
      JOIN "Doctors" dd ON dd.id = p."doctor_id"
      JOIN "Users" u_doctor ON u_doctor.id = dd.user_id AND u_doctor.role_id = 4
      ${whereClause}
    `;

    const [countRows]: any = await this.sequelize.query(countSql, {
      replacements,
    });
    const totalRecords = Number(countRows?.[0]?.total ?? 0);

    return {
      data: rows,
      pagination: {
        currentPage: Number(page),
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
      },
    };
  }
  async getAllForExport(query: any) {
    return this.getAllPrescriptionsDetails({
      ...query,
      page: 1,
      limit: 10000,
    });
  }

  async exportPrescriptionExcel(query: any) {
    const result = await this.getAllForExport(query);
    const rows = result.data;

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Prescriptions');

    const { startDate, endDate } = query;

    sheet.mergeCells('A1:Q1');
    const title = sheet.getCell('A1');
    title.value = 'Prescription List';
    title.font = { bold: true, size: 16 };
    title.alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:Q2');
    const filterCell = sheet.getCell('A2');

    filterCell.value =
      startDate && endDate
        ? `Filtered: ${new Date(startDate).toLocaleDateString()} ? ${new Date(
            endDate,
          ).toLocaleDateString()}`
        : 'Filtered: All Records';

    filterCell.font = { italic: true, color: { argb: '555555' } };
    filterCell.alignment = { horizontal: 'center' };

    sheet.addRow([]);

    sheet.columns = [
      { key: 's_no', width: 10 },
      { key: 'bill_no', width: 15 },
      { key: 'uhid', width: 15 },
      { key: 'patient_name', width: 25 },
      { key: 'age', width: 10 },
      { key: 'gender', width: 10 },
      { key: 'contactNumber', width: 15 },
      { key: 'fin_cat', width: 15 },
      { key: 'bp_systolic', width: 15 },
      { key: 'bp_diastolic', width: 15 },
      { key: 'pulse', width: 10 },
      { key: 'spo2', width: 10 },
      { key: 'temperature', width: 15 },
      { key: 'height', width: 12 },
      { key: 'weight', width: 12 },
      { key: 'createdAt', width: 20 },
      { key: 'doctor_name', width: 20 },
    ];

    const headerRow = sheet.addRow([
      'S No',
      'Bill No',
      'UHID',
      'Patient Name',
      'Age',
      'Gender',
      'Mobile No',
      'Fin. Cat',
      'BP Systolic',
      'BP Diastolic',
      'Pulse',
      'SPO2',
      'Temperature',
      'Height',
      'Weight',
      'Date',
      'Doctor',
    ]);

    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center' };

    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    let counter = 1;

    rows.forEach((row: any) => {
      sheet.addRow({
        s_no: counter++,
        bill_no: row.bill_no,
        uhid: row.uhid,
        patient_name: row.patient_name,
        age: row.age,
        gender: row.gender,
        contactNumber: row.contactNumber,
        fin_cat: row.category,
        bp_systolic: row.vitals.systolicBP,
        bp_diastolic: row.vitals.diastolicBP,
        pulse: row.vitals.pulse,
        spo2: row.vitals.spo2,
        temperature: row.vitals.temperature,
        height: row.vitals.height,
        weight: row.vitals.weight,
        createdAt: row.createdAt
          ? new Date(row.createdAt).toLocaleString()
          : '',
        doctor_name: row.doctor_name,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}
