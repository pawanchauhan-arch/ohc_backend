import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Disease } from '../../models/disease';
import { Op } from 'sequelize';
import { CreateDiseaseDto } from './dto/create-disease.dto';

@Injectable()
export class DiseaseService {
  constructor(
    @InjectModel(Disease)
    private readonly diseaseModel: typeof Disease,
  ) {}

  async searchDiseases(
    query: string = '',
    page: number = 1,
    limit: number = 20,
  ) {
    const offset = (page - 1) * limit;

    const whereClause = query
      ? {
          is_active: true,
          name: { [Op.iLike]: `%${query}%` },
        }
      : { is_active: true };

    const { rows, count } = await this.diseaseModel.findAndCountAll({
      where: whereClause,
      offset,
      limit,
      order: [['name', 'ASC']],
    });

    return {
      data: rows,
      currentPage: page,
      totalRecords: count,
      totalPages: Math.ceil(count / limit),
    };
  }
  async createDisease(data: CreateDiseaseDto) {
    const name = data.name?.trim();
    const code = data.code?.trim();
    const category = data.category?.trim();
    const description = data.description?.trim();

    if (!name) {
      throw new BadRequestException('Disease name is required');
    }

    if (!code) {
      throw new BadRequestException('Disease code is required');
    }

    const existingDisease = await this.diseaseModel.findOne({
      where: {
        name: { [Op.iLike]: name },
      },
    });

    if (existingDisease) {
      throw new ConflictException('Disease with this name already exists');
    }

    try {
      const diseaseData = {
        name,
        code,
        is_active: true,
        ...(category ? { category } : {}),
        ...(description ? { description } : {}),
      };

      return await this.diseaseModel.create(diseaseData);
    } catch (error: unknown) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Disease with this name already exists');
      }

      throw error;
    }
  }

  private isUniqueConstraintError(error: unknown): error is { name: string } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      (error as { name?: unknown }).name === 'SequelizeUniqueConstraintError'
    );
  }
}
