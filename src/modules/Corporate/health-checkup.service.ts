import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Order } from 'sequelize';

import { Corporate } from '../../models/corporate';
import { User } from '../../models/User';
import { Center } from '../../models/Center';
import { Doctor } from '../../models/Doctor';
import { driverhealthcheckup } from '../../models/DriverHealthCheckup';
import { CETMANAGEMENT } from '../../models/CetManagement';
import { CenterUser } from '../../models/CenterUser';
import { DRIVERMASTER } from '../../models/DriverMaster';
import { Prescription } from '../../models/Prescription';
import { PrescriptionMedicine } from '../../models/PrescriptionMedicine';

import {
  CorporateHistoryDto,
  SpecificCenterHistoryDto,
  GetCorporateDriversDto,
} from './dto/health-history.dto';

@Injectable()
export class HealthCheckupService {
  constructor(
    @InjectModel(driverhealthcheckup)
    private healthCheckupModel: typeof driverhealthcheckup,
    @InjectModel(Corporate) private corporateModel: typeof Corporate,
    @InjectModel(DRIVERMASTER) private driverMasterModel: typeof DRIVERMASTER,
  ) {}

  // =================================================================
  // API 1: Get History for ALL Centers belonging to a Corporate
  // =================================================================
  async getHistoryByCorporate(dto: CorporateHistoryDto) {
    // 1. Fetch Corporate to get allowed Center IDs
    const corporate = await this.corporateModel.findByPk(dto.corporate_id);
    if (!corporate) throw new NotFoundException('Corporate not found');

    const centerIds = corporate.center_ids || [];
    if (centerIds.length === 0)
      return { data: [], message: 'No centers assigned to this corporate' };

    // 2. Filter: CreatedBy must be ONE OF the corporate's centers
    const centerCondition = { [Op.in]: centerIds };

    return this.fetchHealthCheckups(dto, centerCondition);
  }

  // =================================================================
  // API 2: Get History for a SPECIFIC Center (Security Checked)
  // =================================================================
  async getHistoryBySpecificCenter(dto: SpecificCenterHistoryDto) {
    // 1. Fetch Corporate
    const corporate = await this.corporateModel.findByPk(dto.corporate_id);
    if (!corporate) throw new NotFoundException('Corporate not found');

    // 2. Security Check: Is this center actually part of this corporate?
    const allowedCenters = corporate.center_ids || [];
    if (!allowedCenters.includes(dto.center_id)) {
      throw new BadRequestException(
        `Center ID ${dto.center_id} is not associated with this Corporate`,
      );
    }

    // 3. Filter: CreatedBy must be EXACTLY this center
    const centerCondition = dto.center_id;

    return this.fetchHealthCheckups(dto, centerCondition);
  }

  // =================================================================
  // SHARED HELPER: Builds the query and fetches data
  // =================================================================
  private async fetchHealthCheckups(
    dto: CorporateHistoryDto,
    createdByCondition: any, // Can be a number (specific) or Op.in array (all)
  ) {
    const { corporate_id, start_date, end_date } = dto;

    const whereCondition: any = {
      confirm_report: 'yes',
      is_submited: true,
      createdBy: createdByCondition, // Filter by Center(s)
    };

    // Date Filter
    if (start_date && end_date) {
      whereCondition.date_time = {
        // Or use 'createdAt'
        [Op.between]: [
          new Date(`${start_date}T00:00:00.000Z`),
          new Date(`${end_date}T23:59:59.999Z`),
        ],
      };
    }
    const associated = this.getAssociations();
    const results = await this.healthCheckupModel.findAll({
      where: whereCondition,
      limit: start_date && end_date ? undefined : 100, // Limit if no date range
      order: [['id', 'DESC']],
      include: associated, // Helper for clean code
    });

    return {
      status: true,
      message: results.length > 0 ? 'Fetch Successful' : 'No records found',
      data: results,
    };
  }

  // Helper to keep the main logic clean
  private getAssociations() {
    return [
      {
        model: Doctor,
        as: 'doctor',
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'name', 'email'],
          },
        ],
      },
      {
        model: Center,
        as: 'center',
        include: [
          {
            model: CenterUser,
            as: 'centerusers',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'name'],
              },
            ],
          },
        ],
      },
      {
        model: CETMANAGEMENT,
        as: 'CETMANAGEMENT',
        required: false,
        attributes: ['id', 'name', 'contactNumber'],
      },
      { model: DRIVERMASTER, as: 'driver' },
      { model: User, as: 'user', attributes: ['id', 'username', 'name'] },
      {
        model: Prescription,
        as: 'checkupPrescriptions',
        required: false,
        attributes: [
          'prescription_id',
          'diagnose',
          'fitness_status',
          'createdAt',
          'instructions',
        ],
        include: [
          {
            model: PrescriptionMedicine,
            as: 'medicines',
            required: false,
            attributes: ['medicine_name', 'dosage', 'frequency'],
          },
        ],
        order: [['createdAt', 'DESC']] as Order,
      },
    ];
  }

  async getDriversByCorporateCenters(dto: GetCorporateDriversDto) {
    // 1. Fetch the Corporate to get the list of authorized centers
    const corporate = await this.corporateModel.findByPk(dto.corporate_id);

    if (!corporate) {
      throw new NotFoundException('Corporate not found');
    }

    // 2. Extract Center IDs (Handle null/empty case)
    const centerIds = corporate.center_ids || [];

    if (centerIds.length === 0) {
      return {
        status: true,
        message: 'No centers assigned to this corporate',
        data: [],
      };
    }

    // 3. Find Drivers created by ANY of these centers
    // We use the 'createdBy' field as requested, which maps to Center ID
    const drivers = await this.driverMasterModel.findAll({
      where: {
        createdBy: {
          [Op.in]: centerIds,
        },
        // Optional: If you also want to ensure the driver is explicitly linked
        // to this corporate via the old column, uncomment the line below:
        // driver_cetid: dto.corporate_id
      },
      order: [['id', 'DESC']],
    });

    return {
      status: true,
      message:
        drivers.length > 0
          ? 'List of drivers fetched successfully'
          : 'No drivers found for these centers',
      data: drivers,
    };
  }
}
