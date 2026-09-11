import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { HealthConcern } from '../../models/HealthConcern';
import { DRIVERMASTER } from '../../models/DriverMaster';
import { CETMANAGEMENT } from '../../models/CetManagement';
import { Center } from '../../models/Center';
import { CreateConcernDto } from './dto/create-concern.dto';
import { UpdateConcernDto } from './dto/update-concern.dto';
import { ConcernFiltersDto } from './dto/concern-filters.dto';

@Injectable()
export class HealthConcernsService {
  constructor(
    @InjectModel(HealthConcern)
    private healthConcernModel: typeof HealthConcern,
    @InjectModel(DRIVERMASTER)
    private driverMasterModel: typeof DRIVERMASTER,
    @InjectModel(CETMANAGEMENT)
    private cetManagementModel: typeof CETMANAGEMENT,
    @InjectModel(Center)
    private centerModel: typeof Center,
  ) {}

  /**
   * Create a new health concern
   */
  async createConcern(createConcernDto: CreateConcernDto): Promise<HealthConcern> {
    const concernData = {
      health_checkup_id: createConcernDto.health_checkup_id,
      driver_id: createConcernDto.driver_id,
      cet_id: createConcernDto.cet_id,
      center_id: createConcernDto.center_id,
      concern_type: createConcernDto.concern_type,
      concern_level: createConcernDto.concern_level,
      parameter_value: createConcernDto.parameter_value,
      threshold_value: createConcernDto.threshold_value,
      spoc_details: createConcernDto.spoc_details,
    };
    
    return this.healthConcernModel.create(concernData);
  }

  /**
   * Get all health concerns with filters and pagination
   */
  async getConcerns(filters: ConcernFiltersDto): Promise<{
    concerns: HealthConcern[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const where: any = {};
    const include = [
      {
        model: this.driverMasterModel,
        as: 'driver',
        attributes: ['id', 'name', 'contactNumber'],
      },
      {
        model: this.cetManagementModel,
        as: 'cet',
        attributes: ['id', 'name', 'spocName', 'spocEmail', 'spocWhatsappNumber'],
      },
      {
        model: this.centerModel,
        as: 'center',
        attributes: ['id', 'project_name', 'client_spoc_name', 'client_spoc_email', 'client_spoc_whatsapp'],
      },
    ];

    // Apply filters
    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.level) {
      where.concern_level = filters.level;
    }

    if (filters.type) {
      where.concern_type = filters.type;
    }

    if (filters.driverId) {
      where.driver_id = filters.driverId;
    }

    if (filters.cetId) {
      where.cet_id = filters.cetId;
    }

    if (filters.centerId) {
      where.center_id = filters.centerId;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt[Op.gte] = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt[Op.lte] = new Date(filters.dateTo);
      }
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    // Get total count
    const total = await this.healthConcernModel.count({ where });

    // Get concerns with pagination
    const concerns = await this.healthConcernModel.findAll({
      where,
      include,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return {
      concerns,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a health concern by ID
   */
  async getConcernById(id: number): Promise<HealthConcern> {
    const concern = await this.healthConcernModel.findByPk(id, {
      include: [
        {
          model: this.driverMasterModel,
          as: 'driver',
          attributes: ['id', 'name', 'contactNumber'],
        },
        {
          model: this.cetManagementModel,
          as: 'cet',
          attributes: ['id', 'name', 'spocName', 'spocEmail', 'spocWhatsappNumber'],
        },
        {
          model: this.centerModel,
          as: 'center',
          attributes: ['id', 'project_name', 'client_spoc_name', 'client_spoc_email', 'client_spoc_whatsapp'],
        },
      ],
    });

    if (!concern) {
      throw new NotFoundException(`Health concern with ID ${id} not found`);
    }

    return concern;
  }

  /**
   * Update a health concern
   */
  async updateConcern(id: number, updateConcernDto: UpdateConcernDto): Promise<HealthConcern> {
    const concern = await this.getConcernById(id);

    // Update reviewed_at if status is being changed to APPROVED
    if (updateConcernDto.status === 'APPROVED' && concern.status !== 'APPROVED') {
      updateConcernDto['reviewed_at'] = new Date();
    }

    await concern.update(updateConcernDto);
    return concern;
  }

  /**
   * Delete a health concern
   */
  async deleteConcern(id: number): Promise<void> {
    const concern = await this.getConcernById(id);
    await concern.destroy();
  }

  /**
   * Get concerns by health checkup ID
   */
  async getConcernsByHealthCheckupId(healthCheckupId: number): Promise<HealthConcern[]> {
    return this.healthConcernModel.findAll({
      where: { health_checkup_id: healthCheckupId },
      include: [
        {
          model: this.driverMasterModel,
          as: 'driver',
          attributes: ['id', 'name', 'contactNumber'],
        },
        {
          model: this.cetManagementModel,
          as: 'cet',
          attributes: ['id', 'name', 'spocName', 'spocEmail', 'spocWhatsappNumber'],
        },
        {
          model: this.centerModel,
          as: 'center',
          attributes: ['id', 'project_name', 'client_spoc_name', 'client_spoc_email', 'client_spoc_whatsapp'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Get pending concerns
   */
  async getPendingConcerns(): Promise<HealthConcern[]> {
    return this.healthConcernModel.findAll({
      where: { status: 'PENDING' },
      include: [
        {
          model: this.driverMasterModel,
          as: 'driver',
          attributes: ['id', 'name', 'contactNumber'],
        },
        {
          model: this.cetManagementModel,
          as: 'cet',
          attributes: ['id', 'name', 'spocName', 'spocEmail', 'spocWhatsappNumber'],
        },
        {
          model: this.centerModel,
          as: 'center',
          attributes: ['id', 'project_name', 'client_spoc_name', 'client_spoc_email', 'client_spoc_whatsapp'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }
}
