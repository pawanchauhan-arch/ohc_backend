import { Injectable } from '@nestjs/common';
import { Op, fn, col } from 'sequelize';

import { CETMANAGEMENT } from 'src/models/CetManagement';
import { Center } from 'src/models/Center';
import { driverhealthcheckup } from 'src/models/DriverHealthCheckup';
import { DRIVERMASTER } from 'src/models/DriverMaster';
import { Doctor } from 'src/models/Doctor';
import * as fs from 'fs';
import * as path from 'path';
import { createObjectCsvWriter } from 'csv-writer';
import { sendSuccess, sendError } from '../../../utils/response.util';
import { GlobalHelper } from '../../../helper/global.helper';
import { User } from 'src/models/User';
import { CenterUser } from 'src/models/CenterUser';
import { Prescription } from 'src/models/Prescription';
import { PrescriptionMedicine } from 'src/models/PrescriptionMedicine';
import {
  emptyShapedContacts,
  findAllCetsWithContacts,
  findOneCetWithContacts,
  safeSyncCetContacts,
} from 'src/helper/cet-contact.helper';
@Injectable()
export class CetManagementService {
  async createCET(req: any, res: any) {
    const {
      name,
      uniqueId,
      registeredAddress,
      correspondenceAddress,
      contactNumber,
      spocName,
      spocWhatsappNumber,
      spocEmail,
      alternateSpocName,
      alternateSpocContactNumber,
      alternateSpocEmail,
      pan,
      gstin,
      accountNumber,
      ifscCode,
      bankName,
      attachPanCopy,
      attachGstin,
      attachCancelledChequeOrPassbook,
      attachCertificateOfIncorporation,
      short_code,
      cet_type,
      center_ids_array,
    } = req.body;

    const requiredFields = ['name', 'registeredAddress', 'contactNumber'];
    const missingFields = requiredFields.filter(
      (f) => !req.body[f] || req.body[f].trim() === '',
    );

    if (missingFields.length) {
      return res
        .status(400)
        .json({ error: `${missingFields.join(', ')} is required` });
    }

    try {
      const last = await CETMANAGEMENT.findOne({ order: [['id', 'DESC']] });
      const nextId = last ? Number(last.id) + 1 : 1;
      const external_id = `${short_code}000${nextId}`;

      // const cId = await GlobalHelper.getCenterId(req.userId);

      const data = {
        center_ids_array: center_ids_array,
        external_id,
        short_code,
        cet_type,
        name,
        uniqueId,
        registeredAddress,
        correspondenceAddress,
        contactNumber,
        spocName,
        spocWhatsappNumber,
        spocEmail,
        alternateSpocName,
        alternateSpocContactNumber,
        alternateSpocEmail,
        pan,
        gstin,
        accountNumber,
        ifscCode,
        bankName,
        status: 'Active',
        attachPanCopy: attachPanCopy || null,
        attachGstin: attachGstin || null,
        attachCancelledChequeOrPassbook:
          attachCancelledChequeOrPassbook || null,
        attachCertificateOfIncorporation:
          attachCertificateOfIncorporation || null,
      };

      const insert = await CETMANAGEMENT.create(data);

      try {
        await safeSyncCetContacts(Number(insert.id), req.body);
      } catch (contactErr) {
        return sendError(
          res,
          400,
          contactErr instanceof Error
            ? contactErr.message
            : 'Invalid supervisor details',
        );
      }

      const shaped =
        (await findOneCetWithContacts({ id: insert.id })) || {
          ...insert.get({ plain: true }),
          ...emptyShapedContacts(),
        };

      return sendSuccess(res, 201, shaped, 'CET Center successfully');
    } catch (error) {
      return sendError(
        res,
        500,
        error instanceof Error ? error.message : 'Internal server error',
      );
    }
  }

