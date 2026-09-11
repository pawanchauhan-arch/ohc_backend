import { Injectable, Logger } from '@nestjs/common';
import { MigrationSource, MigrationConfig } from '../config/migration.config';
import { 
  MultiSourceMigrationResult, 
  SourceMigrationResult, 
  MultiSourceIncrementalResult,
  SourceIncrementalResult 
} from '../types/migration.types';
import { SourceConfigurationService } from './source-configuration.service';
import { MultiSourceDatabaseConnectionService } from './multi-source-database-connection.service';
import { DataTransformationService } from './data-transformation.service';
import { ValidationService } from './validation.service';
import { BackupService } from './backup.service';
import { MigrationLog } from '../models/migration-log.model';
import { DRIVERMASTER } from '../../../models/DriverMaster';
import { driverhealthcheckup } from '../../../models/DriverHealthCheckup';
import { v4 as uuidv4 } from 'uuid';import { Op } from 'sequelize';

/**
 * Service responsible for orchestrating multi-source data migrations
 * Handles parallel processing, error handling, and result aggregation
 */
@Injectable()
export class MultiSourceMigrationService {
  private readonly logger = new Logger(MultiSourceMigrationService.name);

  constructor(
    private readonly sourceConfigService: SourceConfigurationService,
    private readonly databaseConnectionService: MultiSourceDatabaseConnectionService,
    private readonly dataTransformationService: DataTransformationService,
    private readonly validationService: ValidationService,
    private readonly backupService: BackupService,
  ) {}

  /**
   * Migrates health checkup data from all active sources in parallel
   */
  async migrateHealthCheckupDataFromAllSources(
    batchSize: number = 100,
    enableBackup: boolean = true,
  ): Promise<MultiSourceMigrationResult> {
    const startTime = new Date();
    const activeSources = this.sourceConfigService.getActiveSources();
    
    this.logger.log(`Starting multi-source health checkup migration for ${activeSources.length} sources`);

    if (activeSources.length === 0) {
      return {
        success: false,
        totalSources: 0,
        successfulSources: 0,
        failedSources: 0,
        totalRecordsProcessed: 0,
        totalRecordsFailed: 0,
        totalRecordsSkipped: 0,
        startTime,
        endTime: new Date(),
        duration: 0,
        sourceResults: [],
        aggregatedErrors: ['No active migration sources found'],
        aggregatedWarnings: [],
      };
    }

    // Process all sources in parallel
    const migrationPromises = activeSources.map(source => 
      this.migrateHealthCheckupDataFromSource(source, batchSize, enableBackup)
        .catch(error => ({
          sourceName: source.name,
          success: false,
          totalRecords: 0,
          processedRecords: 0,
          failedRecords: 0,
          skippedRecords: 0,
          errorCount: 1,
          warningCount: 0,
          startTime: new Date(),
          endTime: new Date(),
          duration: 0,
          errors: [error.message],
          warnings: [],
        } as SourceMigrationResult))
    );

    const results = await Promise.allSettled(migrationPromises);
    const sourceResults: SourceMigrationResult[] = results.map(result => 
      result.status === 'fulfilled' ? result.value : result.reason
    );

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    // Aggregate results
    const successfulSources = sourceResults.filter(r => r.success).length;
    const failedSources = sourceResults.filter(r => !r.success).length;
    const totalRecordsProcessed = sourceResults.reduce((sum, r) => sum + r.processedRecords, 0);
    const totalRecordsFailed = sourceResults.reduce((sum, r) => sum + r.failedRecords, 0);
    const totalRecordsSkipped = sourceResults.reduce((sum, r) => sum + r.skippedRecords, 0);

    const aggregatedErrors = sourceResults
      .flatMap(r => r.errors)
      .filter((error, index, array) => array.indexOf(error) === index);

    const aggregatedWarnings = sourceResults
      .flatMap(r => r.warnings)
      .filter((warning, index, array) => array.indexOf(warning) === index);

    const overallSuccess = successfulSources > 0 && failedSources === 0;

    this.logger.log(`Multi-source migration completed. Success: ${successfulSources}/${activeSources.length} sources`);

    return {
      success: overallSuccess,
      totalSources: activeSources.length,
      successfulSources,
      failedSources,
      totalRecordsProcessed,
      totalRecordsFailed,
      totalRecordsSkipped,
      startTime,
      endTime,
      duration,
      sourceResults,
      aggregatedErrors,
      aggregatedWarnings,
    };
  }

