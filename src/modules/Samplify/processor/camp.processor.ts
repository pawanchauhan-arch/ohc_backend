import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import axios from 'axios';
import { uploadToS3WithFolder } from '../../../utils/s3-image-upload';
import {driverhealthcheckup } from '../../../models/DriverHealthCheckup';
import { PhlebotomistService } from '../../phlebotomist/phlebotomist.service';
import {CampList} from '../../../models/CampList';
import {CampListItem} from '../../../models/CampListItem';
import {DRIVERMASTER} from '../../../models/DriverMaster';
import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';
import { HealthCheckupService } from '../../healthCheckup/health-checkup.service';
import { buildLmcHealthCheckupMainPdfFromPayload } from '../../lmc-driver-health-report/lmc-driver-health-checkup-pdf.copy';

import { Cbc } from '../../../models/health-tests/cbc.model';
import { Biochemistry } from '../../../models/health-tests/biochemistry.model';
import { LipidProfile } from '../../../models/health-tests/lipid_profile.model';
import { Kft } from '../../../models/health-tests/kft.model';
import { Lft } from '../../../models/health-tests/lft.model';
import { Sequelize } from 'sequelize-typescript';
import {samplifyConfig } from 'config/envConfig';


import { exec } from 'child_process';
import { promisify } from 'util';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { randomUUID } from 'crypto';
import * as muhammara from 'muhammara';
const execPromise = promisify(exec);




const BUCKET_NAME_REPORTS=process.env.BUCKET_NAME_REPORTS;

@Injectable()
export class CampProcessor {
  private readonly logger = new Logger(CampProcessor.name);
  private readonly apiKey = process.env.SAMPLIFY_API_KEY ; // Your API key from Sathi portal
  private readonly customerCode = samplifyConfig.customerCode;
  private readonly reportRenderTimeoutMs = 60000;

  constructor(
   @InjectModel(CampListItem) private readonly campListItemModel: typeof CampListItem,
    @InjectModel(CampList) private readonly campListModel: typeof CampList,
    @InjectModel(DRIVERMASTER) private readonly driverModel: typeof DRIVERMASTER,
    @InjectModel(driverhealthcheckup) private readonly driverHealthCheckupModel: typeof driverhealthcheckup,
    private readonly phlebotomistService: PhlebotomistService,
    private readonly healthCheckupService: HealthCheckupService,
    @InjectConnection()
    private readonly sequelize: Sequelize,
        @InjectModel(Cbc)
        private readonly cbcModel: typeof Cbc,
    
        @InjectModel(Biochemistry)
        private readonly biochemistryModel: typeof Biochemistry,
    
        @InjectModel(LipidProfile)
        private readonly lipidProfileModel: typeof LipidProfile,
    
        @InjectModel(Kft)
        private readonly kftModel: typeof Kft,
    
        @InjectModel(Lft)
        private readonly lftModel: typeof Lft,

  ) {}


  private getHeaders() {
    return {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      'api-key': this.apiKey,
      'customer-code': this.customerCode,
      // 'customer-code': 'TST',
      'ngrok-skip-browser-warning': 'y',
    };
  }

  async processCamp(payload: {
    camp_unique_id: string;
    camp_patients: any[];
    phlebo_details: any[];
  }) {
    const { camp_unique_id, camp_patients, phlebo_details } = payload;
    if (
      camp_unique_id === undefined ||
      camp_unique_id === null ||
      String(camp_unique_id).trim() === ''
    ) {
      this.logger.warn(
        '[processCamp] Skipped: camp_unique_id is missing from payload (avoid invalid Sequelize query)',
      );
      return {
        success: false,
        message: 'camp_unique_id is required',
        camp_unique_id: camp_unique_id as unknown as string,
        patient_count: 0,
      };
    }
    const safePatients = Array.isArray(camp_patients) ? camp_patients : [];
    const safePhlebos = Array.isArray(phlebo_details) ? phlebo_details : [];
    this.logger.log(
      `[processCamp] Step 1: Processing started for camp=${camp_unique_id || 'unknown'} patients=${safePatients.length} phlebotomists=${safePhlebos.length}`,
    );

    this.logger.log('[processCamp] Step 2: Fetching camp from DB by camp_unique_id');
    const camp = await this.campListModel.findOne({ where: { camp_unique_id } });
    if (!camp) throw new NotFoundException('Camp not found');
    this.logger.log(`[processCamp] Step 3: Camp found id=${camp.id} center_id=${camp.center_id}`);

    try {
      // --- Process Phlebo Assigning ---
      this.logger.log('[processCamp] Step 4: Processing phlebotomists');
      await this.processPhlebotomists(camp, safePhlebos);
      this.logger.log('[processCamp] Step 5: Phlebotomist processing complete');

      // --- Process Patients Reports ---
      this.logger.log('[processCamp] Step 6: Processing patient reports');
      await this.processPatients(camp, safePatients);
      this.logger.log('[processCamp] Step 7: Patient report processing complete');

      return {
        success: true,
        message: 'Camp processed successfully',
        camp_unique_id: camp.camp_unique_id,
        patient_count: safePatients.length,
      };
    } catch (error) {
      this.logger.error(
        `[processCamp] Failed for camp=${camp_unique_id || 'unknown'}: ${error?.message || error}`,
        (error as any)?.stack,
      );
      throw error; // Re-throw to propagate the error
    }
  }

