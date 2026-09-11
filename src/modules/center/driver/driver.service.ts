import { Injectable } from '@nestjs/common';
import { sendSuccess, sendError } from '../../../utils/response.util';
import { DRIVERMASTER } from 'src/models/DriverMaster';
import { Otp } from 'src/models/OTP';
import { Packagemanagment } from 'src/models/packagemanagment.model';
import { Centerpackage } from 'src/models/centerpackage.model';
import { Bloodgroup } from 'src/models/bloodgroup.model';
import { Bloodpressure } from 'src/models/bloodpressure.model';
import { Pulmonaryfunctiontest } from 'src/models/pulmonaryfunctiontest.model';
import { BMI } from 'src/models/bmi.model';
import { CHOLESTEROL } from 'src/models/cholesterol.model';
import { Cretenine } from 'src/models/cretenine.model';
import { ECG } from 'src/models/ecg.model';
import { EyeTest } from 'src/models/health-tests';
import { Haemoglobin } from 'src/models/haemoglobin.model';
import { Hearingtest } from 'src/models/hearingtest.model';
import { Hiv } from 'src/models/hiv.model';
import { Pulse } from 'src/models/pulse.model';
import { RandomBloodSugar } from 'src/models/random-blood-sugar.model';
import { SPO2 } from 'src/models/spo2.model';
import { Temperature } from 'src/models/temperature.model';
// import { AlcoholTest } from 'src/models/health-tests';
import { CenterUser } from 'src/models/CenterUser';
import { Center } from 'src/models/Center';
import { DRIVERFAMILYHISTORY } from 'src/models/DriverFamilyHistory';
import { DRIVERMASTERPERSONAL } from 'src/models/DriverMasterPersonal';
import { driverhealthcheckup } from 'src/models/DriverHealthCheckup';
import { Romberg } from 'src/models/romberg.model';
import { Vision } from 'src/models/vision.model';
import { ViewHistoryPermission } from 'src/models/view-history-permission.model';
import { sendOTP as sendOtpSms } from 'src/helper/sendOtp';
import { WhatsAppHelper } from 'src/helper/whatsapp.helper';
import { GlobalHelper } from 'src/helper/global.helper';
import { processCenterGrouping } from 'src/utils/center-group.util';
import { THRESHOLDS } from 'src/helper/thresholds.helper';
import { Prescription } from 'src/models/Prescription';
import { PrescriptionMedicine } from 'src/models/PrescriptionMedicine';
import { Op } from 'sequelize';
import { configJwt } from 'config/envConfig';
import * as jwt from 'jsonwebtoken';
const moment = require('moment-timezone');
import { Kft } from 'src/models/health-tests/kft.model';
import { Sequelize } from 'sequelize-typescript';
import { InjectConnection } from '@nestjs/sequelize';
import {Alcholtest} from "src/models/alcholtest.model";
import { Cetuser } from 'src/models/CetUser';
import { GROUP_TRANSPORTER_CET_IDS } from 'config/envConfig';

@Injectable()
export class DriverService {
  constructor(
  @InjectConnection() private readonly sequelize: Sequelize
) {}
  async createDriver(req: any & any, res: any) {
    const {
      driver_cetid,
      driver_cetname,
      name,
      healthCardNumber,
      driverId,
      abhaNumber,
      abhaDocument,
      dateOfBirthOrAge,
      gender,
      localAddress,
      localAddressDistrict,
      localAddressState,
      contactNumber,
      emergencyContactName,
      emergencyContactNumber,
      idProof,
      idProof_number,
      photographOfDriver,
      idProof_doc,
      idProof_name,
      blood_group,
      employeeID,
      isAyushmanCard,
      needAssistanceAyushman,
      consent_form,
      disease_ids,
    } = req.body;

    if (!name) {
      return sendError(res, 400, 'name Required');
    }

    if (!consent_form) {
      return sendError(res, 400, 'Consent form is required');
    }

    try {
      const lastDriver = await DRIVERMASTER.findOne({
        order: [['id', 'DESC']],
      });

      const nextId = lastDriver ? Number(lastDriver.id) + 1 : 1;
      const external_id = `LMC0000${nextId}`;

      const centerData = await GlobalHelper.getCenterId(req.userId);

      const data = {
        driver_cetid,
        driver_cetname,
        createdBy: centerData?.center_id,
        external_id,
        name,
        healthCardNumber,
        driverId: driverId || null,
        abhaNumber,
        abhaDocument: abhaDocument || null,
        dateOfBirthOrAge,
        gender,
        photographOfDriver: photographOfDriver || null,
        localAddress,
        localAddressDistrict,
        localAddressState,
        contactNumber,
        emergencyContactName,
        emergencyContactNumber,
        idProof,
        idProof_number,
        blood_group,
        idProof_name: idProof_name || null,
        idProof_doc: idProof_doc || null,
        consent_form: consent_form || null,
        employeeId: employeeID,
        isAyushmanCard,
        needAssistanceAyushman,
        disease_ids: Array.isArray(disease_ids) ? disease_ids : [],
      };

      const insert = await DRIVERMASTER.create(data);

      return sendSuccess(res, 201, insert, 'Patient created successfully');
    } catch (error) {
      return sendError(res, 500, error);
    }
  }
  private denyTestAccountAccess(res: any) {
    return sendError(res, 403, 'test_account_restricted');
  }

