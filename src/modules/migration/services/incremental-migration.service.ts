import { Injectable, Logger } from '@nestjs/common';
import * as cron from 'node-cron';
import { MultiSourceDatabaseConnectionService } from './multi-source-database-connection.service';
import { SourceConfigurationService } from './source-configuration.service';
import { DataTransformationService } from './data-transformation.service';
import { ValidationService } from './validation.service';
import { BackupService } from './backup.service';
import { driverhealthcheckup } from '../../../models/DriverHealthCheckup';
import { DRIVERMASTER } from '../../../models/DriverMaster';
import { MigrationLog } from '../models/migration-log.model';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';

export interface IncrementalMigrationResult {
  success: boolean;
  operationId: string;
  copiedRecords: number;
  skippedRecords: number;
  failedRecords: number;
  errors: string[];
  duration: number;
  newRecordsFound: number;
  timestamp: string;
  sourceResults?: Array<{
    sourceName: string;
    newRecordsFound: number;
    copiedRecords: number;
    skippedRecords: number;
    failedRecords: number;
  }>;
}

/**
 * Incremental Migration Service
 * Handles hourly migration of new records from multiple sources to LMC
 */
@Injectable()
export class IncrementalMigrationService {
  private readonly logger = new Logger(IncrementalMigrationService.name);

  constructor(
    private readonly multiSourceDatabaseConnection: MultiSourceDatabaseConnectionService,
    private readonly sourceConfigService: SourceConfigurationService,
    private readonly dataTransformation: DataTransformationService,
    private readonly validationService: ValidationService,
    private readonly backupService: BackupService,
  ) {}

  /**
   * Initialize scheduled tasks when the application starts
   */
  public initScheduledTasks(): void {
    this.scheduleHourlyMigration();
  }

  /**
   * Schedule the hourly migration task to run every hour
   */
  private scheduleHourlyMigration(): void {
    // Schedule task to run every hour
    // Cron format: second(0-59) minute(0-59) hour(0-23) day(1-31) month(1-12) day of week(0-6)(Sunday=0)
    cron.schedule('0 0 * * * *', async () => {
      try {
        this.logger.log('Running scheduled task: Hourly incremental migration from all sources to LMC');
        
        const operationId = uuidv4();
        const result = await this.migrateNewRecordsFromAllSources(operationId);
        
        this.logger.log(`Hourly migration completed. Copied: ${result.copiedRecords}, Skipped: ${result.skippedRecords}, Failed: ${result.failedRecords}`);
        this.logger.debug(`Migration result: ${JSON.stringify(result)}`);
      } catch (error) {
        this.logger.error('Failed to execute scheduled hourly migration task', error.stack);
      }
    }, {
      timezone: "Asia/Kolkata" // Set to Indian timezone
    });
    
    this.logger.log('Hourly incremental migration scheduled for every hour (Asia/Kolkata).');
  }