  private async processPhlebotomists(camp: any, phlebo_details: any[]) {
    if (!phlebo_details?.length) {
      this.logger.log(`[processPhlebotomists] No phlebotomists provided for camp_id=${camp.id}`);
      return;
    }
    this.logger.log(`[processPhlebotomists] Starting ${phlebo_details.length} phlebotomist records for camp_id=${camp.id}`);

    if (phlebo_details?.length) {

        await Promise.all(
          phlebo_details.map(async (phelbo, index) => {
            this.logger.log(
              `[processPhlebotomists] [${index + 1}/${phlebo_details.length}] Searching phlebotomist phone=${phelbo?.phone || 'unknown'}`,
            );
            const existing = await this.phlebotomistService.searchPhlebotomists(
              camp.center_id, phelbo.phone,
            );
            this.logger.log(
              `[processPhlebotomists] [${index + 1}/${phlebo_details.length}] Search result count=${existing?.length || 0}`,
            );
            let pid = existing?.[0]?.id;
    
            if (!pid) {
              this.logger.log(
                `[processPhlebotomists] [${index + 1}/${phlebo_details.length}] Creating new phlebotomist for phone=${phelbo?.phone || 'unknown'}`,
              );
    
              const newPhlebo = await this.phlebotomistService.createPhlebotomist(
                { phone: phelbo.phone, name: phelbo.name }, camp.center_id
              );
              pid = newPhlebo.id;
              this.logger.log(
                `[processPhlebotomists] [${index + 1}/${phlebo_details.length}] Created phlebotomist id=${pid}`,
              );
            }
            camp.statusSamplify = 'PHLEBO_ASSIGNED';
            this.logger.log(
              `[processPhlebotomists] [${index + 1}/${phlebo_details.length}] DB change planned: camp_list.statusSamplify=PHLEBO_ASSIGNED for camp_id=${camp.id}`,
            );
            await camp.save();
            this.logger.log(
              `[processPhlebotomists] [${index + 1}/${phlebo_details.length}] DB change success: camp_id=${camp.id} statusSamplify=${camp.statusSamplify}`,
            );
    
            await this.phlebotomistService.addPhlebotomistsToCamp(
              camp.id, camp.center_id, { phlebotomist_ids: [pid] },
            );
            this.logger.log(
              `[processPhlebotomists] [${index + 1}/${phlebo_details.length}] Camp mapping updated with phlebotomist_id=${pid} for camp_id=${camp.id}`,
            );
          })
        );

    }
    
  }