  async getDriverList(req: any & any, res: any) {
    if (req.isTestAccount) {
      return this.denyTestAccountAccess(res);
    }

    try {
      // kept same logic as original (no center filter)
      const drivers = await DRIVERMASTER.findAll({
        order: [['id', 'DESC']],
      });

      return sendSuccess(res, 200, drivers, 'List of drivers');
    } catch (error) {
      return sendError(res, 500, 'Internal server error');
    }
  }
  async getDriverListCET(req: any & any, res: any) {
    try {
      const cetData = await GlobalHelper.getCetId(req.userId);
      const cetId = cetData?.cet_id;

      const drivers = await DRIVERMASTER.findAll({
        where: { driver_cetid: cetId },
        order: [['id', 'DESC']],
      });

      return sendSuccess(res, 200, drivers, 'List of drivers for this CET');
    } catch (error) {
      return sendError(res, 500, 'Internal server error');
    }
  }

  async getDriverDetails(req: any & any, res: any) {
    if (req.isTestAccount) {
      return this.denyTestAccountAccess(res);
    }

    if (!req.body.id) {
      return sendError(res, 400, 'ID Required');
    }

    const { id } = req.body;

    try {
      const driver = await DRIVERMASTER.findOne({
        where: { id },
      });

      return sendSuccess(res, 200, driver, 'Driver details');
    } catch (error) {
      return sendError(res, 500, error);
    }
  }

  /* ===================== UPDATE DRIVER ===================== */

  async updateDriver(req: any, res: any) {
    const { id } = req.body;

    if (!id) {
      return sendError(res, 400, 'ID Required');
    }

    try {
      const existingDriver = await DRIVERMASTER.findByPk(id);
      if (!existingDriver) {
        return sendError(res, 404, 'Driver not found or not updated');
      }

      const consent_form =
        req.body.consent_form || (existingDriver as any).consent_form;
      if (!consent_form) {
        return sendError(res, 400, 'Consent form is required');
      }

      const updatedData = {
        ...req.body,
        consent_form,
      };

      const [updatedRowCount] = await DRIVERMASTER.update(updatedData, {
        where: { id },
      });

      if (updatedRowCount === 0) {
        return sendError(res, 404, 'Driver not found or not updated');
      }

      const updatedDriver = await DRIVERMASTER.findByPk(id);

      return sendSuccess(
        res,
        200,
        updatedDriver,
        'Driver updated successfully with CET details',
      );
    } catch (error) {
      return sendError(res, 500, 'Internal server error');
    }
  }

  /* ===================== CREATE DRIVER PERSONAL DATA ===================== */

  async createDriverPersonalData(req: any, res: any) {
    const {
      driver_phone,
      driver_id,
      blood_group,
      diabetes,
      hypertension,
      hypotension,
      epilepsy,
      physical_disability,
      physical_disability_details,
      mental_disability,
      mental_disability_details,
      vision_issues,
      vision_issues_details,
      hearing_issues,
      hearing_issues_details,
      major_accident,
      allergies,
      other_medical_info,
      alcohol_consumption,
      smoking,
      tobacco_consumption,
      birthmark_identification,
    } = req.body;

    const data = {
      driver_phone,
      driver_id: parseInt(driver_id),
      blood_group,
      diabetes,
      hypertension,
      hypotension,
      epilepsy,
      physical_disability,
      physical_disability_details,
      mental_disability,
      mental_disability_details,
      vision_issues,
      vision_issues_details,
      hearing_issues,
      hearing_issues_details:
        hearing_issues_details === 'null' ? null : hearing_issues_details,
      major_accident,
      allergies,
      other_medical_info,
      alcohol_consumption,
      smoking,
      tobacco_consumption,
      birthmark_identification,
    };

    try {
      const insert = await DRIVERMASTERPERSONAL.create(data);

      return sendSuccess(
        res,
        201,
        insert,
        'DRIVERMASTERPERSONAL Center successfully',
      );
    } catch (error) {
      return sendError(res, 500, 'Internal server error');
    }
  }

  /* ===================== VIEW DRIVER PERSONAL DATA ===================== */

  async driverPersonalDataView(req: any, res: any) {
    try {
      const drivers = await DRIVERMASTERPERSONAL.findAll({
        order: [['id', 'DESC']],
      });

      return sendSuccess(res, 200, drivers, 'List of drivers');
    } catch (error) {
      return sendError(res, 500, 'Internal server error');
    }
  }

  async driverPersonalDetails(req: any, res: any) {
    if (!req.body.id) {
      return sendError(res, 400, 'ID Required');
    }

    try {
      const driver = await DRIVERMASTER.findOne({
        where: { id: req.body.id },
      });

      const driverPersonalData = await DRIVERMASTERPERSONAL.findOne({
        where: { driver_id: req.body.id },
      });

      const resData = {
        driver,
        driverPersonalData,
      };

      return sendSuccess(res, 200, resData, 'Driver Data');
    } catch (error) {
      return sendError(res, 500, error);
    }
  }

  /* ===================== DRIVER PERSONAL UPDATE ===================== */

  async driverPersonalUpdate(req: any, res: any) {
    const {
      driver_id,
      blood_group,
      diabetes,
      hypertension,
      hypotension,
      epilepsy,
      physical_disability,
      physical_disability_details,
      mental_disability,
      mental_disability_details,
      vision_issues,
      vision_issues_details,
      hearing_issues,
      hearing_issues_details,
      major_accident,
      allergies,
      other_medical_info,
      alcohol_consumption,
      smoking,
      tobacco_consumption,
      birthmark_identification,
    } = req.body;

    try {
      const driver = await DRIVERMASTER.findOne({
        where: { id: driver_id },
      });

      if (!driver) {
        return sendError(res, 404, 'Driver not found');
      }

      const data = {
        driver_id: parseInt(driver_id),
        blood_group,
        diabetes,
        hypertension,
        hypotension,
        epilepsy,
        physical_disability,
        physical_disability_details,
        mental_disability,
        mental_disability_details,
        vision_issues,
        vision_issues_details,
        hearing_issues,
        hearing_issues_details:
          hearing_issues_details === 'null' ? null : hearing_issues_details,
        major_accident,
        allergies,
        other_medical_info,
        alcohol_consumption,
        smoking,
        tobacco_consumption,
        birthmark_identification,
        driver_phone: driver.contactNumber,
      };

      const existingRecord = await DRIVERMASTERPERSONAL.findOne({
        where: { driver_id },
        raw: true,
        nest: true,
      });

      if (existingRecord) {
        await DRIVERMASTERPERSONAL.update(data, {
          where: { driver_id },
        });

        return sendSuccess(
          res,
          200,
          data,
          'Driver personal data updated successfully',
        );
      } else {
        await DRIVERMASTERPERSONAL.create(data);

        return sendSuccess(
          res,
          200,
          data,
          'Driver personal data created successfully',
        );
      }
    } catch (error) {
      return sendError(res, 500, error);
    }
  }

