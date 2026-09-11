import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import axios, { AxiosResponse } from 'axios';
import { lastValueFrom } from 'rxjs';
import { driverhealthcheckup } from 'src/models/DriverHealthCheckup';
import { Prescription } from 'src/models/Prescription';
import { DRIVERMASTER } from 'src/models/DriverMaster';
import { instavansParkflowConfig } from 'config/envConfig';
import { InstavansStatus, PushFitnessDto } from './dto/push-fitness.dto';
import { buildParkflowHmacSignature } from './utils/parkflow-hmac.util';
import {
  CHECKUP_STATUS_DOCTOR_CONSULTATION,
  mapCheckupFitnessStatusToInstavans,
  mapPrescriptionFitnessStatusToInstavans,
} from './mappers/instavans-status.mapper';
import {
  buildInstavansRemark,
  listAbnormalVitalLabels,
} from './formatters/vital-remark.formatter';

interface ParkflowResponseEnvelope {
  readonly statusCode?: number;
  readonly msg?: string;
  readonly data?: {
    readonly decision?: string;
  };
}

@Injectable()
export class InstavansParkflowService {
  private readonly logger = new Logger(InstavansParkflowService.name);
  private readonly postPath = '/parkflow/v1/integrations/kavach/fitness';
  private readonly maxRetries: number =
    instavansParkflowConfig.retryAttempts ?? 2;

  constructor(private readonly httpService: HttpService) {}

  async pushFromHealthCheckup(checkup: driverhealthcheckup): Promise<void> {
    if (!instavansParkflowConfig.enabled) {
      this.logDebug(
        'instavans_disabled',
        'Skip health-checkup push because integration is disabled',
      );
      return;
    }
    if (!this.isReadyDriverCheckup(checkup)) {
      this.logDebug(
        'health_checkup_not_ready',
        'Skip health-checkup push because checkup is not ready or not driver',
        {
          checkupId: checkup.id,
          patientType: checkup.patient_type,
          isSubmitted: checkup.is_submited,
          confirmReport: checkup.confirm_report,
        },
      );
      return;
    }
    const checkupFitnessStatus: string = this.getStringValue(
      (checkup as unknown as Record<string, unknown>).fitness_status,
    );
    const mapping = mapCheckupFitnessStatusToInstavans(checkupFitnessStatus);
    if (!mapping.shouldPush || !mapping.mappedStatus) {
      this.logDebug(
        'health_checkup_mapping_skip',
        'Skip health-checkup push because status is deferred',
        {
          checkupId: checkup.id,
          checkupFitnessStatus,
        },
      );
      return;
    }
    const driver: DRIVERMASTER | undefined = checkup.driver;
    const licenseNumber: string = this.getStringValue(driver?.idProof_number);
    if (!licenseNumber) {
      this.logger.warn(
        `Skipping Instavans push for checkup=${checkup.id}: missing license number`,
      );
      return;
    }
    const shouldAppendVitals: boolean = this.shouldIncludeVitalsInRemark(
      mapping.mappedStatus.status,
    );
    const selectedTest: unknown = shouldAppendVitals
      ? checkup.selected_test
      : undefined;
    const abnormalVitalLabels: string[] = shouldAppendVitals
      ? listAbnormalVitalLabels(selectedTest)
      : [];
    const remarks: string = buildInstavansRemark({
      baseRemark: mapping.mappedStatus.baseRemark,
      selectedTest,
      concerns: shouldAppendVitals
        ? ((checkup.concerns as unknown as readonly Record<string, unknown>[]) ??
            [])
        : [],
    });
    const payload: PushFitnessDto = {
      license_number: licenseNumber,
      status: mapping.mappedStatus.status,
      remarks,
      internal_status: mapping.mappedStatus.internalStatus,
      last_updated: this.toIstIsoString(checkup.updatedAt ?? new Date()),
    };
    this.logDebug(
      'health_checkup_push_payload',
      'Prepared health-checkup payload for Instavans',
      {
        checkupId: checkup.id,
        mappedStatus: payload.status,
        internalStatus: payload.internal_status,
        licenseMasked: this.maskLicenseNumber(payload.license_number),
        abnormalVitalCount: abnormalVitalLabels.length,
        abnormalVitalLabels,
        remarksLength: payload.remarks.length,
        remarks: payload.remarks,
      },
    );
    await this.pushWithRetry(payload, `health-checkup:${checkup.id}`);
  }