  private async processPatients(camp: any, camp_patients: any[]) {
    this.logger.log(`[processPatients] Starting ${camp_patients?.length || 0} patient records for camp_id=${camp.id}`);

      await Promise.all(
        camp_patients.map(async (patient, index) => {
        this.logger.log(
          `[processPatients] [${index + 1}/${camp_patients.length}] Looking up driver by patient_ref_id=${patient?.patient_ref_id || 'unknown'}`,
        );
        const driver = await this.driverModel.findOne({ where: { employeeId: patient.patient_ref_id }});
        if (!driver) {
          this.logger.warn(
            `[processPatients] [${index + 1}/${camp_patients.length}] Driver not found for patient_ref_id=${patient?.patient_ref_id || 'unknown'}`,
          );
          return {success: false, message: 'Driver not found'};
        }

        this.logger.log(
          `[processPatients] [${index + 1}/${camp_patients.length}] Looking up camp_list_item by driver_id=${driver.id}, camp_id=${camp.id}`,
        );
        const item = await this.campListItemModel.findOne({ where: { driver_id: driver.id, camp_id: camp.id }});
        if (!item) {
          this.logger.warn(
            `[processPatients] [${index + 1}/${camp_patients.length}] Camp list item not found for driver_id=${driver.id}, camp_id=${camp.id}`,
          );
          return {success: false, message: 'Driver not found'};
        }

        const parameterMetadata = patient?.parameter_metadata ?? patient?.report_metadata;
        if (!parameterMetadata){
          this.logger.warn(
            `[processPatients] [${index + 1}/${camp_patients.length}] No parameter metadata for patient_ref_id=${patient?.patient_ref_id || 'unknown'}. Skipping DB updates.`,
          );
          return;
        }

        this.logger.log(
          `[processPatients] [${index + 1}/${camp_patients.length}] DB change planned: camp_list_item.id=${item.id} is_report_Uploaded=processing`,
        );
        item.is_report_Uploaded = 'processing';
        await item.save();
        this.logger.log(
          `[processPatients] [${index + 1}/${camp_patients.length}] DB change success: camp_list_item.id=${item.id} is_report_Uploaded=${item.is_report_Uploaded}`,
        );

        const folderPath = `${camp.camp_unique_id}-${driver.employeeId}-${driver.name}`;
        this.logger.log(
          `[processPatients] [${index + 1}/${camp_patients.length}] Downloading/uploading reports count=${Array.isArray(patient?.reports) ? patient.reports.length : 0} folder=${folderPath}`,
        );

        const {uploadedUrls , pdfBuffers } = await this.downloadAndUploadReports(folderPath, patient.reports);
        this.logger.log(
          `[processPatients] [${index + 1}/${camp_patients.length}] Report upload result: uploaded=${uploadedUrls.length}, pdfBuffers=${pdfBuffers.length}`,
        );
        const temp: Buffer[] = [];
        if (item.driver_health_checkup_id){
          this.logger.log(
            `[processPatients] [${index + 1}/${camp_patients.length}] Generating internal report for healthCheckupId=${item.driver_health_checkup_id}`,
          );
          const pdfReportBuffer = await this.makeReport(item.driver_health_checkup_id);
          this.logger.log(
            `[processPatients] [${index + 1}/${camp_patients.length}] Updating health checkup and test tables for healthCheckupId=${item.driver_health_checkup_id}`,
          );
          await this.updateHealthCheckup(item.driver_health_checkup_id, parameterMetadata);
          // pdfBuffers.push(pdfReportBuffer); 
          temp.push(...pdfReportBuffer);
        }

        temp.push(...pdfBuffers);
        const mergedUrl = await this.mergedReports(temp, folderPath);
        this.logger.log(
          `[processPatients] [${index + 1}/${camp_patients.length}] Merged report URL generated=${mergedUrl || 'none'}`,
        );
        
        item.test_report = parameterMetadata;
        this.logger.log(
          `[processPatients] [${index + 1}/${camp_patients.length}] DB change planned: camp_list_item.id=${item.id} test_report + report URLs`,
        );
        
        if (uploadedUrls.length >= 0) {
          item.is_report_Uploaded = 'success';
          item.merged_report_url = mergedUrl.toString();
          item.report_url = uploadedUrls;
          await item.save();
          this.logger.log(
            `[processPatients] [${index + 1}/${camp_patients.length}] DB change success: camp_list_item.id=${item.id} is_report_Uploaded=success report_url_count=${uploadedUrls.length}`,
          );
        } else {
          item.is_report_Uploaded = 'failed';
          await item.save();
          this.logger.warn(
            `[processPatients] [${index + 1}/${camp_patients.length}] DB change success: camp_list_item.id=${item.id} is_report_Uploaded=failed`,
          );
        }
        
        
        })
    );

    // final status set externally by worker if needed
  }

