import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Request } from '../../models/Request';
import { DRIVERMASTER } from '../../models/DriverMaster';
import { Center } from '../../models/Center';
import { CenterGroup } from '../../models/CenterGroup';
import { Sequelize } from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
const dayjs = require('dayjs');

@Injectable()
export class RequestService {
  constructor(
    @InjectModel(Request)
    private readonly requestModel: typeof Request,
    @InjectModel(DRIVERMASTER)
    private readonly driverMasterModel: typeof DRIVERMASTER,
    @InjectModel(Center)
    private readonly centerModel: typeof Center,
    @InjectModel(CenterGroup)
    private readonly centerGroupModel: typeof CenterGroup,
    private readonly sequelize: Sequelize,
  ) {}

  /**
   * Creates a new request with optional centerID validation
   */
  async createRequest(data: Partial<Request>): Promise<Request> {
    if (!data.request_id) {
      data.request_id = uuidv4();
    }

    await this.validateDriverExists(data.driver_id);
    await this.validateCenterExists(data.centerID);
    this.processPreferredTime(data);

    return this.requestModel.create(data);
  }

  /**
   * Validates if driver exists
   */
  private async validateDriverExists(driverId: number): Promise<void> {
    if (!driverId) {
      throw new NotFoundException('Driver ID is required.');
    }
    
    const driver = await this.driverMasterModel.findByPk(driverId);
    if (!driver) {
      throw new NotFoundException(`Driver with ID ${driverId} not found.`);
    }
  }

  /**
   * Validates if center exists (when centerID is provided)
   */
  private async validateCenterExists(centerID?: number): Promise<void> {
    if (centerID !== undefined && centerID !== null) {
      const center = await this.centerModel.findByPk(centerID);
      if (!center) {
        throw new NotFoundException(`Center with ID ${centerID} not found.`);
      }
    }
  }

  /**
   * Processes preferred_time string format
   */
  private processPreferredTime(data: Partial<Request>): void {
    if (typeof data.preferred_time === 'string') {
      const durationMatch = data.preferred_time
        .trim()
        .match(/^(\d+)\s*(hour|hours|minute|minutes|min|mins)$/i);
      if (durationMatch) {
        const duration = parseInt(durationMatch[1], 10);
        const unit = durationMatch[2].toLowerCase();
        const isMinuteUnit = ['minute', 'minutes', 'min', 'mins'].includes(unit);
        data.preferred_time = dayjs().add(duration, isMinuteUnit ? 'minute' : 'hour').toDate();
      } else {
        throw new Error('Invalid preferred_time format. Please provide input as "1 hour", "2 hours", "10 minutes", etc.');
      }
    }
  }

  /**
   * Fetches center IDs from center_groups table by group ID(s).
   * Supports comma-separated group IDs from FE (e.g. "5,6").
   */
  private async getCentersFromGroups(groupIds: number[]): Promise<number[]> {
    const allCenterIds: number[] = [];
    for (const groupId of groupIds) {
      const ids = await this.getCentersFromGroup(groupId);
      allCenterIds.push(...ids);
    }
    return [...new Set(allCenterIds)]; // dedupe
  }