  /**
   * Manually trigger incremental migration
   */
  async triggerIncrementalMigration(): Promise<IncrementalMigrationResult> {
    const operationId = uuidv4();
    this.logger.log(`Manually triggering incremental migration with operation ID: ${operationId}`);

    try {
      const result = await this.migrateNewRecordsFromAllSources(operationId);
      this.logger.log(`Manual incremental migration completed: ${result.copiedRecords} copied, ${result.skippedRecords} skipped`);
      return result;
    } catch (error) {
      this.logger.error(`Manual incremental migration failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Migrate new records from all active sources
   */
  private async migrateNewRecordsFromAllSources(operationId: string): Promise<IncrementalMigrationResult> {
    const startTime = Date.now();
    const activeSources = this.sourceConfigService.getActiveSources();
    
    this.logger.log(`Starting incremental migration from ${activeSources.length} sources`);

    if (activeSources.length === 0) {
      return {
        success: false,
        operationId,
        copiedRecords: 0,
        skippedRecords: 0,
        failedRecords: 0,
        errors: ['No active migration sources found'],
        duration: Date.now() - startTime,
        newRecordsFound: 0,
        timestamp: new Date().toISOString(),
      };
    }

    // Create migration log
    await this.createMigrationLog(operationId);

    let totalCopiedRecords = 0;
    let totalSkippedRecords = 0;
    let totalFailedRecords = 0;
    let totalNewRecordsFound = 0;
    const allErrors: string[] = [];
    const sourceResults: Array<{
      sourceName: string;
      newRecordsFound: number;
      copiedRecords: number;
      skippedRecords: number;
      failedRecords: number;
    }> = [];

    // Process all sources in parallel
    const migrationPromises = activeSources.map(async (source) => {
      try {
        this.logger.log(`Starting incremental migration from source: ${source.name}`);
        
        // Get new records from the past hour
        const newRecords = await this.multiSourceDatabaseConnection.executeQuery(
          source,
          `SELECT * FROM Picaso_PatientConsultingSheetdetails WHERE AddedDate >= DATEADD(hour, -1, GETDATE()) ORDER BY AddedDate DESC`
        );

        this.logger.log(`Found ${newRecords.length} new records in source ${source.name}`);

        let copiedRecords = 0;
        let skippedRecords = 0;
        let failedRecords = 0;
        const errors: string[] = [];

        for (const record of newRecords) {
          try {
            // Validate record
            const validation = this.validationService.validateHealthCheckupData(record);
            if (!validation.isValid) {
              errors.push(`Validation failed for record ${record.ID}: ${validation.errors.join(', ')}`);
              failedRecords++;
              continue;
            }

            // Transform record
            const transformation = this.dataTransformation.transformHealthCheckupDataWithCreatorId(
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
            copiedRecords++;

          } catch (recordError) {
            errors.push(`Failed to process record ${record.ID}: ${recordError.message}`);
            failedRecords++;
          }
        }

        this.logger.log(`Incremental migration completed for source ${source.name}: ${copiedRecords} copied, ${skippedRecords} skipped, ${failedRecords} failed`);

        return {
          sourceName: source.name,
          newRecordsFound: newRecords.length,
          copiedRecords,
          skippedRecords,
          failedRecords,
          errors,
        };

      } catch (error) {
        this.logger.error(`Incremental migration failed for source ${source.name}:`, error.message);
        return {
          sourceName: source.name,
          newRecordsFound: 0,
          copiedRecords: 0,
          skippedRecords: 0,
          failedRecords: 0,
          errors: [error.message],
        };
      }
    });

    const results = await Promise.allSettled(migrationPromises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const sourceResult = result.value;
        totalCopiedRecords += sourceResult.copiedRecords;
        totalSkippedRecords += sourceResult.skippedRecords;
        totalFailedRecords += sourceResult.failedRecords;
        totalNewRecordsFound += sourceResult.newRecordsFound;
        allErrors.push(...sourceResult.errors);
        sourceResults.push({
          sourceName: sourceResult.sourceName,
          newRecordsFound: sourceResult.newRecordsFound,
          copiedRecords: sourceResult.copiedRecords,
          skippedRecords: sourceResult.skippedRecords,
          failedRecords: sourceResult.failedRecords,
        });
      } else {
        const sourceName = activeSources[index]?.name || `Source ${index}`;
        allErrors.push(`Failed to process ${sourceName}: ${result.reason}`);
        totalFailedRecords++;
      }
    });

    const duration = Date.now() - startTime;
    const success = totalFailedRecords === 0;

    this.logger.log(`Multi-source incremental migration completed. Total: ${totalCopiedRecords} copied, ${totalSkippedRecords} skipped, ${totalFailedRecords} failed`);

    return {
      success,
      operationId,
      copiedRecords: totalCopiedRecords,
      skippedRecords: totalSkippedRecords,
      failedRecords: totalFailedRecords,
      errors: allErrors.slice(0, 100), // Limit error messages
      duration,
      newRecordsFound: totalNewRecordsFound,
      timestamp: new Date().toISOString(),
      sourceResults,
    };
  }

  /**
   * Get incremental migration statistics
   */
  async getIncrementalMigrationStats(): Promise<{
    lastRun: string | null;
    totalRuns: number;
    successRate: number;
    averageDuration: number;
    lastRunDetails: IncrementalMigrationResult | null;
  }> {
    try {
      // Get recent migration logs - only select existing columns
      const recentLogs = await MigrationLog.findAll({
        where: {
          operationType: 'HEALTH_CHECKUP', // Use existing enum value
        },
        order: [['startTime', 'DESC']], // Use startTime instead of createdAt
        limit: 10,
        attributes: ['id', 'operationType', 'status', 'startTime', 'endTime', 'duration', 'totalRecords', 'processedRecords', 'failedRecords'], // Only select existing columns
      });

      if (recentLogs.length === 0) {
        return {
          lastRun: null,
          totalRuns: 0,
          successRate: 0,
          averageDuration: 0,
          lastRunDetails: null,
        };
      }

      const successfulRuns = recentLogs.filter(log => log.status === 'COMPLETED').length;
      const totalRuns = recentLogs.length;
      const successRate = (successfulRuns / totalRuns) * 100;

      const averageDuration = recentLogs.reduce((sum, log) => sum + (log.duration || 0), 0) / totalRuns;

      const lastRun = recentLogs[0]?.startTime?.toISOString() || null;

      return {
        lastRun,
        totalRuns,
        successRate,
        averageDuration,
        lastRunDetails: null, // Could be enhanced to return actual details
      };
    } catch (error) {
      this.logger.error('Failed to get incremental migration stats:', error.message);
      throw error;
    }
  }

  /**
   * Create migration log entry
   */
  private async createMigrationLog(operationId: string): Promise<void> {
    try {
      await MigrationLog.create({
        id: operationId,
        operationType: 'HEALTH_CHECKUP', // Use existing enum value
        status: 'IN_PROGRESS',
        startTime: new Date(),
        totalRecords: 0,
        processedRecords: 0,
        failedRecords: 0,
        duration: 0,
        initiatedBy: 'system',
        description: 'Multi-source incremental migration',
        // Note: skippedRecords, warnings, sourceSystem, targetSystem, createdBy are not included
        // as they don't exist in the current database schema
      });
    } catch (error) {
      this.logger.error('Failed to create migration log:', error.message);
    }
  }
} 