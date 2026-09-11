import { Injectable,   InternalServerErrorException, NotFoundException,BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { OhcVitals } from 'src/models/ohcVitals.model';

@Injectable()
export class OhcVitalsService {
    constructor(
        @InjectModel(OhcVitals)
        private readonly vitalsModel: typeof OhcVitals,
    ) { }

   async create(data: Partial<OhcVitals>) {
  try {
    // if (!data.employee_id) {
    //   throw new BadRequestException('Employee ID required');
    // }

    const result = await this.vitalsModel.create(data as any);

    return {
      success: true,
      message: 'Vitals created successfully',
      data: result,
    };

  } catch (error: any) {
    throw new InternalServerErrorException({
      success: false,
      message: error.message || 'Failed to create vitals',
    });
  }
}
async findAll() {
  const data = await this.vitalsModel.findAll({
    order: [['id', 'DESC']],
  });

  return {
    success: true,
    message: 'Vitals fetched successfully',
    data,
  };
}
async findOne(id: number) {
  const data = await this.vitalsModel.findByPk(id);

  if (!data) {
    throw new NotFoundException({
      success: false,
      message: 'Vitals not found',
    });
  }

  return {
    success: true,
    message: 'Vitals fetched successfully',
    data,
  };
}
async update(id: number, data: Partial<OhcVitals>) {
  try {
    const record = await this.vitalsModel.findByPk(id);

    if (!record) {
      throw new NotFoundException({
        success: false,
        message: 'Vitals not found',
      });
    }

    await record.update(data);

    return {
      success: true,
      message: 'Vitals updated successfully',
      data: record,
    };

  } catch (error: any) {
    throw new InternalServerErrorException({
      success: false,
      message: error.message || 'Failed to update vitals',
    });
  }
}
async delete(id: number) {
  const deleted = await this.vitalsModel.destroy({
    where: { id },
  });

  if (!deleted) {
    throw new NotFoundException({
      success: false,
      message: 'Vitals not found',
    });
  }

  return {
    success: true,
    message: 'Vitals deleted successfully',
  };
}
}