  /* ===================== CREATE DRIVER FAMILY DATA ===================== */

  async createDriverFamilyData(req: any, res: any) {
    const {
      driver_phone,
      driver_id,
      family_member_1,
      family_member_2,
      parent_diabetic,
      parent_hypertension,
      parent_hypotension,
      other_genetic_disease,
      family_member_1_relation,
      family_member_2_relation,
    } = req.body;

    try {
      const insert = await DRIVERFAMILYHISTORY.create({
        driver_phone,
        driver_id,
        family_member_1,
        family_member_2,
        parent_diabetic,
        parent_hypertension,
        parent_hypotension,
        other_genetic_disease,
        family_member_1_relation,
        family_member_2_relation,
      });

      return sendSuccess(
        res,
        201,
        insert,
        'DRIVERFAMILYHISTORY Center successfully',
      );
    } catch (error) {
      return sendError(res, 500, error);
    }
  }

  /* ===================== DRIVER FAMILY LIST ===================== */

  async driverFamilyList(req: any, res: any) {
    try {
      const insert = await DRIVERFAMILYHISTORY.findAll({
        order: [['id', 'DESC']],
      });

      return sendSuccess(
        res,
        200,
        insert,
        'DRIVERFAMILYHISTORY Fetch successfully',
      );
    } catch (error) {
      return sendError(res, 500, error);
    }
  }

  /* ===================== DRIVER FAMILY DETAILS ===================== */

  async driverFamilyDetails(req: any, res: any) {
    if (!req.body.id) {
      return sendError(res, 400, 'ID Required');
    }

    try {
      const driver = await DRIVERMASTER.findOne({
        where: { id: req.body.id },
      });

      const familyData = await DRIVERFAMILYHISTORY.findOne({
        where: { driver_id: req.body.id },
      });

      const resData = {
        driver,
        familyData,
      };

      return sendSuccess(
        res,
        200,
        resData,
        'DRIVERFAMILYHISTORY Fetch successfully',
      );
    } catch (error) {
      return sendError(res, 500, error);
    }
  }

  async driverFamilyUpdate(req: any, res: any) {
    if (!req.body.id) {
      sendError(res, 400, 'ID Required');
      return;
    }

    try {
      const {
        id,
        driver_phone,
        family_member_1,
        family_member_2,
        parent_diabetic,
        parent_hypertension,
        parent_hypotension,
        other_genetic_disease,
        driver_id,
        family_member_1_relation,
        family_member_2_relation,
      } = req.body;

      const existingRecord = await DRIVERFAMILYHISTORY.findOne({
        where: { driver_id },
        raw: true,
        nest: true,
      });

      if (existingRecord) {
        await DRIVERFAMILYHISTORY.update(
          {
            driver_phone,
            family_member_1,
            family_member_2,
            parent_diabetic,
            parent_hypertension,
            parent_hypotension,
            other_genetic_disease,
            family_member_1_relation,
            family_member_2_relation,
          },
          {
            where: { id },
          },
        );

        sendSuccess(
          res,
          201,
          existingRecord,
          'Family member record updated successfully',
        );
        return;
      }

      await DRIVERFAMILYHISTORY.create({
        driver_id,
        driver_phone,
        family_member_1,
        family_member_2,
        parent_diabetic,
        parent_hypertension,
        parent_hypotension,
        other_genetic_disease,
        family_member_1_relation,
        family_member_2_relation,
      });

      sendSuccess(
        res,
        201,
        existingRecord,
        'Family member record updated successfully',
      );
      return;
    } catch (error) {
      sendError(res, 500, error);
    }
  }

  async sendOtp(req: any, res: any) {
    const phoneNumber = req.body.phoneNumber;

    if (!phoneNumber) {
      sendError(res, 400, 'Phone Number is required!');
      return;
    }

    try {
      const checkNumber = await DRIVERMASTER.findOne({
        where: { contactNumber: phoneNumber },
        raw: true,
        nest: true,
      });

      if (checkNumber) {
        const getOtp = await sendOtpSms(phoneNumber);

        await Otp.create({
          user_id: checkNumber.id,
          phone: phoneNumber,
          otp: getOtp.otp,
        });

        sendSuccess(res, 200, 'OTP Send Successfully', 'OTP Send Successfully');
        return;
      } else {
        sendError(res, 400, 'Wrong Phone Number');
        return;
      }
    } catch (error: any) {
      const isNetworkError =
        error?.code === 'ETIMEDOUT' ||
        error?.code === 'ECONNREFUSED' ||
        error?.code === 'ENOTFOUND' ||
        error?.message?.includes('timeout');
      const message = isNetworkError
        ? 'SMS service is temporarily unreachable. If testing locally, set SKIP_SMS_OTP=true in .env to bypass sending SMS.'
        : error?.message || error;
      sendError(res, 500, message);
    }
  }

