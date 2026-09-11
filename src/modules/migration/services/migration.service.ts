import { Injectable, Logger } from '@nestjs/common';
import { Transaction } from 'sequelize';
import { DatabaseConnectionService } from './database-connection.service';
import { BackupService } from './backup.service';
import { ValidationService } from './validation.service';
import { DataTransformationService } from './data-transformation.service';
import { MigrationLog } from '../models/migration-log.model';
import { DRIVERMASTER } from '../../../models/DriverMaster';
import { driverhealthcheckup } from '../../../models/DriverHealthCheckup';
import { CopyOperation, CopyResult, MigrationStatus, BatchResult } from '../types/migration.types';
import { getMigrationConfig } from '../config/migration.config';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';

/**
 * Migration Service
 * Orchestrates the entire data copying process with safety and rollback capabilities
 */
@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);
  private readonly config = getMigrationConfig();
  private activeOperations = new Map<string, CopyOperation>();

  constructor(
    private readonly databaseConnection: DatabaseConnectionService,
    private readonly backupService: BackupService,
    private readonly validationService: ValidationService,
    private readonly dataTransformation: DataTransformationService,
  ) {}

  /**
   * Copies driver data from Picaso to LMC
   */
  async copyDriverData(operationId: string): Promise<CopyResult> {
    const startTime = Date.now();
    let copiedRecords = 0;
    let skippedRecords = 0;
    let failedRecords = 0;
    const errors: string[] = [];
    let backupId: string | undefined;

    try {
      this.logger.log(`Starting driver data copy operation: ${operationId}`);

      // Create backup if enabled
      if (this.config.enableBackup) {
        backupId = await this.backupService.createBackup('DRIVERMASTERs', 1);
        this.logger.log(`Created backup: ${backupId}`);
      }

      // Fetch data from Picaso
      const picasoData = await this.fetchDriverDataFromPicaso();
      this.logger.log(`Fetched ${picasoData.length} records from Picaso`);

      if (picasoData.length === 0) {
        return {
          success: true,
          copiedRecords: 0,
          skippedRecords: 0,
          failedRecords: 0,
          errors: ['No data found in Picaso'],
          operationId,
          duration: Date.now() - startTime,
          backupId,
        };
      }

      // Process records in batches
      const batchSize = this.config.batchSize;
      const totalBatches = Math.ceil(picasoData.length / batchSize);

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const start = batchIndex * batchSize;
        const end = Math.min(start + batchSize, picasoData.length);
        const batch = picasoData.slice(start, end);

        this.logger.log(`Processing batch ${batchIndex + 1}/${totalBatches} (records ${start + 1}-${end})`);

        for (const record of batch) {
          try {
            // Validate record
            const validation = this.validationService.validateDriverData(record);
            if (!validation.isValid) {
              failedRecords++;
              errors.push(`Record ${copiedRecords + skippedRecords + failedRecords}: ${validation.errors.join(', ')}`);
              continue;
            }

            // Transform record
            const transformation = this.dataTransformation.transformDriverData(record);
            if (!transformation.isValid) {
              failedRecords++;
              errors.push(`Record ${copiedRecords + skippedRecords + failedRecords}: ${transformation.errors.join(', ')}`);
              continue;
            }

            // Check for duplicates
            const existingRecord = await this.checkDriverDuplicate(transformation.transformedRecord);
            if (existingRecord) {
              skippedRecords++;
              this.logger.debug(`Skipped duplicate record: ${transformation.transformedRecord.driverId}`);
              continue;
            }

            // Save to LMC database
            await this.saveDriverRecord(transformation.transformedRecord);
            copiedRecords++;

            this.logger.debug(`Successfully copied driver record: ${transformation.transformedRecord.driverId}`);
          } catch (error) {
            failedRecords++;
            const errorMessage = `Record ${copiedRecords + skippedRecords + failedRecords}: ${error.message}`;
            errors.push(errorMessage);
            this.logger.error(errorMessage);
          }
        }

        // Update progress
        this.updateProgress(operationId, {
          processedRecords: copiedRecords + skippedRecords + failedRecords,
          totalRecords: picasoData.length,
          currentBatch: batchIndex + 1,
          totalBatches,
        });
      }

      const duration = Date.now() - startTime;
      this.logger.log(`Driver data copy completed: ${copiedRecords} copied, ${skippedRecords} skipped, ${failedRecords} failed`);

      return {
        success: failedRecords === 0,
        copiedRecords,
        skippedRecords,
        failedRecords,
        errors: errors.slice(0, 100), // Limit error messages
        operationId,
        duration,
        backupId,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Driver data copy failed: ${error.message}`);
      
      return {
        success: false,
        copiedRecords,
        skippedRecords,
        failedRecords,
        errors: [error.message],
        operationId,
        duration,
        backupId,
      };
    }
  }

  /**
   * Copies health checkup data from Picaso to LMC
   */
  async copyHealthCheckupData(operationId: string): Promise<CopyResult> {
    const startTime = Date.now();
    let copiedRecords = 0;
    let skippedRecords = 0;
    let failedRecords = 0;
    const errors: string[] = [];
    let backupId: string | undefined;

    try {
      this.logger.log(`Starting health checkup data copy operation: ${operationId}`);

      // Create backup if enabled
      if (this.config.enableBackup) {
        try {
          backupId = await this.backupService.createBackup('driverhealthcheckups', 1);
          this.logger.log(`Created backup: ${backupId}`);
        } catch (error) {
          this.logger.warn(`Backup creation failed, continuing without backup: ${error.message}`);
          // Continue without backup for health checkup due to large JSON data
        }
      }

      // Fetch data from Picaso
      const picasoData = await this.fetchHealthCheckupDataFromPicaso();
      this.logger.log(`Fetched ${picasoData.length} records from Picaso`);

      if (picasoData.length === 0) {
        return {
          success: true,
          copiedRecords: 0,
          skippedRecords: 0,
          failedRecords: 0,
          errors: ['No data found in Picaso'],
          operationId,
          duration: Date.now() - startTime,
          backupId,
        };
      }

      // Process records in batches
      const batchSize = this.config.batchSize;
      const totalBatches = Math.ceil(picasoData.length / batchSize);

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const start = batchIndex * batchSize;
        const end = Math.min(start + batchSize, picasoData.length);
        const batch = picasoData.slice(start, end);

        this.logger.log(`Processing batch ${batchIndex + 1}/${totalBatches} (records ${start + 1}-${end})`);

        for (const record of batch) {
          try {
            // Validate record
            const validation = this.validationService.validateHealthCheckupData(record);
            if (!validation.isValid) {
              failedRecords++;
              const errorMsg = `Record ${copiedRecords + skippedRecords + failedRecords}: ${validation.errors.join(', ')}`;
              errors.push(errorMsg);
              this.logger.error(errorMsg);
              continue;
            }

            // Transform record
            const transformation = this.dataTransformation.transformHealthCheckupData(record);
            if (!transformation.isValid) {
              failedRecords++;
              const errorMsg = `Record ${copiedRecords + skippedRecords + failedRecords}: ${transformation.errors.join(', ')}`;
              errors.push(errorMsg);
              this.logger.error(errorMsg);
              continue;
            }

            // Check for duplicates
            const existingRecord = await this.checkHealthCheckupDuplicate(transformation.transformedRecord);
            if (existingRecord) {
              skippedRecords++;
              this.logger.debug(`Skipped duplicate record: ${transformation.transformedRecord.uniqueId}`);
              continue;
            }

            // Save to LMC database
            await this.saveHealthCheckupRecord(transformation.transformedRecord);
            copiedRecords++;

            this.logger.debug(`Successfully copied health checkup record: ${transformation.transformedRecord.uniqueId}`);
          } catch (error) {
            failedRecords++;
            const errorMessage = `Record ${copiedRecords + skippedRecords + failedRecords}: ${error.message}`;
            errors.push(errorMessage);
            this.logger.error(`Detailed error for record ${copiedRecords + skippedRecords + failedRecords}:`, error);
          }
        }

        // Update progress
        this.updateProgress(operationId, {
          processedRecords: copiedRecords + skippedRecords + failedRecords,
          totalRecords: picasoData.length,
          currentBatch: batchIndex + 1,
          totalBatches,
        });
      }

      const duration = Date.now() - startTime;
      this.logger.log(`Health checkup data copy completed: ${copiedRecords} copied, ${skippedRecords} skipped, ${failedRecords} failed`);

      return {
        success: failedRecords === 0,
        copiedRecords,
        skippedRecords,
        failedRecords,
        errors: errors.slice(0, 100), // Limit error messages
        operationId,
        duration,
        backupId,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Health checkup data copy failed: ${error.message}`);
      
      return {
        success: false,
        copiedRecords,
        skippedRecords,
        failedRecords,
        errors: [error.message],
        operationId,
        duration,
        backupId,
      };
    }
  }

  /**
   * Rolls back a migration operation
   */
  async rollbackMigration(operationId: string): Promise<CopyResult> {
    const startTime = Date.now();

    try {
      this.logger.log(`Starting rollback for operation: ${operationId}`);

      const operation = await MigrationLog.findByPk(operationId);
      if (!operation) {
        throw new Error('Migration operation not found');
      }

      if (!operation.backupId) {
        throw new Error('No backup available for rollback');
      }

      // Update status to rolling back
      await this.updateMigrationLog(operationId, 'ROLLED_BACK', {});

      // Restore backup
      const restoreResult = await this.backupService.restoreBackup(operation.backupId);

      if (!restoreResult) {
        throw new Error('Failed to restore backup');
      }

      const duration = Date.now() - startTime;
      this.logger.log(`Rollback completed for operation: ${operationId}`);

      return {
        success: true,
        copiedRecords: 0,
        skippedRecords: 0,
        failedRecords: 0,
        errors: [],
        operationId,
        duration,
        rolledBackRecords: 0, // Will be calculated based on backup
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Rollback failed for operation ${operationId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gets the status of a migration operation
   */
  async getMigrationStatus(operationId: string): Promise<MigrationStatus | null> {
    try {
      const operation = await MigrationLog.findByPk(operationId);
      if (!operation) {
        return null;
      }

      const progress = operation.totalRecords > 0
        ? Math.round((operation.processedRecords / operation.totalRecords) * 100)
        : 0;

      const estimatedCompletion = this.calculateEstimatedCompletion(operation);

      return {
        operationId: operation.id,
        status: operation.status,
        progress,
        totalRecords: operation.totalRecords,
        processedRecords: operation.processedRecords,
        failedRecords: operation.failedRecords,
        startTime: operation.startTime,
        estimatedCompletion,
        errorCount: operation.errorLogs?.length || 0,
        warningCount: 0, // TODO: Add warning tracking
        backupId: operation.backupId,
        metadata: operation.metadata,
      };
    } catch (error) {
      this.logger.error(`Failed to get migration status for ${operationId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gets the actual column names from Picaso database for debugging
   */
  async getPicasoTableInfo(tableName: string): Promise<any[]> {
    try {
      const query = `
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = '${tableName}'
        ORDER BY ORDINAL_POSITION
      `;

      return await this.databaseConnection.executeQuery(query);
    } catch (error) {
      this.logger.error(`Failed to get table info for ${tableName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetches driver data from Picaso
   */
  private async fetchDriverDataFromPicaso(): Promise<any[]> {
    try {
      const query = `
        SELECT
          PatientID,
          PicasoID,
          PatientName,
          Sex,
          DOB,
          ContactNo,
          BloodGroup,
          PermanentAddress,
          MailingAddress,
          State,
          District
        FROM Picaso_PatientMaster
        WHERE PatientID IS NOT NULL
      `;

      return await this.databaseConnection.executeQuery(query);
    } catch (error) {
      this.logger.error(`Failed to fetch driver data from Picaso: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetches health checkup data from Picaso
   */
  private async fetchHealthCheckupDataFromPicaso(): Promise<any[]> {
    try {
      const query = `
        SELECT
          ID,
          ConsultingID,
          PicasoID,
          PatientName,
          ContactNo,
          Age,
          Gender,
          BPsystolic,
          BPdiastolic,
          PulseRate,
          SPO2,
          Temperature,
          Height,
          Weight,
          AddedDate,
          AddedBy
        FROM Picaso_PatientConsultingSheetdetails
        WHERE PicasoID IS NOT NULL AND ConsultingID IS NOT NULL
      `;

      return await this.databaseConnection.executeQuery(query);
    } catch (error) {
      this.logger.error(`Failed to fetch health checkup data from Picaso: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gets sample health checkup data from Picaso for debugging
   */
  async getSampleHealthCheckupData(): Promise<any[]> {
    try {
      const query = `
        SELECT TOP 5
          ID,
          ConsultingID,
          PicasoID,
          PatientName,
          ContactNo,
          Age,
          Gender,
          BPsystolic,
          BPdiastolic,
          PulseRate,
          SPO2,
          Temperature,
          Height,
          Weight,
          AddedDate,
          AddedBy
        FROM Picaso_PatientConsultingSheetdetails
        WHERE PicasoID IS NOT NULL AND ConsultingID IS NOT NULL
      `;

      return await this.databaseConnection.executeQuery(query);
    } catch (error) {
      this.logger.error(`Failed to get sample health checkup data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Copies data in batches with progress tracking
   */
  private async copyDataInBatches(
    sourceData: any[],
    type: 'DRIVER_MASTER' | 'HEALTH_CHECKUP',
    operationId: string
  ): Promise<CopyResult> {
    const batches = this.createBatches(sourceData, this.config.batchSize);
    let copiedRecords = 0;
    let skippedRecords = 0;
    let failedRecords = 0;
    const errors: string[] = [];

    this.logger.log(`Processing ${batches.length} batches for ${type}`);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchNumber = i + 1;

      try {
        const batchResult = await this.processBatch(batch, type, batchNumber);

        copiedRecords += batchResult.processedRecords;
        failedRecords += batchResult.failedRecords;
        errors.push(...batchResult.errors);

        // Update progress
        await this.updateProgress(operationId, {
          processedRecords: copiedRecords + skippedRecords + failedRecords,
          totalRecords: sourceData.length,
          currentBatch: batchNumber,
          totalBatches: batches.length,
        });

        this.logger.log(`Batch ${batchNumber}/${batches.length} completed: ${batchResult.processedRecords} processed, ${batchResult.failedRecords} failed`);

      } catch (error) {
        failedRecords += batch.length;
        errors.push(`Batch ${batchNumber} failed: ${error.message}`);
        this.logger.error(`Batch ${batchNumber} failed: ${error.message}`);
      }
    }

    return {
      success: errors.length === 0,
      copiedRecords,
      skippedRecords,
      failedRecords,
      errors,
      operationId: operationId,
      duration: 0, // Will be calculated by caller
    };
  }

  /**
   * Processes a single batch of records
   */
  private async processBatch(
    batch: any[],
    type: 'DRIVER_MASTER' | 'HEALTH_CHECKUP',
    batchNumber: number
  ): Promise<BatchResult> {
    const startTime = Date.now();
    let processedRecords = 0;
    let failedRecords = 0;
    const errors: string[] = [];

    for (const record of batch) {
      try {
        const transformationResult = type === 'DRIVER_MASTER'
          ? this.dataTransformation.transformDriverData(record)
          : this.dataTransformation.transformHealthCheckupData(record);

        if (!transformationResult.isValid) {
          failedRecords++;
          errors.push(`Record transformation failed: ${transformationResult.errors.join(', ')}`);
          continue;
        }

        // Check for existing record to prevent duplicates
        const existingRecord = await this.checkExistingRecord(transformationResult.transformedRecord, type);
        if (existingRecord) {
          this.logger.warn(`Skipping duplicate record: ${transformationResult.transformedRecord.driverId || transformationResult.transformedRecord.uniqueId}`);
          continue;
        }

        // Insert record
        await this.insertRecord(transformationResult.transformedRecord, type);
        processedRecords++;

      } catch (error) {
        failedRecords++;
        errors.push(`Record processing failed: ${error.message}`);
      }
    }

    return {
      batchNumber,
      success: failedRecords === 0,
      processedRecords,
      failedRecords,
      errors,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Checks if a record already exists
   */
  private async checkExistingRecord(record: any, type: 'DRIVER_MASTER' | 'HEALTH_CHECKUP'): Promise<boolean> {
    try {
      if (type === 'DRIVER_MASTER') {
        const existing = await DRIVERMASTER.findOne({
          where: { driverId: record.driverId }
        });
        return !!existing;
      } else {
        const existing = await driverhealthcheckup.findOne({
          where: { uniqueId: record.uniqueId }
        });
        return !!existing;
      }
    } catch (error) {
      this.logger.error(`Error checking existing record: ${error.message}`);
      return false;
    }
  }

  /**
   * Inserts a record into the target table
   */
  private async insertRecord(record: any, type: 'DRIVER_MASTER' | 'HEALTH_CHECKUP'): Promise<void> {
    try {
      if (type === 'DRIVER_MASTER') {
        await DRIVERMASTER.create(record);
      } else {
        await driverhealthcheckup.create(record);
      }
    } catch (error) {
      this.logger.error(`Error inserting record: ${error.message}`);
      throw error;
    }
  }

  /**
   * Creates batches from source data
   */
  private createBatches(data: any[], batchSize: number): any[][] {
    const batches: any[][] = [];
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Creates a migration log entry
   */
  private async createMigrationLog(operationId: string, type: string): Promise<MigrationLog> {
    return await MigrationLog.create({
      id: operationId, // Use the provided UUID
      operationType: type,
      status: 'PENDING',
      startTime: new Date(),
      totalRecords: 0,
      processedRecords: 0,
      failedRecords: 0,
      errorLogs: [],
    });
  }

  /**
   * Updates migration log with progress
   */
  private async updateMigrationLog(operationId: string, status: string, result: any): Promise<void> {
    await MigrationLog.update(
      {
        status,
        endTime: new Date(),
        totalRecords: result.totalRecords || 0,
        processedRecords: result.copiedRecords || 0,
        failedRecords: result.failedRecords || 0,
        errorLogs: result.errors || [],
        backupId: result.backupId,
        duration: result.duration || 0,
        metadata: result.metadata || {},
      },
      { where: { id: operationId } }
    );
  }

  /**
   * Updates progress for an operation
   */
  private async updateProgress(operationId: string, progress: { processedRecords: number; totalRecords: number; currentBatch: number; totalBatches: number }): Promise<void> {
    await MigrationLog.update(
      {
        processedRecords: progress.processedRecords,
        totalRecords: progress.totalRecords,
        currentBatch: progress.currentBatch,
        totalBatches: progress.totalBatches,
        status: 'IN_PROGRESS',
      },
      { where: { id: operationId } }
    );
  }

  /**
   * Calculates estimated completion time
   */
  private calculateEstimatedCompletion(operation: MigrationLog): Date | undefined {
    if (operation.status !== 'IN_PROGRESS' || operation.processedRecords === 0) {
      return undefined;
    }

    const elapsed = Date.now() - operation.startTime.getTime();
    const rate = operation.processedRecords / elapsed;
    const remaining = (operation.totalRecords - operation.processedRecords) / rate;

    return new Date(Date.now() + remaining);
  }

  /**
   * Checks for duplicate driver record
   */
  private async checkDriverDuplicate(transformedRecord: any): Promise<boolean> {
    try {
      const existingRecord = await DRIVERMASTER.findOne({
        where: {
          [Op.or]: [
            { driverId: transformedRecord.driverId },
            { external_id: transformedRecord.external_id },
          ],
        },
      });
      return !!existingRecord;
    } catch (error) {
      this.logger.error(`Error checking driver duplicate: ${error.message}`);
      return false;
    }
  }

  /**
   * Saves driver record to LMC database
   */
  private async saveDriverRecord(transformedRecord: any): Promise<void> {
    try {
      await DRIVERMASTER.create(transformedRecord);
    } catch (error) {
      this.logger.error(`Error saving driver record: ${error.message}`);
      throw error;
    }
  }

  /**
   * Checks if health checkup record already exists (only by uniqueId, not external_id)
   */
  private async checkHealthCheckupDuplicate(transformedRecord: any): Promise<boolean> {
    try {
      // Only check by uniqueId (health checkup ID), not external_id (patient ID)
      // Because one patient can have multiple health checkups
      const existingRecord = await driverhealthcheckup.findOne({
        where: { uniqueId: transformedRecord.uniqueId },
      });
      return !!existingRecord;
    } catch (error) {
      this.logger.error(`Error checking health checkup duplicate: ${error.message}`);
      return false;
    }
  }

  /**
   * Saves health checkup record to LMC database
   */
  private async saveHealthCheckupRecord(transformedRecord: any): Promise<void> {
    try {
      // Find the corresponding driver record to get the proper driver_id
      if (transformedRecord.external_id) {
        const driverRecord = await DRIVERMASTER.findOne({
          where: {
            [Op.or]: [
              { external_id: transformedRecord.external_id },
              { driverId: transformedRecord.external_id },
            ],
          },
        });

        if (driverRecord) {
          transformedRecord.driver_id = driverRecord.id; // Use the numeric ID from DRIVERMASTER
        } else {
          this.logger.warn(`No driver found for external_id: ${transformedRecord.external_id}`);
          transformedRecord.driver_id = null; // Set to null if no driver found
        }
      }

      await driverhealthcheckup.create(transformedRecord);
    } catch (error) {
      this.logger.error(`Error saving health checkup record: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gets detailed analysis of skipped records
   */
  async getSkippedRecordsAnalysis(): Promise<any> {
    try {
      // Get all records from Picaso
      const picasoData = await this.fetchHealthCheckupDataFromPicaso();
      
      const analysis = {
        totalPicasoRecords: picasoData.length,
        existingLmcRecords: 0,
        duplicateByUniqueId: 0,
        sampleDuplicates: [],
      };

      for (const record of picasoData.slice(0, 100)) { // Check first 100 for analysis
        const uniqueId = record.ID?.toString();

        // Check for existing records (only by uniqueId)
        const existingByUniqueId = await driverhealthcheckup.findOne({
          where: { uniqueId }
        });

        if (existingByUniqueId) analysis.duplicateByUniqueId++;

        if (existingByUniqueId) {
          analysis.sampleDuplicates.push({
            picasoId: uniqueId,
            picasoExternalId: record.PicasoID,
            patientName: record.PatientName,
            existingByUniqueId: !!existingByUniqueId,
            existingUniqueId: existingByUniqueId?.uniqueId,
          });
        }
      }

      // Get total existing records
      const totalExisting = await driverhealthcheckup.count();
      analysis.existingLmcRecords = totalExisting;

      return analysis;
    } catch (error) {
      this.logger.error(`Failed to get skipped records analysis: ${error.message}`);
      throw error;
    }
  }

  /**
   * Force copy health checkup data (ignore duplicates)
   */
  async forceCopyHealthCheckupData(operationId: string): Promise<CopyResult> {
    const startTime = Date.now();
    let copiedRecords = 0;
    let skippedRecords = 0;
    let failedRecords = 0;
    const errors: string[] = [];
    let backupId: string | undefined;

    try {
      this.logger.log(`Starting FORCE health checkup data copy operation: ${operationId}`);

      // Create backup if enabled
      if (this.config.enableBackup) {
        try {
          backupId = await this.backupService.createBackup('driverhealthcheckups', 1);
          this.logger.log(`Created backup: ${backupId}`);
        } catch (error) {
          this.logger.warn(`Backup creation failed, continuing without backup: ${error.message}`);
        }
      }

      // Fetch data from Picaso
      const picasoData = await this.fetchHealthCheckupDataFromPicaso();
      this.logger.log(`Fetched ${picasoData.length} records from Picaso`);

      if (picasoData.length === 0) {
        return {
          success: true,
          copiedRecords: 0,
          skippedRecords: 0,
          failedRecords: 0,
          errors: ['No data found in Picaso'],
          operationId,
          duration: Date.now() - startTime,
          backupId,
        };
      }

      // Process records in batches (FORCE mode - no duplicate checking)
      const batchSize = this.config.batchSize;
      const totalBatches = Math.ceil(picasoData.length / batchSize);

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const start = batchIndex * batchSize;
        const end = Math.min(start + batchSize, picasoData.length);
        const batch = picasoData.slice(start, end);

        this.logger.log(`Processing batch ${batchIndex + 1}/${totalBatches} (records ${start + 1}-${end})`);

        for (const record of batch) {
          try {
            // Validate record
            const validation = this.validationService.validateHealthCheckupData(record);
            if (!validation.isValid) {
              failedRecords++;
              const errorMsg = `Record ${copiedRecords + skippedRecords + failedRecords}: ${validation.errors.join(', ')}`;
              errors.push(errorMsg);
              this.logger.error(errorMsg);
              continue;
            }

            // Transform record
            const transformation = this.dataTransformation.transformHealthCheckupData(record);
            if (!transformation.isValid) {
              failedRecords++;
              const errorMsg = `Record ${copiedRecords + skippedRecords + failedRecords}: ${transformation.errors.join(', ')}`;
              errors.push(errorMsg);
              this.logger.error(errorMsg);
              continue;
            }

            // FORCE MODE: Skip duplicate checking and insert directly
            try {
              await this.saveHealthCheckupRecord(transformation.transformedRecord);
              copiedRecords++;
              this.logger.debug(`Successfully copied health checkup record: ${transformation.transformedRecord.uniqueId}`);
            } catch (insertError) {
              // If insert fails due to unique constraint, count as skipped
              if (insertError.message.includes('duplicate key') || insertError.message.includes('unique constraint')) {
                skippedRecords++;
                this.logger.debug(`Skipped duplicate record (constraint violation): ${transformation.transformedRecord.uniqueId}`);
              } else {
                failedRecords++;
                const errorMessage = `Record ${copiedRecords + skippedRecords + failedRecords}: ${insertError.message}`;
                errors.push(errorMessage);
                this.logger.error(`Detailed error for record ${copiedRecords + skippedRecords + failedRecords}:`, insertError);
              }
            }
          } catch (error) {
            failedRecords++;
            const errorMessage = `Record ${copiedRecords + skippedRecords + failedRecords}: ${error.message}`;
            errors.push(errorMessage);
            this.logger.error(`Detailed error for record ${copiedRecords + skippedRecords + failedRecords}:`, error);
          }
        }

        // Update progress
        this.updateProgress(operationId, {
          processedRecords: copiedRecords + skippedRecords + failedRecords,
          totalRecords: picasoData.length,
          currentBatch: batchIndex + 1,
          totalBatches,
        });
      }

      const duration = Date.now() - startTime;
      this.logger.log(`FORCE health checkup data copy completed: ${copiedRecords} copied, ${skippedRecords} skipped, ${failedRecords} failed`);

      return {
        success: failedRecords === 0,
        copiedRecords,
        skippedRecords,
        failedRecords,
        errors: errors.slice(0, 100), // Limit error messages
        operationId,
        duration,
        backupId,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`FORCE health checkup data copy failed: ${error.message}`);
      
      return {
        success: false,
        copiedRecords,
        skippedRecords,
        failedRecords,
        errors: [error.message],
        operationId,
        duration,
        backupId,
      };
    }
  }

  /**
   * Force copy all health checkup data without duplicate checking
   */
  async forceCopyAllHealthCheckupData(operationId: string): Promise<CopyResult> {
    try {
      this.logger.log(`Starting force copy of all health checkup data`);

      // Create migration log
      await this.createMigrationLog(operationId, 'HEALTH_CHECKUP_FORCE_COPY');

      // Get all Picaso data
      const picasoData = await this.fetchHealthCheckupDataFromPicaso();
      this.logger.log(`Found ${picasoData.length} records in Picaso`);

      let copiedRecords = 0;
      let failedRecords = 0;
      const errors: string[] = [];

      // Process each record without duplicate checking
      for (let i = 0; i < picasoData.length; i++) {
        const record = picasoData[i];
        
        try {
          // Transform the record
          const transformation = this.dataTransformation.transformHealthCheckupData(record);
          
          if (!transformation.isValid) {
            failedRecords++;
            errors.push(`Record ${i + 1}: ${transformation.errors.join(', ')}`);
            continue;
          }

          // Save the record directly without duplicate checking
          await this.saveHealthCheckupRecord(transformation.transformedRecord);
          copiedRecords++;

          // Log progress every 100 records
          if ((i + 1) % 100 === 0) {
            this.logger.log(`Processed ${i + 1}/${picasoData.length} records`);
          }
        } catch (error) {
          failedRecords++;
          errors.push(`Record ${i + 1}: ${error.message}`);
        }
      }

      const result: CopyResult = {
        success: true,
        operationId,
        copiedRecords,
        skippedRecords: 0, // No skipping in force copy
        failedRecords,
        errors,
        duration: Date.now() - Date.now(), // Will be calculated properly
      };

      // Update migration log
      await this.updateMigrationLog(operationId, 'COMPLETED', result);

      this.logger.log(`Force copy completed: ${copiedRecords} copied, ${failedRecords} failed`);

      return result;
    } catch (error) {
      this.logger.error(`Force copy failed: ${error.message}`);
      await this.updateMigrationLog(operationId, 'FAILED', { error: error.message });
      throw error;
    }
  }

  /**
   * Get duplicate records details for a specific operation
   */
  async getDuplicateRecordsDetails(operationId: string): Promise<any> {
    try {
      const operation = await MigrationLog.findByPk(operationId);
      if (!operation) {
        throw new Error('Migration operation not found');
      }

      // This would need to be enhanced to track duplicates during migration
      // For now, return basic operation info
      return {
        operationId,
        operationType: operation.operationType,
        status: operation.status,
        totalRecords: operation.totalRecords,
        processedRecords: operation.processedRecords,
        failedRecords: operation.failedRecords,
        message: 'Duplicate tracking needs to be enhanced in future versions',
      };
    } catch (error) {
      this.logger.error(`Failed to get duplicate records details: ${error.message}`);
      throw error;
    }
  }

  /**
   * Compare LMC existing records with Picaso data (memory optimized)
   */
  async compareLmcWithPicaso(): Promise<any> {
    try {
      // Get Picaso data (usually smaller)
      const picasoData = await this.fetchHealthCheckupDataFromPicaso();
      const picasoUniqueIds = new Set(picasoData.map(r => r.ID?.toString()));

      // Count LMC records without loading all data
      const totalLmcRecords = await driverhealthcheckup.count();

      // Use pagination to analyze LMC records
      const pageSize = 1000;
      const totalPages = Math.ceil(totalLmcRecords / pageSize);
      
      let lmcOnlyRecords = 0;
      let conflictingRecords = 0;

      for (let page = 0; page < totalPages; page++) {
        const lmcRecords = await driverhealthcheckup.findAll({
          limit: pageSize,
          offset: page * pageSize,
          attributes: ['uniqueId'], // Only fetch needed fields
        });

        for (const lmcRecord of lmcRecords) {
          const hasPicasoUniqueId = picasoUniqueIds.has(lmcRecord.uniqueId);

          if (!hasPicasoUniqueId) {
            lmcOnlyRecords++;
          } else {
            conflictingRecords++;
          }
        }
      }

      // Count Picaso-only records
      let picasoOnlyRecords = 0;
      for (const picasoRecord of picasoData) {
        const uniqueId = picasoRecord.ID?.toString();
        
        // Check if this record exists in LMC (using database query instead of loading all)
        const existingRecord = await driverhealthcheckup.findOne({
          where: { uniqueId },
          attributes: ['id'], // Only fetch ID to check existence
        });

        if (!existingRecord) {
          picasoOnlyRecords++;
        }
      }

      return {
        picaso: {
          totalRecords: picasoData.length,
        },
        lmc: {
          totalRecords: totalLmcRecords,
        },
        analysis: {
          lmcOnlyRecords,
          picasoOnlyRecords,
          conflictingRecords,
          safeToCopyRecords: picasoOnlyRecords,
        }
      };
    } catch (error) {
      this.logger.error(`Failed to compare LMC with Picaso: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get records that exist in LMC but not in Picaso (memory optimized)
   */
  async getLmcOnlyRecords(): Promise<any[]> {
    try {
      const picasoData = await this.fetchHealthCheckupDataFromPicaso();
      const picasoUniqueIds = new Set(picasoData.map(r => r.ID?.toString()));

      // Use pagination to avoid memory issues
      const pageSize = 1000;
      const totalRecords = await driverhealthcheckup.count();
      const totalPages = Math.ceil(totalRecords / pageSize);
      
      const lmcOnlyRecords = [];

      for (let page = 0; page < totalPages; page++) {
        const lmcRecords = await driverhealthcheckup.findAll({
          limit: pageSize,
          offset: page * pageSize,
          attributes: ['id', 'uniqueId', 'external_id', 'contactNumber', 'createdAt'],
        });

        for (const lmcRecord of lmcRecords) {
          const hasPicasoUniqueId = picasoUniqueIds.has(lmcRecord.uniqueId);
          
          if (!hasPicasoUniqueId) {
            lmcOnlyRecords.push({
              id: lmcRecord.id,
              uniqueId: lmcRecord.uniqueId,
              external_id: lmcRecord.external_id,
              contactNumber: lmcRecord.contactNumber,
              createdAt: lmcRecord.createdAt,
              isOriginalLmcRecord: true,
            });
          }
        }
      }

      return lmcOnlyRecords;
    } catch (error) {
      this.logger.error(`Failed to get LMC-only records: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get records that exist in both LMC and Picaso (memory optimized)
   */
  async getConflictingRecords(): Promise<any[]> {
    try {
      const picasoData = await this.fetchHealthCheckupDataFromPicaso();
      const picasoUniqueIds = new Set(picasoData.map(r => r.ID?.toString()));

      // Use pagination to avoid memory issues
      const pageSize = 1000;
      const totalRecords = await driverhealthcheckup.count();
      const totalPages = Math.ceil(totalRecords / pageSize);
      
      const conflictingRecords = [];

      for (let page = 0; page < totalPages; page++) {
        const lmcRecords = await driverhealthcheckup.findAll({
          limit: pageSize,
          offset: page * pageSize,
          attributes: ['id', 'uniqueId', 'external_id', 'contactNumber', 'createdAt'],
        });

        for (const lmcRecord of lmcRecords) {
          const hasPicasoUniqueId = picasoUniqueIds.has(lmcRecord.uniqueId);
          
          if (hasPicasoUniqueId) {
            conflictingRecords.push({
              id: lmcRecord.id,
              uniqueId: lmcRecord.uniqueId,
              external_id: lmcRecord.external_id,
              contactNumber: lmcRecord.contactNumber,
              createdAt: lmcRecord.createdAt,
              conflictType: 'uniqueId',
            });
          }
        }
      }

      return conflictingRecords;
    } catch (error) {
      this.logger.error(`Failed to get conflicting records: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get records that exist in Picaso but not in LMC (memory optimized)
   */
  async getPicasoOnlyRecords(): Promise<any[]> {
    try {
      const picasoData = await this.fetchHealthCheckupDataFromPicaso();
      const picasoOnlyRecords = [];

      // Check each Picaso record individually to avoid loading all LMC records
      for (const picasoRecord of picasoData) {
        const uniqueId = picasoRecord.ID?.toString();
        
        // Check if this record exists in LMC
        const existingRecord = await driverhealthcheckup.findOne({
          where: { uniqueId },
          attributes: ['id'], // Only fetch ID to check existence
        });

        if (!existingRecord) {
          picasoOnlyRecords.push({
            ID: picasoRecord.ID,
            PicasoID: picasoRecord.PicasoID,
            PatientName: picasoRecord.PatientName,
            ContactNo: picasoRecord.ContactNo,
            Age: picasoRecord.Age,
            Gender: picasoRecord.Gender,
            AddedDate: picasoRecord.AddedDate,
            isPicasoOnly: true,
          });
        }
      }

      return picasoOnlyRecords;
    } catch (error) {
      this.logger.error(`Failed to get Picaso-only records: ${error.message}`);
      throw error;
    }
  }
} 
