import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { sendSuccess, sendError } from 'src/utils/response.util';
import { Bloodgroup } from 'src/models/bloodgroup.model';
import { Bloodpressure } from 'src/models/bloodpressure.model';
import { BMI } from 'src/models/bmi.model';
import { CHOLESTEROL } from 'src/models/cholesterol.model';
import { ECG } from 'src/models/ecg.model';
import { Eyetest } from 'src/models/eyetest.model';
import { Hearingtest } from 'src/models/hearingtest.model';
import { Vision } from 'src/models/vision.model';
import { CETMANAGEMENT } from 'src/models/CetManagement';
import { Center } from 'src/models/Center';
import { CenterUser } from 'src/models/CenterUser';
import { User } from 'src/models/User';
import {
  checkEmailExist,
  checkUserNameExist,
  checkPhoneExist,
  checkRole,
  getRoleById,
} from 'src/helper/auth.helper';
import * as bcrypt from 'bcryptjs';
import { Cetuser } from 'src/models/CetUser';
import { GlobalHelper } from 'src/helper/global.helper';
import { Sequelize } from 'sequelize-typescript';
import { Op, WhereOptions } from 'sequelize';
import * as ExcelJS from 'exceljs';
import { driverhealthcheckup } from 'src/models/DriverHealthCheckup';
import { saveDriverHealthCheckupAsAdmin } from 'src/utils/driver-health-checkup-admin-update.util';
import { Doctor } from 'src/models/Doctor';
import { DRIVERMASTER } from 'src/models/DriverMaster';
import * as moment from 'moment-timezone';
import {
  getOperationalDateRangeWindow,
  getOperationalDayWindow,
  getOperationalRangeEndUtc,
} from 'src/utils/operational-day.util';
import { Prescription } from 'src/models/Prescription';
import { Haemoglobin } from 'src/models/haemoglobin.model';
import { Pulmonaryfunctiontest } from 'src/models/pulmonaryfunctiontest.model';
import { CenterGroup } from 'src/models/CenterGroup';
import { clearCenterGroupsCache } from 'src/utils/center-group.util';
import { Workforcetype } from 'src/models/workforcetype.model';
import { Romberg } from 'src/models/romberg.model';
import { RandomBloodSugar } from 'src/models/random-blood-sugar.model';
import { Pulse } from 'src/models/pulse.model';
import { Temperature } from 'src/models/temperature.model';
import { Cretenine } from '../../../models/cretenine.model';
import { Hiv } from 'src/models/hiv.model';
import { Alcholtest } from 'src/models/alcholtest.model';
import { SPO2 } from 'src/models/spo2.model';
import { AuthService } from 'src/modules/auth/auth.service';
import { Permission } from 'src/models/Permissions';
import { Role } from 'src/models/Role';
import HttpStatusCode from 'src/const/HttpStatusCode';
import slugify from 'slugify';
import { UserLog } from 'src/models/userlog.model';
import {
  emptyShapedContacts,
  findAllCetsWithContacts,
  findOneCetWithContacts,
  safeSyncCetContacts,
} from 'src/helper/cet-contact.helper';