  async sendOtp2(req: any, res: any) {
    const phoneNumber = req.body.phoneNumber;

    try {
      const getOtp = await sendOtpSms(phoneNumber);

      await Otp.create({
        user_id: 1, //This code need to be check
        phone: phoneNumber,
        otp: getOtp.otp,
      });

      sendSuccess(res, 200, 'OTP Send Successfully', 'OTP Send Successfully');
      return;
    } catch (error) {
      sendError(res, 500, error);
    }
  }

  async whatsappOtp(req: any, res: any) {
    const phoneNumber = req.body.phoneNumber;
    const name = req.body.name;
    const url = req.body.url;
    const rawCheckupId = req.body?.health_checkup_id ?? req.body?.checkupId;
    const parsedCheckupId = Number(rawCheckupId);
    const healthCheckupId =
      rawCheckupId !== null &&
      rawCheckupId !== undefined &&
      rawCheckupId !== '' &&
      Number.isFinite(parsedCheckupId) &&
      parsedCheckupId > 0
        ? parsedCheckupId
        : null;

    if (!phoneNumber) {
      sendError(res, 400, 'Phone Number is required!');
      return;
    }

    try {
      const result = await WhatsAppHelper.sendTemplateMessage(
        name,
        url,
        phoneNumber,
      );

      // Persist share status once Twilio accepts the message (idempotent Yes)
      if (healthCheckupId) {
        try {
          await driverhealthcheckup.update(
            { is_whatsapp_report_sent: true },
            { where: { id: healthCheckupId } },
          );
        } catch (flagError) {
          console.error(
            `Failed to set is_whatsapp_report_sent for checkup=${healthCheckupId}`,
            flagError,
          );
        }
      }

      return res.status(200).json({
        success: true,
        code: 200,
        result,
      });
    } catch (error) {
      sendError(res, 500, error);
    }
  }

  async verifyOtp(req: any, res: any) {
    if (!req.body.phoneNumber) {
      sendError(res, 400, 'Phone Number is required!');
      return;
    }

    if (!req.body.otp) {
      sendError(res, 400, 'Otp is required!');
      return;
    }

    try {
      const checkNumber = await Otp.findOne({
        where: {
          phone: req.body.phoneNumber,
          otp: req.body.otp,
        },
      });

      if (checkNumber) {
        await checkNumber.destroy();

        sendSuccess(
          res,
          200,
          'the OTP verification is successful',
          'the OTP verification is successful',
        );
      } else {
        sendError(res, 400, 'Wrong Otp');
        return;
      }
    } catch (error) {
      sendError(res, 500, error);
    }
  }

  async packageList(req: any, res: any) {
    try {
      // Step 1: Resolve user / center id safely
      const userId = req?.userId;
      const requestedCenterId = req?.body?.center_id;
      const isAdminCaller = Boolean(req?.isAdminCaller);

      if (!userId && !requestedCenterId) {
        return sendError(res, 400, 'center_id or userId is required');
      }

      // Step 3: Fetch center mapping (only if not admin)
      let centerId: number | null = null;

      if (isAdminCaller) {
        centerId = Number(requestedCenterId);
        if (!centerId || isNaN(centerId)) {
          return sendError(res, 400, 'center_id is required for admin');
        }
      } else {
        const centerData = await CenterUser.findOne({
          where: { user_id: userId },
          raw: true,
        });

        if (!centerData) {
          return sendError(res, 404, 'Center not found for user');
        }

        centerId = Number(centerData.center_id);
      }

      if (!centerId || isNaN(centerId)) {
        return sendError(res, 400, 'Invalid center_id');
      }

      const packages = await Centerpackage.findAll({
        where: { center_id: centerId, status: true },
        include: [{ model: Packagemanagment, as: 'package' }],
        order: [['id', 'DESC']],
      });

      const formattedData = packages.map((item: any) => {
        const pkg = item?.package || {};

        return {
          package: {
            id: pkg.id ?? null,
            package_name: pkg.package_name ?? null,
            package_id: pkg.package_id ?? null,
            package_list: pkg.package_list ?? null,
            status: pkg.status ?? null,
            createdAt: pkg.createdAt ?? null,
            updatedAt: pkg.updatedAt ?? null,
          },
        };
      });
      return sendSuccess(res, 200, formattedData, 'Success');
    } catch (error: any) {
      return sendError(res, 500, error?.message || 'Internal Server Error');
    }
  }

async packageListUnit(req: any, res: any) {
  try {
    const { package_list } = req.body;

    if (!Array.isArray(package_list) || package_list.length === 0) {
      return sendSuccess(res, 200, {}, "No packages provided");
    }

    const modelMapping: Record<string, any> = {
      temperature: Temperature,
      spo2: SPO2,
      pulse: Pulse,
      pft: Pulmonaryfunctiontest,
      haemoglobin: Haemoglobin,
      cretenine: Cretenine,
      alchol: Alcholtest,
      hiv: Hiv,
      ecg: ECG,
      bmi: BMI,
      cholesterol: CHOLESTEROL,
      eye: EyeTest,
      hearing: Hearingtest,
      "blood-pressure": Bloodpressure,
      "blood-group": Bloodgroup,
      "random-blood-sugar": RandomBloodSugar,
      romberg: Romberg,
      vision: Vision,
      kft: Kft,
    };

    const uniqueUnits = [...new Set(package_list.filter(Boolean))];
    const validUnits = uniqueUnits.filter((unit) => modelMapping[unit]);

    const results = await Promise.all(
      validUnits.map(async (unit) => {
        try {
          let record;

          // =========================
          // ✅ RAW QUERY FOR EYE
          // =========================
          if (unit === "eye") {
            const [eyeData] = await this.sequelize.query(`
              SELECT *
              FROM "Eyetests"
            `);

            // ✅ Always array
            record = Array.isArray(eyeData) ? eyeData[0] || null : null;

          } else {
            // ✅ Normal Sequelize
            const Model = modelMapping[unit];

            record = await Model.findOne({
              raw: true,
            });
          }

          return [unit, record ?? null];
        } catch (err) {
          console.error(`Error fetching ${unit}:`, err);
          return [unit, null];
        }
      })
    );

    const data = Object.fromEntries(results);

    return sendSuccess(res, 200, data, "Success");
  } catch (error) {
    console.error("packageListUnit error:", error);
    return sendError(res, 500, "Internal Server Error");
  }
}

