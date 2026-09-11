import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Packagemanagment } from 'src/models/packagemanagment.model';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class PackagemanagementService {
  constructor(
    @InjectModel(Packagemanagment)
    private readonly packageModel: typeof Packagemanagment,

    private readonly sequelize: Sequelize,
  ) {}

  async addPackage(body: any) {
    const transaction = await this.sequelize.transaction();

    try {
      const {
        package_name,
        package_type,
        package_price,
        package_list,
        tenant_id,
        center_id,
       
      } = body;

      if (
        !package_name ||
        !package_type ||
        !tenant_id ||
        !center_id ||
        !package_list
      ) {
        throw new Error('Required fields are missing');
      }

      const duplicate = await this.packageModel.findOne({
        where: {
          package_name,
          tenant_id,
          center_id,
          status: true,
        },
        transaction,
      });

      if (duplicate) {
        throw new Error('Package already exists.');
      }

      const lastPackage = await this.packageModel.findOne({
        where: {
          package_type,
        },
        order: [['id', 'DESC']],
        transaction,
      });

      let nextNumber = 1;

      if (lastPackage?.external_id) {
        const number = parseInt(
          lastPackage.external_id.replace(package_type, ''),
          10,
        );

        nextNumber = number + 1;
      }

      const external_id =
        package_type + String(nextNumber).padStart(4, '0');

      const data = await this.packageModel.create(
        {
          package_name,
          package_type,
          package_price,
          package_list,
          tenant_id,
          center_id,
          package_id: null,
          external_id,
          status: true,
        },
        {
          transaction,
        },
      );

      await transaction.commit();

      return {
        success: true,
        message: 'Package created successfully',
        data,
      };
    } catch (error: any) {
      await transaction.rollback();

      throw new InternalServerErrorException(
        error.message || 'Failed to create package',
      );
    }
  }

async listPackage(query: any) {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = true,
    } = query;

    const pageNumber = Number(page);
    const pageSize = Number(limit);
    const offset = (pageNumber - 1) * pageSize;

    const where: any = {
      status:
        status === true ||
        status === 'true' ||
        status === 1 ||
        status === '1',

      tenant_id: {
        [Op.ne]: null,
      },

      center_id: {
        [Op.ne]: null,
      },
    };

    if (search) {
      where[Op.or] = [
        {
          package_name: {
            [Op.iLike]: `%${search}%`,
          },
        },
        {
          external_id: {
            [Op.iLike]: `%${search}%`,
          },
        },
        {
          package_type: {
            [Op.iLike]: `%${search}%`,
          },
        },
      ];
    }

    const { rows, count } = await this.packageModel.findAndCountAll({
  where,
  attributes: {
    exclude: ['tenant_id', 'center_id'],
  },
  limit: pageSize,
  offset,
  order: [['createdAt', 'DESC']],
});

    return {
      success: true,
      message: 'Package list fetched successfully',
      data: rows,
      pagination: {
        currentPage: pageNumber,
        pageSize,
        totalRecords: count,
        totalPages: Math.ceil(count / pageSize),
      },
    };
  } catch (error: any) {
    throw new InternalServerErrorException(
      error.message || 'Failed to fetch package list',
    );
  }
}
async packageDetails(body: any) {
  try {
    const { id, tenant_id, center_id } = body;

    const data = await this.packageModel.findOne({
      where: {
        id,
        tenant_id,
        center_id,
        status: true,
      },
    });

    if (!data) {
      throw new NotFoundException('Package not found');
    }

    return {
      success: true,
      message: 'Package details fetched successfully',
      data,
    };
  } catch (error: any) {
    throw new InternalServerErrorException(
      error.message || 'Failed to fetch package details',
    );
  }
}
async updatePackage(body: any) {
  const transaction = await this.sequelize.transaction();

  try {
    const {
      id,
      package_name,
      package_type,
      package_price,
      package_list,
      tenant_id,
      center_id,
    } = body;

    const packageData = await this.packageModel.findOne({
      where: {
        id,
        tenant_id,
        center_id,
        status: true,
      },
      transaction,
    });

    if (!packageData) {
      throw new NotFoundException('Package not found');
    }

    const duplicate = await this.packageModel.findOne({
      where: {
        package_name,
        tenant_id,
        center_id,
        id: {
          [Op.ne]: id,
        },
        status: true,
      },
      transaction,
    });

    if (duplicate) {
      throw new Error('Package name already exists.');
    }

    await packageData.update(
      {
        package_name,
        package_type,
        package_price,
        package_list,
      },
      {
        transaction,
      },
    );

    await transaction.commit();

    return {
      success: true,
      message: 'Package updated successfully',
      data: packageData,
    };
  } catch (error: any) {
    await transaction.rollback();

    throw new InternalServerErrorException(
      error.message || 'Failed to update package',
    );
  }
}
async deletePackage(body: any) {
  const transaction = await this.sequelize.transaction();

  try {
    const { id, tenant_id, center_id } = body;

    const packageData = await this.packageModel.findOne({
      where: {
        id,
        tenant_id,
        center_id,
        status: true,
      },
      transaction,
    });

    if (!packageData) {
      throw new NotFoundException('Package not found');
    }

    await packageData.update(
      {
        status: false,
      },
      {
        transaction,
      },
    );

    await transaction.commit();

    return {
      success: true,
      message: 'Package deleted successfully',
    };
  } catch (error: any) {
    await transaction.rollback();

    throw new InternalServerErrorException(
      error.message || 'Failed to delete package',
    );
  }
}

}