  async pushFromPrescription(params: {
    readonly prescription: Prescription;
    readonly checkup: driverhealthcheckup;
    readonly driver: DRIVERMASTER | null;
  }): Promise<void> {
    if (!instavansParkflowConfig.enabled) {
      this.logDebug(
        'instavans_disabled',
        'Skip prescription push because integration is disabled',
      );
      return;
    }
    if (!this.isReadyDriverCheckup(params.checkup)) {
      this.logDebug(
        'prescription_checkup_not_ready',
        'Skip prescription push because linked checkup is not ready or not driver',
        {
          prescriptionId: params.prescription.prescription_id,
          checkupId: params.checkup.id,
          patientType: params.checkup.patient_type,
          isSubmitted: params.checkup.is_submited,
          confirmReport: params.checkup.confirm_report,
        },
      );
      return;
    }
    const checkupFitnessStatus: string = this.getStringValue(
      (params.checkup as unknown as Record<string, unknown>).fitness_status,
    );
    if (checkupFitnessStatus !== CHECKUP_STATUS_DOCTOR_CONSULTATION) {
      this.logDebug(
        'prescription_checkup_status_skip',
        'Skip prescription push because checkup status is not doctor consultation',
        {
          prescriptionId: params.prescription.prescription_id,
          checkupId: params.checkup.id,
          checkupFitnessStatus,
        },
      );
      return;
    }
    const mapping = mapPrescriptionFitnessStatusToInstavans(
      params.prescription.fitness_status,
    );
    if (!mapping.shouldPush || !mapping.mappedStatus) {
      this.logDebug(
        'prescription_mapping_skip',
        'Skip prescription push because fitness status is not mappable',
        {
          prescriptionId: params.prescription.prescription_id,
          prescriptionFitnessStatus: params.prescription.fitness_status,
        },
      );
      return;
    }
    const licenseNumber: string = this.getStringValue(
      params.driver?.idProof_number,
    );
    if (!licenseNumber) {
      this.logger.warn(
        `Skipping Instavans push for prescription=${params.prescription.prescription_id}: missing license number`,
      );
      return;
    }
    const shouldAppendVitals: boolean = this.shouldIncludeVitalsInRemark(
      mapping.mappedStatus.status,
    );
    const selectedTest: unknown = shouldAppendVitals
      ? params.checkup.selected_test
      : undefined;
    const abnormalVitalLabels: string[] = shouldAppendVitals
      ? listAbnormalVitalLabels(selectedTest)
      : [];
    const remarks: string = buildInstavansRemark({
      baseRemark: mapping.mappedStatus.baseRemark,
      selectedTest,
      concerns: shouldAppendVitals
        ? ((params.checkup.concerns as unknown as readonly Record<
            string,
            unknown
          >[]) ?? [])
        : [],
    });
    const payload: PushFitnessDto = {
      license_number: licenseNumber,
      status: mapping.mappedStatus.status,
      remarks,
      internal_status: mapping.mappedStatus.internalStatus,
      last_updated: this.toIstIsoString(
        params.prescription.updatedAt ?? new Date(),
      ),
    };
    this.logDebug(
      'prescription_push_payload',
      'Prepared prescription payload for Instavans',
      {
        prescriptionId: params.prescription.prescription_id,
        checkupId: params.checkup.id,
        mappedStatus: payload.status,
        internalStatus: payload.internal_status,
        licenseMasked: this.maskLicenseNumber(payload.license_number),
        abnormalVitalCount: abnormalVitalLabels.length,
        abnormalVitalLabels,
        remarksLength: payload.remarks.length,
        remarks: payload.remarks,
      },
    );
    await this.pushWithRetry(
      payload,
      `prescription:${params.prescription.prescription_id}`,
    );
  }

  private shouldIncludeVitalsInRemark(status: InstavansStatus): boolean {
    return status === 'red';
  }

  private isReadyDriverCheckup(checkup: driverhealthcheckup): boolean {
    const patientType: string = this.getStringValue(checkup.patient_type);
    const confirmReport: string = this.getStringValue(checkup.confirm_report);
    return (
      patientType === 'DR' &&
      checkup.is_submited === true &&
      confirmReport.toLowerCase() === 'yes'
    );
  }

  private async pushWithRetry(
    payload: PushFitnessDto,
    contextKey: string,
  ): Promise<void> {
    let attempt = 0;
    while (attempt <= this.maxRetries) {
      this.logDebug(
        'push_attempt_start',
        'Instavans push attempt started',
        {
          contextKey,
          attempt: attempt + 1,
          maxAttempts: this.maxRetries + 1,
          status: payload.status,
          licenseMasked: this.maskLicenseNumber(payload.license_number),
        },
      );
      try {
        const response: ParkflowResponseEnvelope = await this.pushOnce(payload);
        this.logger.log(
          `Instavans push success context=${contextKey} status=${payload.status} decision=${response?.data?.decision ?? 'UNKNOWN'}`,
        );
        this.logDebug(
          'push_attempt_success',
          'Instavans push attempt completed successfully',
          {
            contextKey,
            attempt: attempt + 1,
            statusCode: response?.statusCode,
            decision: response?.data?.decision,
            responseMessage: response?.msg,
          },
        );
        return;
      } catch (error: unknown) {
        const shouldRetry: boolean = this.shouldRetryError(error);
        this.logDebug(
          'push_attempt_error',
          'Instavans push attempt failed',
          {
            contextKey,
            attempt: attempt + 1,
            shouldRetry,
            statusCode: axios.isAxiosError(error) ? error.response?.status : 0,
            errorMessage: this.extractAxiosMessage(error),
          },
        );
        if (!shouldRetry || attempt >= this.maxRetries) {
          this.logPushFailure(error, payload, contextKey, attempt);
          return;
        }
      }
      attempt += 1;
    }
  }