  uploadSignature(req: any, res: any) {
    try {
      const fileData = req?.fileData;
      sendSuccess(res, 200, fileData, 'Success');
    } catch (error) {
      sendError(res, 500, error);
    }
  }
  async searchDriverByNumberorID(req: any, res: any) {
    const { searchData } = req.body;

    if (!searchData) {
      return sendError(res, 400, 'Search data is required!');
    }

    try {
      const searchQuery = await DRIVERMASTER.findOne({
        where: {
          [Op.or]: [
            { contactNumber: searchData },
            { external_id: searchData },
            { idProof_number: searchData },
          ],
        },
      });

      if (searchQuery) {
        sendSuccess(res, 200, searchQuery, 'Driver found successfully');
      } else {
        sendError(res, 404, 'Driver not found');
      }
    } catch (error) {
      sendError(res, 500, error);
    }
  }

  /* ===== helpers kept as-is ===== */

  testMapping = {
    temperature_unit: 'Temperature',
    spo2_unit: 'SPO2',
    random_blood_sugar_unit: 'Random Blood Sugar',
    alchol_test_unit: 'Alcohol Test',
    bmi_unit: 'BMI',
    ecg_unit: 'ECG',
    pulse_unit: 'Pulse',
    haemoglobin_unit: 'Haemoglobin Test',
    pulmonary_function_test_unit: 'PFT',
    vision_unit: 'Vision',
    blood_pressure_unit: {
      systolic: 'BP Systolic',
      diastolic: 'BP Diastolic',
    },
    eye_unit: {
      spherical_right_eye_unit: 'AR Report (AV Right Eye - Spherical)',
      cylindrical_right_eye_unit: 'AR Report (AV Right Eye - Cylindrical)',
      spherical_left_eye_unit: 'AR Report (AV Left Eye - Spherical)',
      cylindrical_left_eye_unit: 'AR Report (AV Left Eye - Cylindrical)',
      colour_blindness_unit: 'Colour Blindness',
    },
    romberg_unit: 'Romberg Test',
    // hiv_unit: 'HIV',
    basic_hearing_unit: 'Basic Hearing',
  };

  getTestStatusAndRemarks(value, threshold, testName = '') {
    if (!threshold) {
      return {
        test_status: 'Thresholds not defined',
        test_remarks: 'Data unavailable',
      };
    }

    if (value === null || value === undefined) {
      return {
        test_status: null,
        test_remarks: 'Data not available',
      };
    }

    if (threshold.high && value > threshold.high) {
      return {
        test_status: 'Out Of Range (High)',
        test_remarks: threshold.remarks?.high || 'Consultation Recommended',
      };
    } else if (threshold.max && value >= threshold.max) {
      return {
        test_status: 'Within Deviation Value (Max)',
        test_remarks: threshold.remarks?.max || 'Consultation Recommended',
      };
    } else if (threshold.normalMin && value >= threshold.normalMin) {
      return {
        test_status: 'Normal',
        test_remarks: threshold.remarks?.normal || 'Pass',
      };
    } else if (threshold.min && value >= threshold.min) {
      return {
        test_status: 'Within Deviation Value (Min)',
        test_remarks: threshold.remarks?.min || 'Consultation Recommended',
      };
    } else if (threshold.low && value <= threshold.low) {
      return {
        test_status: 'Out Of Range (Low)',
        test_remarks: threshold.remarks?.low || 'Consultation Recommended',
      };
    }

    return {
      test_status: 'Data Inconclusive',
      test_remarks: 'Please retest',
    };
  }

  processNonThresholdTests(testData, testName) {
    if (testData) {
      return {
        test_name: testName,
        test_status: testData.status || 'success',
        test_value: testData.value || null,
        test_unit: testData.units || null,
        test_remarks: testData.remark || 'Data not available',
      };
    }

    return {
      test_name: testName,
      test_status: null,
      test_value: null,
      test_unit: null,
      test_remarks: 'Data not available',
    };
  }

