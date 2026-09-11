import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { AmbulanceStatus, ServiceStatus } from '../../common/enum';

import { AmbulanceService as AmbulanceServiceModel } from '../../models/ambulance-service.model';
import { Ambulance } from '../../models/ambulance.model';

import { AmbulanceServiceFilterDto } from './dto/ambulance-service-filter.dto';
import { CreateAmbulanceServiceDto } from './dto/create-ambulance-service.dto';
import { UpdateAmbulanceServiceDto } from './dto/update-ambulance-service.dto';

@Injectable()
export class AmbulanceServicesService {
  constructor(
    @InjectModel(AmbulanceServiceModel)
    private readonly serviceModel: typeof AmbulanceServiceModel,

    @InjectModel(Ambulance)
    private readonly ambulanceModel: typeof Ambulance,
  ) {}

  async create(
    dto: CreateAmbulanceServiceDto,
    context: any,
  ): Promise<AmbulanceServiceModel> {
    const ambulance = await this.ambulanceModel.findOne({
      where: {
        id: dto.ambulance_id,
        tenant_id: String(context.tenantId),
        center_id: String(context.centerId),
      },
    });

    if (!ambulance) {
      throw new NotFoundException('Ambulance not found for this center');
    }

    if (ambulance.status === AmbulanceStatus.ON_TRIP) {
      throw new BadRequestException('Selected ambulance is already on a trip');
    }

    // Create service
    const service = await this.serviceModel.create({
      ...dto,
      tenant_id: String(context.tenantId),
      center_id: String(context.centerId),
      status: ServiceStatus.PENDING,
    });

    // Update ambulance status
    await ambulance.update({
      status: AmbulanceStatus.ON_TRIP,
    });

    return this.findOne(service.id, context);
  }

  async findAll(context: any, filters: AmbulanceServiceFilterDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const offset = (page - 1) * limit;

    const where: any = {
      tenant_id: String(context.tenantId),
      center_id: String(context.centerId),
    };

    if (filters.ambulance_id) {
      where.ambulance_id = filters.ambulance_id;
    }

    if (filters.patient_name) {
      where.patient_name = {
        [Op.iLike]: `%${filters.patient_name}%`,
      };
    }

    if (filters.patient_mobile) {
      where.patient_mobile = filters.patient_mobile;
    }

    if (filters.patient_type) {
      where.patient_type = filters.patient_type;
    }

    if (filters.status) {
      where.status = filters.status;
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

    const { rows: data, count: totalRecords } =
      await this.serviceModel.findAndCountAll({
        where,

        include: [
          {
            model: Ambulance,
            as: 'ambulance',
          },
        ],

        order: [['createdAt', 'DESC']],

        offset,
        limit,
      });

    return {
      data,

      pagination: {
        totalRecords,
        currentPage: page,
        totalPages: Math.ceil(totalRecords / limit) || 1,
        limit,
      },
    };
  }

  async findOne(
    id: string,
    context: any,
  ): Promise<AmbulanceServiceModel> {
    const service = await this.serviceModel.findOne({
      where: {
        id,
        tenant_id: String(context.tenantId),
        center_id: String(context.centerId),
      },

      include: [
        {
          model: Ambulance,
          as: 'ambulance',
        },
      ],
    });

    if (!service) {
      throw new NotFoundException('Ambulance service not found');
    }

    return service;
  }

  async update(
    id: string,
    dto: UpdateAmbulanceServiceDto,
    context: any,
  ): Promise<AmbulanceServiceModel> {
    const service = await this.findOne(id, context);

    const previousStatus = service.status;

    // Update service
    await service.update({
      ...dto,
    });

    // Release ambulance when service is completed/cancelled
    if (
      dto.status &&
      [ServiceStatus.COMPLETED, ServiceStatus.CANCELLED].includes(dto.status) &&
      previousStatus !== dto.status
    ) {
      const ambulance = await this.ambulanceModel.findOne({
        where: {
          id: service.ambulance_id,
        },
      });

      if (ambulance) {
        await ambulance.update({
          status: AmbulanceStatus.AVAILABLE,
        });
      }
    }

    return this.findOne(service.id, context);
  }

  async remove(id: string, context: any): Promise<void> {
    const service = await this.findOne(id, context);

    await service.destroy();
  }
}
