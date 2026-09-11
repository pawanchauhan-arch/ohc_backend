import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import axios from 'axios';
import * as FormData from 'form-data';
import { join } from 'path';
import * as fs from 'fs';
import { QueryTypes } from 'sequelize';

@Injectable()
export class GovPatientPushService {
  private readonly logger = new Logger(GovPatientPushService.name);

  constructor(private readonly sequelize: Sequelize) {}

  private GOV_API_URL = process.env.LATEHAR_API_URL;
  private API_KEY = process.env.LATEHAR_API_KEY;
  private ACCESS_TOKEN = process.env.LATEHAR_AUTH_TOKEN;

  async getCentersFromGroup(groupId: number): Promise<number[]> {
    const rows = await this.sequelize.query<{ center_ids: any }>(
      `SELECT center_ids FROM "center_groups" WHERE id = :groupId`,
      {
        replacements: { groupId },
        type: QueryTypes.SELECT,
      },
    );

    if (!rows.length) return [];

    const raw = rows[0].center_ids;
    if (Array.isArray(raw)) {
      if (
        raw.length === 1 &&
        typeof raw[0] === 'string' &&
        raw[0].includes(',')
      ) {
        return raw[0]
          .split(',')
          .map((x) => Number(x.trim()))
          .filter((id) => !isNaN(id));
      }
      return raw.map(Number).filter((id) => !isNaN(id));
    }

    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map(Number).filter((id) => !isNaN(id));
        }
      } catch {
        return [];
      }
    }
    return [];
  }

  async getPendingDrivers(centerIds: number[]) {
    const [rows] = await this.sequelize.query(
      `SELECT *
         FROM "DRIVERMASTERs"
         WHERE is_synced = false
        AND "createdBy" IN (:centerIds)
         ORDER BY id ASC
         LIMIT 20;`,
      {
        replacements: { centerIds },
      },
    );

    return rows;
  }

  async getPendingRequest(centerIds: number[]) {
    const [rows] = await this.sequelize.query(
      `SELECT *
         FROM "request"
         WHERE is_synced = false
         AND "centerID"  IN (:centerIds)
         ORDER BY "createdAt" DESC
         LIMIT 20;`,
      {
        replacements: { centerIds },
      },
    );

    return rows;
  }

  async getPendingConsultation(centerIds: number[]) {
    const [rows] = await this.sequelize.query(
      `SELECT *
         FROM "consultation"
         WHERE is_synced = false
         AND "centerID"  IN (:centerIds)
         ORDER BY "createdAt" DESC
         LIMIT 20;`,
      {
        replacements: { centerIds },
      },
    );

    return rows;
  }

  async pushDriver(driver: any) {
    try {
      const form = new FormData();

      // Basic details - using safeAppend to handle null/undefined values
      this.safeAppend(form, 'PatientId', driver.id);
      this.safeAppend(form, 'ContactNo', driver.contactNumber);
      this.safeAppend(form, 'Gender', driver.gender || 'N/A');
      this.safeAppend(form, 'AbhaNumber', driver.abhaNumber);
      this.safeAppend(form, 'BloodGroup', driver.blood_group);
      this.safeAppend(form, 'DriverCetId', driver.driver_cetid);
      this.safeAppend(form, 'LocalState', driver.localAddressState);
      this.safeAppend(form, 'ExternalId', driver.external_id);
      this.safeAppend(form, 'ClientId', driver.client_id);
      this.safeAppend(form, 'EmployeeId', driver.employee_id);
      this.safeAppend(form, 'IdProof', driver.idProof);
      this.safeAppend(form, 'LocalAddress', driver.localAddress);
      this.safeAppend(form, 'IdProofNo', driver.idProof_number);
      this.safeAppend(form, 'IsAyusmanCard', driver.isayushmancard);
      this.safeAppend(form, 'HealthCardNo', driver.healthCardNumber);
      this.safeAppend(form, 'AbhaDetailsJson', driver.abhaDetailsJson);
      this.safeAppend(form, 'PatientName', driver.name);
      this.safeAppend(
        form,
        'EmergencyContactNo',
        driver.emergencyContactNumber,
      );
      this.safeAppend(form, 'IdProofName', driver.idProof_name);
      this.safeAppend(
        form,
        'NeedAssistanceAyushman',
        driver.needassistanceayushman,
      );
      this.safeAppend(form, 'PreferredLanguage', driver.preferred_language);
      this.safeAppend(form, 'LocalDistrict', driver.localAddressDistrict);
      this.safeAppend(
        form,
        'EmergencyContactName',
        driver.emergencyContactName,
      );
      this.safeAppend(form, 'DateOfBirth', driver.dateOfBirthOrAge);
      this.safeAppend(form, 'AbhaSkipReason', driver.abhaSkipReason);
      this.safeAppend(form, 'Age', driver.age);

      // Handle file uploads with proper error checking
      if (driver.id_proof_file) {
        const idProofPath = join(process.cwd(), driver.id_proof_file);
        if (fs.existsSync(idProofPath)) {
          form.append('IdProofDoc', fs.createReadStream(idProofPath), {
            filename: 'idproof.jpg',
            contentType: 'image/jpeg',
          });
        } else {
          this.logger.warn(`ID proof file not found: ${idProofPath}`);
        }
      }

      if (driver.photo_file) {
        const photoPath = join(process.cwd(), driver.photo_file);
        if (fs.existsSync(photoPath)) {
          form.append('PhotographOfDriver', fs.createReadStream(photoPath), {
            filename: 'photo.jpg',
            contentType: 'image/jpeg',
          });
        } else {
          this.logger.warn(`Photo file not found: ${photoPath}`);
        }
      }

      // Construct URL - remove trailing slash if exists to avoid double slash
      const baseUrl = this.GOV_API_URL.endsWith('/')
        ? this.GOV_API_URL.slice(0, -1)
        : this.GOV_API_URL;

      const url = `${baseUrl}/patientMaster/new?apiKey=${this.API_KEY}`;

      this.logger.debug(`Making request to: ${url}`);

      const response = await axios.post(url, form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${this.ACCESS_TOKEN}`,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      this.logger.log(`Successfully synced driver ID: ${driver.id}`);

      await this.sequelize.query(
        `UPDATE "DRIVERMASTERs"
                SET is_synced = true,
                    synced_at = NOW()
                WHERE id = :id;`,
        {
          replacements: { id: driver.id },
        },
      );

      return { success: true, govtResponse: response.data };
    } catch (err: any) {
      this.logger.error(
        `Latehar Sync Failed for ID ${driver?.id}: ${err.message}`,
      );

      if (err.response) {
        this.logger.error(`Status: ${err.response.status}`);
        this.logger.error(`Response: ${JSON.stringify(err.response.data)}`);
      }

      // throw new InternalServerErrorException(
      //     err.response?.data || err.message || 'Latehar sync failed',
      // );
      return {
        success: false,
        error: err?.response?.data || err?.message,
      };
    }
  }

  async pushRequest(requestData: any) {
    try {
      const body = {
        patientId: String(requestData.driver_id),
        preferredSpecialist: String(requestData.preferredspecialist || ''),
        symptoms: String(requestData.symptoms || ''),
        preferredDoctorId: String(requestData.preferredDoctorID || ''),
        preferredTime: requestData.preferred_time,
        status: Boolean(requestData.status),
        requestId: String(requestData.request_id),
      };

      const baseUrl = this.GOV_API_URL.endsWith('/')
        ? this.GOV_API_URL.slice(0, -1)
        : this.GOV_API_URL;

      const url = `${baseUrl}/request/new?apiKey=${this.API_KEY}`;

      this.logger.debug(`Making request to: ${url}`);
      this.logger.debug(`Request body: ${JSON.stringify(body)}`);

      const response = await axios.post(url, body, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.ACCESS_TOKEN}`,
        },
      });

      this.logger.log(
        `Successfully synced request ID: ${requestData.request_id}`,
      );

      await this.sequelize.query(
        `UPDATE "request"
            SET is_synced = true,
                synced_at = NOW()
            WHERE request_id = :id;`,
        {
          replacements: { id: requestData.request_id },
        },
      );

      return { success: true, govtResponse: response.data };
    } catch (err: any) {
      this.logger.error(
        `Latehar Sync Failed for Request ID ${requestData?.request_id}: ${err.message}`,
      );

      if (err.response) {
        this.logger.error(`Status: ${err.response.status}`);
        this.logger.error(`Response: ${JSON.stringify(err.response.data)}`);
      }

      // throw new InternalServerErrorException(
      //     err.response?.data || err.message || 'Latehar sync failed',
      // );
      return {
        success: false,
        error: err?.response?.data || err?.message,
      };
    }
  }

  async pushConsultation(consultation: any) {
    try {
      const body = {
        patientId: String(consultation.driver_id),
        isBooked: Boolean(consultation.isBooked),
        scheduleTime: consultation.scheduled_time,
        requestId: String(consultation.request_id),
        prescriptionId: String(consultation.prescription_Id),
        meetLink: String(consultation.meet_link || ''),
        doctorId: Number(consultation.doctor_id),
        doctorName: String(consultation.doctor_name || ''),
        isComplete: Boolean(consultation.isComplete),
        roomName: String(consultation.room_name || ''),
        vitals: {
          bmi: String(consultation.vitals?.bmi || ''),
          spo2: String(consultation.vitals?.spo2 || ''),
          height: String(consultation.vitals?.height || ''),
          weight: String(consultation.vitals?.weight || ''),
          systolicBP: String(consultation.vitals?.systolicBP || ''),
          diastolicBP: String(consultation.vitals?.diastolicBP || ''),
          temperature: String(consultation.vitals?.temperature || ''),
        },
        centerId: String(consultation.centerID || ''),
      };

      if (consultation.prescription_Id != null) {
        body.prescriptionId = String(consultation.prescription_Id);
      }

      const baseUrl = this.GOV_API_URL.endsWith('/')
        ? this.GOV_API_URL.slice(0, -1)
        : this.GOV_API_URL;

      const url = `${baseUrl}/request/new?apiKey=${this.API_KEY}`;

      this.logger.debug(`Making request to: ${url}`);
      this.logger.debug(`Request body: ${JSON.stringify(body)}`);

      const response = await axios.post(url, body, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.ACCESS_TOKEN}`,
        },
      });

      this.logger.log(
        `Successfully synced request ID: ${consultation.request_id}`,
      );

      await this.sequelize.query(
        `UPDATE "consultation"
                 SET is_synced = true,
                 synced_at = NOW()
                 WHERE consultation_id = :id;`,
        {
          replacements: { id: consultation.consultation_id },
        },
      );

      return { success: true, govtResponse: response.data };
    } catch (err: any) {
      this.logger.error(
        `Latehar Sync Failed for Request ID ${consultation?.request_id}: ${err.message}`,
      );

      if (err.response) {
        this.logger.error(`Status: ${err.response.status}`);
        this.logger.error(`Response: ${JSON.stringify(err.response.data)}`);
      }

      // throw new InternalServerErrorException(
      //     err.response?.data || err.message || 'Latehar sync failed',
      // );
      return {
        success: false,
        error: err?.response?.data || err?.message,
      };
    }
  }

  /**
   * Safely appends a value to FormData, handling null and undefined values
   */
  private safeAppend(
    form: FormData,
    key: string,
    value: any,
    skipIfEmpty: boolean = false,
  ): void {
    if (value !== null && value !== undefined) {
      form.append(key, String(value));
    } else if (!skipIfEmpty) {
      form.append(key, '');
    }
  }

  /**
   * Safely returns a value, handling null and undefined
   * @param value - The value to check
   * @param defaultValue - Default value if null/undefined (default: empty string)
   */
  private getSafeValue(value: any, defaultValue: string = ''): any {
    return value !== null && value !== undefined ? value : defaultValue;
  }
}