  getHaemoglobinStatus(value, threshold) {
    if (value >= threshold.normalMin) {
      return {
        test_status: 'Normal',
        test_remarks: threshold.remarks.normal,
      };
    } else if (value >= threshold.low) {
      return {
        test_status: 'Out Of Range (Low)',
        test_remarks: threshold.remarks.low,
      };
    }

    return {
      test_status: 'Data Inconclusive',
      test_remarks: 'Please retest',
    };
  }
  processTestResults(selectedTests, thresholds) {
    const testResults = [];

    Object.keys(this.testMapping).forEach((testKey) => {
      if (typeof this.testMapping[testKey] === 'string') {
        const testName = this.testMapping[testKey];
        const testData = selectedTests[testKey];

        // Non-threshold tests
        if (
          ['Vision', 'Romberg Test', 'Basic Hearing', 'ECG'].includes(testName)
        ) {
          testResults.push(this.processNonThresholdTests(testData, testName));
          return;
        }

        // Special cases for Haemoglobin and PFT
        if (testName === 'Haemoglobin Test' || testName === 'PFT') {
          const value =
            testData?.value !== undefined ? parseFloat(testData.value) : null;

          const status = this.getHaemoglobinStatus(value, thresholds[testName]);

          testResults.push({
            test_name: testName,
            test_status: status.test_status,
            test_value: value,
            test_unit: thresholds[testName]?.unit || null,
            test_remarks: status.test_remarks,
          });
          return;
        }

        // General processing
        const value =
          testData?.value !== undefined ? parseFloat(testData.value) : null;

        const { test_status, test_remarks } = this.getTestStatusAndRemarks(
          value,
          thresholds[testName],
          testName,
        );

        testResults.push({
          test_name: testName,
          test_status,
          test_value: value,
          test_unit: thresholds[testName]?.unit || testData?.units || null,
          test_remarks,
        });
      }
    });

    // Blood pressure unit
    if (selectedTests.blood_pressure_unit) {
      const systolicData = selectedTests.blood_pressure_unit.systolic_bp_unit;

      if (systolicData) {
        testResults.push(
          this.processNonThresholdTests(
            systolicData,
            this.testMapping.blood_pressure_unit.systolic,
          ),
        );
      }

      const diastolicData = selectedTests.blood_pressure_unit.diastolic_bp_unit;

      if (diastolicData) {
        testResults.push(
          this.processNonThresholdTests(
            diastolicData,
            this.testMapping.blood_pressure_unit.diastolic,
          ),
        );
      }
    }

    // Eye unit
    if (selectedTests.eye_unit) {
      Object.keys(this.testMapping.eye_unit).forEach((eyeKey) => {
        const testName = this.testMapping.eye_unit[eyeKey];
        const testData = selectedTests.eye_unit[eyeKey];

        if (testData) {
          const value = testData.value ? parseFloat(testData.value) : null;

          const threshold = thresholds[testName];
          let test_status = null;
          let test_remarks = 'Data not available';

          if (threshold && value !== null) {
            if (value > threshold.high) {
              test_status = 'Out Of Range (High)';
              test_remarks = threshold.remarks.high;
            } else if (value >= threshold.max) {
              test_status = 'Within Deviation Value (Max)';
              test_remarks = threshold.remarks.max;
            } else if (value >= threshold.normalMin) {
              test_status = 'Normal';
              test_remarks = threshold.remarks.normal;
            } else if (value >= threshold.low) {
              test_status = 'Out Of Range (Low)';
              test_remarks = threshold.remarks.low;
            }
          }

          testResults.push({
            test_name: testName,
            test_status: test_status || testData.status,
            test_value: value || testData.value || null,
            test_unit: testData.units || threshold?.unit || 'D',
            test_remarks: test_remarks || testData.remark,
          });
        } else {
          testResults.push({
            test_name: testName,
            test_status: null,
            test_value: null,
            test_unit: null,
            test_remarks: 'Data not available',
          });
        }
      });
    }

    return testResults;
  }