  private async getCentersFromGroup(groupId: number): Promise<number[]> {
    const group = await this.centerGroupModel.findByPk(groupId);
    if (!group || !group.center_ids) return [];

    const raw = group.center_ids;
    if (Array.isArray(raw)) {
      if (raw.length === 1 && typeof raw[0] === 'string' && raw[0].includes(',')) {
        return raw[0]
          .split(',')
          .map((x) => Number(x.trim()))
          .filter((id) => !isNaN(id));
      }
      return raw.map(Number).filter((id) => !isNaN(id));
    }

    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map(Number).filter((id) => !isNaN(id));
        }
      } catch {
        return [];
      }
    }
    return [];
  }

  /**
   * Gets all requests with optional status, centerID/groupIDs filtering, and time-based filtering
   * By default, returns requests from the last 2 days to reduce response size
   * When groupIDs is provided (e.g. [5, 6]), fetches center IDs from center_groups and filters by those centers
   */
  async getAllRequests(status?: string, centerID?: number, groupIDs?: number[], daysBack?: number): Promise<any[]> {
    let whereClause: any = {};
    
    // Add status filter
    if (status === "booked") {
      whereClause.status = true;
    } else if (status === "pending") {
      whereClause.status = false;
    }
    
    // Add center filter: groupIDs takes precedence over centerID
    if (groupIDs?.length) {
      const centerIds = await this.getCentersFromGroups(groupIDs);
      if (centerIds.length > 0) {
        whereClause.centerID = { [Op.in]: centerIds };
      }
    } else if (centerID !== undefined && centerID !== null) {
      whereClause.centerID = centerID;
    }
    
    // Add time-based filtering to reduce response size
    // Default to last 2 days if no specific daysBack is provided
    const defaultDaysBack = daysBack !== undefined ? daysBack : 2;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - defaultDaysBack);
    
    whereClause.createdAt = {
      [Op.gte]: cutoffDate, // Only fetch requests created after the cutoff date
    };
    
    if (status === "rejected") {
      // ✅ Fetch only soft-deleted records (rejected requests)
      const rejectedWhereClause: any = {
        deletedAt: { [Op.ne]: null }, // ✅ Get only soft-deleted records
        createdAt: {
          [Op.gte]: cutoffDate, // Apply same time filter for rejected requests
        },
      };
      
      // Add center filter for rejected requests too
      if (groupIDs?.length) {
        const centerIds = await this.getCentersFromGroups(groupIDs);
        if (centerIds.length > 0) {
          rejectedWhereClause.centerID = { [Op.in]: centerIds };
        }
      } else if (centerID !== undefined && centerID !== null) {
        rejectedWhereClause.centerID = centerID;
      }
      
      return this.requestModel.findAll({
        where: rejectedWhereClause,
        paranoid: false, // ✅ This ensures soft-deleted records are fetched
        include: [
                  {
          model: this.driverMasterModel,
          attributes: ["name", "contactNumber"],
          required: true,
        },
        {
          model: this.centerModel,
          as: 'requestCenter',
          attributes: ["id", "project_name", "center_shortcode"],
          required: false,
        },
      ],
        attributes: [
          "request_id",
          "driver_id",
          "centerID",
          "status",
          "symptoms",
          "preferred_time",
          "createdAt",
          "deletedAt", // ✅ Ensure deletedAt is included for rejected records
          "preferredspecialist"
        ],
      }).then((requests) => {
        return requests.map((request) => ({
          request_id: request.request_id,
          driver_id: request.driver_id,
          centerID: request.centerID,
          status: request.status,
          symptoms: request.symptoms,
          preferred_time: request.preferred_time,
          createdAt: request.createdAt,
          deletedAt: request.deletedAt,
          driver_name: request.requestDriver?.name || "N/A",
          contactNumber: request.requestDriver?.contactNumber || "N/A",
          center_name: request.requestCenter?.project_name || null,
          center_shortcode: request.requestCenter?.center_shortcode || null,
          preferredspecialist:request.preferredspecialist || null
        }));
      });
    }
  
    return this.requestModel.findAll({
      where: whereClause,
      paranoid: true, // ✅ Ensures non-deleted records are fetched
      include: [
        {
          model: this.driverMasterModel,
          attributes: ["name", "contactNumber"],
          required: true,
        },
        {
          model: this.centerModel,
          as: 'requestCenter',
          attributes: ["id", "project_name", "center_shortcode"],
          required: false,
        },
      ],
      attributes: [
        "request_id",
        "driver_id",
        "centerID",
        "status",
        "symptoms",
        "preferred_time",
        "createdAt",
        "deletedAt",
        "preferredspecialist"
      ],
    }).then((requests) => {
      return requests.map((request) => ({
        request_id: request.request_id,
        driver_id: request.driver_id,
        centerID: request.centerID,
        status: request.status,
        symptoms: request.symptoms,
        preferred_time: request.preferred_time,
        createdAt: request.createdAt,
        deletedAt: request.deletedAt,
        driver_name: request.requestDriver?.name || "N/A",
        contactNumber: request.requestDriver?.contactNumber || "N/A",
        center_name: request.requestCenter?.project_name || null,
        center_shortcode: request.requestCenter?.center_shortcode || null,
        preferredspecialist: request.preferredspecialist || null
      }));
    });
  }
  
  
  


  async getRequestById(id: string): Promise<Request> {
    const request = await this.requestModel.findByPk(id);
    if (!request) {
      throw new NotFoundException(`Request with ID ${id} not found.`);
    }
    return request;
  }

  async updateRequest(id: string, data: Partial<Request>): Promise<Request | null> {
    const [rowsUpdated, [updatedRequest]] = await this.requestModel.update(data, {
      where: { request_id: id },
      returning: true,
    });

    return rowsUpdated > 0 ? updatedRequest : null;
  }

  async deleteRequest(id: string): Promise<boolean> {
    const rowsDeleted = await this.requestModel.destroy({ where: { request_id: id } });
    return rowsDeleted > 0;
  }
  async getRequestsByDriverId(driverId: number): Promise<Request[]> {
    // Validate driver existence
    const driver = await this.driverMasterModel.findByPk(driverId);
    if (!driver) {
      throw new NotFoundException(`Driver with ID ${driverId} not found.`);
    }

    // Fetch all requests for the driver
    const requests = await this.requestModel.findAll({ where: { driver_id: driverId } });

    if (requests.length === 0) {
      throw new NotFoundException(`No requests found for driver with ID ${driverId}.`);
    }

    return requests;
  }

  // API to get the latest request with status false for a driver
  async getLatestPendingRequest(driverId: number): Promise<Request> {
    // Validate driver existence
    const driver = await this.driverMasterModel.findByPk(driverId);
    if (!driver) {
      throw new NotFoundException(`Driver with ID ${driverId} not found.`);
    }

    // Fetch the latest request with status false for the driver
    const request = await this.requestModel.findOne({
      where: { driver_id: driverId, status: false },
      order: [['createdAt', 'DESC']], // Order by creation time (latest first)
    });

    if (!request) {
      throw new NotFoundException(`No pending requests found for driver with ID ${driverId}.`);
    }

    return request;
  }
  async getLatestRequestByDriverId(driverId: number): Promise<Request> {
    // Validate driver existence
    const driver = await this.driverMasterModel.findByPk(driverId);
    if (!driver) {
      throw new NotFoundException(`Driver with ID ${driverId} not found.`);
    }
  
    // Fetch the latest request for the driver
    const latestRequest = await this.requestModel.findOne({
      where: { driver_id: driverId },
      order: [['createdAt', 'DESC']], // Order by creation time (latest first)
    });
  
    if (!latestRequest) {
      throw new NotFoundException(`No requests found for driver with ID ${driverId}.`);
    }
  
    return latestRequest;
  }

  async rejectRequest(id: string): Promise<boolean> {
    const request = await this.requestModel.findByPk(id);
  
    if (!request) {
      throw new NotFoundException(`Request with ID ${id} not found.`);
    }
  
    await request.destroy(); // ✅ Soft delete the request
    return true;
  }

  async restoreRequest(request_id: string): Promise<boolean> {
    const request = await this.requestModel.findOne({
      where: { request_id },
      paranoid: false, // Include soft-deleted records
    });
  
    if (!request) {
      throw new NotFoundException(`Request with ID ${request_id} not found.`);
    }
  
    await request.restore(); // Restore soft-deleted request
    return true;
  }
  
  
}