  private async updateHealthCheckup(healthCheckupId: number, testReport: any[]) {
    this.logger.log(`[updateHealthCheckup] Step 1: Fetching driverhealthcheckup id=${healthCheckupId}`);
    const healthCheckup = await this.driverHealthCheckupModel.findOne({
      where: { id: healthCheckupId },
    });

    if (!healthCheckup) {
      this.logger.warn(`[updateHealthCheckup] No driverhealthcheckup found for id=${healthCheckupId}`);
      return;
    }

    const existingTests = healthCheckup.selected_test ? { ...healthCheckup.selected_test } : {};
    const newTestData: any = {};

    testReport.forEach((report) => {
      const testName = report.testName.replace(/^\d+~/, '').trim();
      newTestData[testName] = report;
    });

    healthCheckup.selected_test = { ...existingTests, ...newTestData };
    this.logger.log(
      `[updateHealthCheckup] Step 2: Prepared selected_test merge with ${Object.keys(newTestData).length} test groups for id=${healthCheckupId}`,
    );

    const { concerns } = this.generateConcerns(testReport);
    if (healthCheckup.concerns && Array.isArray(healthCheckup.concerns)) {
        healthCheckup.concerns = [...healthCheckup.concerns, ...concerns];
    } else {
    healthCheckup.concerns = [...(concerns || [])];
    }

    this.logger.log(
      `[updateHealthCheckup] Step 3: DB change planned: save driverhealthcheckup id=${healthCheckupId} concerns_added=${concerns?.length || 0}`,
    );
    await healthCheckup.save();
    this.logger.log(`[updateHealthCheckup] Step 4: DB change success: driverhealthcheckup id=${healthCheckupId} saved`);
    this.logger.log(`[updateHealthCheckup] Step 5: Updating per-test result tables for healthcheckup id=${healthCheckupId}`);
    await this.saveResultsPerTable(healthCheckupId,testReport);
  }

  private generateConcerns(testReport: any[]) {
    const concerns: any[] = [];
    const testsWithConcerns: string[] = [];

    testReport.forEach((report) => {
      const testName = report.testName.replace(/^\d+~/, '').trim();
      let hasConcern = false;

      report.observations.forEach((obs: any) => {
        if (obs.value && obs.value !== 'HEAD') {
          const abnormal = this.isAbnormal(obs.value, obs.referenceRange);
          if (abnormal) {
            hasConcern = true;
            concerns.push({
              id: `${obs.observationName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`,
              testName,
              observationName: obs.observationName,
              value: obs.value,
              unit: obs.unit,
              referenceRange: obs.referenceRange,
              level: 'HIGH',
              type: obs.observationName.replace(/\s+/g, '_').toUpperCase(),
              recommendation: 'Consult Doctor',
            });
          }
        }
      });

      if (hasConcern) testsWithConcerns.push(testName);
    });

    return { concerns, testsWithConcerns };
  }

  private isAbnormal(valueStr: string, refRange: string) {
    const num = parseFloat(valueStr);
    if (isNaN(num) || !refRange) return false;

    if (refRange.includes('-')) {
      const [min, max] = refRange.split('-').map((v) => parseFloat(v.trim()));
      return num < min || num > max;
    }

    if (refRange.startsWith('<=')) return num > parseFloat(refRange.slice(2));
    if (refRange.startsWith('<')) return num >= parseFloat(refRange.slice(1));
    if (refRange.startsWith('>=')) return num < parseFloat(refRange.slice(2));
    if (refRange.startsWith('>')) return num <= parseFloat(refRange.slice(1));

    return false;
  }

  /** Download PDFs from URLs and return buffers only (no S3 upload). Use when docs are already on S3. */
  private async downloadPdfBuffers(urls: string[]): Promise<Buffer[]> {
    const buffers: Buffer[] = [];
    for (const url of urls) {
      try {
        this.logger.debug(`ECG/downloadPdfBuffers: fetching URL ${url}`);
        const response = await axios.get(url, {
          responseType: 'arraybuffer',
          timeout: 20000,
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HealthApp/1.0)' },
        });
        buffers.push(Buffer.from(response.data));
      } catch (error) {
        this.logger.error(
          `ECG/downloadPdfBuffers: download failed for ${url} - ${error?.message || error}`,
          (error as any)?.stack,
        );
      }
    }