  async downloadHealthCheckupRecords(req: any, res: any) {
    try {
      const { startDate, endDate, driver_ID, vehicle_no } = req.body;
      let cet_id = req?.cetId; // from middleware

      if (!cet_id && req?.userId) {
        const cetUser = await Cetuser.findOne({
          where: { user_id: req.userId },
          attributes: ['cet_id'],
          order: [['id', 'DESC']],
        });
        cet_id = cetUser?.cet_id ?? null;
      }

      let transpoterCondition;
      if (GROUP_TRANSPORTER_CET_IDS.includes(cet_id)) {
        transpoterCondition = {
          [Op.in]: GROUP_TRANSPORTER_CET_IDS,
        };
      } else {
        transpoterCondition = cet_id;
      }

      const whereCondition = {
        date_time: {
          [Op.between]: [startDate, endDate],
        },
        ...(driver_ID && { driver_id: driver_ID }),
        ...(vehicle_no && { vehicle_no: vehicle_no }),
        ...(cet_id && { transpoter: transpoterCondition }),
      };

      console.log('[downloadHealthCheckupRecords] Applied filters:', {
        userId: req?.userId ?? null,
        cetId: cet_id ?? null,
        startDate,
        endDate,
        driver_ID: driver_ID ?? null,
        vehicle_no: vehicle_no ?? null,
        transpoterFilter:
          typeof transpoterCondition === 'object'
            ? { type: 'in', values: GROUP_TRANSPORTER_CET_IDS }
            : transpoterCondition ?? null,
      });

      const healthCheckupRecords = await driverhealthcheckup.findAll({
        where: whereCondition,
        include: [
          {
            model: DRIVERMASTER,
            as: 'driver',
            attributes: [
              'healthCardNumber',
              'name',
              'contactNumber',
              'idProof',
              'idProof_number',
            ],
          },
          {
            model: Center,
            as: 'center',
            attributes: [
              'project_name',
              'project_address',
              'center_address',
              'client_address',
            ],
          },
          {
            model: Prescription,
            as: 'checkupPrescriptions',
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
                  'prescription_medicine_id',
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
        attributes: [
          'id',
          'driver_id',
          'vehicle_no',
          'date_time',
          'selected_package_name',
          'selected_test',
          'createdBy',
        ],
      });

      if (healthCheckupRecords.length === 0) {
        return res.status(404).json({
          message: 'No health checkup records found for the given criteria',
        });
      }

      const anyData = healthCheckupRecords.map((record) => {
        const selectedTest =
          typeof record.selected_test === 'string'
            ? JSON.parse(record.selected_test)
            : record.selected_test || {};

        const testResults = this.processTestResults(selectedTest, THRESHOLDS);

        const prescriptions = record?.prescriptions
          ? record?.prescriptions.map((prescription) => ({
              prescription_id: prescription.prescription_id,
              lab: prescription.lab,
              other_lab: prescription.other_lab,
              instructions: prescription.instructions,
              chief_complaints: prescription.chief_complaints,
              follow_up: prescription.follow_up,
              preventive_advice: prescription.preventive_advice,
              prescription_slip_image: prescription.prescription_slip_image,
              prescription_slip_text: prescription.prescription_slip_text,
              vitals: prescription.vitals,
              health_conditions: prescription.health_conditions,
              drug_allergies: prescription.drug_allergies,
              diagnose: prescription.diagnose,
              fitness_status: prescription.fitness_status,
              created_at: moment(prescription.createdAt)
                .tz('Asia/Kolkata')
                .format('YYYY-MM-DD HH:mm:ss'),
              medicines: prescription.medicines
                ? prescription.medicines.map((medicine) => ({
                    prescription_medicine_id: medicine.prescription_medicine_id,
                    medicine_name: medicine.medicine_name,
                    dosage: medicine.dosage,
                    frequency: medicine.frequency,
                    medicine_type: medicine.medicine_type,
                    duration: medicine.duration,
                    instructions: medicine.instructions,
                  }))
                : [],
            }))
          : [];

        return {
          healthCardNumber: record.driver?.healthCardNumber || null,
          name: record.driver?.name || null,
          contactNumber: record.driver?.contactNumber || null,
          idProof: record.driver?.idProof || null,
          idProof_number: record.driver?.idProof_number || null,
          id: record.id,
          driver_id: record.driver_id,
          vehicle_no: record.vehicle_no,
          date_time: moment(record.date_time)
            .tz('Asia/Kolkata')
            .format('YYYY-MM-DD HH:mm:ss'),
          selected_package_name: record.selected_package_name,
          center_name: record.center.project_name,
          center_address: record.center.center_address,
          test_results: testResults,
          prescriptions,
        };
      });

      res.status(200).json(anyData);
    } catch (error) {
      res.status(500).json({
        message: 'An error occurred while generating the JSON any',
      });
    }
  }

  async downloadDriverMasters(req: any, res: any) {
    if (req.isTestAccount) {
      return this.denyTestAccountAccess(res);
    }

    const token = req.headers['authkey'];

    if (!token) {
      return res
        .status(401)
        .json({ message: 'Authorization token is required' });
    }

    let cet_id;

    try {
      const decodedToken: any = jwt.verify(
        token as string,
        configJwt.JWT_CENTER,
      );
      cet_id = decodedToken.data.cet_id;
    } catch (error) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    try {
      const { driver_cetname, name, contactNumber, employee_id } = req.body;

      const driverMasters = await DRIVERMASTER.findAll({
        where: {
          driver_cetid: cet_id,
          ...(driver_cetname && { driver_cetname }),
          ...(name && { name }),
          ...(contactNumber && { contactNumber }),
          ...(employee_id && { employee_id }),
          ...(cet_id && { driver_cetid: cet_id }),
        },
        raw: true,
      });

      if (driverMasters.length === 0) {
        return res.status(404).json({
          message: 'No driver records found for the given criteria',
        });
      }

      const anyData = driverMasters.map((record) => ({
        id: record.id,
        driver_cetid: record.driver_cetid,
        driver_cetname: record.driver_cetname,
        external_id: record.external_id,
        createdBy: record.createdBy,
        name: record.name,
        healthCardNumber: record.healthCardNumber,
        driverId: record.driverId,
        abhaNumber: record.abhaNumber,
        abhaDocument: record.abhaDocument,
        dateOfBirthOrAge: record.dateOfBirthOrAge,
        gender: record.gender,
        photographOfDriver: record.photographOfDriver,
        localAddress: record.localAddress,
        localAddressDistrict: record.localAddressDistrict,
        localAddressState: record.localAddressState,
        contactNumber: record.contactNumber,
        emergencyContactName: record.emergencyContactName,
        emergencyContactNumber: record.emergencyContactNumber,
        idProof_name: record.idProof_name,
        idProof: record.idProof,
        idProof_number: record.idProof_number,
        idProof_doc: record.idProof_doc,
        blood_group: record.blood_group,
        employee_id: record.employeeId,
      }));

      res.status(200).json(anyData);
    } catch (error) {
      res.status(500).json({
        message: 'An error occurred while generating the JSON any',
      });
    }
  }

  async checkPermission(req: any, res: any) {
    const { driver_id, cet_id } = req.body;

    try {
      const permissionRecord = await ViewHistoryPermission.findOne({
        where: {
          driver_id,
          cet_id,
          permission: true,
        },
      });

      if (permissionRecord) {
        return sendSuccess(
          res,
          200,
          { permission: true },
          'Permission granted.',
        );
      } else {
        return sendSuccess(
          res,
          200,
          { permission: false },
          'Permission denied.',
        );
      }
    } catch (error) {
      sendError(res, 500, error);
    }
  }

  async downloadPrevHealthRecords(req: any, res: any) {
    try {
      const { driver_ID, cet_id } = req.body;

      if (!driver_ID) {
        return sendError(res, 400, 'Driver ID is required');
      }

      const hasPermission = await ViewHistoryPermission.findOne({
        where: {
          driver_id: driver_ID,
          cet_id,
          permission: true,
        },
      });

      const whereClause: any = {
        driver_id: driver_ID,
      };

      if (!hasPermission) {
        whereClause.transpoter = cet_id;
      }

      const healthCheckupRecords = await driverhealthcheckup.findAll({
        where: whereClause,
        raw: true,
      });

      if (healthCheckupRecords.length === 0) {
        return sendError(
          res,
          404,
          'No health checkup records found for this driver',
        );
      }

      const serializedRecords = healthCheckupRecords.map((record) => ({
        ...record,
        package_list: Array.isArray(record.package_list)
          ? record.package_list.join(', ')
          : record.package_list,
        selected_package_name: Array.isArray(record.selected_package_name)
          ? record.selected_package_name.join(', ')
          : record.selected_package_name,
        selected_package_list: Array.isArray(record.selected_package_list)
          ? record.selected_package_list.join(', ')
          : record.selected_package_list,
        selected_test: JSON.stringify(record.selected_test || {}),
        bmi_unit: JSON.stringify(record.bmi_unit || {}),
        blood_pressure_unit: JSON.stringify(record.blood_pressure_unit || {}),
        haemoglobin_unit: JSON.stringify(record.haemoglobin_unit || {}),
        random_blood_sugar_unit: JSON.stringify(
          record.random_blood_sugar_unit || {},
        ),
        hearing_unit: JSON.stringify(record.hearing_unit || {}),
        cholesterol_unit: JSON.stringify(record.cholesterol_unit || {}),
        ecg_unit: JSON.stringify(record.ecg_unit || {}),
      }));

      res.status(200).json(serializedRecords);
    } catch (error) {
      sendError(res, 500, 'An error occurred while generating the CSV data');
    }
  }

  async updatePermission(req: any, res: any) {
    const { driver_id, cet_id } = req.body;

    try {
      let permissionRecord = await ViewHistoryPermission.findOne({
        where: { driver_id, cet_id },
      });

      if (permissionRecord) {
        permissionRecord.permission = true;
        await permissionRecord.save();

        res.status(200).json({
          success: true,
          message: 'Permission updated successfully.',
        });
      } else {
        await ViewHistoryPermission.create({
          driver_id,
          cet_id,
          permission: true,
        });

        res.status(201).json({
          success: true,
          message: 'Permission created and set to true.',
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error.',
      });
    }
  }

  async updateEmployeeId(req: any, res: any) {
    const { id, employeeId } = req.body;

    if (!id || !employeeId) {
      return sendError(res, 400, 'id and employeeId are required');
    }

    try {
      const driverId = Number(id);
      if (Number.isNaN(driverId)) {
        return sendError(res, 400, 'Invalid id');
      }

      const driver = await DRIVERMASTER.findByPk(driverId);
      if (!driver) {
        return sendError(res, 404, 'Driver not found');
      }

      driver.employeeId = String(employeeId);
      await driver.save();

      sendSuccess(res, 200, driver, 'Employee ID updated successfully');
    } catch (error) {
      sendError(res, 500, error);
    }
  }

  async updateEmployeeIdByLMCID(req: any, res: any) {
    const { external_id, employee_id } = req.body;

    if (!external_id || !employee_id) {
      return sendError(res, 400, 'ID and Employee ID are required');
    }

    try {
      const [updatedRowCount] = await DRIVERMASTER.update(
        { employee_id },
        { where: { external_id } },
      );

      if (updatedRowCount === 0) {
        return sendError(res, 404, 'Driver not found or not updated');
      }

      const updatedDriver = await DRIVERMASTER.findOne({
        where: { external_id },
      });

      sendSuccess(res, 200, updatedDriver, 'Employee ID updated successfully');
    } catch (error) {
      sendError(res, 500, error);
    }
  }
  async searchDriver(req: any, res: any) {
    if ((req as any).isTestAccount) {
      return this.denyTestAccountAccess(res);
    }

    const {
      external_id,
      name,
      healthCardNumber,
      abhaNumber,
      contactNumber,
      center_id,
    } = req.body;

    try {
      // Process center grouping
      const groupingInfo = await processCenterGrouping(center_id);

      const whereCondition: any = {};

      // Apply center filtering
      if (
        groupingInfo.targetCenterIds &&
        groupingInfo.targetCenterIds.length > 0
      ) {
        whereCondition.createdBy = {
          [Op.in]: groupingInfo.targetCenterIds,
        };
      }

      // Apply search filters
      if (external_id) {
        whereCondition.external_id = {
          [Op.iLike]: `%${external_id}%`,
        };
      }

      if (name) {
        whereCondition.name = {
          [Op.iLike]: `%${name}%`,
        };
      }

      if (healthCardNumber) {
        whereCondition.healthCardNumber = {
          [Op.iLike]: `%${healthCardNumber}%`,
        };
      }

      if (abhaNumber) {
        whereCondition.abhaNumber = {
          [Op.iLike]: `%${abhaNumber}%`,
        };
      }

      if (contactNumber) {
        whereCondition.contactNumber = {
          [Op.iLike]: `%${contactNumber}%`,
        };
      }

      let drivers;

      if (Object.keys(whereCondition).length > 0) {
        drivers = await DRIVERMASTER.findAll({
          where: whereCondition,
          limit: 100,
          order: groupingInfo.orderClause,
        });

        if (!drivers || drivers.length === 0) {
          return sendError(res, 404, 'No matching driver found');
        }
      } else {
        drivers = await DRIVERMASTER.findAll({
          limit: 10,
          order: groupingInfo.orderClause,
        });
      }

      return sendSuccess(res, 200, drivers, 'Drivers fetched successfully');
    } catch (error) {
      return sendError(res, 500, error);
    }
  }
  async getCenterId(req, res) {
    try {
      const userId = req.userId;

      if (!userId) {
        return sendError(res, 400, 'User ID is required.');
      }

      const centerUser = await CenterUser.findOne({
        where: { user_id: userId },
        attributes: ['center_id'],
      });

      if (!centerUser) {
        return sendError(res, 404, 'Center not found for this user.');
      }

      return sendSuccess(
        res,
        200,
        { center_id: centerUser.center_id },
        'Center ID retrieved successfully.',
      );
    } catch (error) {
      return sendError(res, 500, error.message);
    }
  }
}