  async viewCET(req: any, res: any) {
    try {
      const cIds = await GlobalHelper.getCenterId(req.userId);
      const centerId = Number(cIds.center_id);
      const result = await findAllCetsWithContacts({
        where: {
          center_ids_array: {
            [Op.contains]: [centerId],
          },
        },
        order: [['id', 'DESC']],
      });

      return sendSuccess(res, 200, result, 'CET List Fetch Successful');
    } catch (error) {
      return sendError(res, 500, 'internal server error');
    }
  }

  // Return all CETs (id and name) — accessible to authenticated center users
  async listAllCETs() {
    const result = await CETMANAGEMENT.findAll({
      attributes: ['id', 'name'],
      order: [['id', 'DESC']],
      raw: true,
      nest: true,
    });
    return result;
  }

  async viewCETDetails(req: any, res: any) {
    if (!req.body.id) {
      return sendError(res, 400, 'ID Required');
    }

    try {
      const result = await findOneCetWithContacts({ id: req.body.id });

      if (!result) {
        return sendError(res, 404, 'CET not found');
      }

      return sendSuccess(
        res,
        200,
        result,
        'CET Details Fetch Successful',
      );
    } catch (error) {
      return sendError(res, 500, 'internal server error');
    }
  }

  async updateCET(req: any, res: any) {
    const { id, manager, supervisors, ...rest } = req.body;
    if (!id) return sendError(res, 400, 'ID Required');

    try {
      const update = await CETMANAGEMENT.update(rest, {
        where: { id },
      });

      try {
        await safeSyncCetContacts(Number(id), req.body);
      } catch (contactErr) {
        return sendError(
          res,
          400,
          contactErr instanceof Error
            ? contactErr.message
            : 'Invalid supervisor details',
        );
      }

      return sendSuccess(res, 200, update, 'CET Center updated successfully');
    } catch (error) {
      return sendError(
        res,
        500,
        error instanceof Error ? error.message : 'Internal server error',
      );
    }
  }

  async healthCheckupHistoryDownload(req: any, res: any) {
    try {
      const cId = await GlobalHelper.getCetId(req.userId);
      if (!cId) return sendError(res, 400, 'Not found');

      const drivers = await driverhealthcheckup.findAll({
        where: { transpoter: cId.cet_id },
        include: [{ model: DRIVERMASTER, as: 'driver' }],
        order: [['id', 'DESC']],
      });

      if (!drivers.length) return sendError(res, 404, 'No data found');

      const filePath = path.join(__dirname, 'healthCheckupHistory.csv');
      const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: [
          { id: 'id', title: 'ID' },
          { id: 'uniqueId', title: 'Unique ID' },
          { id: 'driver_name', title: 'Driver Name' },
        ],
      });

      await csvWriter.writeRecords(
        drivers.map((d) => ({
          id: d.id,
          uniqueId: d.uniqueId,
          driver_name: d.driver?.name,
        })),
      );