  private async pushOnce(payload: PushFitnessDto): Promise<ParkflowResponseEnvelope> {
    const baseUrl: string = this.getBaseUrl();
    const clientId: string = this.getRequiredConfigValue(
      instavansParkflowConfig.clientId,
      'INSTAVANS_PARKFLOW_CLIENT_ID',
    );
    const clientSecret: string = this.getRequiredConfigValue(
      instavansParkflowConfig.clientSecret,
      'INSTAVANS_PARKFLOW_CLIENT_SECRET',
    );
    const body: string = JSON.stringify(payload);
    const timestamp: string = Date.now().toString();
    const signature = buildParkflowHmacSignature({
      method: 'POST',
      requestPathWithQuery: this.postPath,
      timestamp,
      body,
      clientSecret,
    });
    const headers = {
      'Content-Type': 'application/json',
      'x-client-id': clientId,
      'x-timestamp': timestamp,
      'x-signature': signature.signature,
    };
    this.logDebug(
      'push_http_request',
      'Sending Instavans HTTP request',
      {
        url: `${baseUrl}/v1/integrations/kavach/fitness`,
        method: 'POST',
        clientId,
        timestamp,
        pathUsedForSignature: this.postPath,
        bodyHash: signature.bodyHash,
        signaturePreview: this.previewSignature(signature.signature),
      },
    );
    const response: AxiosResponse<ParkflowResponseEnvelope> = await lastValueFrom(
      this.httpService.post(`${baseUrl}/v1/integrations/kavach/fitness`, body, {
        headers,
        timeout: instavansParkflowConfig.timeoutMs,
      }),
    );
    this.logDebug(
      'push_http_response',
      'Received Instavans HTTP response',
      {
        httpStatus: response.status,
        responseStatusCode: response.data?.statusCode,
        responseMessage: response.data?.msg,
        responseDecision: response.data?.data?.decision,
      },
    );
    return response.data;
  }

  private shouldRetryError(error: unknown): boolean {
    if (!axios.isAxiosError(error)) {
      return false;
    }
    const statusCode: number = error.response?.status ?? 0;
    if (statusCode >= 500) {
      return true;
    }
    if (statusCode === 401) {
      const message: string = this.extractAxiosMessage(error).toLowerCase();
      return message.includes('timestamp');
    }
    return statusCode === 0;
  }

  private logPushFailure(
    error: unknown,
    payload: PushFitnessDto,
    contextKey: string,
    attempt: number,
  ): void {
    if (axios.isAxiosError(error)) {
      const statusCode: number = error.response?.status ?? 0;
      const message: string = this.extractAxiosMessage(error);
      this.logger.error(
        `Instavans push failed context=${contextKey} attempts=${attempt + 1} statusCode=${statusCode} message=${message} payloadStatus=${payload.status}`,
      );
      return;
    }
    const message: string =
      error instanceof Error ? error.message : 'Unexpected error';
    this.logger.error(
      `Instavans push failed context=${contextKey} attempts=${attempt + 1} message=${message} payloadStatus=${payload.status}`,
    );
  }

  private extractAxiosMessage(error: unknown): string {
    if (!axios.isAxiosError(error)) {
      return '';
    }
    const responseData: unknown = error.response?.data;
    if (typeof responseData === 'string') {
      return responseData;
    }
    if (responseData && typeof responseData === 'object') {
      const maybeMessage: unknown = (responseData as Record<string, unknown>)
        .message;
      if (typeof maybeMessage === 'string') {
        return maybeMessage;
      }
      return JSON.stringify(responseData);
    }
    return error.message;
  }

  private getBaseUrl(): string {
    const rawBaseUrl: string = this.getRequiredConfigValue(
      instavansParkflowConfig.baseUrl,
      'INSTAVANS_PARKFLOW_BASE_URL',
    );
    return rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
  }

  private getRequiredConfigValue(
    value: string | undefined,
    key: string,
  ): string {
    if (!value || value.trim().length === 0) {
      throw new InternalServerErrorException(`${key} is not configured`);
    }
    return value.trim();
  }

  private getStringValue(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private toIstIsoString(date: Date): string {
    const source: Date = date instanceof Date ? date : new Date(date);
    const istDate: Date = new Date(source.getTime() + 5.5 * 60 * 60 * 1000);
    const iso: string = istDate.toISOString().replace('Z', '');
    return `${iso}+05:30`;
  }

  private logDebug(event: string, message: string, meta?: Record<string, unknown>): void {
    if (!instavansParkflowConfig.debug) {
      return;
    }
    const metaText: string = meta ? ` meta=${JSON.stringify(meta)}` : '';
    this.logger.log(`[InstavansDebug] event=${event} message=${message}${metaText}`);
  }

  private maskLicenseNumber(value: string): string {
    if (!value || value.length <= 4) {
      return '****';
    }
    const visibleTail: string = value.slice(-4);
    return `${'*'.repeat(Math.max(0, value.length - 4))}${visibleTail}`;
  }

  private previewSignature(signature: string): string {
    if (!signature || signature.length < 12) {
      return '****';
    }
    return `${signature.slice(0, 6)}...${signature.slice(-6)}`;
  }
}