  /**
   * Migrates health checkup data from a specific source
   */
  private async migrateHealthCheckupDataFromSource(
    source: MigrationSource,
    batchSize: number,
    enableBackup: boolean,
  ): Promise<SourceMigrationResult> {
    const startTime = new Date();
    const errors: string[] = [];
    const warnings: string[] = [];
    let totalRecords = 0;
    let processedRecords = 0;
    let failedRecords = 0;
    let skippedRecords = 0;
    let backupId: string | undefined;

    try {
      this.logger.log(`Starting migration from source: ${source.name}`);

      // Create backup if enabled
      if (enableBackup) {
        try {
                  const recordCount = await this.databaseConnectionService.getRecordCount(source, 'Picaso_PatientConsultingSheetdetails');
        backupId = await this.backupService.createBackup('driverhealthcheckups', recordCount);
          this.logger.log(`Backup created for source ${source.name}: ${backupId}`);
        } catch (backupError) {
          warnings.push(`Backup creation failed: ${backupError.message}`);
        }
      }

      // Get total record count
              totalRecords = await this.databaseConnectionService.getRecordCount(source, 'Picaso_PatientConsultingSheetdetails');
      this.logger.log(`Found ${totalRecords} records in source ${source.name}`);

      if (totalRecords === 0) {
        return {
          sourceName: source.name,
          success: true,
          totalRecords: 0,
          processedRecords: 0,
          failedRecords: 0,
          skippedRecords: 0,
          errorCount: 0,
          warningCount: warnings.length,
          startTime,
          endTime: new Date(),
          duration: 0,
          errors,
          warnings,
          backupId,
        };
      }

      // Process in batches
      let offset = 0;
      while (offset < totalRecords) {
        const batch = await this.databaseConnectionService.executeQuery(
          source,
          `SELECT * FROM Picaso_PatientConsultingSheetdetails ORDER BY ID OFFSET ${offset} ROWS FETCH NEXT ${batchSize} ROWS ONLY`
        );

        for (const record of batch) {
          try {
            // Validate record
            const validation = this.validationService.validateHealthCheckupData(record);
            if (!validation.isValid) {
              errors.push(`Validation failed for record ${record.ID}: ${validation.errors.join(', ')}`);
              failedRecords++;
              continue;
            }

            // Transform record
            const transformation = this.dataTransformationService.transformHealthCheckupDataWithCreatorId(
              record,
              source.creatorId
            );
            if (!transformation.isValid) {
              errors.push(`Transformation failed for record ${record.ID}: ${transformation.errors.join(', ')}`);
              failedRecords++;
              continue;
            }

            // Check for duplicates
            const existingRecord = await driverhealthcheckup.findOne({
              where: { uniqueId: transformation.transformedRecord.uniqueId }
            });

            if (existingRecord) {
              skippedRecords++;
              continue;
            }

            // Find driver ID
            const driver = await DRIVERMASTER.findOne({
              where: { external_id: transformation.transformedRecord.external_id }
            });

            if (driver) {
              transformation.transformedRecord.driver_id = driver.id;
            }

            // Save record
            await driverhealthcheckup.create(transformation.transformedRecord);
            processedRecords++;

          } catch (recordError) {
            errors.push(`Failed to process record ${record.ID}: ${recordError.message}`);
            failedRecords++;
          }
        }

        offset += batchSize;
        this.logger.log(`Processed ${Math.min(offset, totalRecords)}/${totalRecords} records from source ${source.name}`);
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      this.logger.log(`Migration completed for source ${source.name}: ${processedRecords} processed, ${skippedRecords} skipped, ${failedRecords} failed`);

      return {
        sourceName: source.name,
        success: failedRecords === 0,
        totalRecords,
        processedRecords,
        failedRecords,
        skippedRecords,
        errorCount: errors.length,
        warningCount: warnings.length,
        startTime,
        endTime,
        duration,
        errors,
        warnings,
        backupId,
      };

    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      this.logger.error(`Migration failed for source ${source.name}:`, error.message);

      return {
        sourceName: source.name,
        success: false,
        totalRecords,
        processedRecords,
        failedRecords,
        skippedRecords,
        errorCount: errors.length + 1,
        warningCount: warnings.length,
        startTime,
        endTime,
        duration,
        errors: [...errors, error.message],
        warnings,
        backupId,
      };
    }
  }

  /**
   * Migrates new records from all active sources in parallel (incremental migration)
   */
  async migrateNewRecordsFromAllSources(): Promise<MultiSourceIncrementalResult> {
    const activeSources = this.sourceConfigService.getActiveSources();
    
    this.logger.log(`Starting incremental migration from ${activeSources.length} sources`);

    if (activeSources.length === 0) {
      return {
        success: false,
        totalSources: 0,
        successfulSources: 0,
        failedSources: 0,
        totalNewRecordsFound: 0,
        totalRecordsMigrated: 0,
        totalRecordsSkipped: 0,
        sourceResults: [],
        aggregatedErrors: ['No active migration sources found'],
      };
    }

    // Process all sources in parallel
    const migrationPromises = activeSources.map(source => 
      this.migrateNewRecordsFromSource(source)
        .catch(error => ({
          sourceName: source.name,
          success: false,
          newRecordsFound: 0,
          recordsMigrated: 0,
          recordsSkipped: 0,
          errors: [error.message],
          fromDate: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
          toDate: new Date().toISOString(),
        } as SourceIncrementalResult))
    );

    const results = await Promise.allSettled(migrationPromises);
    const sourceResults: SourceIncrementalResult[] = results.map(result => 
      result.status === 'fulfilled' ? result.value : result.reason
    );

    // Aggregate results
    const successfulSources = sourceResults.filter(r => r.success).length;
    const failedSources = sourceResults.filter(r => !r.success).length;
    const totalNewRecordsFound = sourceResults.reduce((sum, r) => sum + r.newRecordsFound, 0);
    const totalRecordsMigrated = sourceResults.reduce((sum, r) => sum + r.recordsMigrated, 0);
    const totalRecordsSkipped = sourceResults.reduce((sum, r) => sum + r.recordsSkipped, 0);

    const aggregatedErrors = sourceResults
      .flatMap(r => r.errors)
      .filter((error, index, array) => array.indexOf(error) === index);

    const overallSuccess = successfulSources > 0;

    this.logger.log(`Incremental migration completed. Success: ${successfulSources}/${activeSources.length} sources`);

    return {
      success: overallSuccess,
      totalSources: activeSources.length,
      successfulSources,
      failedSources,
      totalNewRecordsFound,
      totalRecordsMigrated,
      totalRecordsSkipped,
      sourceResults,
      aggregatedErrors,
    };
  }

  /**
   * Migrates new records from a specific source
   */
  private async migrateNewRecordsFromSource(source: MigrationSource): Promise<SourceIncrementalResult> {
    const fromDate = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
    const toDate = new Date();
    const errors: string[] = [];

    try {
      this.logger.log(`Starting incremental migration from source: ${source.name}`);

      // Get new records from the past hour
      const newRecords = await this.databaseConnectionService.executeQuery(
        source,
        `SELECT * FROM Picaso_PatientConsultingSheetdetails WHERE AddedDate >= DATEADD(hour, -1, GETDATE()) ORDER BY AddedDate DESC`
      );

      this.logger.log(`Found ${newRecords.length} new records in source ${source.name}`);

      let recordsMigrated = 0;
      let recordsSkipped = 0;

      for (const record of newRecords) {
        try {
          // Validate record
          const validation = this.validationService.validateHealthCheckupData(record);
          if (!validation.isValid) {
            errors.push(`Validation failed for record ${record.ID}: ${validation.errors.join(', ')}`);
            continue;
          }

          // Transform record
          const transformation = this.dataTransformationService.transformHealthCheckupDataWithCreatorId(
            record,
            source.creatorId
          );
          if (!transformation.isValid) {
            errors.push(`Transformation failed for record ${record.ID}: ${transformation.errors.join(', ')}`);
            continue;
          }

          // Check for duplicates
          const existingRecord = await driverhealthcheckup.findOne({
            where: { uniqueId: transformation.transformedRecord.uniqueId }
          });

          if (existingRecord) {
            recordsSkipped++;
            continue;
          }

          // Find driver ID
          const driver = await DRIVERMASTER.findOne({
            where: { external_id: transformation.transformedRecord.external_id }
          });

          if (driver) {
            transformation.transformedRecord.driver_id = driver.id;
          }

          // Save record
          await driverhealthcheckup.create(transformation.transformedRecord);
          recordsMigrated++;

        } catch (recordError) {
          errors.push(`Failed to process record ${record.ID}: ${recordError.message}`);
        }
      }

      this.logger.log(`Incremental migration completed for source ${source.name}: ${recordsMigrated} migrated, ${recordsSkipped} skipped`);

      return {
        sourceName: source.name,
        success: errors.length === 0,
        newRecordsFound: newRecords.length,
        recordsMigrated,
        recordsSkipped,
        errors,
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString(),
      };

    } catch (error) {
      this.logger.error(`Incremental migration failed for source ${source.name}:`, error.message);

      return {
        sourceName: source.name,
        success: false,
        newRecordsFound: 0,
        recordsMigrated: 0,
        recordsSkipped: 0,
        errors: [...errors, error.message],
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString(),
      };
    }
  }

  /**
   * Migrates driver data from all active sources in parallel
   */
  async migrateDriverDataFromAllSources(
    batchSize: number = 100,
    enableBackup: boolean = true,
  ): Promise<MultiSourceMigrationResult> {
    const startTime = new Date();
    const activeSources = this.sourceConfigService.getActiveSources();
    
    this.logger.log(`Starting multi-source driver migration for ${activeSources.length} sources`);

    if (activeSources.length === 0) {
      return {
        success: false,
        totalSources: 0,
        successfulSources: 0,
        failedSources: 0,
        totalRecordsProcessed: 0,
        totalRecordsFailed: 0,
        totalRecordsSkipped: 0,
        startTime,
        endTime: new Date(),
        duration: 0,
        sourceResults: [],
        aggregatedErrors: ['No active migration sources found'],
        aggregatedWarnings: [],
      };
    }

    // Process all sources in parallel
    const migrationPromises = activeSources.map(source => 
      this.migrateDriverDataFromSource(source, batchSize, enableBackup)
        .catch(error => ({
          sourceName: source.name,
          success: false,
          totalRecords: 0,
          processedRecords: 0,
          failedRecords: 0,
          skippedRecords: 0,
          errorCount: 1,
          warningCount: 0,
          startTime: new Date(),
          endTime: new Date(),
          duration: 0,
          errors: [error.message],
          warnings: [],
        } as SourceMigrationResult))
    );

    const results = await Promise.allSettled(migrationPromises);
    const sourceResults: SourceMigrationResult[] = results.map(result => 
      result.status === 'fulfilled' ? result.value : result.reason
    );

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    // Aggregate results
    const successfulSources = sourceResults.filter(r => r.success).length;
    const failedSources = sourceResults.filter(r => !r.success).length;
    const totalRecordsProcessed = sourceResults.reduce((sum, r) => sum + r.processedRecords, 0);
    const totalRecordsFailed = sourceResults.reduce((sum, r) => sum + r.failedRecords, 0);
    const totalRecordsSkipped = sourceResults.reduce((sum, r) => sum + r.skippedRecords, 0);

    const aggregatedErrors = sourceResults
      .flatMap(r => r.errors)
      .filter((error, index, array) => array.indexOf(error) === index);

    const aggregatedWarnings = sourceResults
      .flatMap(r => r.warnings)
      .filter((warning, index, array) => array.indexOf(warning) === index);

    const overallSuccess = successfulSources > 0 && failedSources === 0;

    this.logger.log(`Multi-source driver migration completed. Success: ${successfulSources}/${activeSources.length} sources`);

    return {
      success: overallSuccess,
      totalSources: activeSources.length,
      successfulSources,
      failedSources,
      totalRecordsProcessed,
      totalRecordsFailed,
      totalRecordsSkipped,
      startTime,
      endTime,
      duration,
      sourceResults,
      aggregatedErrors,
      aggregatedWarnings,
    };
  }

  /**
   * Migrates driver data from a specific source
   */
  private async migrateDriverDataFromSource(
    source: MigrationSource,
    batchSize: number,
    enableBackup: boolean,
  ): Promise<SourceMigrationResult> {
    const startTime = new Date();
    const errors: string[] = [];
    const warnings: string[] = [];
    let totalRecords = 0;
    let processedRecords = 0;
    let failedRecords = 0;
    let skippedRecords = 0;
    let backupId: string | undefined;

    try {
      this.logger.log(`Starting driver migration from source: ${source.name}`);

      // Create backup if enabled
      if (enableBackup) {
        try {
          const recordCount = await this.databaseConnectionService.getRecordCount(source, 'Picaso_PatientMaster');
          backupId = await this.backupService.createBackup('DRIVERMASTERs', recordCount);
          this.logger.log(`Backup created for source ${source.name}: ${backupId}`);
        } catch (backupError) {
          warnings.push(`Backup creation failed: ${backupError.message}`);
        }
      }

      // Get total record count
      totalRecords = await this.databaseConnectionService.getRecordCount(source, 'Picaso_PatientMaster');
      this.logger.log(`Found ${totalRecords} driver records in source ${source.name}`);

      if (totalRecords === 0) {
        return {
          sourceName: source.name,
          success: true,
          totalRecords: 0,
          processedRecords: 0,
          failedRecords: 0,
          skippedRecords: 0,
          errorCount: 0,
          warningCount: warnings.length,
          startTime,
          endTime: new Date(),
          duration: 0,
          errors,
          warnings,
          backupId,
        };
      }

      // Process in batches
      let offset = 0;
      while (offset < totalRecords) {
        const batch = await this.databaseConnectionService.executeQuery(
          source,
          `SELECT * FROM Picaso_PatientMaster ORDER BY PatientID OFFSET ${offset} ROWS FETCH NEXT ${batchSize} ROWS ONLY`
        );

        for (const record of batch) {
          try {
            // Validate record
            const validation = this.validationService.validateDriverData(record);
            if (!validation.isValid) {
              errors.push(`Validation failed for record ${record.PatientID}: ${validation.errors.join(', ')}`);
              failedRecords++;
              continue;
            }

            // Transform record
            const transformation = this.dataTransformationService.transformDriverDataWithCreatorId(
              record,
              source.creatorId
            );
            if (!transformation.isValid) {
              errors.push(`Transformation failed for record ${record.PatientID}: ${transformation.errors.join(', ')}`);
              failedRecords++;
              continue;
            }

            // Check for duplicates
            const existingRecord = await DRIVERMASTER.findOne({
              where: {
                [Op.or]: [
                  { driverId: transformation.transformedRecord.driverId },
                  { external_id: transformation.transformedRecord.external_id },
                ],
              }
            });

            if (existingRecord) {
              skippedRecords++;
              continue;
            }

            // Save record
            await DRIVERMASTER.create(transformation.transformedRecord);
            processedRecords++;

          } catch (recordError) {
            errors.push(`Failed to process record ${record.PatientID}: ${recordError.message}`);
            failedRecords++;
          }
        }

        offset += batchSize;
        this.logger.log(`Processed ${Math.min(offset, totalRecords)}/${totalRecords} driver records from source ${source.name}`);
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      this.logger.log(`Driver migration completed for source ${source.name}: ${processedRecords} processed, ${skippedRecords} skipped, ${failedRecords} failed`);

      return {
        sourceName: source.name,
        success: failedRecords === 0,
        totalRecords,
        processedRecords,
        failedRecords,
        skippedRecords,
        errorCount: errors.length,
        warningCount: warnings.length,
        startTime,
        endTime,
        duration,
        errors,
        warnings,
        backupId,
      };

    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      this.logger.error(`Driver migration failed for source ${source.name}:`, error.message);

      return {
        sourceName: source.name,
        success: false,
        totalRecords,
        processedRecords,
        failedRecords,
        skippedRecords,
        errorCount: errors.length + 1,
        warningCount: warnings.length,
        startTime,
        endTime,
        duration,
        errors: [...errors, error.message],
        warnings,
        backupId,
      };
    }
  }

  /**
   * Gets migration statistics for all sources
   */
  async getMigrationStatistics(): Promise<{
    totalSources: number;
    activeSources: number;
    sourceDetails: Array<{
      name: string;
      isActive: boolean;
      creatorId: number;
      connectionStatus: { healthy: boolean; error?: string };
    }>;
  }> {
    const sourceStats = this.sourceConfigService.getSourceStatistics();
    const healthStatus = await this.databaseConnectionService.getHealthStatus();

    const sourceDetails = sourceStats.sourceDetails.map(source => ({
      name: source.name,
      isActive: source.isActive,
      creatorId: source.creatorId,
      connectionStatus: healthStatus[source.name] || { healthy: false, error: 'Unknown' },
    }));

    return {
      totalSources: sourceStats.totalSources,
      activeSources: sourceStats.activeSources,
      sourceDetails,
    };
  }
}
