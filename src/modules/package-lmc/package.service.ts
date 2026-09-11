import { Injectable } from '@nestjs/common';
import { sendSuccess, sendError } from 'src/utils/response.util';
import { Packagemanagment } from 'src/models/packagemanagment.model';
import { Centerpackage } from 'src/models/centerpackage.model';
import { Center } from 'src/models/Center';

@Injectable()
export class PackageServiceLMC {
  async addPackage(req: any, res: any) {
    try {
      const { package_name, package_id, package_list, short_code } = req.body;

      const getLastCenterId = await Packagemanagment.findOne({
        order: [['id', 'DESC']],
      });

      const nextId = getLastCenterId ? parseInt(getLastCenterId.id) + 1 : 1;

      const external_id = `${short_code}00${nextId}`;

      const data = {
        external_id,
        package_type: short_code,
        package_name,
        package_id,
        package_list,
        status: true,
      };

      const insert = await Packagemanagment.create(data);

      sendSuccess(res, 201, insert, 'addPackage successfully');
    } catch (error) {
      sendError(res, 500, error.message);
      return;
    }
  }

  async listPackage(req: any, res: any) {
    try {
      const reqData = await Packagemanagment.findAll({
        raw: true,
        nest: true,
        order: [['id', 'DESC']],
      });

      sendSuccess(res, 200, reqData, 'Success');
    } catch (error) {
      sendError(res, 500, error.message);
      return;
    }
  }

  async updatePackageStatus(req: any, res: any) {
    try {
      if (!req.body.id) {
        sendError(res, 400, 'bad request');
        return;
      }

      if (typeof req.body.status !== 'boolean') {
        sendError(res, 400, 'bad request , status required');
        return;
      }

      const user = await Packagemanagment.findOne({
        where: { id: req.body.id },
      });

      if (!user) {
        sendError(res, 404, 'User id not found');
        return;
      }

      const result = await Packagemanagment.update(
        { status: req.body.status },
        { where: { id: req.body.id } },
      );

      sendSuccess(res, 200, result, 'Status Update Successfully');
    } catch (error) {
      sendError(res, 500, 'internal server error');
    }
  }

  async addPackageTOCenter(req: any, res: any) {
    const {
      package_price,
      package_frequency,
      package_id,
      center_id,
      short_code,
    } = req.body;

    try {
      const getLastCenterId = await Centerpackage.findOne({
        order: [['id', 'DESC']],
      });

      const nextId = getLastCenterId ? parseInt(getLastCenterId.id) + 1 : 1;

      const external_id = `${short_code}00${nextId}`;

      const data = {
        package_price,
        package_frequency,
        package_id,
        center_id,
        external_id,
        status: true,
      };

      const reqData = await Centerpackage.create(data);

      sendSuccess(res, 201, reqData, 'Centerpackage created Successfully');
    } catch (error) {
      return sendError(res, 500, error.message);
    }
  }

  async viewCenterPackage(req: any, res: any) {
    try {
      const reqData = await Centerpackage.findAll({
        include: [
          { model: Packagemanagment, as: 'package' },
          { model: Center, as: 'center' },
        ],
        raw: true,
        nest: true,
        order: [['id', 'DESC']],
      });

      sendSuccess(res, 200, reqData, 'Centerpackage created Successfully');
    } catch (error) {
      console.log(error);
      return sendError(res, 500, error.message);
    }
  }

  async packageDetails(req: any, res: any) {
    if (!req.body.id) {
      sendError(res, 400, 'bad request');
      return;
    }

    try {
      const reqData = await Packagemanagment.findOne({
        where: { id: req.body.id },
        raw: true,
        nest: true,
      });

      sendSuccess(res, 200, reqData, 'Package details retrieved successfully');
    } catch (error) {
      return sendError(res, 500, error.message);
    }
  }

  async packageUpdate(req: any, res: any) {
    const { id, package_name, package_id, package_list } = req.body;

    if (!id) {
      sendError(res, 400, 'bad request');
      return;
    }

    try {
      const packageToUpdate = await Packagemanagment.findByPk(id);

      if (!packageToUpdate) {
        sendError(res, 404, 'Not found');
        return;
      }

      packageToUpdate.package_name = package_name;
      packageToUpdate.package_id = package_id;
      packageToUpdate.package_list = package_list;

      await packageToUpdate.save();

      sendSuccess(res, 200, packageToUpdate, 'Package updated successfully');
    } catch (error) {
      sendError(res, 500, error.message);
    }
  }

  async centerPackageDetails(req: any, res: any) {
    if (!req.body.id) {
      sendError(res, 400, 'bad request');
      return;
    }

    try {
      const reqData = await Centerpackage.findOne({
        where: { id: req.body.id },
        raw: true,
        nest: true,
      });

      sendSuccess(res, 200, reqData, 'Package details retrieved successfully');
    } catch (error) {
      sendError(res, 500, error.message);
    }
  }

  async centerPackageUpdate(req: any, res: any) {
    try {
      const { id, package_price, package_frequency, package_id, center_id } =
        req.body;

      if (!id) {
        sendError(res, 400, 'Bad request');
        return;
      }

      const centerPackageToUpdate = await Centerpackage.findByPk(id);

      if (!centerPackageToUpdate) {
        sendError(res, 404, 'Not found');
        return;
      }

      centerPackageToUpdate.package_price = package_price;
      centerPackageToUpdate.package_frequency = package_frequency;
      centerPackageToUpdate.package_id = package_id;
      centerPackageToUpdate.center_id = center_id;

      await centerPackageToUpdate.save();

      sendSuccess(
        res,
        200,
        centerPackageToUpdate,
        'Center package updated successfully',
      );
    } catch (error) {
      sendError(res, 500, error.message);
    }
  }

  async updateCenterPackageStatus(req: any, res: any) {
    try {
      if (!req.body.id) {
        sendError(res, 400, 'bad request');
        return;
      }

      if (typeof req.body.status !== 'boolean') {
        sendError(res, 400, 'bad request , status required');
        return;
      }

      const user = await Centerpackage.findOne({
        where: { id: req.body.id },
      });

      if (!user) {
        sendError(res, 404, 'User id not found');
        return;
      }

      const result = await Centerpackage.update(
        { status: req.body.status },
        { where: { id: req.body.id } },
      );

      sendSuccess(res, 200, result, 'Status Update Successfully');
    } catch (error) {
      sendError(res, 500, error.message);
    }
  }
}
