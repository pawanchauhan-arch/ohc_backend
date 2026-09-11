import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { sendSuccess, sendError } from '../../utils/response.util';
import { enrichMobilabTests } from '../../utils/lab-value.util';
import { User } from '../../models/User';
import { Doctor } from '../../models/Doctor';
import { DRIVERMASTER } from 'src/models/DriverMaster';
import { Packagemanagment } from 'src/models/packagemanagment.model';
import { Centerpackage } from 'src/models/centerpackage.model';
import { Bloodgroup } from 'src/models/bloodgroup.model';
import { Bloodpressure } from 'src/models/bloodpressure.model';
import { Pulmonaryfunctiontest } from 'src/models/pulmonaryfunctiontest.model';
import { BMI } from 'src/models/bmi.model';
import { CHOLESTEROL } from 'src/models/cholesterol.model';
import { Cretenine } from 'src/models/cretenine.model';
import { ECG } from 'src/models/ecg.model';
import { Eyetest } from 'src/models/eyetest.model';
import { Haemoglobin } from 'src/models/haemoglobin.model';
import { Hearingtest } from 'src/models/hearingtest.model';
import { Hiv } from 'src/models/hiv.model';
import { Pulse } from 'src/models/pulse.model';
import { RandomBloodSugar } from 'src/models/random-blood-sugar.model';
import { SPO2 } from 'src/models/spo2.model';
import { Temperature } from 'src/models/temperature.model';
import { AlcoholTest } from 'src/models/health-tests';
import {
  BloodPressureTest,
  BmiTest,
  EcgTest,
  EyeTest,
  HaemoglobinTest,
  HivTest,
  PulmonaryFunctionTest,
  PulseTest,
  RandomBloodSugarTest,
  RombergTest,
  Spo2Test,
  TemperatureTest,
  VisionTest,
} from 'src/models/health-tests';
import { CenterUser } from 'src/models/CenterUser';
import { Center } from 'src/models/Center';
import { DRIVERMASTERPERSONAL } from 'src/models/DriverMasterPersonal';
import { driverhealthcheckup } from 'src/models/DriverHealthCheckup';
import { Vision } from 'src/models/vision.model';
import { WhatsAppHelper } from 'src/helper/whatsapp.helper';
import { GlobalHelper } from 'src/helper/global.helper';
import { parseCenterId } from 'src/utils/parse-center-id.util';
import { Workforcetype } from 'src/models/workforcetype.model';
import { CampListItem } from 'src/models/CampListItem';
import { Op, Sequelize, QueryTypes, Transaction } from 'sequelize';
import { CETMANAGEMENT } from 'src/models/CetManagement';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
const { S3 } = require('aws-sdk');
import * as ffmpeg from 'fluent-ffmpeg';
import { VideoCategoryReference } from 'src/models/video-category-reference.model';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { Alcholtest } from 'src/models/alcholtest.model';
import { InjectConnection } from '@nestjs/sequelize';
import { kinesisClient, STREAM_NAME } from './kinesisClient';
import { PutRecordCommand } from '@aws-sdk/client-kinesis';
import { InstavansParkflowService } from '../instavans-parkflow/instavans-parkflow.service';
import { Prescription } from 'src/models/Prescription';
import {
  InstavansPushSourceAfterCheckupEdit,
  resolveInstavansPushSourceAfterCheckupEdit,
} from '../instavans-parkflow/mappers/instavans-status.mapper';
import {
  AWS_REGION,
  healthCheckupCpiConfig,
  S3_BUCKET_NAME,
} from 'config/envConfig';
import {
  calculateFitnessStatus,
  getFitnessVitalAssessments,
} from 'src/utils/fitness-status.util';
import { LabResultService } from '../MobiLab/lab-result.service';
import { updateDriverHealthCheckupAsAdmin } from 'src/utils/driver-health-checkup-admin-update.util';
import { resolveReportConfirmedAtForUpdate } from 'src/utils/report-confirmed-at.util';
import {
  emptyShapedContacts,
  mergeContactsIntoCetObjects,
} from 'src/helper/cet-contact.helper';
import { HealthService } from '../ViewDriverHealth/health.service';

@Injectable()
export class HealthCheckupService {
  constructor(
    @InjectConnection() private readonly sequelize: Sequelize,
    private readonly instavansParkflowService: InstavansParkflowService,
    private readonly labResultService: LabResultService,
    private readonly healthListService: HealthService,
  ) {}
  private readonly logger = new Logger(HealthCheckupService.name);
  s3 = new S3({
    accessKeyId: process.env.S3AccessKey,
    secretAccessKey: process.env.SecretKey,
    region: process.env.AWS_REGION,
  });

  private denyTestAccountAccess(res) {
    sendError(
      res,
      403,
      'Test accounts are not allowed to access health checkup records',
    );
  }

  getRBSVideoKey(value: any) {
    if (value < 55) return 'less than 55 RBS';
    if (value >= 55 && value <= 70) return 'Low 70-55 RBS';
    if (value >= 200 && value <= 300) return '200-300 RBS';
    if (value > 350) return 'Higher than 350 RBS';
    return null;
  }

  getBPVideoKey(bpString: any) {
    const parts = bpString.split('/');
    if (parts.length !== 2) return null;

    const s = parseFloat(parts[0]); // Systolic
    const d = parseFloat(parts[1]);
    if (s > 160 || d > 102) return 'More than 160-102 BP';

    if (s >= 140 || d >= 90) return 'High BP 140-90';
    if (s < 80) return 'less than 80 BP';
    if ((s >= 80 && s <= 100) || (d >= 60 && d <= 70)) return 'Low BP 80-60';

    return null;
  }

  getPulseVideoKey(value: any) {
    if (value < 60) return 'Down';
    if (value > 100) return 'Up';
    return null;
  }

  getTemperatureVideoKey(value: any) {
    if (value > 99) return 'bodyTemperatureUp';
    if (value < 95) return 'bodyTemperatureDown';
    return null;
  }

  getBMIVideoKey(value: any) {
    if (value < 16) return 'Less than 16';
    if (value > 30) return 'Higher than 30';
    return null;
  }

  private triggerInstavansFromHealthCheckup(checkup: driverhealthcheckup): void {
    void this.instavansParkflowService
      .pushFromHealthCheckup(checkup)
      .catch((error: unknown) => {
        const message: string =
          error instanceof Error ? error.message : 'Unexpected error';
        this.logger.error(
          `Instavans health-checkup push failed for checkup=${checkup.id}: ${message}`,
        );
      });
  }

  /**
   * Re-pushes Instavans after a health-record edit using recalculated checkup or prescription status.
   */
  private triggerInstavansAfterHealthRecordEdit(
    checkup: driverhealthcheckup,
  ): void {
    this.logger.log(
      `Instavans retrigger started after health-record edit checkup=${checkup.id}`,
    );
    void this.executeInstavansAfterHealthRecordEdit(checkup).catch(
      (error: unknown) => {
        const message: string =
          error instanceof Error ? error.message : 'Unexpected error';
        this.logger.error(
          `Instavans retrigger failed after health-record edit checkup=${checkup.id}: ${message}`,
        );
      },
    );
  }

  private async executeInstavansAfterHealthRecordEdit(
    checkup: driverhealthcheckup,
  ): Promise<void> {
    const prescription: Prescription | null =
      await this.findPrescriptionForCheckupEdit(checkup);
    const checkupFitnessStatus: string = this.readCheckupFitnessStatus(checkup);
    const source: InstavansPushSourceAfterCheckupEdit =
      resolveInstavansPushSourceAfterCheckupEdit({
        checkupFitnessStatus,
        prescriptionFitnessStatus: prescription?.fitness_status,
      });
    this.logInstavansRetriggerDecision({
      checkupId: checkup.id,
      sourceKind: source.kind,
      checkupFitnessStatus,
      prescriptionId: prescription?.prescription_id,
      prescriptionFitnessStatus: prescription?.fitness_status,
    });
    if (source.kind === 'checkup') {
      await this.instavansParkflowService.pushFromHealthCheckup(checkup);
      this.logger.log(
        `Instavans retrigger completed after health-record edit checkup=${checkup.id} source=checkup`,
      );
      return;
    }
    if (source.kind === 'prescription' && prescription) {
      await this.instavansParkflowService.pushFromPrescription({
        prescription,
        checkup,
        driver: checkup.driver ?? null,
      });
      this.logger.log(
        `Instavans retrigger completed after health-record edit checkup=${checkup.id} source=prescription prescriptionId=${prescription.prescription_id}`,
      );
      return;
    }
    this.logger.log(
      `Instavans retrigger skipped after health-record edit checkup=${checkup.id}: no mappable status`,
    );
  }

  private logInstavansRetriggerDecision(params: {
    readonly checkupId: number;
    readonly sourceKind: string;
    readonly checkupFitnessStatus: string;
    readonly prescriptionId?: string;
    readonly prescriptionFitnessStatus?: string | null;
  }): void {
    this.logger.log(
      `Instavans retrigger decision checkup=${params.checkupId} source=${params.sourceKind} checkupFitnessStatus=${params.checkupFitnessStatus} prescriptionId=${params.prescriptionId ?? 'none'} prescriptionFitnessStatus=${params.prescriptionFitnessStatus ?? 'none'}`,
    );
  }

  private readCheckupFitnessStatus(checkup: driverhealthcheckup): string {
    const rawFitnessStatus: unknown = (
      checkup as unknown as Record<string, unknown>
    ).fitness_status;
    return typeof rawFitnessStatus === 'string' ? rawFitnessStatus.trim() : '';
  }

  private async findPrescriptionForCheckupEdit(
    checkup: driverhealthcheckup,
  ): Promise<Prescription | null> {
    const linkedPrescription: Prescription | null = await Prescription.findOne({
      where: { driver_health_checkup_id: checkup.id },
      order: [['updatedAt', 'DESC']],
    });
    if (linkedPrescription) {
      return linkedPrescription;
    }
    if (!checkup.driver_id) {
      return null;
    }
    return Prescription.findOne({
      where: { driver_id: checkup.driver_id },
      order: [['updatedAt', 'DESC']],
    });
  }