    this.logger.debug(
      `ECG/downloadPdfBuffers: successfully downloaded ${buffers.length} buffer(s) for ${urls.length} URL(s)`,
    );
    return buffers;
  }

  private async downloadAndUploadReports(folderPath: string, reports: string[]) {
    const uploadedUrls: string[] = [];
    const pdfBuffers: Buffer[] = [];
    this.logger.log(
      `[downloadAndUploadReports] Starting for folder=${folderPath} report_count=${Array.isArray(reports) ? reports.length : 0}`,
    );
    for (const reportUrl of reports) {
      try {
        this.logger.debug(`[downloadAndUploadReports] Downloading report URL=${reportUrl}`);
        const response = await axios.get(reportUrl, {
          responseType: 'arraybuffer',
          timeout: 20000,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (compatible; HealthApp/1.0)',
          },
        });

        const path = new URL(reportUrl).pathname;
        let filename = path.split('/').pop() || `report_${Date.now()}.pdf`;
        pdfBuffers.push(Buffer.from(response.data));
        const multerFile = {
          buffer: Buffer.from(response.data),
          originalname: filename,
          mimetype: response.headers['content-type'] || 'application/pdf',
        } as Express.Multer.File;

        const s3Url = await uploadToS3WithFolder(multerFile, BUCKET_NAME_REPORTS, `${folderPath}`);

        uploadedUrls.push(s3Url);
        this.logger.debug(`[downloadAndUploadReports] Uploaded report to S3 URL=${s3Url}`);
      } catch (error) {
        this.logger.error(
          `[downloadAndUploadReports] Download/Upload failed for URL=${reportUrl}: ${error?.message || error}`,
          (error as any)?.stack,
        );
      }
    }

    this.logger.log(
      `[downloadAndUploadReports] Completed for folder=${folderPath}: uploaded=${uploadedUrls.length}, buffers=${pdfBuffers.length}`,
    );
    return {uploadedUrls, pdfBuffers};
  }

  
