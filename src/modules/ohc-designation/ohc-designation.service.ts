import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

import { Designation } from '../../models/designation.model';
import { Center } from '../../models/Center';

@Injectable()
export class DesignationService {
  constructor(
    @InjectModel(Designation)
    private readonly designationModel: typeof Designation,

    @InjectModel(Center)
    private readonly ohcCenterModel: typeof Center,
  ) {}

  /**
   * Create Designation
   */
  async create(body: any) {
    const {
      name,
      description,
      code,
      center_id,
      is_active = true,
      modified_by,
      department_id
    } = body;

    if (!name || !name.trim()) {
      throw new BadRequestException('Designation name is required');
    }

    // Validate center if supplied
    // if (center_id) {
    //   await this.validateCenter(center_id);
    // }

   
    // Prevent duplicate designation code
    if (code) {
      const existingCode = await this.designationModel.findOne({
        where: {
          code: code.trim(),
        },
      });

      if (existingCode) {
        throw new BadRequestException('Designation code already exists');
      }
    }

    const designation = await this.designationModel.create({
      name: name.trim(),
      description: description?.trim() || null,
      code: code?.trim() || null,
      center_id: center_id ? Number(center_id) : null,
      is_active,
      modified_by: modified_by || null,
      modified_date: new Date(),
      department_id: department_id ? Number(department_id) : null,
    });

    return {
      success: true,
      message: 'Designation created successfully',
      data: designation,
    };
  }

  /**
   * Get Designation List
   */
  async findAll(query: any) {
    const page = Math.max(Number(query.page) || 1, 1);

    const limit = Math.max(Number(query.limit) || 10, 1);

    const offset = (page - 1) * limit;

    const { name, code, center_id, startDate, endDate } = query;

    const where: any = {};

    /**
     * Name filter
     */
    if (name?.trim()) {
      where.name = {
        [Op.iLike]: `%${name.trim()}%`,
      };
    }

    /**
     * Code filter
     */
    if (code?.trim()) {
      where.code = {
        [Op.iLike]: `%${code.trim()}%`,
      };
    }

    /**
     * Center filter
     */
    // if (center_id) {
    //   where.center_id = Number(center_id);
    // }
    where.center_id = 2;

    /**
     * Modified date filter
     */
    if (startDate && endDate) {
      where.modified_date = {
        [Op.between]: [`${startDate} 00:00:00`, `${endDate} 23:59:59`],
      };
    } else if (startDate) {
      where.modified_date = {
        [Op.gte]: `${startDate} 00:00:00`,
      };
    } else if (endDate) {
      where.modified_date = {
        [Op.lte]: `${endDate} 23:59:59`,
      };
    }

    const { rows, count } = await this.designationModel.findAndCountAll({
      where,
      limit,
      offset,
      order: [['id', 'DESC']],
    });

    return {
      success: true,
      data: {
        data: rows,
        pagination: {
          currentPage: page,
          perPage: limit,
          totalRecords: count,
          totalPages: Math.ceil(count / limit),
        },
      },
    };
  }

  /**
   * Get Designation By ID
   */
  async findOne(id: number) {
    const designation = await this.designationModel.findByPk(id);

    if (!designation) {
      throw new NotFoundException('Designation not found');
    }

    return {
      success: true,
      data: designation,
    };
  }

  /**
   * Update Designation
   */
  async update(id: number, body: any) {
    const designation = await this.designationModel.findByPk(id);

    if (!designation) {
      throw new NotFoundException('Designation not found');
    }

    const { name, description, code, center_id, is_active, modified_by } = body;

    /**
     * Validate name
     */
    if (name !== undefined && !name?.trim()) {
      throw new BadRequestException('Designation  name is required');
    }

    /**
     * Validate center
     */
    if (center_id !== undefined && center_id !== null && center_id !== '') {
      await this.validateCenter(center_id);
    }

    /**
     * Check duplicate code
     */
    if (code) {
      const existingCode = await this.designationModel.findOne({
        where: {
          code: code.trim(),
          id: {
            [Op.ne]: id,
          },
        },
      });

      if (existingCode) {
        throw new BadRequestException('Designation code already exists');
      }
    }

    const updateData: any = {
      modified_date: new Date(),
    };

    if (name !== undefined) {
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (code !== undefined) {
      updateData.code = code?.trim() || null;
    }

    if (center_id !== undefined) {
      updateData.center_id = center_id ? Number(center_id) : null;
    }

    if (is_active !== undefined) {
      updateData.is_active = Boolean(is_active);
    }

    if (modified_by !== undefined) {
      updateData.modified_by = modified_by ? Number(modified_by) : null;
    }

    await designation.update(updateData);

    return {
      success: true,
      message: 'Designation updated successfully',
      data: designation,
    };
  }

  /**
   * Delete Designation
   */
  async remove(id: number) {
    const designation = await this.designationModel.findByPk(id);

    if (!designation) {
      throw new NotFoundException('Designation not found');
    }

    await designation.destroy();

    return {
      success: true,
      message: 'Designation deleted successfully',
    };
  }

  /**
   * Toggle Designation Status
   */
  async toggleStatus(id: number) {
    const designation = await this.designationModel.findByPk(id);

    if (!designation) {
      throw new NotFoundException('Designation not found');
    }

    designation.is_active = !designation.is_active;

    designation.modified_date = new Date();

    await designation.save();

    return {
      success: true,
      message: 'Designation status updated successfully',
      data: designation,
    };
  }

  /**
   * Validate OHC Center
   */
  private async validateCenter(centerId: number) {
    const center = await this.ohcCenterModel.findByPk(Number(centerId));

    if (!center) {
      throw new BadRequestException('OHC Center not found');
    }

    return center;
  }
}