  async view(req, res) {
    try {
      const getData = await Workforcetype.findAll({
        where: { isActive: true },
        order: [['id', 'DESC']],
        raw: true,
        nest: true,
      });

      return sendSuccess(res, 200, getData, 'Success');
    } catch (error) {
      this.logger.error(error);
      return sendError(res, 500, error);
    }
  }
  async createHealthData(req, res) {
    let transaction: Transaction | null = null;
    try {
      const short_code = req.body.short_code;

      const cId = await GlobalHelper.getCenterId(req.userId);
      const patientType = req.body.patient_type || null;

      const vehicleNumber = req.body.vehicle_no;

      if (patientType === 'DR') {
        if (!vehicleNumber) {
          return sendError(res, 400, 'Vehicle number is required for drivers');
        }

        const vehicleNumberPattern = /^[A-Z]{2}.*\d{4}$/;
        if (!vehicleNumberPattern.test(vehicleNumber)) {
          return sendError(res, 400, 'Invalid vehicle number format');
        }
      }

      transaction = await this.sequelize.transaction();

      const insert = await driverhealthcheckup.create({
        user_id: req.userId,
        createdBy: cId.center_id,
        contactNumber: req.body.contactNumber || null,
        date_time: req.body.date_time,
        driver_id: req.body.driverId,
        patient_type: req.body.patient_type || null,
        transpoter: req.body.transpoter || null,
        verify_option: req.body.verify_option || null,
        accept_term_condition: true,
        signature: req.body.signature,
        doctor_id: req.body.doctor_id,
        vehicle_no: req.body.vehicle_no || null,
        is_submited: false,
        shipmentno: req.body.shipmentno || null,
        gateentryno: req.body.gateentryno || null,
      }, { transaction });

      const paddedInsertedId = insert.id.toString().padStart(5, '0');
      const uniqueId = `${short_code}${paddedInsertedId}`;

      await insert.update(
        {
          uniqueId,
          external_id: uniqueId,
        },
        { transaction },
      );

      await transaction.commit();

      return sendSuccess(
        res,
        201,
        insert,
        'Health Checkup Created successfully',
      );
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }
      return sendError(res, 500, error);
    }
  }

  /**
   * Vitals are stored on `driverhealthcheckups` root columns and/or inside
   * `selected_test`. Concern generation must see both (same sources as fitness).
   */
  private buildSelectedTestForConcerns(
    healthData: Record<string, any> | null | undefined,
  ): Record<string, any> | null {
    if (!healthData) {
      return null;
    }
    let raw = healthData.selected_test;
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw);
      } catch {
        raw = {};
      }
    }
    const base =
      raw && typeof raw === 'object' && !Array.isArray(raw) ? { ...raw } : {};

    const rootUnitKeys = [
      'spo2_unit',
      'temperature_unit',
      'pulse_unit',
      'blood_pressure_unit',
      'bmi_unit',
      'haemoglobin_unit',
      'random_blood_sugar_unit',
      'hearing_unit',
      'cholesterol_unit',
      'ecg_unit',
      'pulmonary_function_test_unit',
      'romberg_unit',
      'hiv_unit',
    ] as const;

    for (const key of rootUnitKeys) {
      const rootVal = healthData[key];
      if (rootVal == null) {
        continue;
      }
      if (base[key] != null) {
        continue;
      }
      if (typeof rootVal === 'string') {
        const t = rootVal.trim();
        if (t.startsWith('{') || t.startsWith('[')) {
          try {
            base[key] = JSON.parse(rootVal);
            continue;
          } catch {
            /* fall through */
          }
        }
      }
      base[key] = rootVal;
    }

    const alcoholRoot =
      healthData.alchol_test_unit ?? healthData.alcohol_unit ?? null;
    if (
      alcoholRoot != null &&
      base.alchol_test_unit == null &&
      base.alcohol_unit == null
    ) {
      base.alchol_test_unit = alcoholRoot;
    }

    if (healthData.vision_unit != null && base.vision_unit == null) {
      base.vision_unit = healthData.vision_unit;
    }

    return base;
  }

  async checkHealthData(healthData: any) {
    const concerns: any[] = [];

    const selectedTestMerged = this.buildSelectedTestForConcerns(healthData);
    if (
      !selectedTestMerged ||
      typeof selectedTestMerged !== 'object' ||
      Object.keys(selectedTestMerged).length === 0
    ) {
      return {
        concerns: [],
        summary: { totalConcerns: 0, moderateCount: 0, highCount: 0 },
      };
    }

    const assessments = getFitnessVitalAssessments(selectedTestMerged);
    let concernSequence = 0;
    for (const assessment of assessments) {
      if (assessment.band !== 'moderate' && assessment.band !== 'high') {
        continue;
      }
      const level = assessment.band === 'high' ? 'HIGH' : 'MODERATE';
      concerns.push({
        id: `${assessment.concernType.toLowerCase()}_${Date.now()}_${concernSequence++}`,
        type: assessment.concernType,
        level,
        parameter: assessment.parameter,
        value: assessment.value,
        threshold:
          assessment.thresholdLabel ??
          'Moderate/high band per fitness status criteria',
        recommendation:
          level === 'HIGH'
            ? 'MANDATORY Doctor Consultation'
            : 'Lifestyle Counselling / Doctor consultation',
      });
    }

    const summary = {
      totalConcerns: concerns.length,
      moderateCount: concerns.filter((c) => c.level === 'MODERATE').length,
      highCount: concerns.filter((c) => c.level === 'HIGH').length,
    };

    return { concerns, summary };
  }

  private async processConcernVideoWorkflow(
    id: number,
    concerns: any[],
    driverName: string,
    driverContactNumber: string,
  ) {
    try {
      const mergedVideoUrl = await this.makeVideos(concerns);
      await driverhealthcheckup.update(
        { concerns, concernvideo: mergedVideoUrl },
        { where: { id } },
      );

      const waPhone = this.normalizeDriverPhoneForWhatsApp(driverContactNumber);
      if (mergedVideoUrl && waPhone) {
        const waResult = await WhatsAppHelper.sendAiConcernVideoMessage(
          driverName || 'Driver',
          mergedVideoUrl,
          waPhone,
        );
        this.logger.log(
          `Concern video WhatsApp sent checkup=${id} twilio_sid=${waResult.sid}`,
        );
      } else {
        this.logger.warn(
          `Skipping concern WhatsApp checkup=${id}: mergedVideoUrl=${!!mergedVideoUrl} waPhone=${waPhone ?? 'invalid'}`,
        );
      }

      const command = new PutRecordCommand({
        StreamName: STREAM_NAME,
        Data: Buffer.from(
          JSON.stringify({
            id,
            name: driverName,
            number: driverContactNumber,
            concerns,
          }),
        ),
        PartitionKey: String(id),
      });

      await kinesisClient.send(command);
    } catch (error: any) {
      this.logger.error(
        `Concern video workflow failed checkup=${id}: ${error?.message}`,
        error?.stack,
      );
    }
  }

  /**
   * Returns 10-digit mobile for India; {@link WhatsAppHelper.sendAiConcernVideoMessage} prepends +91.
   */
  private normalizeDriverPhoneForWhatsApp(
    phone: string | null | undefined,
  ): string | null {
    if (phone == null || typeof phone !== 'string') {
      return null;
    }
    const digits = phone.replace(/\D/g, '');
    if (!digits) {
      return null;
    }
    if (digits.length === 10) {
      return digits;
    }
    if (digits.length === 12 && digits.startsWith('91')) {
      return digits.slice(2);
    }
    if (digits.length === 11 && digits.startsWith('0')) {
      return digits.slice(1);
    }
    if (digits.length > 10) {
      return digits.slice(-10);
    }
    return null;
  }

  async analyzeAllHealthCheckups(req, res) {
    try {
      const healthCheckups = await driverhealthcheckup.findAll();

      let updated = 0;
      let errors = 0;

      for (const healthCheckup of healthCheckups) {
        try {
          const analysisResult = await this.checkHealthData(healthCheckup);

          await healthCheckup.update({
            concerns: analysisResult?.concerns,
            updatedAt: new Date(),
          });

          updated++;
        } catch (error) {
          this.logger.error(
            `Error analyzing health checkup ${healthCheckup.id}:`,
            error,
          );
          errors++;
        }
      }
      return sendSuccess(
        res,
        201,
        { updated, errors },
        'Health Checkup Concerns Updated successfully',
      );
    } catch (error) {
      return sendError(res, 500, error);
    }
  }

  async getHealthCheckupConcerns(req, res) {
    try {
      const healthCheckup = await driverhealthcheckup.findOne({
        where: { id: req.body.id },
      });

      return sendSuccess(
        res,
        200,
        healthCheckup?.concerns || [],
        'Health Checkup Concerns',
      );
    } catch (error) {
      return sendError(res, 500, error);
    }
  }

  private async sendDataToCpiWithFetch(payload: any): Promise<any> {
    const { url, user: username, password } = healthCheckupCpiConfig;

    if (!url || !username || !password) {
      throw new Error('Missing health checkup CPI configuration in environment');
    }

    // Create Basic Auth Base64 token
    const credentials = Buffer.from(`${username}:${password}`).toString(
      'base64',
    );

    try {
      this.logger.log(`[CPI_FETCH] Calling CPI API: ${url}`);
      this.logger.log(
        `[CPI_FETCH] Payload: ${JSON.stringify(payload ?? {})}`,
      );

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${credentials}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `[CPI_FETCH] Non-2xx response. status=${response.status}, statusText=${response.statusText}, body=${errorText}`,
        );
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`,
        );
      }

      let responseBodyForLog = '';
      try {
        responseBodyForLog = await response.clone().text();
      } catch (parseError) {
        responseBodyForLog = '[unavailable]';
      }
      this.logger.log(
        `[CPI_FETCH] CPI API success. status=${response.status}, statusText=${response.statusText}, body=${responseBodyForLog}`,
      );

      return await response;
    } catch (error) {
      this.logger.error(
        `[CPI_FETCH] CPI API call failed. endpoint=${url}, payload=${JSON.stringify(payload ?? {})}, reason=${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
  

  async calculateTotalPackagePrice(
    packageIds: string[],
    centerId?: string,
  ): Promise<string> {
    if (!packageIds || packageIds.length === 0) {
      this.logger.log(
        '[CPI_AMOUNT] Skipping price lookup: packageIds missing or empty',
      );
      return 'N/A';
    }

    if (!centerId) {
      this.logger.log(
        '[CPI_AMOUNT] Skipping price lookup: center_id is mandatory',
      );
      return 'N/A';
    }

    if (packageIds.length > 1) {
      this.logger.log(
        `[CPI_AMOUNT] Multiple package ids received (${packageIds.join(', ')}); using first package id only`,
      );
    }

    const selectedPackageId = String(packageIds[0]).trim();
    const numericPackageId: number = Number(selectedPackageId);
    if (Number.isNaN(numericPackageId)) {
      this.logger.log(
        `[CPI_AMOUNT] Invalid package id '${selectedPackageId}': non-numeric value`,
      );
      return 'N/A';
    }

    const matchedPackages = await Centerpackage.findAll({
      where: {
        package_id: numericPackageId,
        center_id: centerId,
        status: true,
      },
      attributes: ['id', 'package_id', 'package_price', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 2,
    });

    if (!matchedPackages.length) {
      this.logger.log(
        `[CPI_AMOUNT] No active package found for package_id=${numericPackageId} center_id=${centerId}`,
      );
      return 'N/A';
    }

    if (matchedPackages.length > 1) {
      this.logger.log(
        `[CPI_AMOUNT] Duplicate active rows found for package_id=${numericPackageId} center_id=${centerId}; selecting latest by createdAt`,
      );
    }

    const price = parseFloat(matchedPackages[0].package_price) || 0;
    return price.toString();
  }

  private parseNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const parsedValue = Number(value);
    return Number.isNaN(parsedValue) ? null : parsedValue;
  }

  private parseInteger(value: any): number | null {
    const parsedValue = this.parseNumber(value);
    return parsedValue === null ? null : Math.trunc(parsedValue);
  }

  private parseSelectedTestObject(selectedTest: unknown): Record<string, any> {
    if (!selectedTest) {
      return {};
    }

    if (typeof selectedTest === 'string') {
      try {
        const parsed = JSON.parse(selectedTest);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed as Record<string, any>;
        }
      } catch {
        return {};
      }
      return {};
    }

    if (typeof selectedTest === 'object' && !Array.isArray(selectedTest)) {
      return selectedTest as Record<string, any>;
    }

    return {};
  }

  private parseBoolean(value: any): boolean | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      const normalizedValue = value.trim().toLowerCase();
      if (normalizedValue === 'true') {
        return true;
      }
      if (normalizedValue === 'false') {
        return false;
      }
    }
    return null;
  }

  private async upsertTestByHealthCheckup(
    model: any,
    data: Record<string, any>,
    transaction: Transaction,
  ): Promise<'created' | 'updated'> {
    const existingRow = await model.findOne({
      where: { health_checkup_id: data.health_checkup_id },
      transaction,
    });
    if (existingRow) {
      await existingRow.update(data, { transaction });
      return 'updated';
    }
    await model.create(data, { transaction });
    return 'created';
  }

  private async syncSelectedTestsToDedicatedTables(
    healthCheckupId: number,
    selectedTest: any,
  ): Promise<Record<string, 'created' | 'updated'>> {
    const transaction = await this.sequelize.transaction();
    try {
      const selected = selectedTest ?? {};
      const dbChangeSummary: Record<string, 'created' | 'updated'> = {};
      if (selected.spo2_unit) {
        dbChangeSummary.spo2_tests = await this.upsertTestByHealthCheckup(
          Spo2Test,
          {
            health_checkup_id: healthCheckupId,
            value: this.parseNumber(selected.spo2_unit?.value),
            units: selected.spo2_unit?.units || '%',
            status: selected.spo2_unit?.status || null,
            remark: selected.spo2_unit?.remark || null,
          },
          transaction,
        );
      } else {
        this.logger.log(`[STEP2][DB] skipped spo2_tests for checkup=${healthCheckupId}`);
      }
      if (selected.blood_pressure_unit) {
        dbChangeSummary.blood_pressure_tests = await this.upsertTestByHealthCheckup(
          BloodPressureTest,
          {
            health_checkup_id: healthCheckupId,
            systolic_value: this.parseInteger(
              selected.blood_pressure_unit?.systolic_bp_unit?.value,
            ),
            diastolic_value: this.parseInteger(
              selected.blood_pressure_unit?.diastolic_bp_unit?.value,
            ),
            units:
              selected.blood_pressure_unit?.systolic_bp_unit?.units || 'mm Hg',
            systolic_status:
              selected.blood_pressure_unit?.systolic_bp_unit?.status || null,
            diastolic_status:
              selected.blood_pressure_unit?.diastolic_bp_unit?.status || null,
            systolic_remark:
              selected.blood_pressure_unit?.systolic_bp_unit?.remark || null,
            diastolic_remark:
              selected.blood_pressure_unit?.diastolic_bp_unit?.remark || null,
          },
          transaction,
        );
      }
      if (selected.temperature_unit) {
        dbChangeSummary.temperature_tests = await this.upsertTestByHealthCheckup(
          TemperatureTest,
          {
            health_checkup_id: healthCheckupId,
            value: this.parseNumber(selected.temperature_unit?.value),
            units: selected.temperature_unit?.units || 'F',
            status: selected.temperature_unit?.status || null,
            remark: selected.temperature_unit?.remark || null,
          },
          transaction,
        );
      }
      if (selected.pulse_unit) {
        dbChangeSummary.pulse_tests = await this.upsertTestByHealthCheckup(
          PulseTest,
          {
            health_checkup_id: healthCheckupId,
            value: this.parseInteger(selected.pulse_unit?.value),
            units: selected.pulse_unit?.units || 'bpm',
            status: selected.pulse_unit?.status || null,
            remark: selected.pulse_unit?.remark || null,
          },
          transaction,
        );
      }
      if (selected.bmi_unit) {
        dbChangeSummary.bmi_tests = await this.upsertTestByHealthCheckup(
          BmiTest,
          {
            health_checkup_id: healthCheckupId,
            value: this.parseNumber(selected.bmi_unit?.value),
            units: selected.bmi_unit?.units || 'kg/m2',
            status: selected.bmi_unit?.status || null,
            remark: selected.bmi_unit?.remark || null,
            height: this.parseNumber(selected.bmi_unit?.height),
            weight: this.parseNumber(selected.bmi_unit?.weight),
          },
          transaction,
        );
      }
      if (selected.random_blood_sugar_unit) {
        dbChangeSummary.random_blood_sugar_tests = await this.upsertTestByHealthCheckup(
          RandomBloodSugarTest,
          {
            health_checkup_id: healthCheckupId,
            value: this.parseInteger(selected.random_blood_sugar_unit?.value),
            units: selected.random_blood_sugar_unit?.units || 'mg/dl',
            status: selected.random_blood_sugar_unit?.status || null,
            remark: selected.random_blood_sugar_unit?.remark || null,
          },
          transaction,
        );
      }
      if (selected.haemoglobin_unit) {
        dbChangeSummary.haemoglobin_tests = await this.upsertTestByHealthCheckup(
          HaemoglobinTest,
          {
            health_checkup_id: healthCheckupId,
            value: this.parseInteger(selected.haemoglobin_unit?.value),
            units: selected.haemoglobin_unit?.units || 'g/dl',
            status: selected.haemoglobin_unit?.status || null,
            remark: selected.haemoglobin_unit?.remark || null,
          },
          transaction,
        );
      }
      const alcoholUnit = selected.alchol_test_unit ?? selected.alcohol_unit;
      if (alcoholUnit) {
        dbChangeSummary.alcohol_tests = await this.upsertTestByHealthCheckup(
          AlcoholTest,
          {
            health_checkup_id: healthCheckupId,
            value:
              alcoholUnit?.value !== undefined &&
              alcoholUnit?.value !== null &&
              alcoholUnit?.value !== ''
                ? String(alcoholUnit?.value)
                : null,
            units: alcoholUnit?.units || 'mg/ml',
            status: alcoholUnit?.status || null,
            remark: alcoholUnit?.remark || null,
          },
          transaction,
        );
      }
      if (selected.ecg_unit) {
        dbChangeSummary.ecg_tests = await this.upsertTestByHealthCheckup(
          EcgTest,
          {
            health_checkup_id: healthCheckupId,
            value: selected.ecg_unit?.value || null,
            status: selected.ecg_unit?.status || null,
            remark: selected.ecg_unit?.remark || null,
          },
          transaction,
        );
      }
      if (selected.vision_unit) {
        dbChangeSummary.vision_tests = await this.upsertTestByHealthCheckup(
          VisionTest,
          {
            health_checkup_id: healthCheckupId,
            value: selected.vision_unit?.value || null,
            left_eye_value:
              selected.vision_unit?.left_eye_value ??
              selected.vision_unit?.left_eye?.value ??
              null,
            right_eye_value:
              selected.vision_unit?.right_eye_value ??
              selected.vision_unit?.right_eye?.value ??
              null,
            left_eye_remark:
              selected.vision_unit?.left_eye_remark ??
              selected.vision_unit?.left_eye?.remark ??
              null,
            right_eye_remark:
              selected.vision_unit?.right_eye_remark ??
              selected.vision_unit?.right_eye?.remark ??
              null,
            is_wearing_specs: this.parseBoolean(
              selected.vision_unit?.is_wearing_specs ??
                selected.vision_unit?.isWearingSpecs,
            ),
            status: selected.vision_unit?.status || null,
            remark: selected.vision_unit?.remark || null,
          },
          transaction,
        );
      }
      if (selected.romberg_unit) {
        dbChangeSummary.romberg_tests = await this.upsertTestByHealthCheckup(
          RombergTest,
          {
            health_checkup_id: healthCheckupId,
            value: selected.romberg_unit?.value || null,
            status: selected.romberg_unit?.status || null,
            remark: selected.romberg_unit?.remark || null,
          },
          transaction,
        );
      }
      if (selected.pulmonary_function_test_unit) {
        dbChangeSummary.pulmonary_function_tests =
          await this.upsertTestByHealthCheckup(
            PulmonaryFunctionTest,
            {
              health_checkup_id: healthCheckupId,
              value: this.parseInteger(
                selected.pulmonary_function_test_unit?.value,
              ),
              units: selected.pulmonary_function_test_unit?.units || 'L/min',
              status: selected.pulmonary_function_test_unit?.status || null,
              remark: selected.pulmonary_function_test_unit?.remark || null,
            },
            transaction,
          );
      }
      if (selected.hiv_unit) {
        dbChangeSummary.hiv_tests = await this.upsertTestByHealthCheckup(
          HivTest,
          {
            health_checkup_id: healthCheckupId,
            value: selected.hiv_unit?.value || null,
            status: selected.hiv_unit?.status || null,
            remark: selected.hiv_unit?.remark || null,
          },
          transaction,
        );
      }
      if (selected.eye_unit) {
        dbChangeSummary.eye_tests = await this.upsertTestByHealthCheckup(
            EyeTest,
            {
              health_checkup_id: healthCheckupId,
              spherical_right_eye: this.parseNumber(
                selected.eye_unit?.spherical_right_eye_unit?.value,
              ),
              spherical_left_eye: this.parseNumber(
                selected.eye_unit?.spherical_left_eye_unit?.value,
              ),
              cylindrical_right_eye: this.parseNumber(
                selected.eye_unit?.cylindrical_right_eye_unit?.value,
              ),
              cylindrical_left_eye: this.parseNumber(
                selected.eye_unit?.cylindrical_left_eye_unit?.value,
              ),
              colour_blindness:
                selected.eye_unit?.colour_blindness_unit?.value || null,
              units:
                selected.eye_unit?.spherical_right_eye_unit?.units || 'D',
              spherical_right_status:
                selected.eye_unit?.spherical_right_eye_unit?.status || null,
              spherical_left_status:
                selected.eye_unit?.spherical_left_eye_unit?.status || null,
              cylindrical_right_status:
                selected.eye_unit?.cylindrical_right_eye_unit?.status || null,
              cylindrical_left_status:
                selected.eye_unit?.cylindrical_left_eye_unit?.status || null,
              colour_blindness_status:
                selected.eye_unit?.colour_blindness_unit?.status || null,
              remark: selected.eye_unit?.remark || null,
            },
            transaction,
        );
      }
      this.logger.log(
        `[STEP2][DB] dedicated tables sync for checkup=${healthCheckupId}: ${JSON.stringify(dbChangeSummary)}`,
      );
      await transaction.commit();

      if (selected?.mobilab_tests) {
        await this.labResultService.syncMobilabTestsToTables(
          healthCheckupId,
          selected,
        );
        this.logger.log(
          `[STEP2][DB] mobilab_tests synced to lab tables for checkup=${healthCheckupId}`,
        );
      }

      return dbChangeSummary;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  
  async createHealthDataStep2(req, res) {
    if (!req.body.last_insert_id) {
      sendError(res, 400, 'last_insert_id is required');
      return;
    }

    if (!req.body.selected_test) {
      sendError(res, 400, 'selected_test is required');
      return;
    }

    const id = req.body.last_insert_id;

    try {
      const existingCheckup = await driverhealthcheckup.findByPk(id, {
        attributes: ['id', 'confirm_report', 'report_confirmed_at'],
      });
      if (!existingCheckup) {
        return sendError(res, 404, 'Health Data not found');
      }

      let normalizedPackageList = [];
      let derivedPackageNames = [];
      const requestSelectedPackageNames = Array.isArray(
        req.body.selected_package_name,
      )
        ? req.body.selected_package_name
        : typeof req.body.selected_package_name === 'string'
          ? req.body.selected_package_name
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean)
          : [];
      const hasLabTestPackage = requestSelectedPackageNames.some(
        (packageName) => String(packageName).toUpperCase() === 'LAB TEST',
      );
      const hasRetestPackage = requestSelectedPackageNames.some(
        (packageName) => String(packageName).toUpperCase() === 'RETEST',
      );
      if (hasLabTestPackage || hasRetestPackage) {
        derivedPackageNames = hasLabTestPackage ? ['LAB TEST'] : ['RETEST'];
        if (req.body.package_list) {
          const rawPackageList = Array.isArray(req.body.package_list)
            ? req.body.package_list
            : typeof req.body.package_list === 'string'
              ? req.body.package_list
                  .split(',')
                  .map((item) => item.trim())
                  .filter(Boolean)
              : [];
          normalizedPackageList = rawPackageList.map((id) => String(id));
        }
      }

      if (req.body.package_list && !hasLabTestPackage && !hasRetestPackage) {
        const rawPackageList = Array.isArray(req.body.package_list)
          ? req.body.package_list
          : typeof req.body.package_list === 'string'
            ? req.body.package_list
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean)
            : [];

        if (!rawPackageList.length) {
          sendError(
            res,
            400,
            'package_list must contain at least one package id',
          );
          return;
        }

        const numericPackageIds = rawPackageList
          .map((id) => parseInt(id, 10))
          .filter((id) => !isNaN(id));

        const packageQueryConditions = [];

        if (numericPackageIds.length) {
          packageQueryConditions.push({ id: { [Op.in]: numericPackageIds } });
        }

        if (rawPackageList.length) {
          packageQueryConditions.push({
            package_id: { [Op.in]: rawPackageList },
          });
        }

        const packages = await Packagemanagment.findAll({
          where:
            packageQueryConditions.length === 1
              ? packageQueryConditions[0]
              : { [Op.or]: packageQueryConditions },
          attributes: ['id', 'package_id', 'package_name'],
          raw: true,
        });

        const packageNameMap = {};
        packages.forEach((pkg) => {
          packageNameMap[String(pkg.id)] = pkg.package_name;
          if (pkg.package_id) {
            packageNameMap[String(pkg.package_id)] = pkg.package_name;
          }
        });

        const missingPackageIds = [];
        derivedPackageNames = rawPackageList.map((pkgId) => {
          const key =
            packageNameMap[pkgId] !== undefined
              ? pkgId
              : String(parseInt(pkgId, 10));
          const resolvedName = packageNameMap[key];
          if (resolvedName === undefined) {
            missingPackageIds.push(pkgId);
          }
          return resolvedName;
        });

        if (missingPackageIds.length) {
          sendError(
            res,
            400,
            `package_list contains invalid package ids: ${missingPackageIds.join(', ')}`,
          );
          return;
        }

        normalizedPackageList = rawPackageList.map((id) => String(id));
      }

      const selectedTestPayload =
        typeof req.body.selected_test === 'string'
          ? JSON.parse(req.body.selected_test)
          : req.body.selected_test;
      if (selectedTestPayload?.mobilab_tests) {
        selectedTestPayload.mobilab_tests = enrichMobilabTests(
          selectedTestPayload.mobilab_tests,
        );
      }
      const fitnessStatus = calculateFitnessStatus({
        selectedTest: selectedTestPayload,
        referenceDate: req.body.date_time ?? new Date(),
      });

      const nextConfirmReport = req.body.confirm_report;
      const reportConfirmedAt = resolveReportConfirmedAtForUpdate({
        existingConfirmReport: existingCheckup.confirm_report,
        existingReportConfirmedAt: existingCheckup.report_confirmed_at,
        nextConfirmReport,
      });

      const data: Record<string, unknown> = {
        doctor_id: req.body.doctor_id,
        bmi_unit: req.body.bmi_unit || null,
        haemoglobin_unit: req.body.haemoglobin_unit || null,
        package_list: normalizedPackageList,
        selected_package_name: derivedPackageNames,
        selected_package_list: Array.isArray(req.body.selected_package_list)
          ? req.body.selected_package_list
          : [],
        spo2_unit: req.body.spo2_unit || null,
        temperature_unit: req.body.temperature_unit || null,
        date_time: req.body.date_time,
        random_blood_sugar_unit: req.body.random_blood_sugar_unit || null,
        hearing_unit: req.body.hearing_unit || null,
        cholesterol_unit: req.body.cholesterol_unit || null,
        blood_pressure_unit: req.body.blood_pressure_unit || null,
        ecg_unit: req.body.ecg_unit || null,
        accept_term_condition: true,
        selected_test: selectedTestPayload,
        fitness_status: fitnessStatus,
        is_submited: true,
        vehicle_no: req.body.vehicle_no,
        confirm_report: nextConfirmReport,
      };

      if (reportConfirmedAt) {
        data.report_confirmed_at = reportConfirmedAt;
      }

      const isAdminCaller = Boolean(req.isAdminCaller);
      const mainUpdateResult = isAdminCaller
        ? await updateDriverHealthCheckupAsAdmin({ id }, data)
        : await driverhealthcheckup.update(data, {
            where: { id },
          });
      this.logger.log(
        `[STEP2][DB] updated driverhealthcheckups for checkup=${id}, affected_rows=${mainUpdateResult?.[0] ?? 0}`,
      );
      const testTableChanges = await this.syncSelectedTestsToDedicatedTables(
        id,
        selectedTestPayload,
      );
      this.logger.log(
        `[STEP2][DB] completed step-2 persistence for checkup=${id}, test_table_changes=${JSON.stringify(testTableChanges)}`,
      );

      const trfNumber = req.body.trf_number?.trim();

      if (trfNumber) {
        try {
          const campItem = await CampListItem.findOne({
            where: { trf_number: trfNumber },
          });

          if (!campItem) {
            return sendError(
              res,
              404,
              `No patient found with TRF: ${trfNumber}`,
            );
          }

          await campItem.update({
            driver_health_checkup_id: id,
          });

          await campItem.reload();
        } catch (error) {
          this.logger.error('Error linking health checkup:', error);
          return sendError(res, 500, 'Failed to link health checkup');
        }
      }

      const getData = await driverhealthcheckup.findOne({
        include: [
          {
            model: DRIVERMASTER,
            as: 'driver',
          },
        ],
        where: { id: id },
      });
      const healthCheckResult = await this.checkHealthData(getData);
      const isReportConfirmed =
        String(req.body.confirm_report || '').trim().toLowerCase() === 'yes';
      if (
        isReportConfirmed &&
        healthCheckResult.concerns &&
        Array.isArray(healthCheckResult.concerns) &&
        healthCheckResult.concerns.length > 0
      ) {
        setImmediate(() => {
          void this.processConcernVideoWorkflow(
            id,
            healthCheckResult.concerns,
            getData.driver?.name ?? 'Driver',
            getData.driver?.contactNumber ?? '',
          );
        });
      } else if (!isReportConfirmed) {
        this.logger.log(
          `Skipping concerns/video for checkup=${id}: confirm_report is not yes`,
        );
      } else {
        this.logger.log('No concerns found for health checkup');
      }

      const response = {
        ...getData.toJSON(),
        healthAnalysis: healthCheckResult,
      };

      const shipmentno_cpi = getData.shipmentno;
      const centerIdFromDb = getData?.createdBy;
      const normalizedCenterId = centerIdFromDb
        ? String(centerIdFromDb).trim()
        : undefined;
      this.logger.log(
        `[CPI_AMOUNT] center_id resolved as '${normalizedCenterId ?? 'N/A'}'`,
      );
      const amount = await this.calculateTotalPackagePrice(
        normalizedPackageList,
        normalizedCenterId || undefined,
      );
      const CheckupDate = new Date().toLocaleDateString('en-GB').replace(/\//g, '.');
      const CheckupTime = new Date().toLocaleTimeString('en-GB', { hour12: false });
      this.logger.log("Shipment Number" , shipmentno_cpi);
      this.logger.log("amount for cpi " , amount);
      const isValidShipmentNumber = shipmentno_cpi && 
          shipmentno_cpi.trim() !== '' && 
          shipmentno_cpi !== "NA" && 
          shipmentno_cpi !== "null" && 
          shipmentno_cpi !== "N/A" && 
          shipmentno_cpi !== "na" &&  
          shipmentno_cpi !== "undefined" ; 
      
      
      const isValidAmountForCpi =
        typeof amount === 'string' &&
        amount.trim() !== '' &&
        amount.trim().toUpperCase() !== 'N/A';

      const currentConfirmReport = String(getData.confirm_report || '')
        .trim()
        .toLowerCase();
      const isCurrentReportReady = currentConfirmReport === 'yes';

      const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
      const DAY_IN_MS = 24 * 60 * 60 * 1000;
      const referenceUpdatedAt = getData.updatedAt
        ? new Date(getData.updatedAt)
        : new Date();
      const referenceIst = new Date(referenceUpdatedAt.getTime() + IST_OFFSET_MS);
      const istDayStartCandidateUtcMs =
        Date.UTC(
          referenceIst.getUTCFullYear(),
          referenceIst.getUTCMonth(),
          referenceIst.getUTCDate(),
          6,
          0,
          0,
          0,
        ) - IST_OFFSET_MS;
      const istDayStartUtcMs =
        referenceIst.getUTCHours() < 6
          ? istDayStartCandidateUtcMs - DAY_IN_MS
          : istDayStartCandidateUtcMs;
      const istDayEndUtcMs = istDayStartUtcMs + DAY_IN_MS - 1;
      const istDayStartUtc = new Date(istDayStartUtcMs);
      const istDayEndUtc = new Date(istDayEndUtcMs);

      const getSameDayShipmentRows = async () => {
        if (!isValidShipmentNumber) {
          return [];
        }

        return driverhealthcheckup.findAll({
          where: {
            shipmentno: shipmentno_cpi,
            updatedAt: {
              [Op.between]: [istDayStartUtc, istDayEndUtc],
            },
            id: {
              [Op.ne]: id,
            },
          },
          attributes: ['id', 'confirm_report', 'updatedAt'],
          raw: true,
        });
      };

      const shouldSkipCpi = async () => {
        const sameDayShipmentRows = await getSameDayShipmentRows();
        if (!isCurrentReportReady) {
          return {
            skip: true,
            reason: 'current report is not ready (confirm_report!=yes)',
          };
        }

        const readyRows = sameDayShipmentRows.filter(
          (row: any) =>
            String(row.confirm_report || '').trim().toLowerCase() === 'yes',
        );
        const readyRecordIds = readyRows.map((row: any) => row.id).join(', ');
        const hasReadyEntry = sameDayShipmentRows.some(
          (row: any) =>
            String(row.confirm_report || '').trim().toLowerCase() === 'yes',
        );
        if (hasReadyEntry) {
          return {
            skip: true,
            reason:
              `shipment already sent for today from record id(s): ${readyRecordIds}`,
          };
        }

        return { skip: false, reason: '' };
      };

      // Check if shipment number and amount are valid for CPI
      if (isValidShipmentNumber && isValidAmountForCpi) {
        const firstGateCheck = await shouldSkipCpi();
        if (firstGateCheck.skip) {
          this.logger.log(
            `[CPI] Skipping CPI call for shipment '${shipmentno_cpi}': ${firstGateCheck.reason}. updatedAt IST day window (UTC): ${istDayStartUtc.toISOString()} to ${istDayEndUtc.toISOString()}`,
          );
        } else {
          const secondGateCheck = await shouldSkipCpi();
          if (secondGateCheck.skip) {
            this.logger.log(
              `[CPI] Skipping CPI call after final recheck for shipment '${shipmentno_cpi}': ${secondGateCheck.reason}. updatedAt IST day window (UTC): ${istDayStartUtc.toISOString()} to ${istDayEndUtc.toISOString()}`,
            );
          } else {
            this.logger.log("Making CPI call with valid shipment number", shipmentno_cpi);
            const dex = parseFloat(amount).toFixed(2);
            const cpiPayload = {
              FoNumber: shipmentno_cpi,
              Amount: dex,
              CheckupDate: CheckupDate,
              CheckupTime: CheckupTime,
            };
            try {
              let outcpi = await this.sendDataToCpiWithFetch(cpiPayload);
              if (outcpi.status == 200){
                  if (req.isAdminCaller) {
                    await updateDriverHealthCheckupAsAdmin(
                      { id },
                      { cpi_status: true },
                    );
                  } else {
                    await driverhealthcheckup.update(
                      {
                        cpi_status: true,
                      },
                      {
                        where: {
                          id: id,
                        },
                      },
                    );
                  }
              }
            } catch (cpiError) {
              throw cpiError;
            }
          }
        }
      } else {
        if (!isValidShipmentNumber) {
          this.logger.log(
            `[CPI] Skipping CPI call: invalid shipment number '${shipmentno_cpi}'`,
          );
        }
        if (!isValidAmountForCpi) {
          this.logger.log(
            `[CPI] Skipping CPI call: invalid amount '${amount}' (expected numeric value, received N/A/blank)`,
          );
        }
      }

      if (
        healthCheckResult?.concerns &&
        Array.isArray(healthCheckResult.concerns) &&
        typeof getData.setDataValue === 'function'
      ) {
        getData.setDataValue('concerns', healthCheckResult.concerns);
      }
      this.triggerInstavansFromHealthCheckup(getData);

      return sendSuccess(
        res,
        201,
        response,
        'Health Checkup Created successfully',
      );
    } catch (error) {
      return sendError(res, 500, error);
    }
  }

  async viewHealthData(req, res) {
    if (req.isTestAccount) {
      return this.denyTestAccountAccess(res);
    }

    try {
      const result = await this.healthListService.viewHealthData(req.body);
      const records = result?.data?.records ?? [];
      const pagination = result?.data?.pagination;

      const plains = records as Array<{
        center?: { project_name?: string };
        CETMANAGEMENT?: Record<string, unknown> | null;
        [key: string]: unknown;
      }>;

      const responseData = plains.map((plain) => ({
        ...plain,
        center_name: plain.center?.project_name ?? null,
      }));

      return sendSuccess(
        res,
        200,
        pagination ? { records: responseData, pagination } : responseData,
        result.message || 'List of driver health checkup',
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        return sendError(res, 400, error.message);
      }
      return sendError(res, 500, error);
    }
  }

  async detailsHealthData(req, res) {
    if (req.isTestAccount) {
      return this.denyTestAccountAccess(res);
    }

    const { id } = req.body;

    if (!id) {
      sendError(res, 400, 'Id is required');
      return;
    }

    try {
      const drivers = await driverhealthcheckup.findOne({
        where: { id },
        include: [
          {
            model: DRIVERMASTER,
            as: 'driver',
          },
        ],
        order: [['id', 'DESC']],
      });

      return sendSuccess(res, 200, drivers, 'List of driver health checkup');
    } catch (error) {
      return sendError(res, 500, error);
    }
  }

  async updateHealthDataById(req, res) {
    const id = req.body.id;

    try {
      const existingHealthCheckup = await driverhealthcheckup.findOne({
        where: { id },
        raw: true,
      });
      if (!existingHealthCheckup) {
        sendError(res, 404, 'Health Data not found');
        return;
      }
      const incomingSelectedTest =
        typeof req.body.selected_test === 'string'
          ? JSON.parse(req.body.selected_test)
          : req.body.selected_test;
      if (incomingSelectedTest?.mobilab_tests) {
        incomingSelectedTest.mobilab_tests = enrichMobilabTests(
          incomingSelectedTest.mobilab_tests,
        );
      }
      const selectedTestForFitness =
        incomingSelectedTest ?? existingHealthCheckup.selected_test ?? null;
      const fitnessStatus = calculateFitnessStatus({
        selectedTest: selectedTestForFitness,
        referenceDate:
          req.body.date_time ?? existingHealthCheckup.date_time ?? new Date(),
      });
      const [updatedRowsCount, updatedRows = 0] =
        await driverhealthcheckup.update(
          {
            driver_id: req.body.driver_id,
            package_and_test_history: req.body.package_and_test_history,
            driver_details: req.body.driver_details,
            transpoter: req.body.transpoter,
            driver_type: req.body.driver_type,
            date_time: req.body.date_time,
            spo2_unit: req.body.spo2_unit,
            temperature_unit: req.body.temperature_unit,
            pulse_unit: req.body.pulse_unit,
            package_list: req.body.package_list,
            selected_test:
              incomingSelectedTest ?? existingHealthCheckup.selected_test,
            fitness_status: fitnessStatus,
          },
          { where: { id } },
        );

      if (updatedRowsCount > 0) {
        const updatedCheckup = await driverhealthcheckup.findOne({
          where: { id },
          include: [
            {
              model: DRIVERMASTER,
              as: 'driver',
            },
          ],
        });
        if (updatedCheckup) {
          this.triggerInstavansAfterHealthRecordEdit(updatedCheckup);
        }
        return sendSuccess(
          res,
          200,
          updatedRows,
          'Health Data updated successfully',
        );
      } else {
        sendError(res, 404, 'Health Data not found');
        return;
      }
    } catch (error) {
      return sendError(res, 500, error);
    }
  }

  async driverHealthHistory(req, res) {
    if (req.isTestAccount) {
      return this.denyTestAccountAccess(res);
    }

    const { id } = req.body;

    if (!id) {
      sendError(res, 400, 'Id is required');
      return;
    }

    try {
      const drivers = await driverhealthcheckup.findAll({
        where: {
          driver_id: id,
          confirm_report: 'yes',
          is_submited: true,
        },
        include: [
          {
            model: DRIVERMASTER,
            as: 'driver',
          },
          {
            model: Center,
            as: 'center',
          },
        ],
        order: [['id', 'DESC']],
        raw: true,
        nest: true,
      });
      const suggestedPackages = await this.getSuggestedPackage(id);
      return sendSuccess(
        res,
        200,
        { drivers, suggestedPackages },
        'List of driver health history',
      );
    } catch (error) {
      return sendError(res, 500, error);
    }
  }
  async driverDoctorList(req, res) {
    try {
      const doctors = await Doctor.findAll({
        include: [
          {
            model: User,
            where: { status: true },
            as: 'user', // Must match association alias
            attributes: ['id', 'username', 'status', 'phone'],
          },
        ],
      });

      return sendSuccess(res, 200, doctors, 'Success');
    } catch (error) {
      return sendError(res, 500, error);
    }
  }

  /**
   * Same record assembly as {@link driverHealthReportDownload} without HTTP.
   * Used for in-process PDF generation (avoids misconfigured LMC_AuthBackend_URL / HTTP 404).
   */
  async getDriverHealthReportDownloadPayload(healthCheckupId: number): Promise<{
    drivers: any;
    metaData: any;
    centerMetaData: any;
    packageMetaData: { getPackageData: any[] };
  } | null> {
    if (!healthCheckupId) {
      return null;
    }
    try {
      const helthData = await driverhealthcheckup.findOne({
        where: { id: healthCheckupId },
        raw: true,
        nest: true,
      });

      if (!helthData) {
        return null;
      }

      const centerUserId = helthData.createdBy;
      const packageList = helthData.package_list;

      const userData = await User.findOne({
        where: { id: centerUserId },
        attributes: [
          'username',
          'name',
          'email',
          'phone',
          'status',
          'external_id',
        ],
        raw: true,
        nest: true,
      });

      const getCenterUser = await CenterUser.findOne({
        where: { user_id: helthData.user_id },
        raw: true,
        nest: true,
      });

      if (!getCenterUser) {
        return null;
      }

      const getCenterUserData = await Center.findOne({
        where: { id: getCenterUser.center_id },
        raw: true,
        nest: true,
      });

      const getPackageData = await Packagemanagment.findAll({
        where: {
          id: {
            [Op.in]: packageList,
          },
        },
        raw: true,
        nest: true,
        order: [['id', 'DESC']],
      });

      const centerMetaData = {
        signature: getCenterUser.signature,
        getCenterUserData,
        userData,
      };

      const packageMetaData = {
        getPackageData,
      };

      const drivers = await driverhealthcheckup.findOne({
        where: { id: healthCheckupId },
        include: [
          {
            model: Doctor,
            as: 'doctor',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'status', 'phone'],
              },
            ],
          },
          {
            model: DRIVERMASTER,
            as: 'driver',
            include: [
              {
                model: DRIVERMASTERPERSONAL,
                attributes: ['id', 'blood_group'],
                required: false,
              },
            ],
          },
          {
            model: CETMANAGEMENT,
            as: 'CETMANAGEMENT',
          },
          {
            model: CETMANAGEMENT,
            as: 'CETMANAGEMENT',
          },
        ],
        order: [['id', 'DESC']],
      });

      if (!drivers) {
        return null;
      }

      const modelMapping = {
        temperature_unit: Temperature,
        spo2_unit: SPO2,
        pulse_unit: Pulse,
        pulmonary_function_test_unit: Pulmonaryfunctiontest,
        haemoglobin_unit: Haemoglobin,
        cretenine_unit: Cretenine,
        alchol_test_unit: Alcholtest,
        hiv_unit: Hiv,
        ecg_unit: ECG,
        bmi_unit: BMI,
        cholesterol_unit: CHOLESTEROL,
        eyetest_unit: Eyetest,
        hearing_unit: Hearingtest,
        blood_pressure_unit: Bloodpressure,
        blood_group_unit: Bloodgroup,
        random_blood_sugar_unit: RandomBloodSugar,
        Vision: Vision,
      };

      let selectedTest = this.parseSelectedTestObject(drivers.selected_test);
      if (selectedTest.mobilab_tests) {
        selectedTest = {
          ...selectedTest,
          mobilab_tests: enrichMobilabTests(selectedTest.mobilab_tests),
        };
      }

      if (typeof drivers.setDataValue === 'function') {
        drivers.setDataValue('selected_test', selectedTest);
      } else {
        drivers.selected_test = selectedTest;
      }

      let additionalData = {};
      let metaData = {};

      for (const key in selectedTest) {
        if (modelMapping.hasOwnProperty(key)) {
          const model = modelMapping[key];
          additionalData[key] = await model.findOne({
            raw: true,
            nest: true,
          });
        }
      }

      for (const key in selectedTest) {
        if (!modelMapping.hasOwnProperty(key)) {
          metaData[key] = selectedTest[key];
          continue;
        }

        const value = selectedTest[key];

        // 🧠 Detect nested objects (BP, Eye, etc.)
        const isNested =
          typeof value === 'object' &&
          value !== null &&
          Object.values(value).some(
            (v) => typeof v === 'object' && v !== null && 'value' in v,
          );

        if (isNested) {
          // ✅ Convert to children array
          const children = Object.entries(value).map(
            ([childKey, childVal]: any) => ({
              key: childKey,
              label:
                childVal?.label || childKey.replace(/_/g, ' ').toUpperCase(),
              value: childVal?.value ?? '',
              units: childVal?.units || '',
              standard_value: childVal?.standard_value || '',
              remark: childVal?.remark || '',
              status: childVal?.status || '',
              doc: childVal?.doc || '',
            }),
          );

          metaData[key] = {
            key,
            label: key.replace(/_/g, ' ').toUpperCase(),
            children,
          };
        } else {
          // ✅ Normal flat test
          metaData[key] = {
            key,
            label: value?.label || key.replace(/_/g, ' ').toUpperCase(),
            value: value?.value ?? '',
            units: value?.units || '',
            standard_value: value?.standard_value || '',
            remark: value?.remark || '',
            status: value?.status || '',
            doc: value?.doc || '',
          };
        }
      }

      const resData = {
        drivers,
        metaData,
        centerMetaData,
        packageMetaData,
      };

      return resData;
    } catch (error) {
      this.logger.error(
        `getDriverHealthReportDownloadPayload failed: ${(error as Error)?.message || error}`,
        (error as Error)?.stack,
      );
      return null;
    }
  }

  async driverHealthReportDownload(req, res) {
    if (req.isTestAccount) {
      return this.denyTestAccountAccess(res);
    }

    const { id } = req.body;
    if (!id) {
      sendError(res, 400, 'Id is required');
      return;
    }

    const payload = await this.getDriverHealthReportDownloadPayload(Number(id));
    if (!payload) {
      sendError(res, 400, 'No result found');
      return;
    }

    return sendSuccess(res, 200, payload, 'Driver health report');
  }

  async editVehicleNumber(req, res) {
    const { test_id, new_vehicleNumber } = req.body;

    const vehicleNumberPattern = /^[A-Z]{2}.*\d{4}$/;

    if (!vehicleNumberPattern.test(new_vehicleNumber)) {
      sendError(res, 400, 'Invalid vehicle number format');
      return;
    }

    try {
      const drivers = await driverhealthcheckup.findOne({
        where: { id: test_id },
      });

      if (!drivers) {
        sendError(res, 404, 'DriverID Not found');
        return;
      }

      drivers.vehicle_no = new_vehicleNumber;
      await drivers.save();

      return sendSuccess(
        res,
        200,
        drivers,
        'Vehicle number updated successfully',
      );
    } catch (error) {
      return sendError(res, 500, error);
    }
  }

  async downloadFile(url: string, outputPath: string): Promise<void> {
    try {
      await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

      const writer = fs.createWriteStream(outputPath);

      const response = await axios.get(url, {
        responseType: 'stream',
        timeout: 60_000,
      });

      response.data.pipe(writer);

      await new Promise<void>((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to download file: ${error.message}`,
      );
    }
  }

  /** S3 prefix for merged concern videos (bucket: {@link S3_BUCKET_NAME}). */
  private static readonly CONCERN_VIDEO_S3_PREFIX =
    'videosConcernDriver/generated_reports';

  /**
   * Public HTTPS URL for Twilio/WhatsApp media templates.
   * Uses virtual-hosted style; Location from upload() can differ and break playback.
   */
  private buildConcernVideoPublicUrl(bucket: string, key: string): string {
    const region = AWS_REGION || process.env.AWS_REGION || 'ap-south-1';
    const encodedKey = key.split('/').map(encodeURIComponent).join('/');
    return `https://${bucket}.s3.${region}.amazonaws.com/${encodedKey}`;
  }

  private resolveConcernVideoBucket(): string {
    const bucket = S3_BUCKET_NAME?.trim();
    if (!bucket) {
      throw new InternalServerErrorException(
        'S3_BUCKET_NAME is not set (required for concern video upload)',
      );
    }
    return bucket;
  }

  async uploadConcernVideoToS3(
    filePath: string,
    fileName: string,
  ): Promise<string> {
    const bucket = this.resolveConcernVideoBucket();
    const key = `${HealthCheckupService.CONCERN_VIDEO_S3_PREFIX}/${fileName}`;

    try {
      const stats = await fs.promises.stat(filePath);
      if (stats.size < 1024) {
        throw new InternalServerErrorException(
          'Merged video file is empty or corrupt',
        );
      }

      await this.s3
        .upload({
          Bucket: bucket,
          Key: key,
          Body: fs.createReadStream(filePath),
          ContentType: 'video/mp4',
          ContentDisposition: 'inline; filename="concern-video.mp4"',
          CacheControl: 'public, max-age=31536000',
        })
        .promise();

      const publicUrl = this.buildConcernVideoPublicUrl(bucket, key);
      this.logger.log(
        `Concern video uploaded bucket=${bucket} key=${key} size=${stats.size} url=${publicUrl}`,
      );
      return publicUrl;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to upload concern video to S3: ${error.message}`,
      );
    }
  }

  private assertExecutableExists(
    binaryPath: string,
    label: string,
    envHint: string,
  ): string {
    if (!fs.existsSync(binaryPath)) {
      throw new InternalServerErrorException(
        `${label} binary not found at "${binaryPath}". ${envHint}`,
      );
    }
    return binaryPath;
  }

  private probeMediaStreams(
    filePath: string,
  ): Promise<{ hasAudio: boolean; hasVideo: boolean }> {
    const { ffprobe: ffprobePath } = this.configureFfmpegPaths();

    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, { path: ffprobePath }, (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        const streams = data?.streams ?? [];
        resolve({
          hasVideo: streams.some((s) => s.codec_type === 'video'),
          hasAudio: streams.some((s) => s.codec_type === 'audio'),
        });
      });
    });
  }

  /**
   * WhatsApp requires AAC audio; source clips without an audio track break concat/playback.
   */
  private async ensureInputHasAudio(
    inputPath: string,
    workDir: string,
  ): Promise<string> {
    const { hasAudio, hasVideo } = await this.probeMediaStreams(inputPath);
    if (!hasVideo) {
      throw new InternalServerErrorException(
        `Downloaded segment has no video stream: ${inputPath}`,
      );
    }
    if (hasAudio) {
      return inputPath;
    }

    const outputPath = path.join(
      workDir,
      `with_audio_${path.basename(inputPath)}`,
    );
    this.configureFfmpegPaths();

    this.logger.warn(`Segment missing audio, adding silent track: ${inputPath}`);

    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(inputPath)
        .input('anullsrc=channel_layout=stereo:sample_rate=44100')
        .inputOptions(['-f', 'lavfi'])
        .outputOptions([
          '-c:v',
          'copy',
          '-c:a',
          'aac',
          '-b:a',
          '128k',
          '-shortest',
          '-movflags',
          '+faststart',
        ])
        .on('error', (err) =>
          reject(
            new InternalServerErrorException(
              `Failed to add audio track: ${err.message}`,
            ),
          ),
        )
        .on('end', () => resolve())
        .save(outputPath);
    });

    return outputPath;
  }

  /**
   * fluent-ffmpeg runs the ffmpeg CLI. Use FFMPEG_PATH for a custom binary,
   * otherwise @ffmpeg-installer/ffmpeg (Windows/macOS/Linux), else PATH.
   */
  private resolveFfmpegBinaryPath(): string {
    const fromEnv = process.env.FFMPEG_PATH?.trim();
    if (fromEnv) {
      return this.assertExecutableExists(
        fromEnv,
        'FFmpeg',
        'Set FFMPEG_PATH to a valid ffmpeg binary.',
      );
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { path: installerPath } = require('@ffmpeg-installer/ffmpeg');
      return this.assertExecutableExists(
        installerPath as string,
        'FFmpeg',
        'Run npm install @ffmpeg-installer/ffmpeg or set FFMPEG_PATH.',
      );
    } catch (err) {
      if (err instanceof InternalServerErrorException) {
        throw err;
      }
      throw new InternalServerErrorException(
        'FFmpeg not available. Run npm install @ffmpeg-installer/ffmpeg or set FFMPEG_PATH.',
      );
    }
  }

  /**
   * ffprobe is separate from ffmpeg. Use FFPROBE_PATH, else @ffprobe-installer/ffprobe.
   */
  private resolveFfprobeBinaryPath(): string {
    const fromEnv = process.env.FFPROBE_PATH?.trim();
    if (fromEnv) {
      return this.assertExecutableExists(
        fromEnv,
        'ffprobe',
        'Set FFPROBE_PATH to a valid ffprobe binary.',
      );
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { path: installerPath } = require('@ffprobe-installer/ffprobe');
      return this.assertExecutableExists(
        installerPath as string,
        'ffprobe',
        'Run npm install @ffprobe-installer/ffprobe or set FFPROBE_PATH.',
      );
    } catch (err) {
      if (err instanceof InternalServerErrorException) {
        throw err;
      }
    }
    const ffmpegPath = this.resolveFfmpegBinaryPath();
    const ext = process.platform === 'win32' ? '.exe' : '';
    const sibling = path.join(path.dirname(ffmpegPath), `ffprobe${ext}`);
    if (fs.existsSync(sibling)) {
      return sibling;
    }
    throw new InternalServerErrorException(
      'ffprobe not available. Run npm install @ffprobe-installer/ffprobe or set FFPROBE_PATH.',
    );
  }

  private configureFfmpegPaths(): { ffmpeg: string; ffprobe: string } {
    const ffmpegPath = this.resolveFfmpegBinaryPath();
    const ffprobePath = this.resolveFfprobeBinaryPath();
    const f = ffmpeg as unknown as {
      setFfmpegPath: (p: string) => void;
      setFfprobePath: (p: string) => void;
    };
    f.setFfmpegPath(ffmpegPath);
    f.setFfprobePath(ffprobePath);
    return { ffmpeg: ffmpegPath, ffprobe: ffprobePath };
  }

  async mergeFiles(inputPaths: string[], outputPath: string): Promise<void> {
    if (!inputPaths?.length) {
      throw new InternalServerErrorException('No input files provided');
    }

    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

    return new Promise<void>((resolve, reject) => {
      const { ffmpeg: ffPath, ffprobe: fpPath } = this.configureFfmpegPaths();
      this.logger.debug(
        `mergeFiles: ffmpeg=${ffPath} ffprobe=${fpPath}`,
      );

      const command = ffmpeg();
      const videoFilters: any[] = [];
      const audioFilters: any[] = [];
      const inputs: string[] = [];

      inputPaths.forEach((file) => {
        command.input(file);
      });

      inputPaths.forEach((_, index) => {
        const videoOutput = `v${index}`;

        videoFilters.push(
          {
            filter: 'scale',
            options: {
              w: 1280,
              h: 720,
              force_original_aspect_ratio: 'decrease',
            },
            inputs: `${index}:v`,
            outputs: `scaled${index}`,
          },
          {
            filter: 'pad',
            options: {
              w: 1280,
              h: 720,
              x: '(ow-iw)/2',
              y: '(oh-ih)/2',
            },
            inputs: `scaled${index}`,
            outputs: `padded${index}`,
          },
          {
            filter: 'setsar',
            options: '1',
            inputs: `padded${index}`,
            outputs: videoOutput,
          },
        );

        // ---- AUDIO ----
        const audioOutput = `a${index}`;
        audioFilters.push({
          filter: 'aresample',
          options: 44100,
          inputs: `${index}:a`,
          outputs: audioOutput,
        });

        inputs.push(videoOutput, audioOutput);
      });

      /** 3. Concat filter */
      const concatFilter = {
        filter: 'concat',
        options: {
          n: inputPaths.length,
          v: 1,
          a: 1,
        },
        inputs,
        outputs: ['v', 'a'],
      };

      const allFilters = [...videoFilters, ...audioFilters, concatFilter];

      command
        .complexFilter(allFilters)
        .outputOptions([
          '-map',
          '[v]',
          '-map',
          '[a]',
          '-c:v',
          'libx264',
          '-profile:v',
          'baseline',
          '-level',
          '3.1',
          '-pix_fmt',
          'yuv420p',
          '-r',
          '30',
          '-b:v',
          '1500k',
          '-maxrate',
          '1500k',
          '-bufsize',
          '3000k',
          '-c:a',
          'aac',
          '-b:a',
          '128k',
          '-ar',
          '44100',
          '-ac',
          '2',
          '-movflags',
          '+faststart',
        ])
        .on('start', (cmd) => {
          this.logger.log('FFmpeg started:', cmd);
        })
        .on('error', (err) => {
          this.logger.error('FFmpeg error:', err.message);
          reject(
            new InternalServerErrorException(
              `FFmpeg merge failed: ${err.message}`,
            ),
          );
        })
        .on('end', () => {
          this.logger.log('FFmpeg merge completed');
          resolve();
        })
        .save(outputPath);
    });
  }

  private cleanupTempDir(dirPath: string): void {
    try {
      if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
        this.logger.log(`Temp directory cleaned: ${dirPath}`);
      }
    } catch (err) {
      this.logger.error('Failed to cleanup temp directory:', err.message);
    }
  }

  async createFullVideo(videoUrls: string[]): Promise<string> {
    if (!videoUrls?.length) {
      throw new InternalServerErrorException(
        'No video URLs provided for merging',
      );
    }

    const tempDir = path.join(os.tmpdir(), `merge_${uuidv4()}`);
    await fs.promises.mkdir(tempDir, { recursive: true });

    const localFilePaths: string[] = [];
    const outputFileName = `full_report_${Date.now()}.mp4`;
    const localOutputPath = path.join(tempDir, outputFileName);

    try {
      this.logger.log(`Starting merge for ${videoUrls.length} videos`);

      /** 1. Download all videos */
      for (let i = 0; i < videoUrls.length; i++) {
        const localPath = path.join(tempDir, `part_${i}.mp4`);
        await this.downloadFile(videoUrls[i], localPath);
        const withAudio = await this.ensureInputHasAudio(localPath, tempDir);
        localFilePaths.push(withAudio);
      }

      /** 2. Merge videos (H.264 baseline + AAC + faststart for WhatsApp) */
      await this.mergeFiles(localFilePaths, localOutputPath);

      /** 3. Upload merged video */
      const s3Url = await this.uploadConcernVideoToS3(
        localOutputPath,
        outputFileName,
      );

      return s3Url;
    } catch (error) {
      this.logger.error('Video merge failed:', error);
      throw new InternalServerErrorException('Failed to generate full video');
    } finally {
      this.cleanupTempDir(tempDir);
    }
  }
  async makeVideos(concerns: any[]): Promise<string> {
    const generatedVideos: any[] = [];

    /** 1. Fetch references */
    const allReferences = await VideoCategoryReference.findAll();

    /** 2. Build map */
    const referenceMap = new Map<string, any>();
    allReferences.forEach((ref) => {
      referenceMap.set(ref.test_category, ref.video_links);
    });

    /** 3. Intro & Ending */
    const introLink = referenceMap.get('Intro')?.Intro ?? null;
    const endingLink = referenceMap.get('ending')?.ending ?? null;

    /** 3b. BP concerns use split types + numeric values; video lookup needs "sys/dia". */
    const concernsForVideo: any[] = [...(concerns ?? [])];
    const bpSys = concernsForVideo.find(
      (c) => c.type === 'BLOOD_PRESSURE_SYSTOLIC',
    );
    const bpDia = concernsForVideo.find(
      (c) => c.type === 'BLOOD_PRESSURE_DIASTOLIC',
    );
    if (bpSys?.value != null && bpDia?.value != null) {
      concernsForVideo.push({
        type: 'BLOOD_PRESSURE',
        value: `${bpSys.value}/${bpDia.value}`,
      });
    }

    /** 4. Build concern-based videos */
    for (const concern of concernsForVideo) {
      let categoryKey = '';
      let videoKey = '';

      switch (concern.type) {
        case 'BLOOD_SUGAR':
          categoryKey = 'RBS';
          videoKey = this.getRBSVideoKey(concern.value);
          break;

        case 'BLOOD_PRESSURE':
          categoryKey = 'BP';
          videoKey =
            typeof concern.value === 'string'
              ? this.getBPVideoKey(concern.value)
              : null;
          break;

        case 'BLOOD_PRESSURE_SYSTOLIC':
        case 'BLOOD_PRESSURE_DIASTOLIC':
          break;

        case 'PULSE':
          categoryKey = 'Pulse';
          videoKey = this.getPulseVideoKey(concern.value);
          break;

        case 'HEMOGLOBIN':
          categoryKey = 'Hemoglobin';
          videoKey = 'Down';
          break;

        case 'EYE_VISION':
          categoryKey = 'Vision';
          videoKey = '6-9 Vision';
          break;

        case 'SP02':
        case 'SPO2':
          categoryKey = 'SP02';
          videoKey = 'SpO2Less';
          break;

        case 'TEMPERATURE':
        case 'BODY_TEMPERATURE':
          categoryKey = 'Body Temprature';
          videoKey = this.getTemperatureVideoKey(concern.value);
          break;

        case 'BMI':
          categoryKey = 'BMI';
          videoKey = this.getBMIVideoKey(concern.value);
          break;
      }

      if (categoryKey && videoKey && referenceMap.has(categoryKey)) {
        const links = referenceMap.get(categoryKey);
        if (links?.[videoKey]) {
          generatedVideos.push({
            type: concern.type,
            category: categoryKey,
            condition: videoKey,
            url: links[videoKey],
          });
        }
      }
    }

    const urlsToMerge = [
      introLink,
      ...generatedVideos.map((v) => v.url),
      endingLink,
    ].filter(Boolean);

    return this.createFullVideo(urlsToMerge);
  }

  private async getSuggestedPackage(
    driverId: number,
  ): Promise<{ code: 'AD' | 'BS' | 'CS'; label: string }> {
    const PACKAGE_LABELS = {
      AD: 'Advance Package',
      BS: 'Basic Package',
      CS: 'Counseling',
    } as const;

    const MS_PER_DAY = 1000 * 60 * 60 * 24;

    const records = await this.sequelize.query<{
      date_time: Date;
      package_type: 'AD' | 'BS';
    }>(
      `
    SELECT dhc."date_time", pm.package_type
    FROM "driverhealthcheckups" dhc
    JOIN "Packagemanagments" pm
      ON pm.id = ANY(dhc.package_list::int[])
    WHERE dhc.driver_id = :driverId
      AND dhc.confirm_report = 'yes'
      AND pm.package_type IN ('AD','BS')
    ORDER BY dhc."date_time" DESC
    `,
      {
        replacements: { driverId },
        type: QueryTypes.SELECT,
      },
    );

    if (!records.length) {
      return { code: 'AD', label: PACKAGE_LABELS.AD };
    }

    const today = new Date();

    const toUTCDateOnly = (d: Date) =>
      Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());

    /**
     * Find last AD (cycle start)
     */
    const lastAD = records.find((r) => r.package_type === 'AD');

    if (!lastAD) {
      return { code: 'AD', label: PACKAGE_LABELS.AD };
    }

    const cycleStart = new Date(lastAD.date_time);

    const cycleDays = Math.floor(
      (toUTCDateOnly(today) - toUTCDateOnly(cycleStart)) / MS_PER_DAY,
    );

    /**
     * RULE 1: Cycle expiry
     */
    if (cycleDays >= 90) {
      return { code: 'AD', label: PACKAGE_LABELS.AD };
    }

    /**
     * Get cycle records
     */
    const cycleRecords = records.filter(
      (r) => new Date(r.date_time) >= cycleStart,
    );

    const bsRecords = cycleRecords
      .filter((r) => r.package_type === 'BS')
      .sort(
        (a, b) =>
          new Date(b.date_time).getTime() - new Date(a.date_time).getTime(),
      );

    const bsCount = bsRecords.length;

    /**
     * RULE 2: First 30 days → no BS allowed
     */
    if (cycleDays < 30) {
      return { code: 'CS', label: PACKAGE_LABELS.CS };
    }

    /**
     * RULE 3: BS allowed only if:
     * - less than 2 times
     * - AND gap ≥ 30 days
     */

    if (bsCount < 2) {
      const lastBS = bsRecords[0];

      // If no BS yet → check gap from AD
      if (!lastBS) {
        if (cycleDays >= 30) {
          return { code: 'BS', label: PACKAGE_LABELS.BS };
        }
        return { code: 'CS', label: PACKAGE_LABELS.CS };
      }

      // If already one BS → check gap from last BS
      const lastBSDays = Math.floor(
        (toUTCDateOnly(today) - toUTCDateOnly(new Date(lastBS.date_time))) /
          MS_PER_DAY,
      );

      if (lastBSDays >= 30) {
        return { code: 'BS', label: PACKAGE_LABELS.BS };
      }

      return { code: 'CS', label: PACKAGE_LABELS.CS };
    }

    /**
     * RULE 4: BS limit reached → only CS
     */
    return { code: 'CS', label: PACKAGE_LABELS.CS };
  }

  // private async getSuggestedPackage(
  //   driverId: number,
  // ): Promise<{ code: 'AD' | 'BS' | 'CS'; label: string }> {
  //   const PACKAGE_LABELS = {
  //     AD: 'Advance Package',
  //     BS: 'Basic Package',
  //     CS: 'Counseling',
  //   } as const;

  //   const MS_PER_DAY = 1000 * 60 * 60 * 24;

  //   /** Strip time component using UTC to avoid timezone day-shift bugs */
  //   const toUTCDay = (d: Date) =>
  //     Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

  //   const todayUTC = toUTCDay(new Date());

  //   /** Fetch all confirmed AD/BS records for this driver, newest first */
  //   const records = await this.sequelize.query<{
  //     date_time: Date;
  //     package_type: 'AD' | 'BS';
  //   }>(
  //     `
  //   SELECT dhc."date_time", pm.package_type
  //   FROM "driverhealthcheckups" dhc
  //   JOIN "Packagemanagments" pm
  //     ON pm.id = ANY(dhc.package_list::int[])
  //   WHERE dhc.driver_id = :driverId
  //     AND dhc.confirm_report = 'yes'
  //     AND pm.package_type IN ('AD','BS')
  //   ORDER BY dhc."date_time" DESC
  //   `,
  //     { replacements: { driverId }, type: QueryTypes.SELECT },
  //   );

  //   // ── Stage 1: Find the most recent AD (cycle anchor) ──────────────────
  //   const lastAD = records.find((r) => r.package_type === 'AD');

  //   if (!lastAD) {
  //     // Never had an AD → start fresh
  //     return { code: 'AD', label: PACKAGE_LABELS.AD };
  //   }

  //   const cycleStartUTC = toUTCDay(new Date(lastAD.date_time));
  //   const cycleDays = Math.floor((todayUTC - cycleStartUTC) / MS_PER_DAY);

  //   // ── Stage 1 check: cycle expired → restart with AD ───────────────────
  //   if (cycleDays >= 90) {
  //     return { code: 'AD', label: PACKAGE_LABELS.AD };
  //   }

  //   // ── Too early for any BS (first 30 days) → Counseling ────────────────
  //   if (cycleDays < 30) {
  //     return { code: 'CS', label: PACKAGE_LABELS.CS };
  //   }

  //   // ── Collect BS records that belong to this cycle ──────────────────────
  //   const cycleBS = records.filter(
  //     (r) =>
  //       r.package_type === 'BS' &&
  //       toUTCDay(new Date(r.date_time)) >= cycleStartUTC,
  //   );

  //   // ── Stage 2: Day 30–59 window ─────────────────────────────────────────
  //   // Neglect rule: only check if 1st BS was done in THIS window.
  //   // If not done → suggest BS (catch-up). If done → CS.
  //   if (cycleDays < 60) {
  //     const firstBSDone = cycleBS.some(
  //       (r) =>
  //         toUTCDay(new Date(r.date_time)) - cycleStartUTC < 60 * MS_PER_DAY,
  //     );
  //     return firstBSDone
  //       ? { code: 'CS', label: PACKAGE_LABELS.CS }
  //       : { code: 'BS', label: PACKAGE_LABELS.BS };
  //   }

  //   // ── Stage 3: Day 60–89 window ─────────────────────────────────────────
  //   // Neglect rule: check if 2nd BS was done (total BS count >= 2).
  //   // If not done → suggest BS (catch-up). If done → CS.
  //   const secondBSDone = cycleBS.length >= 2;
  //   return secondBSDone
  //     ? { code: 'CS', label: PACKAGE_LABELS.CS }
  //     : { code: 'BS', label: PACKAGE_LABELS.BS };
  // }
}