// ... keep your other imports like Logger, uploadToS3WithFolder, etc.

  private async mergedReports(pdfBuffers: Buffer[], folderPath: string) {
    this.logger.log(
      `[mergedReports] Starting merge for folder=${folderPath} buffers=${Array.isArray(pdfBuffers) ? pdfBuffers.length : 0}`,
    );
    
    // 1. Basic Validation
    if (!pdfBuffers || pdfBuffers.length === 0) {
      this.logger.warn('No valid PDFs to merge');
      return "";
    }

    // 2. Optimization: Single PDF check
    if (pdfBuffers.length === 1) {
      this.logger.debug('Only 1 PDF found, skipping merge.');
      return await this.uploadToS3(pdfBuffers[0], folderPath);
    }

    try {
      this.logger.debug(`Merging ${pdfBuffers.length} PDFs using Muhammara (In-Memory)...`);

      // 3. Filter only valid PDF buffers (Magic bytes check)
      const validBuffers = pdfBuffers.filter(buf => buf && buf.slice(0, 4).toString() === '%PDF');
      this.logger.log(`[mergedReports] Valid PDF buffers=${validBuffers.length}/${pdfBuffers.length}`);

      if (validBuffers.length === 0) {
         throw new Error("No valid PDF files found to merge.");
      }

      // 4. Initialize Memory Streams
      // We create a writable stream in memory to hold the final result
      const outStream = new muhammara.PDFWStreamForBuffer();

      // We start the PDF writer using the FIRST buffer as the base
      const pdfWriter = muhammara.createWriterToModify(
          new muhammara.PDFRStreamForBuffer(validBuffers[0]), 
          outStream
      );

      // 5. Append remaining PDFs
      for (let i = 1; i < validBuffers.length; i++) {
        const pdfReaderStream = new muhammara.PDFRStreamForBuffer(validBuffers[i]);
        // appendPDFPagesFromPDF safely copies pages from source to destination
        pdfWriter.appendPDFPagesFromPDF(pdfReaderStream);
      }

      // 6. Finalize the PDF structure
      pdfWriter.end();

      // 7. Extract the final Buffer
      const mergedPdfBytes = outStream.buffer;
      this.logger.debug('PDF merge completed successfully.');

      // 8. Upload
      const uploadedMergedUrl = await this.uploadToS3(mergedPdfBytes, folderPath);
      this.logger.log(`[mergedReports] Merge+upload success URL=${uploadedMergedUrl}`);
      return uploadedMergedUrl;

    } catch (error) {
      this.logger.error(`Merge/Upload failed: ${error.message}`, error.stack);
      
      // --- FALLBACK MECHANISM ---
      // Upload the first valid PDF if merging failed
      if (pdfBuffers[0]) {
          this.logger.warn('Falling back to uploading the first PDF only due to merge failure.');
          const fallbackUrl = await this.uploadToS3(pdfBuffers[0], folderPath);
          this.logger.warn(`[mergedReports] Fallback upload success URL=${fallbackUrl}`);
          return fallbackUrl;
      }
      return null;
    }
  }

  // Helper to keep the main function clean
  private async uploadToS3(buffer: Buffer, folderPath: string) {
      const filename = `merged_reports_${Date.now()}.pdf`; 
      this.logger.debug(`[uploadToS3] Uploading merged report filename=${filename} folder=${folderPath}`);
      const multerFile = {
        buffer: buffer,
        originalname: filename,
        mimetype: 'application/pdf',
      } as unknown as Express.Multer.File;

      const s3Url = await uploadToS3WithFolder(multerFile, BUCKET_NAME_REPORTS, `${folderPath}/MergedReports`);
      this.logger.debug(`Uploaded PDF to S3: ${s3Url}`);
      return s3Url;
  }

  /**
   * Loads health-checkup data in-process and renders the main LMC PDF (Puppeteer).
   * Does not append ECG or merge with other reports.
   */
  private async buildLmcHealthCheckupPdfBundle(
    id: number,
  ): Promise<{ mainPdf: Buffer; meta: any } | null> {
    if (!id) {
      this.logger.error('No ID provided');
      return null;
    }
    this.logger.log(
      `[buildLmcHealthCheckupPdfBundle] Loading report data in-process for healthCheckupId=${id}`,
    );
    const payload = await this.healthCheckupService.getDriverHealthReportDownloadPayload(id);
    if (!payload) {
      this.logger.error(
        `[buildLmcHealthCheckupPdfBundle] No payload for healthCheckupId=${id}`,
      );
      return null;
    }
    if (!payload.packageMetaData?.getPackageData?.length) {
      this.logger.error(
        `[buildLmcHealthCheckupPdfBundle] No package data for healthCheckupId=${id}`,
      );
      return null;
    }
    return buildLmcHealthCheckupMainPdfFromPayload(
      payload,
      this.logger,
      this.reportRenderTimeoutMs,
    );
  }

  private async makeReport(id: number) {
    const bundle = await this.buildLmcHealthCheckupPdfBundle(id);
    if (!bundle) {
      return null;
    }
    const { mainPdf: mainReportBuffer, meta } = bundle;
    const ecgUrl = meta?.ecg_unit?.doc;
    if (!ecgUrl || typeof ecgUrl !== 'string' || !ecgUrl.startsWith('http')) {
      return [mainReportBuffer];
    }
    let ecgBuffer: Buffer;
    try {
      this.logger.log(`Downloading ECG: ${ecgUrl}`);
      const resECG = await axios.get(ecgUrl, {
        responseType: 'arraybuffer',
        timeout: 5000,
        maxContentLength: 5 * 1024 * 1024,
      });
      ecgBuffer = Buffer.from(resECG.data);
    } catch (err) {
      this.logger.warn(`ECG download failed: ${err.message}`);
      return [mainReportBuffer];
    }
    if (ecgBuffer.slice(0, 4).toString() !== '%PDF') {
      this.logger.warn('ECG is not a valid PDF.');
      return [mainReportBuffer];
    }
    return [mainReportBuffer, ecgBuffer];
  }
  private parseVal(val: string): number | null {
    if (!val || val === 'HEAD' || val.trim() === '') return null;
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
  }


  // Helper to turn the "observations" array into a simple Key-Value object
  // e.g., [{"observationName": "Haemoglobin", "value": "15.6"}] -> {"Haemoglobin": "15.6"}
  private normalizeObservations(observations: any[]): Record<string, string> {
    const map = {};
    if (!observations) return map;
    for (const obs of observations) {
      if (obs.observationName && obs.value) {
        map[obs.observationName.trim()] = obs.value;
      }
    }
    return map;
  }

  async saveResultsPerTable(driverId: number, reports: any[]) {
    this.logger.log(
      `[saveResultsPerTable] Step 1: Started for driverhealthcheckups_id=${driverId} reports=${Array.isArray(reports) ? reports.length : 0}`,
    );

    if (!reports || !Array.isArray(reports)) {
      throw new Error('Invalid JSON format');
    }

    // 1. Prepare Data Objects (POJOs)
    // We initialize them with the ID. If no data is found for a specific test, 
    // we simply won't have fields populated, but the ID ensures connection.
    const cbcData: any = { driverhealthcheckups_id: driverId };
    const bioData: any = { driverhealthcheckups_id: driverId };
    const lipidData: any = { driverhealthcheckups_id: driverId };
    const kftData: any = { driverhealthcheckups_id: driverId };
    const lftData: any = { driverhealthcheckups_id: driverId };

    // Flags to check if we actually found data for these tables
    let hasCbc = false;
    let hasBio = false;
    let hasLipid = false;
    let hasKft = false;
    let hasLft = false;

    // 2. Parse JSON and Fill Objects
    for (const report of reports) {
      const obsMap = this.normalizeObservations(report.observations);
      const testCode = report.testCode ? report.testCode.toString() : '';

      // --- CBC (6085) ---
      if (testCode === '6085') {
        hasCbc = true;
        cbcData.haemoglobin = this.parseVal(obsMap['Haemoglobin']);
        cbcData.packed_cell_volume = this.parseVal(obsMap['Packed Cell, Volume']);
        cbcData.rbc_count = this.parseVal(obsMap['RBC Count']);
        cbcData.mcv = this.parseVal(obsMap['MCV']);
        cbcData.mch = this.parseVal(obsMap['MCH']);
        cbcData.mchc = this.parseVal(obsMap['MCHC']);
        cbcData.rdw_cv = this.parseVal(obsMap['RDW']);
        cbcData.total_leucocyte_count = this.parseVal(obsMap['Total Leucocyte Count (TLC)']);
        // Diff
        cbcData.neutrophils = this.parseVal(obsMap['Neutrophils']);
        cbcData.lymphocytes = this.parseVal(obsMap['Lymphocytes']);
        cbcData.monocytes = this.parseVal(obsMap['Monocytes']);
        cbcData.eosinophils = this.parseVal(obsMap['Eosinophils']);
        cbcData.basophils = this.parseVal(obsMap['Basophils']);
        // Abs
        cbcData.abs_neutrophil_count = this.parseVal(obsMap['Absolute Neutrophil Count']);
        cbcData.abs_lymphocyte_count = this.parseVal(obsMap['Absolute Lymphocyte Count']);
        cbcData.abs_monocyte_count = this.parseVal(obsMap['Absolute Monocyte Count']);
        cbcData.abs_eosinophil_count = this.parseVal(obsMap['Absolute Eosinophil Count']);
        cbcData.abs_basophil_count = this.parseVal(obsMap['Absolute Basophil Count']);
        // Platelet
        cbcData.platelet_count = this.parseVal(obsMap['Platelet Count']);
        cbcData.mpv = this.parseVal(obsMap['MPV']);
      }

      // --- Random Sugar (5854) ---
      if (testCode === '5854') {
        hasBio = true;
        bioData.glucose = this.parseVal(obsMap['Random Glucose']);
      }

      // --- Cholesterol (5825) ---
      if (testCode === '5825') {
        hasLipid = true;
        lipidData.cholesterol = this.parseVal(obsMap['Cholesterol']);
      }

      // --- KFT (10364) ---
      if (testCode === '10364') {
        hasKft = true;
        kftData.urea = this.parseVal(obsMap['Urea']);
        kftData.bun = this.parseVal(obsMap['Blood Urea Nitrogen']);
        kftData.creatinine = this.parseVal(obsMap['Creatinine']);
        kftData.egfr_mdrd = this.parseVal(obsMap['eGFR by MDRD']);
        kftData.egfr_ckd_epi = this.parseVal(obsMap['eGFR by CKD EPI 2021']);
        kftData.bun_creatinine_ratio = this.parseVal(obsMap['Bun/Creatinine  Ratio']);
        kftData.uric_acid = this.parseVal(obsMap['Uric Acid']);
        kftData.calcium = this.parseVal(obsMap['Calcium (Total)']);
        kftData.sodium = this.parseVal(obsMap['Sodium']);
        kftData.potassium = this.parseVal(obsMap['Potassium']);
        kftData.chloride = this.parseVal(obsMap['Chloride']);
        kftData.phosphorus = this.parseVal(obsMap['Phosphorus(inorg)']);
      }

      // --- LFT (9125) ---
      if (testCode === '9125') {
        hasLft = true;
        lftData.total_protein = this.parseVal(obsMap['Total Protein']);
        lftData.albumin = this.parseVal(obsMap['Albumin']);
        lftData.globulin = this.parseVal(obsMap['Globulin']);
        lftData.ag_ratio = this.parseVal(obsMap['A.G. ratio']);
        lftData.bilirubin_total = this.parseVal(obsMap['Bilirubin (Total)']);
        lftData.bilirubin_direct = this.parseVal(obsMap['Bilirubin (Direct)']);
        lftData.bilirubin_indirect = this.parseVal(obsMap['Bilirubin (Indirect)']);
        lftData.sgot = this.parseVal(obsMap['SGOT- Aspartate Transaminase (AST)']);
        lftData.sgpt = this.parseVal(obsMap['SGPT- Alanine Transaminase (ALT)']);
        lftData.ast_alt_ratio = this.parseVal(obsMap['AST/ALT Ratio']);
        lftData.alkaline_phosphatase = this.parseVal(obsMap['Alkaline Phosphatase']);
        lftData.ggtp = this.parseVal(obsMap['GGTP (Gamma GT), Serum']);
      }
    }

    // 3. Save to Database using Transaction & Upsert
    const transaction = await this.sequelize.transaction();
    this.logger.log(`[saveResultsPerTable] Step 2: DB transaction started for driverhealthcheckups_id=${driverId}`);

    try {
      const upsertOptions = { transaction };

      // We only execute upsert if data was actually found for that category
      if (hasCbc) {
        this.logger.log(`[saveResultsPerTable] DB upsert planned: cbc for driverhealthcheckups_id=${driverId}`);
        await this.cbcModel.upsert(cbcData, upsertOptions);
        this.logger.log(`[saveResultsPerTable] DB upsert success: cbc for driverhealthcheckups_id=${driverId}`);
      }
      if (hasBio) {
        this.logger.log(`[saveResultsPerTable] DB upsert planned: biochemistry for driverhealthcheckups_id=${driverId}`);
        await this.biochemistryModel.upsert(bioData, upsertOptions);
        this.logger.log(`[saveResultsPerTable] DB upsert success: biochemistry for driverhealthcheckups_id=${driverId}`);
      }
      if (hasLipid) {
        this.logger.log(`[saveResultsPerTable] DB upsert planned: lipid_profile for driverhealthcheckups_id=${driverId}`);
        await this.lipidProfileModel.upsert(lipidData, upsertOptions);
        this.logger.log(`[saveResultsPerTable] DB upsert success: lipid_profile for driverhealthcheckups_id=${driverId}`);
      }
      if (hasKft) {
        this.logger.log(`[saveResultsPerTable] DB upsert planned: kft for driverhealthcheckups_id=${driverId}`);
        await this.kftModel.upsert(kftData, upsertOptions);
        this.logger.log(`[saveResultsPerTable] DB upsert success: kft for driverhealthcheckups_id=${driverId}`);
      }
      if (hasLft) {
        this.logger.log(`[saveResultsPerTable] DB upsert planned: lft for driverhealthcheckups_id=${driverId}`);
        await this.lftModel.upsert(lftData, upsertOptions);
        this.logger.log(`[saveResultsPerTable] DB upsert success: lft for driverhealthcheckups_id=${driverId}`);
      }

      await transaction.commit();
      this.logger.log(
        `[saveResultsPerTable] Step 3: Transaction committed for driverhealthcheckups_id=${driverId} (cbc=${hasCbc}, bio=${hasBio}, lipid=${hasLipid}, kft=${hasKft}, lft=${hasLft})`,
      );
      
      return { status: 'success', message: 'Health report data saved successfully' };

    } catch (error) {
      await transaction.rollback();
      this.logger.error(
        `[saveResultsPerTable] Transaction rolled back for driverhealthcheckups_id=${driverId}: ${error?.message || error}`,
        (error as any)?.stack,
      );
    }
  }


}