      return res.download(filePath, () => fs.unlinkSync(filePath));
    } catch (error) {
      return sendError(res, 500, 'internal server error');
    }
  }

  async healthCheckupHistory(req: any, res: any) {
    try {
      const cId = await GlobalHelper.getCetId(req.userId);
      const { start_date, end_date } = req.body;

      let whereCondition: any = {
        confirm_report: 'yes',
        is_submited: true,
        transpoter: cId.cet_id,
      };

      let queryOptions: any = {
        where: whereCondition,
        include: [
          {
            model: Doctor,
            as: 'doctor',
            include: [
              {
                model: User,
                as: 'user',
                attributes: [
                  'id',
                  'username',
                  'name',
                  'status',
                  'phone',
                  'external_id',
                  'email',
                ],
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
                    attributes: [
                      'id',
                      'username',
                      'name',
                      'status',
                      'phone',
                      'external_id',
                      'email',
                    ],
                  },
                ],
              },
            ],
          },
          {
            model: DRIVERMASTER,
            as: 'driver',
          },
          {
            model: User,
            as: 'user',
            attributes: [
              'id',
              'username',
              'name',
              'status',
              'phone',
              'external_id',
              'email',
            ],
          },
          {
            model: CETMANAGEMENT,
            as: 'CETMANAGEMENT',
          },
          {
            model: Prescription,
            as: 'checkupPrescriptions', // old is presctions need to change into the frontend
            required: false,
            attributes: [
              'prescription_id',
              'lab',
              'other_lab',
              'instructions',
              'chief_complaints',
              'follow_up',
              'preventive_advice',
              'prescription_slip_image',
              'prescription_slip_text',
              'vitals',
              'health_conditions',
              'drug_allergies',
              'diagnose',
              'fitness_status',
              'createdAt',
            ],
            include: [
              {
                model: PrescriptionMedicine,
                as: 'medicines',
                required: false,
                attributes: [
                  'medicine_name',
                  'dosage',
                  'frequency',
                  'medicine_type',
                  'duration',
                  'instructions',
                ],
              },
            ],
            order: [['createdAt', 'DESC']],
          },
        ],
        order: [['id', 'DESC']],
      };

      // Date filter logic (unchanged)
      if (start_date && end_date) {
        const startDateFormatted = new Date(`${start_date}T00:00:00Z`);
        const endDateFormatted = new Date(`${end_date}T23:59:59Z`);

        whereCondition.date_time = {
          [Op.between]: [startDateFormatted, endDateFormatted],
        };
      } else {
        queryOptions.limit = 100;
      }

      if (cId) {
        const drivers = await driverhealthcheckup.findAll(queryOptions);
        sendSuccess(res, 200, drivers, 'CET List Fetch Successful');
        return;
      } else {
        sendError(res, 400, 'Not found');
        return;
      }
    } catch (error) {
      console.log(error);
      sendError(res, 500, 'Internal server error');
    }
  }

  async getTestCountPerCenter(req: any, res: any) {
    try {
      const { startDate, endDate } = req.body;
      if (!startDate || !endDate)
        return sendError(res, 400, 'startDate and endDate are required');

      const data = await driverhealthcheckup.findAll({
        attributes: [
          [col('center.project_name'), 'center_name'],
          [fn('COUNT', col('driverhealthcheckup.id')), 'test_count'],
        ],
        include: [{ model: Center, as: 'center', attributes: [] }],
        where: {
          createdAt: {
            [Op.between]: [
              new Date(startDate).toISOString(),
              new Date(endDate).toISOString(),
            ],
          },
        },
        group: ['center.project_name'],
        order: [[col('test_count'), 'DESC']],
        raw: true,
      });

      return sendSuccess(
        res,
        200,
        data,
        'Test count per center retrieved successfully',
      );
    } catch (error) {
      return sendError(
        res,
        500,
        error instanceof Error ? error.message : 'Internal server error',
      );
    }
  }

  async healthCheckupHistoryById(req: any, res: any) {
    try {
      const cId = req.body?.id;

      if (!cId) {
        return sendError(res, 400, 'Not found');
      }

      const drivers = await driverhealthcheckup.findAll({
        where: { id: cId },
        include: [
          {
            model: Doctor,
            as: 'doctor',
            include: [
              {
                model: User,
                as: 'user',
                attributes: [
                  'id',
                  'username',
                  'name',
                  'status',
                  'phone',
                  'external_id',
                  'email',
                ],
              },
            ],
          },
          {
            model: Center,
            as: 'center',
          },
          {
            model: DRIVERMASTER,
            as: 'driver',
          },
          {
            model: User,
            as: 'user',
            attributes: [
              'id',
              'username',
              'name',
              'status',
              'phone',
              'external_id',
              'email',
            ],
          },
          {
            model: CETMANAGEMENT,
            as: 'CETMANAGEMENT',
          },
        ],
        order: [['id', 'DESC']],
      });

      return sendSuccess(res, 200, drivers, 'CET List Fetch Successful');
    } catch (error) {
      console.error('healthCheckupHistoryById error:', error);
      return sendError(res, 500, 'internal server error');
    }
  }
}
