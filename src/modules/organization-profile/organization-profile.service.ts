import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/sequelize';

import { Op } from 'sequelize';

import { OrganizationProfile } from '../../models/OrganizationProfile';

@Injectable()
export class OrganizationProfileService {
  constructor(
    @InjectModel(OrganizationProfile)
    private organizationProfileModel: typeof OrganizationProfile,
  ) {}

  // ================= CREATE =================
  async create(data: any) {
    return await this.organizationProfileModel.create(data);
  }

  // ================= UPDATE =================
  async update(id: number, data: any) {
    const profile = await this.organizationProfileModel.findByPk(id);

    if (!profile) {
      throw new NotFoundException('Organization profile not found');
    }

    await profile.update(data);

    return profile;
  }

  // ================= FIND ALL =================
  async findAll(query: any) {
    const { page = 1, limit = 10, tenant_id, center_id, search, address } = query;

    const offset = (page - 1) * limit;

    const where: any = {};

    if (tenant_id) {
      where.tenant_id = tenant_id;
    }

    if (center_id) {
      where.center_id = center_id;
    }

    if (search) {
      where.display_name = {
        [Op.iLike]: `%${search}%`,
      };
    }
    if (address) {
  where.address = {
    [Op.iLike]: `%${address}%`,
  };
}
    const { rows, count } = await this.organizationProfileModel.findAndCountAll(
      {
        where,
        limit: Number(limit),
        offset: Number(offset),

        order: [['id', 'DESC']],
      },
    );

    return {
      data: rows,

      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  // ================= FIND ONE =================
  async findOne(id: number) {
    const profile = await this.organizationProfileModel.findByPk(id);

    if (!profile) {
      throw new NotFoundException('Organization profile not found');
    }

    return profile;
  }

  // ================= DELETE =================
  async delete(id: number) {
    const profile = await this.organizationProfileModel.findByPk(id);

    if (!profile) {
      throw new NotFoundException('Organization profile not found');
    }

    await profile.destroy();

    return {
      message: 'Deleted successfully',
    };
  }

  // ================= TOGGLE STATUS =================
  async toggleStatus(id: number) {
    const profile = await this.organizationProfileModel.findByPk(id);

    if (!profile) {
      throw new NotFoundException('Organization profile not found');
    }

    profile.is_active = !profile.is_active;

    await profile.save();

    return profile;
  }

  async getBranding(tenantId: number, centerId?: number) {
    let branding = null;

    if (centerId) {
      branding = await this.organizationProfileModel.findOne({
        where: {
          tenant_id: tenantId,
          center_id: centerId,
          is_active: true,
        },
      });
    }
    if (!branding) {
      branding = await this.organizationProfileModel.findOne({
        where: {
          tenant_id: tenantId,
          is_active: true,
        },
        order: [['center_id', 'ASC']],
      });
    }

    return branding;
  }
}