@Injectable()
export class CetAdminServiceLMC {
  constructor(
    private readonly sequelize: Sequelize,
    private readonly authService: AuthService,
  ) {}

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
      status,
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
      (field) =>
        !req.body[field] ||
        typeof req.body[field] !== 'string' ||
        req.body[field].trim() === '',
    );

    if (missingFields.length > 0) {
      const msg = missingFields.join(', ');
      return res.status(400).json({ error: `${msg} is required` });
    }

    try {
      const getLastCenterId = await CETMANAGEMENT.findOne({
        order: [['id', 'DESC']],
      });

      const nextId = getLastCenterId ? parseInt(getLastCenterId.id) + 1 : 1;

      const external_id = `${short_code}000${nextId}`;

      const data = {
        center_ids_array,
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
        attachPanCopy: attachPanCopy ? attachPanCopy : null,
        attachGstin: attachGstin ? attachGstin : null,
        attachCancelledChequeOrPassbook: attachCancelledChequeOrPassbook
          ? attachCancelledChequeOrPassbook
          : null,
        attachCertificateOfIncorporation: attachCertificateOfIncorporation
          ? attachCertificateOfIncorporation
          : null,
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

      sendSuccess(res, 201, shaped, 'CET Center successfully');
      return;
    } catch (error) {
      sendError(res, 500, error.message);
      return;
    }
  }
  async viewCET(req: any, res: any) {
    try {
      const result = await findAllCetsWithContacts({
        order: [['id', 'DESC']],
      });

      return sendSuccess(res, 200, result, 'CET Fetch Successful');
    } catch (error) {
      throw new InternalServerErrorException('Internal server error');
    }
  }
  async viewCenter(req: any, res: any) {
    try {
      const result = await this.findAllCenters();
      return sendSuccess(res, 200, result, 'Center Fetch Successful');
    } catch (error) {
      throw new InternalServerErrorException('Invalid input');
    }
  }

  async viewCETDetails(req, res) {
    if (!req.body?.id) {
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

  async updateCET(req, res) {
    const { id, manager, supervisors, ..._rest } = req.body;

    if (!id) {
      return sendError(res, 400, 'ID Required');
    }

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
      status,
      attachPanCopy,
      attachGstin,
      attachCancelledChequeOrPassbook,
      attachCertificateOfIncorporation,
      center_ids_array,
      cet_type,
    } = req.body;

    try {
      const data = {
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
        status,
        attachPanCopy: attachPanCopy ?? null,
        attachGstin: attachGstin ?? null,
        attachCancelledChequeOrPassbook:
          attachCancelledChequeOrPassbook ?? null,
        attachCertificateOfIncorporation:
          attachCertificateOfIncorporation ?? null,
        center_ids_array,
        cet_type,
      };

      const updateResult = await CETMANAGEMENT.update(data, {
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

      return sendSuccess(
        res,
        200,
        updateResult,
        'CET Center updated successfully',
      );
    } catch (error) {
      return sendError(res, 500, error.message);
    }
  }

    async updateCETStatus(req, res) {
      const { id, status } = req.body;
  
      if (!id) {
        return sendError(res, 400, 'ID Required');
      }
  
      if (typeof status !== 'string' || !['Active', 'Inactive'].includes(status)) {
        return sendError(res, 400, 'bad request , status required (Active/Inactive)');
      }
  
      try {
        const user = await CETMANAGEMENT.findOne({
          where: { id },
        });
  
        if (!user) {
          return sendError(res, 404, 'CETMANAGEMENT id not found');
        }

        const transaction = await this.sequelize.transaction();
        try {
          const result = await CETMANAGEMENT.update({ status }, { where: { id }, transaction });

          // Requirement: If CET is disabled, disable all its CET users (Users.status=false)
          if (status === 'Inactive') {
            const mappings = await Cetuser.findAll({
              where: { cet_id: id },
              attributes: ['user_id'],
              raw: true,
              transaction,
            });
            const userIds = mappings
              .map((m: { user_id?: number }) => m.user_id)
              .filter((uid) => uid != null);
            if (userIds.length) {
              await User.update({ status: false }, { where: { id: userIds }, transaction });
            }
          }

          // Requirement: If CET becomes Active again, do NOT auto-enable users (manual enable only)

          await transaction.commit();
          return sendSuccess(res, 200, result, 'Status Update Successfully');
        } catch (error) {
          await transaction.rollback();
          throw error;
        }
      } catch (error) {
        return sendError(res, 500, error.message);
      }
    }

  async assignCET(req, res) {
    try {
      if (!req.body?.cet_id) {
        return sendError(res, 400, 'cet_id required');
      }

      const hasPermissionId = req.body?.permission_id != null && req.body?.permission_id !== '';
      const hasRoleId = req.body?.role_id != null && req.body?.role_id !== '';

      if(!hasRoleId){
        if (!hasPermissionId ) {
          return sendError(res, 400, 'permission id required');
        }
      }

      const { username, phone, email } = req.body;
      const phoneNumber = String(phone);

      if (await checkUserNameExist(username.trim().toLowerCase())) {
        return sendError(res, 400, 'Username Already Exists');
      }

      if (await checkEmailExist(email.toLowerCase())) {
        return sendError(res, 400, 'Email Already Exists');
      }

      if (await checkPhoneExist(phoneNumber)) {
        return sendError(res, 400, 'phoneNumber Already Exists');
      }

      let roleData: { role_id: number; id: number | null };

      if (hasPermissionId) {
        const permissionData = await checkRole(req.body.permission_id);
        if (!permissionData) {
          return sendError(res, 404, 'Invalid permission id');
        }
        roleData = {
          role_id: Number(permissionData.role_id),
          id: permissionData.id,
        };
      } else {
        const roleId = Number(req.body.role_id);
        const role = await getRoleById(roleId);
        if (!role) {
          return sendError(res, 404, 'Invalid role id');
        }
        roleData = {
          role_id: role.id,
          id: null,
        };
      }

      const result = await GlobalHelper.assignCetToUser(req, res, roleData);

      return sendSuccess(res, 201, result, 'Cet user assign successfully');
    } catch (error) {
      return sendError(res, 500, error.message);
    }
  }

  // ---------------- CET USER LIST ----------------
  async cetUser(req, res) {
    try {
      const cetUser = await Cetuser.findAll({
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
          {
            model: CETMANAGEMENT,
            as: 'cetManagement',
          },
        ],
        order: [['id', 'DESC']],
      });

      return sendSuccess(res, 200, cetUser, 'Cet User List Fetch Successfully');
    } catch (error) {
      return sendError(res, 500, error.message);
    }
  }

  // ---------------- CET USER DETAILS ----------------
  async cetUserDetails(req, res) {
    try {
      const { id } = req.body;

      const cetUser = await Cetuser.findOne({
        where: { user_id: id },
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
          {
            model: CETMANAGEMENT,
            as: 'cetManagement',
          },
        ],
        order: [['id', 'DESC']],
      });

      return sendSuccess(res, 200, cetUser, 'Cet Fetch Successfully');
    } catch (error) {
      return sendError(res, 500, error.message);
    }
  }

  async cetUserUpdate(req, res) {
    try {
      const {
        id,
        username,
        name,
        permission_id,
        phone,
        email,
        password,
        cet_id,
      } = req.body;

      let cetUser;

      // Find user
      const user = await User.findByPk(id);
      if (!user) {
        return sendError(res, 404, 'User not found');
      }

      // Validate permission
      const getData = await checkRole(permission_id);
      if (!getData) {
        return sendError(res, 404, 'Invalid permission id');
      }

      // Update user fields
      user.username = username;
      user.name = name;
      user.role_id = getData.role_id;
      user.permission_id = permission_id;
      user.phone = phone;
      user.email = email;

      if (password) {
        user.password = bcrypt.hashSync(password, 8);
      }

      await user.save();

      // Update / create CET mapping
      if (cet_id) {
        cetUser = await Cetuser.findOne({
          where: { user_id: id },
        });

        if (!cetUser) {
          cetUser = await Cetuser.create({
            user_id: id,
            cet_id,
          });
        } else {
          cetUser.cet_id = cet_id;
          await cetUser.save();
        }
      }

      return sendSuccess(
        res,
        200,
        { user, cetUser },
        'User data updated successfully',
      );
    } catch (error) {
      return sendError(res, 500, error.message);
    }
  }

  // ---------------- UPDATE CET USER STATUS ----------------
    async updateCetUserStatus(req, res) {
      try {
        const { id, status } = req.body;
  
        if (!id) {
          return sendError(res, 400, 'id required');
        }
  
        if (typeof status !== 'boolean') {
          return sendError(res, 400, 'bad request , status required');
        }
  
        const user = await User.findOne({ where: { id } });
        if (!user) {
          return sendError(res, 404, 'User id not found');
        }

        // Requirement: If CET is inactive, do not allow enabling a CET user
        if (status === true) {
          const mapping = await Cetuser.findOne({
            where: { user_id: id },
            attributes: ['cet_id'],
            raw: true,
          });

          if (mapping?.cet_id) {
            const cet = await CETMANAGEMENT.findOne({
              where: { id: mapping.cet_id },
              attributes: ['id', 'status'],
              raw: true,
            });

            if (cet && String(cet.status) === 'Inactive') {
              return sendError(res, 400, 'cet_inactive');
            }
          }
        }
  
        const result = await User.update({ status }, { where: { id } });
  
        return sendSuccess(res, 200, result, 'Status Update Successfully');
      } catch (error) {
        return sendError(res, 500, error.message);
      }
    }

  async downloadCsvCet(req, res) {
    const { cet, start_date, end_date } = req.body;

    let whereCondition: any = {};
    let whereCondition2: any = {};

    if (cet && cet !== 'all') {
      whereCondition.transpoter = cet;
    }

    if (start_date && end_date) {
      whereCondition2.date_time = {
        [Op.between]: [`${start_date} 00:00:00`, `${end_date} 23:59:59`],
      };
    } else if (start_date && !end_date) {
      const startDateFormatted = `${start_date} 00:00:00`;
      const now = new Date();

      whereCondition2.date_time = {
        [Op.gte]: startDateFormatted,
        [Op.lt]: now,
      };
    } else {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      whereCondition2.date_time = {
        [Op.gte]: oneDayAgo,
        [Op.lt]: now,
      };
    }

    try {
      const cetUser = await driverhealthcheckup.findAll({
        where: {
          ...whereCondition,
          ...whereCondition2,
        },
        include: [
          {
            model: Doctor,
            as: 'doctor',
            include: [
              {
                model: User,
                as: 'User',
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
        raw: true,
        nest: true,
        attributes: [
          'vehicle_no',
          'id',
          'date_time',
          'selected_package_name',
          'patient_type',
          'shipmentno',
          'gateentryno',
          [this.sequelize.col('CETMANAGEMENT.name'), 'CETName'],
          [this.sequelize.col('center.project_name'), 'CenterName'],
          [this.sequelize.col('user.username'), 'CenterUserName'],
          [this.sequelize.col('driver.name'), 'WorkforceName'],
          [this.sequelize.col('driver.healthCardNumber'), 'HealthCardNumber'],
          [this.sequelize.col('driver.contactNumber'), 'WorkforceMobileNo'],
        ],
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('CetUsers');

      const trimValue = (value) => {
        if (value === null || value === undefined) return value;
        if (typeof value === 'string') {
          return value
            .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
            .replace(/^['"]+/g, '')
            .replace(/['"]+$/g, '')
            .replace(/^\s+|\s+$/g, '')
            .replace(/\s+/g, ' ');
        }
        return value;
      };

      worksheet.columns = [
        { header: 'CET Name', key: 'CETName', width: 20 },
        { header: 'Center Name', key: 'CenterName', width: 20 },
        { header: 'Center User Name', key: 'CenterUserName', width: 20 },
        { header: 'Test Date', key: 'TestDate', width: 15 },
        { header: 'Test Timestamp', key: 'TestTimestamp', width: 20 },
        { header: 'Test Package Name', key: 'TestPackageName', width: 30 },
        { header: 'Workforce Name', key: 'WorkforceName', width: 20 },
        { header: 'Health Card Number', key: 'HealthCardNumber', width: 20 },
        { header: 'Workforce Mobile No', key: 'WorkforceMobileNo', width: 15 },
        { header: 'Vehicle Number', key: 'VehicleNumber', width: 15 },
        { header: 'Patient Type', key: 'PatientType', width: 15 },
        { header: 'Shipment Number', key: 'ShipmentNumber', width: 18 },
        { header: 'Gate Entry Number', key: 'GateEntryNumber', width: 18 },
        { header: 'Test ID', key: 'id', width: 10 },
      ];

      cetUser.forEach((data) => {
        const packageNames = Array.isArray(data.selected_package_name)
          ? data.selected_package_name.join(',')
          : data.selected_package_name || '';

        worksheet.addRow({
          CETName: trimValue(data.CETMANAGEMENT?.name),
          CenterName: trimValue(data.center?.project_name),
          CenterUserName: trimValue(data.user?.username),
          TestDate: new Date(data.date_time).toISOString().split('T')[0],
          TestTimestamp: trimValue(data.date_time),
          TestPackageName: trimValue(packageNames),
          WorkforceName: trimValue(data.driver?.name),
          HealthCardNumber: trimValue(data.driver?.healthCardNumber),
          WorkforceMobileNo: trimValue(data.driver?.contactNumber),
          VehicleNumber: trimValue(data.vehicle_no),
          PatientType: trimValue(data.patient_type),
          ShipmentNumber: trimValue(data.shipmentno),
          GateEntryNumber: trimValue(data.gateentryno),
          id: data.id,
        });
      });

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Disposition', 'attachment; filename=Cet.xlsx');

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      return sendError(res, 500, error.message);
    }
  }

  private trimAllStrings = (obj) => {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return obj
        .replace(/\x08/g, '') // Remove backspace characters
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
        .replace(/^['"]+|['"]+$/g, '') // Remove leading & trailing quotes
        .replace(/\s+/g, ' ')
        .trim();
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.trimAllStrings(item));
    }

    // Skip Date & Buffer
    if (obj instanceof Date || Buffer.isBuffer(obj)) {
      return obj;
    }

    if (typeof obj === 'object') {
      const trimmed = {};
      for (const key of Object.keys(obj)) {
        trimmed[key] = this.trimAllStrings(obj[key]);
      }
      return trimmed;
    }

    return obj;
  };

  async CsvCetList(req, res) {
    const { cet, start_date, end_date } = req.body;
    let whereCondition: WhereOptions<any> = {};

    if (cet && cet !== 'all') {
      whereCondition.transpoter = cet;
    }

    if (start_date && end_date) {
      const window = getOperationalDateRangeWindow(start_date, end_date);
      whereCondition.date_time = {
        [Op.gte]: window.startUtc,
        [Op.lte]: window.endUtc,
      };
    } else if (start_date && !end_date) {
      const window = getOperationalDayWindow(start_date);
      const now = moment().utc().format();

      whereCondition.date_time = {
        [Op.gte]: window.startUtc,
        [Op.lte]: now,
      };
    } else {
      const now = moment().utc().format();
      const oneDayAgo = moment().subtract(24, 'hours').utc().format();

      whereCondition.date_time = {
        [Op.gte]: oneDayAgo,
        [Op.lte]: now,
      };
    }

    whereCondition.confirm_report = { [Op.ne]: 'no' };

    try {
      const cetUser = await driverhealthcheckup.findAll({
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
          { model: DRIVERMASTER, as: 'driver' },
          { model: Center, as: 'center' },
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
          { model: CETMANAGEMENT, as: 'CETMANAGEMENT' },
          {
            model: Prescription,
            as: 'checkupPrescriptions',
            attributes: ['isReady', 'createdAt'],
            separate: true,
            order: [['createdAt', 'DESC']],
          },
        ],
        order: [['id', 'DESC']],
      });

      const trimmedResults = cetUser.map((record) => {
        const plain = record.get({ plain: true });
        const trimmed = this.trimAllStrings(plain);

        trimmed.isReady =
          trimmed.prescriptions?.length > 0
            ? trimmed.prescriptions[0].isReady === true
            : false;

        return trimmed;
      });

      sendSuccess(
        res,
        200,
        trimmedResults,
        trimmedResults.length ? 'Cet Fetch Successfully' : 'No data available',
      );
    } catch (error) {
      sendError(res, 500, error.message);
    }
  }

  async searchDriverById(req, res) {
    const { driver_id } = req.body;

    if (!driver_id) {
      return sendError(res, 400, 'Driver ID is required');
    }

    try {
      const driverRecord = await driverhealthcheckup.findOne({
        where: { driver_id },
        include: [
          {
            model: DRIVERMASTER,
            as: 'driver',
            attributes: ['name', 'healthCardNumber', 'contactNumber'],
          },
          {
            model: CETMANAGEMENT,
            as: 'CETMANAGEMENT',
            attributes: ['name'],
          },
          {
            model: Center,
            as: 'center',
            attributes: ['project_name'],
          },
          {
            model: Doctor,
            as: 'doctor',
            include: [
              {
                model: User,
                as: 'User',
                attributes: ['username', 'email'],
              },
            ],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      if (!driverRecord) {
        return sendError(res, 404, 'Driver not found');
      }

      const response = driverRecord.get({ plain: true });

      return sendSuccess(res, 200, response, 'Driver found successfully');
    } catch (error) {
      return sendError(res, 500, error.message);
    }
  }

  async searchDriverHealthRecordByHealthCard(req, res) {
    const { healthCardNumber } = req.body;

    if (!healthCardNumber) {
      return sendError(res, 400, 'Health Card Number is required');
    }

    try {
      const driverHealthRecord = await driverhealthcheckup.findOne({
        include: [
          {
            model: DRIVERMASTER,
            as: 'driver',
            where: { healthCardNumber },
            attributes: ['name', 'healthCardNumber', 'contactNumber'],
          },
          {
            model: CETMANAGEMENT,
            as: 'CETMANAGEMENT',
            attributes: ['name'],
          },
          {
            model: Center,
            as: 'center',
            attributes: ['project_name'],
          },
          {
            model: Doctor,
            as: 'doctor',
            include: [
              {
                model: User,
                as: 'User',
                attributes: ['username', 'email'],
              },
            ],
          },
        ],
        order: [['createdAt', 'DESC']], // ✅ IMPORTANT
      });

      if (!driverHealthRecord) {
        return sendError(res, 404, 'Driver Health Record Not Found');
      }

      return sendSuccess(
        res,
        200,
        driverHealthRecord.get({ plain: true }),
        'Driver Health Record found successfully',
      );
    } catch (error) {
      return sendError(res, 500, error.message);
    }
  }
  async searchDriver(req, res) {
    const { driver_id, healthCardNumber } = req.body;

    if (driver_id) {
      return exports.searchDriverById(req, res);
    }

    if (healthCardNumber) {
      return exports.searchDriverHealthRecordByHealthCard(req, res);
    }

    return sendError(
      res,
      400,
      'Either Driver ID or Health Card Number is required',
    );
  }

  async editVehicleNumber(req, res) {
    const { test_id, new_vehicleNumber } = req.body;

    if (!test_id || !new_vehicleNumber) {
      return sendError(res, 400, 'Test ID and Vehicle Number required');
    }

    const vehicleNumberPattern = /^[A-Z]{2}\d{1,2}[A-Z]{1,2}\d{4}$/;

    if (!vehicleNumberPattern.test(new_vehicleNumber)) {
      return sendError(res, 400, 'Invalid vehicle number format');
    }

    try {
      const driver = await driverhealthcheckup.findByPk(test_id);

      if (!driver) {
        return sendError(res, 404, 'Test ID not found');
      }

      await saveDriverHealthCheckupAsAdmin(driver, {
        vehicle_no: new_vehicleNumber,
      });

      return sendSuccess(
        res,
        200,
        driver,
        'Vehicle number updated successfully',
      );
    } catch (error) {
      return sendError(res, 500, error.message);
    }
  }

  async editShipmentNumber(req, res) {
    const { test_id, new_ShipmentNumber } = req.body;

    if (!test_id || !new_ShipmentNumber) {
      return sendError(res, 400, 'Test ID and Shipment Number are required');
    }

    try {
      const driver = await driverhealthcheckup.findByPk(test_id);

      if (!driver) {
        return sendError(res, 404, 'Test ID not found');
      }

      await saveDriverHealthCheckupAsAdmin(driver, {
        shipmentno: new_ShipmentNumber,
      });

      return sendSuccess(
        res,
        200,
        driver,
        'Shipment Number updated successfully',
      );
    } catch (error) {
      return sendError(res, 500, error.message);
    }
  }

  async editGateEntryNumber(req, res) {
    const { test_id, new_GateEntryNumber } = req.body;

    if (!test_id || !new_GateEntryNumber) {
      return sendError(res, 400, 'Test ID and Gate Entry Number are required');
    }

    try {
      const driver = await driverhealthcheckup.findByPk(test_id);

      if (!driver) {
        return sendError(res, 404, 'Test ID not found');
      }

      await saveDriverHealthCheckupAsAdmin(driver, {
        gateentryno: new_GateEntryNumber,
      });

      return sendSuccess(
        res,
        200,
        driver,
        'Gate Entry Number updated successfully',
      );
    } catch (error) {
      return sendError(res, 500, error.message);
    }
  }

  async getTestCountByCenter(req, res) {
    try {
      const { centerID, startDate, endDate } = req.body;

      if (!centerID || !startDate || !endDate) {
        return sendError(
          res,
          400,
          'centerID, startDate, and endDate are required',
        );
      }

      // Parse UTC dates
      const startUtc = new Date(startDate);
      const endUtc = new Date(endDate);

      if (isNaN(startUtc.getTime()) || isNaN(endUtc.getTime())) {
        return sendError(res, 400, 'Invalid date format');
      }

      const testCount = await driverhealthcheckup.count({
        where: {
          createdBy: centerID,
          createdAt: {
            [Op.between]: [startUtc.toISOString(), endUtc.toISOString()],
          },
        },
      });

      return sendSuccess(
        res,
        200,
        { testCount },
        'Test count retrieved successfully',
      );
    } catch (error) {
      return sendError(res, 500, error.message);
    }
  }

  async getTestCountPerCenter(req, res) {
    try {
      const { cet, startDate, endDate } = req.body;

      if (!startDate || !endDate) {
        return sendError(res, 400, 'startDate and endDate are required');
      }

      const whereCondition: any = {};

      if (cet && cet !== 'all') {
        whereCondition.transpoter = cet;
      }

      const startUtc = new Date(startDate).toISOString();
      const endUtc = new Date(endDate).toISOString();

      whereCondition.createdAt = { [Op.between]: [startUtc, endUtc] };

      const testCountPerCenter = await driverhealthcheckup.findAll({
        attributes: [
          [this.sequelize.col('center.project_name'), 'center_name'],
          [
            this.sequelize.fn(
              'COUNT',
              this.sequelize.col('driverhealthcheckup.id'),
            ),
            'total_test_count',
          ],
          [
            this.sequelize.fn(
              'SUM',
              this.sequelize.literal(
                `CASE WHEN 'BASIC' = ANY(selected_package_name) THEN 1 ELSE 0 END`,
              ),
            ),
            'basic_test_count',
          ],
          [
            this.sequelize.fn(
              'SUM',
              this.sequelize.literal(
                `CASE WHEN 'ADVANCED' = ANY(selected_package_name) THEN 1 ELSE 0 END`,
              ),
            ),
            'advanced_test_count',
          ],
          [
            this.sequelize.fn(
              'SUM',
              this.sequelize.literal(
                `CASE WHEN 'ADVANCED-ANGUL' = ANY(selected_package_name) THEN 1 ELSE 0 END`,
              ),
            ),
            'advanced_angul_test_count',
          ],
          [
            this.sequelize.fn(
              'SUM',
              this.sequelize.literal(
                `CASE WHEN 'COUNSELLING' = ANY(selected_package_name) THEN 1 ELSE 0 END`,
              ),
            ),
            'counselling_test_count',
          ],
        ],
        include: [
          {
            model: Center,
            as: 'center',
            attributes: [],
          },
        ],
        where: whereCondition,
        group: ['center.project_name'],
        order: [[this.sequelize.col('total_test_count'), 'DESC']],
        raw: true,
      });

      sendSuccess(
        res,
        200,
        testCountPerCenter,
        'Test count per center retrieved successfully',
      );
    } catch (error) {
      sendError(res, 500, error.message || 'Internal server error');
    }
  }

  async editCET(req, res) {
    const { test_id, newTranspoterID } = req.body;

    if (!test_id || !newTranspoterID) {
      return sendError(res, 400, 'Test ID and new transporter ID are required');
    }

    try {
      const driver = await driverhealthcheckup.findByPk(test_id);

      if (!driver) {
        return sendError(res, 404, 'Test ID not found');
      }

      const cetManagement = await CETMANAGEMENT.findByPk(newTranspoterID);

      if (!cetManagement) {
        return sendError(res, 404, 'Transporter (CETMANAGEMENT) ID not found');
      }

      await saveDriverHealthCheckupAsAdmin(driver, {
        transpoter: newTranspoterID,
      });

      return sendSuccess(res, 200, driver, 'Transporter updated successfully');
    } catch (error) {
      return sendError(res, 500, error.message);
    }
  }

  async cumulativeHealthAnalysis(req, res) {
    try {
      let { cet, start_date, end_date, center } = req.body;

      let whereCondition: WhereOptions<any> = {};

      // CET filter
      if (cet && cet !== 'all') {
        whereCondition.transpoter = cet;
      }

      // Center filter
      if (center) {
        whereCondition.createdBy = center;
      }

      // Date filter: startDate 06:00 IST → endDate 05:59 IST
      if (start_date || end_date) {
        let start: string;
        let end: string;

        if (start_date && end_date) {
          const window = getOperationalDateRangeWindow(start_date, end_date);
          start = window.startUtc;
          end = window.endUtc;
        } else if (start_date) {
          start = getOperationalDayWindow(start_date).startUtc;
          end = moment().utc().format();
        } else {
          start = moment.tz('Asia/Kolkata').subtract(100, 'years').utc().format();
          end = getOperationalRangeEndUtc(end_date);
        }

        whereCondition.date_time = {
          [Op.between]: [start, end],
        };
      }

      // Fetch thresholds safely
      const haemoglobinThreshold = ((await Haemoglobin.findOne({
        raw: true,
      })) || {}) as Record<string, number>;

      const PFTThreshold =
        (await Pulmonaryfunctiontest.findOne({ raw: true })) ||
        ({} as Record<string, any>);

      const records = await driverhealthcheckup.findAll({
        where: whereCondition,
        include: [
          { model: CETMANAGEMENT, as: 'CETMANAGEMENT', attributes: ['name'] },
          {
            model: DRIVERMASTER,
            as: 'driver',
            attributes: ['name', 'healthCardNumber'],
          },
        ],
        raw: true,
        nest: true,
      });

      const healthAnalysis = {
        blood_oxygen: { green: 0, yellow: 0, red: 0, redRecords: [] },
        haemoglobin: { green: 0, yellow: 0, red: 0, redRecords: [] },
        blood_sugar: { green: 0, yellow: 0, red: 0, redRecords: [] },
        blood_pressure: { green: 0, yellow: 0, red: 0, redRecords: [] },
        pulmonary_function: { green: 0, yellow: 0, red: 0, redRecords: [] },
        ecg: { green: 0, red: 0, redRecords: [] },
        eye_test: { green: 0, red: 0, redRecords: [] },
        hiv_test: { green: 0, red: 0, redRecords: [] },
      };

      for (const record of records) {
        let selected_test =
          record.selected_test && typeof record.selected_test === 'object'
            ? (record.selected_test as Record<string, any>)
            : undefined;

        // Normalize JSON
        if (typeof selected_test === 'string') {
          try {
            selected_test = JSON.parse(selected_test);
          } catch {
            continue;
          }
        }

        if (!selected_test) continue;

        const patientName = record.driver?.name || 'Unknown';
        // BLOOD OXYGEN
        if (selected_test?.spo2_unit?.remark?.toLowerCase() === 'pass') {
          healthAnalysis.blood_oxygen.green++;
        } else if (selected_test?.spo2_unit) {
          healthAnalysis.blood_oxygen.red++;
          healthAnalysis.blood_oxygen.redRecords.push({
            name: patientName,
            value: selected_test.spo2_unit.value,
          });
        }
        // HAEMOGLOBIN
        const hb = Number(selected_test?.haemoglobin_unit?.value);
        if (!isNaN(hb)) {
          if (hb >= (haemoglobinThreshold.standard_value_min ?? Infinity)) {
            healthAnalysis.haemoglobin.green++;
          } else if (
            hb >=
            (haemoglobinThreshold.within_deviation_value_min_below ?? -Infinity)
          ) {
            healthAnalysis.haemoglobin.yellow++;
          } else {
            healthAnalysis.haemoglobin.red++;
            healthAnalysis.haemoglobin.redRecords.push({
              name: patientName,
              value: hb,
            });
          }
        }
        // RANDOM BLOOD SUGAR
        if (
          selected_test?.random_blood_sugar_unit?.value &&
          Array.isArray(selected_test.random_blood_sugar_unit.standard_value)
        ) {
          const rbs = Number(selected_test.random_blood_sugar_unit.value);
          const [min, max] =
            selected_test.random_blood_sugar_unit.standard_value;

          if (!isNaN(rbs) && !isNaN(min) && !isNaN(max)) {
            if (rbs >= min && rbs <= max) {
              healthAnalysis.blood_sugar.green++;
            } else if (rbs < min) {
              healthAnalysis.blood_sugar.yellow++;
            } else {
              healthAnalysis.blood_sugar.red++;
              healthAnalysis.blood_sugar.redRecords.push({
                name: patientName,
                value: rbs,
              });
            }
          }
        }

        // BLOOD PRESSURE
        if (
          Array.isArray(
            selected_test?.blood_pressure_unit?.systolic_bp_unit
              ?.standard_value,
          ) &&
          Array.isArray(
            selected_test?.blood_pressure_unit?.diastolic_bp_unit
              ?.standard_value,
          )
        ) {
          const systolic = Number(
            selected_test.blood_pressure_unit.systolic_bp_unit.value,
          );
          const diastolic = Number(
            selected_test.blood_pressure_unit.diastolic_bp_unit.value,
          );

          const [sysMin, sysMax] =
            selected_test.blood_pressure_unit.systolic_bp_unit.standard_value;
          const [diaMin, diaMax] =
            selected_test.blood_pressure_unit.diastolic_bp_unit.standard_value;

          if (
            systolic >= sysMin &&
            systolic <= sysMax &&
            diastolic >= diaMin &&
            diastolic <= diaMax
          ) {
            healthAnalysis.blood_pressure.green++;
          } else if (systolic > sysMax || diastolic > diaMax) {
            healthAnalysis.blood_pressure.red++;
            healthAnalysis.blood_pressure.redRecords.push({
              name: patientName,
              value: `${systolic}/${diastolic}`,
            });
          } else {
            healthAnalysis.blood_pressure.yellow++;
          }
        }

        // PULMONARY FUNCTION TEST
        if (selected_test?.pulmonary_function_test_unit?.value) {
          const pft = Number(selected_test.pulmonary_function_test_unit.value);

          if (!isNaN(pft)) {
            if (pft >= (PFTThreshold.standard_value_min ?? Infinity)) {
              healthAnalysis.pulmonary_function.green++;
            } else if (
              pft >=
              (PFTThreshold.within_deviation_value_min_below ?? -Infinity)
            ) {
              healthAnalysis.pulmonary_function.yellow++;
            } else {
              healthAnalysis.pulmonary_function.red++;
              healthAnalysis.pulmonary_function.redRecords.push({
                name: patientName,
                value: pft,
              });
            }
          }
        }

        // ECG
        if (selected_test?.ecg_unit?.status) {
          if (selected_test.ecg_unit.status === 'success') {
            healthAnalysis.ecg.green++;
          } else {
            healthAnalysis.ecg.red++;
            healthAnalysis.ecg.redRecords.push({
              name: patientName,
              value: selected_test.ecg_unit.status,
            });
          }
        }

        // EYE TEST
        if (selected_test?.eye_unit) {
          const eyeStatuses = [
            selected_test.eye_unit?.spherical_right_eye_unit?.status,
            selected_test.eye_unit?.cylindrical_right_eye_unit?.status,
            selected_test.eye_unit?.spherical_left_eye_unit?.status,
            selected_test.eye_unit?.cylindrical_left_eye_unit?.status,
          ];

          const allSuccess = eyeStatuses.every(
            (status) => status === 'success',
          );

          if (allSuccess) {
            healthAnalysis.eye_test.green++;
          } else {
            healthAnalysis.eye_test.red++;
            healthAnalysis.eye_test.redRecords.push({
              name: patientName,
              issue: 'One or more eye test values failed',
            });
          }
        }

        // HIV
        if (selected_test?.hiv_unit?.value === 'Negative') {
          healthAnalysis.hiv_test.green++;
        } else if (selected_test?.hiv_unit?.value) {
          healthAnalysis.hiv_test.red++;
          healthAnalysis.hiv_test.redRecords.push({
            name: patientName,
            value: selected_test.hiv_unit.value,
          });
        }
      }

      // Calculate percentages safely
      for (const key in healthAnalysis) {
        const { green, yellow = 0, red = 0 } = healthAnalysis[key];
        const total = green + yellow + red || 1;

        healthAnalysis[key].percentage = {
          green: ((green / total) * 100).toFixed(2),
          yellow: ((yellow / total) * 100).toFixed(2),
          red: ((red / total) * 100).toFixed(2),
        };
      }

      return res.status(200).json({
        status: true,
        data: healthAnalysis,
        message: 'Cumulative Health Analysis Report',
      });
    } catch (error) {
      return res.status(500).json({
        status: false,
        message: error.message || 'Internal Server Error',
      });
    }
  }

  async getCETTestCounts(req, res) {
    try {
      const { startDate, endDate } = req.body;

      if (!startDate || !endDate) {
        return sendError(res, 400, 'startDate and endDate are required');
      }

      const window = getOperationalDateRangeWindow(startDate, endDate);
      const startUtc = window.startUtc;
      const endUtc = window.endUtc;

      const cetTestCounts = await driverhealthcheckup.findAll({
        attributes: [
          [this.sequelize.col('CETMANAGEMENT.name'), 'CETName'],
          [
            this.sequelize.fn(
              'COUNT',
              this.sequelize.col('driverhealthcheckup.id'),
            ),
            'total_test_count',
          ],
        ],
        include: [
          { model: CETMANAGEMENT, as: 'CETMANAGEMENT', attributes: [] },
        ],
        where: {
          createdAt: { [Op.between]: [startUtc, endUtc] },
        },
        group: [this.sequelize.col('CETMANAGEMENT.name')],
        order: [[this.sequelize.col('total_test_count'), 'DESC']],
        raw: true,
      });

      sendSuccess(
        res,
        200,
        cetTestCounts,
        cetTestCounts.length
          ? 'CET test counts fetched successfully'
          : 'No CET test records found for the given date range',
      );
    } catch (error) {
      sendError(res, 500, error.message || 'Internal Server Error');
    }
  }

  async getCETDriverCounts(req, res) {
    try {
      const { startDate, endDate } = req.body;

      // Validate inputs
      if (!startDate || !endDate) {
        return sendError(res, 400, 'startDate and endDate are required');
      }

      const window = getOperationalDateRangeWindow(startDate, endDate);
      const startUtc = window.startUtc;
      const endUtc = window.endUtc;

      // Query: Count unique drivers grouped by CET
      const cetDriverCounts = await driverhealthcheckup.findAll({
        attributes: [
          [this.sequelize.col('CETMANAGEMENT.name'), 'CETName'],
          [
            this.sequelize.fn(
              'COUNT',
              this.sequelize.fn('DISTINCT', this.sequelize.col('driver_id')),
            ),
            'driver_count',
          ],
        ],
        include: [
          {
            model: CETMANAGEMENT,
            as: 'CETMANAGEMENT',
            attributes: [], // Only need CET name
          },
        ],
        where: {
          createdAt: { [Op.between]: [startUtc, endUtc] },
        },
        group: [this.sequelize.col('CETMANAGEMENT.name')],
        order: [[this.sequelize.col('driver_count'), 'DESC']],
        raw: true,
      });

      // Send results
      sendSuccess(
        res,
        200,
        cetDriverCounts,
        cetDriverCounts.length
          ? 'CET driver counts fetched successfully'
          : 'No CET driver records found for the given date range',
      );
    } catch (error) {
      sendError(res, 500, error.message || 'Internal Server Error');
    }
  }
  private async insertCenter(data) {
    try {
      return await Center.create(data);
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Invalid input');
    }
  }

  private async updateCenter(centerId, data) {
    try {
      const center = await Center.findByPk(centerId);
      if (!center) {
        throw new Error('Center not found');
      }
      await center.update(data);
      return center;
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Invalid input');
    }
  }

  private async findAllCenters() {
    try {
      const data = await Center.findAll({
        raw: true,
        nest: true,
        order: [['id', 'DESC']],
        where: {
              tenant_id: null,
            },
      });
      return data;
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Invalid input');
    }
  }

  async assignCenterToUser(req, res, getData) {
    try {
      const {
        username,
        name,
        phone,
        email,
        password,
        center_id,
        signature,
        short_code,
      } = req.body;
      const phoneNumber = String(phone);

      const lastId = await CenterUser.max('id');
      const nextId = ((lastId as number) ?? 0) + 1;
      const external_id = `${short_code}${nextId.toString().padStart(3, '0')}`;

      const data = {
        username: username.trim().toLowerCase(),
        name,
        phone: phoneNumber,
        email: email.toLowerCase(),
        role_id: getData.role_id,
        permission_id: getData.id,
        status: true,
        isAdmin: false,
        password: bcrypt.hashSync(password, 8), // Need to verifty while testing
        center_id,
        external_id: external_id,
      };

      const userInsert = await User.create(data);

      const userData = await CenterUser.create({
        user_id: userInsert.id,
        center_id: center_id,
        signature: signature,
        short_code: short_code,
      });

      const resData = { signature, userInsert };
      return resData;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

    async centerStatusUpdate(id, status) {
      try {
        const transaction = await this.sequelize.transaction();
        try {
          const result = await Center.update(
            { status: status },
            {
              where: {
                id: id,
              },
              transaction,
            },
          );

          // Requirement: If a center is disabled, disable all its center users (Users.status=false)
          if (status === false) {
            const centerUsers = await CenterUser.findAll({
              where: { center_id: id },
              attributes: ['user_id'],
              raw: true,
              transaction,
            });
            const userIds = centerUsers
              .map((cu: { user_id?: number }) => cu.user_id)
              .filter((uid) => uid != null);
            if (userIds.length) {
              await User.update(
                { status: false },
                { where: { id: userIds }, transaction },
              );
            }
          }

          await transaction.commit();
          return result;
        } catch (error) {
          await transaction.rollback();
          throw error;
        }
      } catch (error) {
        throw new InternalServerErrorException(error.message);
      }
    }
  async getCenterUser() {
    try {
      const centerUsers = await CenterUser.findAll({
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
          }, // Include associated User details
          { model: Center, as: 'center' },
        ],
        order: [['id', 'DESC']],
      });

      return centerUsers;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findCenter(id) {
    try {
      const result = await Center.findOne({
        where: { id: id },
      });
      return result;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async createCenterGroup(req, res) {
    try {
      const {
        group_name,
        group_description,
        center_ids,
        is_active = true,
      } = req.body;

      // Validate required fields
      if (!group_name) {
        return sendError(res, 400, 'Group name is required');
      }

      if (
        !center_ids ||
        !Array.isArray(center_ids) ||
        center_ids.length === 0
      ) {
        return sendError(
          res,
          400,
          'Center IDs array is required and must not be empty',
        );
      }

      // Check if group name already exists
      const existingGroup = await CenterGroup.findOne({
        where: { group_name },
      });

      if (existingGroup) {
        return sendError(res, 400, 'Group name already exists');
      }

      // Create the center group
      const centerGroup = await CenterGroup.create({
        group_name,
        group_description,
        center_ids: center_ids.map((id) => String(id)), // Ensure all IDs are strings
        is_active,
        created_by: req.userId || 1, // Use authenticated user ID or default to 1
      });

      // Clear cache to ensure fresh data
      clearCenterGroupsCache();

      sendSuccess(res, 201, centerGroup, 'Center group created successfully');
    } catch (error) {
      sendError(res, 500, error.message || 'Internal server error');
    }
  }

  /**
   * View all center groups
   */
  async viewCenterGroups(req, res) {
    try {
      const { page = 1, limit = 10, is_active = null } = req.body;

      let whereCondition: WhereOptions<any> = {};

      // Filter by active status if provided
      if (is_active !== null) {
        whereCondition.is_active = is_active;
      }

      const offset = (page - 1) * limit;

      const { count, rows: centerGroups } = await CenterGroup.findAndCountAll({
        where: whereCondition,
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: offset,
        attributes: [
          'id',
          'group_name',
          'group_description',
          'center_ids',
          'is_active',
          'created_by',
          'created_at',
          'updated_at',
        ],
      });

      const totalPages = Math.ceil(count / limit);

      sendSuccess(
        res,
        200,
        {
          centerGroups,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: count,
            itemsPerPage: parseInt(limit),
          },
        },
        'Center groups retrieved successfully',
      );
    } catch (error) {
      sendError(res, 500, error.message);
    }
  }

  /**
   * Get center group details by ID
   */
  async getCenterGroupDetails(req, res) {
    try {
      const { id } = req.body;

      if (!id) {
        return sendError(res, 400, 'Group ID is required');
      }

      const centerGroup = await CenterGroup.findByPk(id);

      if (!centerGroup) {
        return sendError(res, 404, 'Center group not found');
      }

      sendSuccess(
        res,
        200,
        centerGroup,
        'Center group details retrieved successfully',
      );
    } catch (error) {
      sendError(res, 500, error.message || 'Internal server error');
    }
  }

  /**
   * Update center group
   */
  async updateCenterGroup(req, res) {
    const transaction = await this.sequelize.transaction();

    try {
      const { id, group_name, group_description, center_ids, is_active } =
        req.body;

      /* -------------------- Validation -------------------- */
      if (!id) {
        return sendError(res, 400, 'Group ID is required');
      }

      /* -------------------- Fetch Group -------------------- */
      const centerGroup = await CenterGroup.findByPk(id, { transaction });

      if (!centerGroup) {
        return sendError(res, 404, 'Center group not found');
      }

      if (!centerGroup.is_active) {
        return sendError(res, 400, 'Cannot update an inactive center group');
      }

      /* -------------------- Name Uniqueness -------------------- */
      if (group_name && group_name !== centerGroup.group_name) {
        const existingGroup = await CenterGroup.findOne({
          where: {
            group_name,
            id: { [Op.ne]: id },
          },
          transaction,
        });

        if (existingGroup) {
          return sendError(res, 400, 'Group name already exists');
        }
      }

      /* -------------------- Prepare Update -------------------- */
      const updateData: any = {};

      if (group_name !== undefined) {
        updateData.group_name = group_name.trim();
      }

      if (group_description !== undefined) {
        updateData.group_description = group_description;
      }

      if (center_ids !== undefined) {
        if (!Array.isArray(center_ids)) {
          return sendError(res, 400, 'Center IDs must be an array');
        }

        if (center_ids.length === 0) {
          return sendError(res, 400, 'Center IDs array cannot be empty');
        }

        // Remove duplicates & normalize
        const uniqueCenterIds = [...new Set(center_ids.map(String))];

        // Validate centers exist
        const validCenterCount = await Center.count({
          where: { id: uniqueCenterIds },
          transaction,
        });

        if (validCenterCount !== uniqueCenterIds.length) {
          return sendError(res, 400, 'One or more center IDs are invalid');
        }

        updateData.center_ids = uniqueCenterIds;
      }

      if (is_active !== undefined) {
        if (typeof is_active !== 'boolean') {
          return sendError(res, 400, 'is_active must be boolean');
        }
        updateData.is_active = is_active;
      }

      if (Object.keys(updateData).length === 0) {
        return sendError(res, 400, 'No fields provided to update');
      }

      /* -------------------- Update -------------------- */
      await centerGroup.update(updateData, { transaction });

      await transaction.commit();

      /* -------------------- Cache Invalidation -------------------- */
      clearCenterGroupsCache();

      return sendSuccess(
        res,
        200,
        centerGroup,
        'Center group updated successfully',
      );
    } catch (error) {
      await transaction.rollback();
      return sendError(res, 500, error.message || 'Internal server error');
    }
  }

  /**
   * Update center group status (activate/deactivate)
   */
  async updateCenterGroupStatus(req, res) {
    try {
      const { id, is_active } = req.body;

      if (!id) {
        return sendError(res, 400, 'Group ID is required');
      }

      if (typeof is_active !== 'boolean') {
        return sendError(res, 400, 'is_active must be a boolean value');
      }

      // Check if group exists
      const centerGroup = await CenterGroup.findByPk(id);
      if (!centerGroup) {
        return sendError(res, 404, 'Center group not found');
      }

      // Update the status
      await centerGroup.update({ is_active });

      // Clear cache to ensure fresh data
      clearCenterGroupsCache();

      sendSuccess(
        res,
        200,
        centerGroup,
        `Center group ${is_active ? 'activated' : 'deactivated'} successfully`,
      );
    } catch (error) {
      sendError(res, 500, error.message || 'Internal server error');
    }
  }

  /**
   * Delete center group (soft delete by setting is_active to false)
   */
  async deleteCenterGroup(req, res) {
    try {
      const { id } = req.body;

      if (!id) {
        return sendError(res, 400, 'Group ID is required');
      }

      // Check if group exists
      const centerGroup = await CenterGroup.findByPk(id);
      if (!centerGroup) {
        return sendError(res, 404, 'Center group not found');
      }

      // Soft delete by setting is_active to false
      await centerGroup.update({ is_active: false });

      // Clear cache to ensure fresh data
      clearCenterGroupsCache();

      sendSuccess(res, 200, null, 'Center group deleted successfully');
    } catch (error) {
      sendError(res, 500, error.message || 'Internal server error');
    }
  }

  /**
   * Get all active center groups (for dropdowns, etc.)
   */
  async getActiveCenterGroups(req, res) {
    try {
      const centerGroups = await CenterGroup.findAll({
        where: { is_active: true },
        order: [['group_name', 'ASC']],
        attributes: ['id', 'group_name', 'group_description', 'center_ids'],
      });

      sendSuccess(
        res,
        200,
        centerGroups,
        'Active center groups retrieved successfully',
      );
    } catch (error) {
      sendError(res, 500, error.message || 'Internal server error');
    }
  }

  /**
   * Check which group(s) a center belongs to
   */
  async getCenterGroupsByCenterId(req, res) {
    try {
      const { center_id } = req.body;

      if (!center_id) {
        return sendError(res, 400, 'Center ID is required');
      }

      const centerGroups = await this.findByCenterId(center_id, {
        attributes: ['id', 'group_name', 'group_description', 'center_ids'],
      });

      sendSuccess(
        res,
        200,
        centerGroups,
        'Center groups retrieved successfully',
      );
    } catch (error) {
      sendError(res, 500, error.message || 'Internal server error');
    }
  }

  private async findByCenterId(centerId, options = {}) {
    const centerIdStr = String(centerId);
    return CenterGroup.findAll({
      where: {
        is_active: true,
        center_ids: {
          [Op.contains]: [centerIdStr],
        },
      },
      ...options,
    });
  }

  async createCenter(req, res) {
    const {
      project_start_date,
      project_name,
      project_unique_id,
      project_district,
      project_state,
      project_address,
      agency_name,
      agency_district,
      agency_state,
      agency_address,
      agency_spoc_name,
      agency_spoc_email,
      agency_spoc_contact_number,
      project_signed_agreement_file,
      project_end_date,
      agency_spoc_alternate_name,
      agency_spoc_alternate_contact_number,
      center_shortcode,
      short_code,
      agreement_file,
    } = req.body;

    const requiredFields = [
      'project_start_date',
      'project_name',

      'project_district',
      'project_state',
      'project_address',
      'agency_name',
      'agency_district',
      'agency_state',
      'agency_spoc_name',
      'agency_spoc_email',
      'agency_address',
    ];

    try {
      const missingFields = requiredFields.filter((field) => {
        return (
          !req.body[field] ||
          typeof req.body[field] !== 'string' ||
          req.body[field].trim() === ''
        );
      });

      if (missingFields.length > 0) {
        const msg = missingFields.join(', ');
        return sendError(res, 400, msg + ' is required');
      }
      const getLastCenterId = await Center.findOne({
        order: [['id', 'DESC']], // Correctly specify the order by clause
      });

      // Extract the numeric part and increment it
      const nextId = getLastCenterId ? parseInt(getLastCenterId.id) + 1 : 1;
      //const external_id = `${short_code}00${nextId}`;

      const external_id = `${short_code}${nextId.toString().padStart(3, '0')}`;
      const data = {
        project_start_date,
        project_name,
        project_unique_id: null,
        project_district,
        project_state,
        project_address,
        agency_name,
        agency_district,
        agency_state,
        agency_spoc_name,
        agency_spoc_email,
        agency_spoc_contact_number,
        status: true,
        project_end_date,
        agency_address,
        agency_spoc_alternate_name,
        agency_spoc_alternate_contact_number,
        project_signed_agreement_file: agreement_file ? agreement_file : null,
        external_id: external_id,
        short_code: short_code,
        center_shortcode: center_shortcode,
      };

      const insert = await this.insertCenter(data);
      sendSuccess(res, 201, insert, 'Create Center successfully');
    } catch (error) {
      sendError(res, 500, error.message);
    }
  }

  //

  async assignCenter(req, res) {
    try {
      if (!req.body.center_id) {
        sendError(res, 400, 'center id required');
        return;
      }
      if (!req.body.permission_id) {
        sendError(res, 404, 'permission id required');
        return;
      }
      const {
        username,
        name,
        phone,
        email,
        password,
        center_id,
        signature,
        short_code,
      } = req.body;
      const phoneNumber = String(phone);
      if (await checkUserNameExist(username.trim().toLowerCase())) {
        sendError(res, 400, 'Username Already Exists');
        return;
      }
      if (await checkEmailExist(email.toLowerCase())) {
        sendError(res, 400, 'Email Already Exists');
        return;
      }
      if (await checkPhoneExist(phoneNumber)) {
        sendError(res, 400, 'phoneNumber Already Exists');
        return;
      }

      const getData = await checkRole(req.body.permission_id);
      if (!getData) {
        sendError(res, 404, 'Invalid permission id');
        return;
      }
      const result = await this.assignCenterToUser(req, res, getData);
      sendSuccess(res, 201, result, 'Center assign successfully');
    } catch (error) {
      sendError(res, 500, error);
    }
  }
  async centerUser(req, res) {
    try {
      const result = await this.getCenterUser();
      sendSuccess(res, 200, result, 'Success');
    } catch (error) {
      sendError(res, 500, error.message);
    }
  }

  async updateCenterStatus(req, res) {
    try {
      if (!req.body.id) {
        sendError(res, 400, 'bad request , id required');
        return;
      }

      if (typeof req.body.status !== 'boolean') {
        sendError(res, 400, 'bad request , status required');
        return;
      }

      const result = await this.centerStatusUpdate(
        req.body.id,
        req.body.status,
      );
      sendSuccess(res, 200, result, 'Status Update Successfully');
      return;
    } catch (error) {
      sendError(res, 500, error.message);
      return;
    }
  }

  async centerEdit(req, res) {
    try {
      if (!req.body.id) {
        sendError(res, 400, 'bad request , id required');
      }

      const result = await this.findCenter(req.body.id);
      sendSuccess(res, 200, result, 'Status Update Successfully');
    } catch (error) {
      sendError(res, 500, error.message);
    }
  }

  async centerUpdate(req, res) {
    const {
      project_start_date,
      project_name,
      project_unique_id,
      project_district,
      project_state,
      project_address,
      agency_name,
      agency_district,
      agency_state,
      agency_spoc_name,
      agency_spoc_email,
      agency_spoc_contact_number,
      agency_address,
      project_end_date,
      agency_spoc_alternate_name,
      agency_spoc_alternate_contact_number,
      id,
      agreement_file,
    } = req.body;

    try {
      const data = {
        project_start_date,
        project_name,
        project_unique_id,
        project_district,
        project_state,
        project_address,
        agency_name,
        agency_district,
        agency_state,
        agency_spoc_name,
        agency_spoc_email,
        agency_spoc_contact_number,

        agency_address,
        project_end_date,
        agency_spoc_alternate_name,
        agency_spoc_alternate_contact_number,
        project_signed_agreement_file: agreement_file ? agreement_file : null,
      };

      // Assuming you have a function to update the center
      const centerId = id; // Assuming centerId is passed as a URL parameter
      const updatedCenter = await this.updateCenter(centerId, data);

      // Return the updated center
      sendSuccess(res, 200, updatedCenter, ' Update Successfully');
    } catch (error) {
      // Handle errors
      sendError(res, 500, error);
    }
  }

  async centerUserDetails(req, res) {
    if (!req.body.id) {
      sendError(res, 400, 'id  required');
      return;
    }

    try {
      const userId = req.body.id; // Assuming userId is sent in the request params
      const userDetails = await User.findByPk(userId, {
        include: [
          { model: CenterUser, as: 'centerusers' },
          { model: Center, through: { attributes: [] }, as: 'centers' },
        ],
        attributes: { exclude: ['password'] },
      });

      if (!userDetails) {
        sendError(res, 404, 'User not found');
        return;
      }
      const userDetailsWithoutPassword = userDetails.toJSON();

      sendSuccess(
        res,
        200,
        userDetailsWithoutPassword,
        'User details retrieved successfully',
      );
    } catch (error) {
      sendError(res, 500, error.message);
    }
  }

  async centerUserUpdate(req, res) {
    try {
      // Destructure request body
      const {
        id,
        username,
        name,
        permission_id,
        phone,
        email,
        password,
        center_id,
        signature,
      } = req.body;
      let centeruser;
      // Find the user record to update
      let user = await User.findByPk(id);
      if (!user) {
        return sendError(res, 404, 'User not found');
      }
      const getData = await checkRole(permission_id);

      if (!getData) {
        sendError(res, 404, 'Invalid permission id');
        return;
      }

      // Update user data with new values
      user.username = username;
      user.name = name;
      user.role_id = getData.role_id;
      user.permission_id = permission_id;
      user.phone = phone;
      user.email = email;
      if (password) {
        const updatePass = bcrypt.hashSync(password, 8);
        user.password = updatePass;
      }

      await user.save();

      if (center_id) {
        centeruser = await CenterUser.findOne({ where: { user_id: id } });
        if (!centeruser) {
          centeruser = await CenterUser.create({
            user_id: id,
            center_id: center_id,
            signature: signature,
          });
        } else {
          centeruser.center_id = center_id;
          centeruser.signature = signature;
          if (signature) {
            centeruser.signature = signature;
          }

          await centeruser.save();
        }
      }

      // Send success response with updated user data
      sendSuccess(
        res,
        200,
        { user, centeruser },
        'User data updated successfully',
      );
    } catch (error) {
      return sendError(res, 500, error.message);
    }
  }

    async updateCenterUserStatus(req, res) {
      try {
        if (!req.body.id) {
          sendError(res, 400, 'bad request');
          return;
        }

      if (typeof req.body.status !== 'boolean') {
        sendError(res, 400, 'bad request , status required');
        return;
      }
        const user = await User.findOne({ where: { id: req.body.id } });

        if (!user) {
          sendError(res, 404, 'User id not found');
          return;
        }

        // Requirement: If center is inactive, do not allow enabling a center user
        if (req.body.status === true) {
          const mapping = await CenterUser.findOne({
            where: { user_id: req.body.id },
            attributes: ['center_id'],
            raw: true,
          });

          if (mapping?.center_id) {
            const center = await Center.findOne({
              where: { id: mapping.center_id },
              attributes: ['id', 'status'],
              raw: true,
            });

            if (center && center.status === false) {
              sendError(res, 400, 'center_inactive');
              return;
            }
          }
        }
        const result = await User.update(
          { status: req.body.status },
          {
            where: {
              id: req.body.id,
          },
        },
      );
      sendSuccess(res, 200, result, 'Status Update Successfully');
    } catch (error) {
      sendError(res, 500, error.message);
    }
  }

  // Workforce Changes

  async create(req, res) {
    try {
      const { full_name, short_name } = req.body;

      const result = await Workforcetype.create({
        full_name,
        short_name,
        isActive: true,
      });
      sendSuccess(res, 201, result, 'Workforcetype Center successfully');
    } catch (error) {
      sendError(res, 500, error.message);
    }
  }

  async view(req, res) {
    try {
      const getData = await Workforcetype.findAll({
        order: [['id', 'DESC']],
        raw: true,
        nest: true,
      });
      sendSuccess(res, 200, getData, 'Success');
    } catch (error) {
      sendError(res, 500, error.message);
    }
  }
  async getById(req, res) {
    const id = req.body.id; // Assuming id is passed in req.body

    try {
      const getData = await Workforcetype.findOne({
        where: { id: id },
      });

      if (!getData) {
        return sendError(res, 404, 'Workforcetype not found');
      }

      sendSuccess(res, 200, getData, 'Workforcetype found successfully');
    } catch (error) {
      sendError(res, 500, error.message);
    }
  }

  async update(req, res) {
    try {
      const { id, full_name, short_name } = req.body; // Assuming id is passed in req.body
      const data = await Workforcetype.findOne({ where: { id: req.body.id } });

      if (!data) {
        sendError(res, 404, 'Workforcetype id not found');
        return;
      }
      const result = await Workforcetype.update(
        { full_name, short_name },
        {
          where: {
            id: req.body.id,
          },
        },
      );

      sendSuccess(res, 200, result, 'Workforcetype updated successfully');
    } catch (error) {
      sendError(res, 500, error.message);
    }
  }

  async statusChange(req, res) {
    try {
      const { id, isActive } = req.body;

      const result = await Workforcetype.update(
        { isActive },
        {
          where: {
            id: req.body.id,
          },
        },
      );
      if (!result) {
        return sendError(res, 404, 'Workforcetype not found');
      }

      sendSuccess(
        res,
        200,
        result,
        'Workforcetype status changed successfully',
      );
    } catch (error) {
      sendError(res, 500, error.message);
    }
  }

  // admin Master

  async updateRomberg(req, res) {
    try {
      const { option_one, option_two } = req.body;

      if (option_one === undefined || option_two === undefined) {
        return sendError(res, 400, 'option_one and option_two are required');
      }

      const existing = await Romberg.findOne();

      if (existing) {
        await existing.update({
          option_one,
          option_two,
        });

        return sendSuccess(res, 200, existing, 'Romberg updated successfully');
      }

      const created = await Romberg.create({
        option_one,
        option_two,
      });

      return sendSuccess(res, 201, created, 'Romberg created successfully');
    } catch (error) {
      return sendError(res, 500, 'Internal server error');
    }
  }

  async viewRomberg(req, res) {
    try {
      const count = await Romberg.findOne({ raw: true, nest: true });
      return sendSuccess(res, 201, count, '  Romberg successfully fetch');
    } catch (error) {
      return sendError(res, 500, 'internal server error');
    }
  }

  // async updateMaster(req, res) {
  //     try {

  //         sendSuccess(res, 201, insert, 'Create Center successfully');

  //     } catch (error) {
  //         return sendError(res, 500, "internal server error");

  //     }

  // }

  async updateTemperature(req, res) {
    try {
      const {
        standard_value_min,
        standard_value_max,
        within_deviation_value_min,
        within_deviation_value_max,
        out_of_range,
        units,
        within_deviation_value_min_below,
        within_deviation_value_max_below,
        out_of_range_below,
      } = req.body;

      if (
        standard_value_min === undefined ||
        standard_value_max === undefined ||
        units === undefined
      ) {
        return sendError(res, 400, 'Required fields are missing');
      }

      const result = await this.updateMasterTemperature(req, {
        standard_value_min,
        standard_value_max,
        within_deviation_value_min,
        within_deviation_value_max,
        out_of_range,
        units,
        within_deviation_value_min_below,
        within_deviation_value_max_below,
        out_of_range_below,
      });

      return sendSuccess(
        res,
        result?.created ? 201 : 200,
        result?.data ?? result,
        result?.created
          ? 'Temperature created successfully'
          : 'Temperature updated successfully',
      );
    } catch (error) {
      return sendError(res, 500, 'Internal server error');
    }
  }

  async updateSPO2s(req, res) {
    try {
      const {
        standard_value_min,
        standard_value_max,
        within_deviation_value_min,
        within_deviation_value_max,
        out_of_range,
        units,
        within_deviation_value_min_below,
        within_deviation_value_max_below,
        out_of_range_below,
      } = req.body;

      if (
        standard_value_min === undefined ||
        standard_value_max === undefined ||
        units === undefined
      ) {
        return sendError(res, 400, 'Required fields are missing');
      }

      const result = await this.updateMasterSPO2(req, {
        standard_value_min,
        standard_value_max,
        within_deviation_value_min,
        within_deviation_value_max,
        out_of_range,
        units,
        within_deviation_value_min_below,
        within_deviation_value_max_below,
        out_of_range_below,
      });

      return sendSuccess(
        res,
        result?.created ? 201 : 200,
        result?.data ?? result,
        result?.created
          ? 'SPO2 created successfully'
          : 'SPO2 updated successfully',
      );
    } catch (error) {
      return sendError(res, 500, 'Internal server error');
    }
  }

  async updateRandomBloodSugar(req, res) {
    try {
      const { standard_value_min, standard_value_max, units } = req.body;

      if (
        standard_value_min === undefined ||
        standard_value_max === undefined ||
        units === undefined
      ) {
        return sendError(res, 400, 'Required fields are missing');
      }

      const result = await this.updateRBS(req, req.body);

      return sendSuccess(
        res,
        result.created ? 201 : 200,
        result.data,
        result.created
          ? 'Random Blood Sugar created successfully'
          : 'Random Blood Sugar updated successfully',
      );
    } catch (error) {
      return sendError(res, 500, 'Internal server error');
    }
  }

  async updatePulse(req, res) {
    try {
      const { standard_value_min, standard_value_max, units } = req.body;

      if (
        standard_value_min === undefined ||
        standard_value_max === undefined ||
        units === undefined
      ) {
        return sendError(res, 400, 'Required fields are missing');
      }

      const result = await this.updatePulseService(req, req.body);

      return sendSuccess(
        res,
        result.created ? 201 : 200,
        result.data,
        result.created
          ? 'Pulse created successfully'
          : 'Pulse updated successfully',
      );
    } catch (error) {
      return sendError(res, 500, 'Internal server error');
    }
  }

  async updatePulmonaryfunctiontest(req, res) {
    try {
      const { standard_value_min, standard_value_max, units } = req.body;

      if (
        standard_value_min === undefined ||
        standard_value_max === undefined ||
        units === undefined
      ) {
        return sendError(res, 400, 'Required fields are missing');
      }

      const result = await this.updatePulmonaryTest(req, req.body);

      return sendSuccess(
        res,
        result.created ? 201 : 200,
        result.data,
        result.created
          ? 'Pulmonary function test created successfully'
          : 'Pulmonary function test updated successfully',
      );
    } catch (error) {
      return sendError(res, 500, 'Internal server error');
    }
  }

  async updateHaemoglobin(req, res) {
    try {
      const {
        standard_value_min,
        standard_value_max,
        within_deviation_value_min,
        within_deviation_value_max,
        out_of_range,
        units,
        within_deviation_value_min_below,
        within_deviation_value_max_below,
        out_of_range_below,
      } = req.body;

      if (
        standard_value_min === undefined ||
        standard_value_max === undefined ||
        units === undefined
      ) {
        return sendError(res, 400, 'Required fields are missing');
      }

      const data = {
        standard_value_min,
        standard_value_max,
        within_deviation_value_min,
        within_deviation_value_max,
        out_of_range,
        units,
        within_deviation_value_min_below,
        within_deviation_value_max_below,
        out_of_range_below,
      };

      const result = await this.updateHaemoglobinService(req, data);

      return sendSuccess(
        res,
        result?.created ? 201 : 200,
        result?.data ?? result,
        result?.created
          ? 'Haemoglobin test created successfully'
          : 'Haemoglobin test updated successfully',
      );
    } catch (error) {
      return sendError(res, 500, 'Internal server error');
    }
  }

  async updateCretenine(req, res) {
    try {
      const {
        standard_value_min,
        standard_value_max,
        within_deviation_value_min,
        within_deviation_value_max,
        out_of_range,
        units,
        within_deviation_value_min_below,
        within_deviation_value_max_below,
        out_of_range_below,
      } = req.body;

      if (
        standard_value_min === undefined ||
        standard_value_max === undefined ||
        units === undefined
      ) {
        return sendError(res, 400, 'Required fields are missing');
      }

      const data = {
        standard_value_min,
        standard_value_max,
        within_deviation_value_min,
        within_deviation_value_max,
        out_of_range,
        units,
        within_deviation_value_min_below,
        within_deviation_value_max_below,
        out_of_range_below,
      };

      const result = await this.updateCretenineService(req, data);

      return sendSuccess(
        res,
        result?.created ? 201 : 200,
        result?.data ?? result,
        result?.created
          ? 'Creatinine test created successfully'
          : 'Creatinine test updated successfully',
      );
    } catch (error) {
      return sendError(res, 500, 'Internal server error');
    }
  }

  async updateAlcholtest(req, res) {
    try {
      const {
        standard_value_min,
        standard_value_max,
        within_deviation_value_min,
        within_deviation_value_max,
        out_of_range,
        units,
      } = req.body;

      if (
        standard_value_min === undefined ||
        standard_value_max === undefined ||
        units === undefined
      ) {
        return sendError(res, 400, 'Required fields are missing');
      }

      const data = {
        standard_value_min,
        standard_value_max,
        within_deviation_value_min,
        within_deviation_value_max,
        out_of_range,
        units,
      };

      const result = await this.updateAlcholtestService(req, data);

      return sendSuccess(
        res,
        result?.created ? 201 : 200,
        result?.data ?? result,
        result?.created
          ? 'Alcohol test created successfully'
          : 'Alcohol test updated successfully',
      );
    } catch (error) {
      return sendError(res, 500, 'Internal server error');
    }
  }

  async updateHiv(req, res) {
    try {
      const { option_one, option_two } = req.body;

      if (option_one === undefined || option_two === undefined) {
        return sendError(res, 400, 'Required fields are missing');
      }

      const data = {
        option_one,
        option_two,
      };

      const result = await this.updatHivService(req, data);

      return sendSuccess(
        res,
        result?.created ? 201 : 200,
        result?.data ?? result,
        result?.created
          ? 'HIV test created successfully'
          : 'HIV test updated successfully',
      );
    } catch (error) {
      return sendError(res, 500, 'Internal server error');
    }
  }
  private async findLatest(Model: any, res: any) {
    try {
      const data = await Model.findOne({
        order: [['id', 'DESC']],
        raw: true,
        nest: true,
      });
      return sendSuccess(res, 200, data, 'Success');
    } catch (error) {
      return sendError(res, 500, 'internal server error');
    }
  }

  viewTemperature = async (req: any, res: any) => {
    return this.findLatest(Temperature, res);
  };

  viewSPO2 = async (req: any, res: any) => {
    return this.findLatest(SPO2, res);
  };

  viewRandomBloodSugar = async (req: any, res: any) => {
    return this.findLatest(RandomBloodSugar, res);
  };

  viewPulse = async (req: any, res: any) => {
    return this.findLatest(Pulse, res);
  };

  viewPulmonaryFunctionTest = async (req: any, res: any) => {
    return this.findLatest(Pulmonaryfunctiontest, res);
  };

  viewHaemoglobin = async (req: any, res: any) => {
    return this.findLatest(Haemoglobin, res);
  };

  viewCretenine = async (req: any, res: any) => {
    return this.findLatest(Cretenine, res);
  };

  viewAlcholtest = async (req: any, res: any) => {
    return this.findLatest(Alcholtest, res);
  };

  viewHiv = async (req: any, res: any) => {
    return this.findLatest(Hiv, res);
  };

  private async upsertLatest(Model: any, data: any) {
    try {
      const count = await Model.count();
      if (count > 0) {
        const latest = await Model.findOne();
        if (latest) {
          await latest.update(data);
          return latest;
        } else {
          throw new Error('Unexpected: Record not found when it should exist.');
        }
      } else {
        return await Model.create(data);
      }
    } catch (error) {
      throw new Error(error);
    }
  }
  updateMasterTemperature = async (req: any, data: any) => {
    return this.upsertLatest(Temperature, data);
  };

  updateMasterSPO2 = async (req: any, data: any) => {
    return this.upsertLatest(SPO2, data);
  };

  updateRBS = async (req: any, data: any) => {
    return this.upsertLatest(RandomBloodSugar, data);
  };

  updatePulseService = async (req: any, data: any) => {
    return this.upsertLatest(Pulse, data);
  };

  updatePulmonaryTest = async (req: any, data: any) => {
    return this.upsertLatest(Pulmonaryfunctiontest, data);
  };

  updateHaemoglobinService = async (req: any, data: any) => {
    return this.upsertLatest(Haemoglobin, data);
  };

  updateCretenineService = async (req: any, data: any) => {
    return this.upsertLatest(Cretenine, data);
  };

  updateAlcholtestService = async (req: any, data: any) => {
    return this.upsertLatest(Alcholtest, data);
  };

  updatHivService = async (req: any, data: any) => {
    return this.upsertLatest(Hiv, data);
  };

  adminCreate = async (req, res) => {
    try {
      const { username, email, phone, password, name, permission_id } =
        req.body;

      if (!permission_id) {
        return sendError(res, 400, 'permission id required');
      }
      if (!username || !email || !phone || !password || !name) {
        return sendError(res, 400, 'Missing required fields');
      }

      const normalizedUsername = username.trim().toLowerCase();
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedPhone = String(phone).trim();

      // 2️⃣ Validate permission / role
      const permissionData = await this.authService.checkRole(permission_id);
      if (!permissionData) {
        return sendError(res, 404, 'Invalid permission id');
      }

      // 3️⃣ Parallel uniqueness checks (performance win)
      const [isUsernameExists, isEmailExists, isPhoneExists] =
        await Promise.all([
          checkUserNameExist(normalizedUsername),
          checkEmailExist(normalizedEmail),
          checkPhoneExist(normalizedPhone),
        ]);

      if (isUsernameExists) {
        return sendError(res, 400, 'Username already exists');
      }
      if (isEmailExists) {
        return sendError(res, 400, 'Email already exists');
      }
      if (isPhoneExists) {
        return sendError(res, 400, 'Phone already exists');
      }

      // 4️⃣ Generate external ID safely
      const adminRole = await this.authService.getRole('admin');
      const lastUser = await this.authService.getLastId(adminRole);

      const nextId = lastUser?.id ? Number(lastUser.id) + 1 : 1;
      const external_id = `A${String(nextId).padStart(3, '0')}`;

      // 5️⃣ Hash password (async – non-blocking)
      const hashedPassword = await bcrypt.hash(password, 8);

      // 6️⃣ Create user payload
      const userPayload = {
        external_id,
        username: normalizedUsername,
        role_id: permissionData.role_id,
        email: normalizedEmail,
        name,
        permission_id,
        phone: normalizedPhone,
        status: true,
        isAdmin: true,
        password: hashedPassword,
      };

      const result = await this.authService.createUser(userPayload);

      return sendSuccess(res, 201, result.username, 'Success');
    } catch (error) {
      return sendError(res, 500, error.message || 'Internal server error');
    }
  };

  async userList(req: any, res: any) {
    try {
      const result = await User.findAll({
        attributes: [
          'id',
          'external_id',
          'username',
          'name',
          'email',
          'phone',
          'role_id',
          'permission_id',
          'status',
          'isAdmin',
        ],
        where: { isAdmin: true },
        include: [
          {
            model: Role,
            as: 'role',
            attributes: ['id', 'role_title', 'slug'],
          },
          {
            model: Permission,
            as: 'permission',
            attributes: ['id', 'permission_name'],
          },
        ],
        raw: true,
        nest: true,
        order: [['id', 'DESC']],
      });

      return sendSuccess(res, 200, result, 'User List');
    } catch (error) {
      console.error('userList error:', error);
      return sendError(res, 500, 'Internal server error');
    }
  }

  async userStatusUpdate(req: any, res: any) {
    if (!req.body.id) {
      return sendError(res, HttpStatusCode.BAD_REQUEST.code, 'id required');
    }

    if (typeof req.body.status !== 'boolean') {
      return sendError(res, HttpStatusCode.BAD_REQUEST.code, 'status required');
    }

    try {
      const result = await this.authService.changeStatue(
        req.body.id,
        req.body.status,
      );

      return sendSuccess(
        res,
        HttpStatusCode.OK.code,
        result,
        'Status Update Successfully',
      );
    } catch (error) {
      return sendError(
        res,
        HttpStatusCode.INTERNAL_SERVER_ERROR.code,
        'internal server error',
      );
    }
  }
  async userUpdate(req: any, res: any) {
    if (!req.body.id) {
      return sendError(res, HttpStatusCode.BAD_REQUEST.code, 'ID Required');
    }

    if (!req.body.permission_id) {
      return sendError(
        res,
        HttpStatusCode.NOT_FOUND.code,
        'permission id required',
      );
    }

    try {
      const getData = await this.authService.checkRole(req.body.permission_id);

      if (!getData) {
        return sendError(
          res,
          HttpStatusCode.NOT_FOUND.code,
          'Invalid permission id',
        );
      }

      const data: any = {
        username: req.body.username.trim().toLowerCase(),
        role_id: getData.role_id,
        permission_id: req.body.permission_id,
        email: req.body.email,
        name: req.body.name,
        phone: req.body.phone,
        isAdmin: true,
      };

      if (req.body.password) {
        data.password = bcrypt.hashSync(req.body.password, 8);
      }

      await User.update(data, { where: { id: req.body.id } });

      return sendSuccess(
        res,
        HttpStatusCode.OK.code,
        req.body.username,
        'User data updated successfully',
      );
    } catch (error) {
      return sendError(
        res,
        HttpStatusCode.INTERNAL_SERVER_ERROR.code,
        'Internal server error',
      );
    }
  }

  async userLogs(req: any, res: any) {
    try {
      const data = await UserLog.findAll({
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id', 'username', 'email'],
          },
        ],
        order: [['id', 'DESC']],
      });

      return sendSuccess(res, HttpStatusCode.OK.code, data, 'success');
    } catch (error) {
      return sendError(
        res,
        HttpStatusCode.INTERNAL_SERVER_ERROR.code,
        'Internal server error',
      );
    }
  }
  async userDetails(req: any, res: any) {
    if (!req.body.id) {
      return sendError(res, HttpStatusCode.BAD_REQUEST.code, 'ID Required');
    }

    try {
      const result = await User.findOne({
        where: { id: req.body.id },
        attributes: { exclude: ['password'] },
        raw: true,
        nest: true,
      });

      return sendSuccess(
        res,
        HttpStatusCode.OK.code,
        result,
        'User data get Successfully',
      );
    } catch (error) {
      return sendError(
        res,
        HttpStatusCode.INTERNAL_SERVER_ERROR.code,
        'internal server error',
      );
    }
  }
  public createSlug(input: string): string {
    return slugify(input, {
      replacement: '-',
      remove: /[$*_+~.()'"!\-:@]/g,
      lower: true,
    });
  }

  async roleDetails(req: any, res: any) {
    if (!req.body.id) {
      return sendError(res, 400, 'Role ID Required');
    }

    try {
      const result = await this.authService.getRoleData(req.body.id);
      return sendSuccess(res, 200, result, 'Role Fetch successfully');
    } catch (error) {
      return sendError(res, 500, error.message || 'Invalid input');
    }
  }

  async updateRole(req: any, res: any) {
    if (!req.body.id) {
      return sendError(res, 400, 'Role ID Required');
    }
    if (!req.body.role_title) {
      return sendError(res, 400, 'Role Title Required');
    }

    try {
      const data = {
        role_title: req.body.role_title,
        slug: this.createSlug(req.body.role_title),
      };

      const result = await this.authService.updateRole(data, req.body.id);
      return sendSuccess(res, 200, result, 'Update Role successfully');
    } catch (error) {
      return sendError(res, 500, error.message || 'Invalid input');
    }
  }

  async createRole(req: any, res: any) {
    try {
      const data = {
        role_title: req.body.role_title,
        slug: this.createSlug(req.body.role_title),
      };

      const result = await this.authService.roleInsert(data);
      return sendSuccess(res, 201, result, 'Create Role successfully');
    } catch (error) {
      return sendError(res, 500, error.message || 'Invalid input');
    }
  }

  async createPermission(req: any, res: any) {
    if (!req.body.role_id || !req.body.Permissionmetadata) {
      return sendError(
        res,
        HttpStatusCode.BAD_REQUEST.code,
        'role_id and Permissionmetadata required',
      );
    }

    try {
      const permissionData = {
        role_id: req.body.role_id,
        permission_name: req.body.permission_name,
      };

      const permissionMetadata = req.body.Permissionmetadata;

      const permission =
        await this.authService.insertPermission(permissionData);

      for (const metadata of permissionMetadata) {
        metadata.permission_id = permission.id;
        await this.authService.insertPermissionMetadata(metadata);
      }

      return sendSuccess(
        res,
        HttpStatusCode.OK.code,
        permission,
        'Permission Create Successfully',
      );
    } catch (error) {
      return sendError(
        res,
        HttpStatusCode.INTERNAL_SERVER_ERROR.code,
        'internal server error',
      );
    }
  }

  async viewPermission(req: any, res: any) {
    try {
      const result = await this.authService.findPermission(req);
      return sendSuccess(
        res,
        HttpStatusCode.OK.code,
        result,
        'Permission View Successfully',
      );
    } catch (error) {
      return sendError(
        res,
        HttpStatusCode.INTERNAL_SERVER_ERROR.code,
        'internal server error',
      );
    }
  }

  async permissionDetails(req: any, res: any) {
    if (!req.body.id) {
      return sendError(res, HttpStatusCode.BAD_REQUEST.code, 'ID Required');
    }

    try {
      const result = await this.authService.findPermissionData(req.body.id);
      return sendSuccess(
        res,
        HttpStatusCode.OK.code,
        result,
        'Permission View Successfully',
      );
    } catch (error) {
      return sendError(
        res,
        HttpStatusCode.INTERNAL_SERVER_ERROR.code,
        'internal server error',
      );
    }
  }

  async permissionUpdate(req: any, res: any) {
    if (!req.body.permission_id || !req.body.Permissionmetadata) {
      return sendError(
        res,
        HttpStatusCode.BAD_REQUEST.code,
        'permission_id and Permissionmetadata are required',
      );
    }

    try {
      const permissionId = req.body.permission_id;
      const permissionMetadata = req.body.Permissionmetadata;

      const pData = {
        permission_name: req.body.permission_name,
        role_id: req.body.role_id,
      };

      await this.authService.updatePermission(permissionId, pData);
      await this.authService.permmissionDelete(permissionId);

      for (const metadata of permissionMetadata) {
        await this.authService.permmissiondUpdate({
          ...metadata,
          permission_id: permissionId,
        });
      }

      return sendSuccess(
        res,
        HttpStatusCode.OK.code,
        pData,
        'Permission updated successfully',
      );
    } catch (error) {
      return sendError(
        res,
        HttpStatusCode.INTERNAL_SERVER_ERROR.code,
        'Internal server error',
      );
    }
  }
  viewRole = async (req, res) => {
    try {
      const view = await this.authService.rolefindAll();
      sendSuccess(res, 200, view, 'Success');
    } catch (error) {
      console.log(error);
      sendError(res, 500, error.message || 'Internal server error');
    }
  };
}
