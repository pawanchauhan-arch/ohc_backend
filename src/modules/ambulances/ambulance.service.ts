import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

import { AmbulanceStatus } from '../../common/enum';
import { Ambulance } from '../../models/ambulance.model';

import { AmbulanceFilterDto } from './dto/ambulance-filter.dto';
import { CreateAmbulanceDto } from './dto/create-ambulance.dto';
import { UpdateAmbulanceDto } from './dto/update-ambulance.dto';

@Injectable()
export class AmbulancesService {
  constructor(
    @InjectModel(Ambulance)
    private readonly ambulanceModel: typeof Ambulance,
  ) {}

  private generateUniqueName(): string {
    const year = new Date().getFullYear();
    const suffix = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    return `AMB-${year}-${suffix}`;
  }

  async create(
    dto: CreateAmbulanceDto,
    context: any,
  ): Promise<Ambulance> {
    // Check duplicate number plate
    const existingPlate = await this.ambulanceModel.findOne({
      where: {
        number_plate: dto.number_plate,
      },
    });

    if (existingPlate) {
      throw new ConflictException(
        'Number plate already registered',
      );
    }

    const ambulance = await this.ambulanceModel.create({
      ...dto,
      tenant_id: String(context.tenantId),
      center_id: String(context.centerId),
      unique_name: this.generateUniqueName(),
      status: AmbulanceStatus.AVAILABLE,
    });

    return ambulance;
  }

  async findAll(
    context: any,
    filters: AmbulanceFilterDto,
  ) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const offset = (page - 1) * limit;

    const where: any = {
      tenant_id: String(context.tenantId),
      center_id: String(context.centerId),
    };

    // Company name
    if (filters.company_name) {
      where.company_name = {
        [Op.iLike]: `%${filters.company_name}%`,
      };
    }

    // Ambulance type
    if (filters.ambulance_type) {
      where.ambulance_type = filters.ambulance_type;
    }

    // Fuel type
    if (filters.fuel_type) {
      where.fuel_type = filters.fuel_type;
    }

    // Number plate
    if (filters.number_plate) {
      where.number_plate = {
        [Op.iLike]: `%${filters.number_plate}%`,
      };
    }

    // Driver name
    if (filters.driver_name) {
      where.driver_name = {
        [Op.iLike]: `%${filters.driver_name}%`,
      };
    }

    // Unique name
    if (filters.unique_name) {
      where.unique_name = {
        [Op.iLike]: `%${filters.unique_name}%`,
      };
    }

    // Date filter
    if (filters.startDate && filters.endDate) {
      where.createdAt = {
        [Op.between]: [
          new Date(`${filters.startDate}T00:00:00`),
          new Date(`${filters.endDate}T23:59:59`),
        ],
      };
    }

    const {
      rows: data,
      count: totalRecords,
    } = await this.ambulanceModel.findAndCountAll({
      where,

      order: [['createdAt', 'DESC']],

      offset,
      limit,
    });

    return {
      data,

      pagination: {
        totalRecords,
        currentPage: page,
        totalPages:
          Math.ceil(totalRecords / limit) || 1,
        limit,
      },
    };
  }

  async search(
    context: any,
    query: string,
  ): Promise<Ambulance[]> {
    if (!query || query.length < 2) {
      return [];
    }

    return this.ambulanceModel.findAll({
      where: {
        tenant_id: String(context.tenantId),
        center_id: String(context.centerId),

        [Op.or]: [
          {
            unique_name: {
              [Op.iLike]: `%${query}%`,
            },
          },
          {
            number_plate: {
              [Op.iLike]: `%${query}%`,
            },
          },
        ],
      },

      limit: 10,

      order: [['unique_name', 'ASC']],
    });
  }

  async findOne(
    id: string,
    context: any,
  ): Promise<Ambulance> {
    const ambulance = await this.ambulanceModel.findOne({
      where: {
        id,
        tenant_id: String(context.tenantId),
        center_id: String(context.centerId),
      },
    });

    if (!ambulance) {
      throw new NotFoundException(
        'Ambulance not found',
      );
    }

    return ambulance;
  }

  async update(
    id: string,
    dto: UpdateAmbulanceDto,
    context: any,
  ): Promise<Ambulance> {
    const ambulance = await this.findOne(id, context);

    await ambulance.update({
      ...dto,
    });

    return ambulance;
  }

  async remove(
    id: string,
    context: any,
  ): Promise<void> {
    const ambulance = await this.findOne(id, context);

    await ambulance.destroy();
  }
}
