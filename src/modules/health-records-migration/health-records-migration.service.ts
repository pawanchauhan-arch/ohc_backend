import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction, Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';

// Import existing models
import { driverhealthcheckup } from '../../models/DriverHealthCheckup';

// Import health test models
import {
  Spo2Test,
  BloodPressureTest,
  TemperatureTest,
  PulseTest,
  BmiTest,
  RandomBloodSugarTest,
  HaemoglobinTest,
  AlcoholTest,
  EcgTest,
  VisionTest,
  RombergTest,
  PulmonaryFunctionTest,
  HivTest,
  EyeTest,
} from '../../models/health-tests';

// Import utilities and interfaces
import { TestDataParserUtil } from './utils/test-data-parser.util';
import { DataValidatorUtil } from './utils/data-validator.util';
import { MigrationLoggerUtil } from './utils/migration-logger.util';
import { MigrationConfig, ParsedTestData } from './interfaces/migration.interface';
import {
  StartMigrationResponseDto,
  MigrationStatusDto,
  ValidationResponseDto,
  PreviewResponseDto,
  MigrationStatus,
} from './dto/migration-response.dto';

/**
 * Health Records Migration Service
 * Handles migration of selected_test JSON data to individual test tables
 */
@Injectable()
export class HealthRecordsMigrationService {
  private readonly logger = new Logger(HealthRecordsMigrationService.name);

  constructor(
    @InjectModel(driverhealthcheckup)
    private readonly healthCheckupModel: typeof driverhealthcheckup,

    // Health test models
    @InjectModel(Spo2Test)
    private readonly spo2TestModel: typeof Spo2Test,
    @InjectModel(BloodPressureTest)
    private readonly bloodPressureTestModel: typeof BloodPressureTest,
    @InjectModel(TemperatureTest)
    private readonly temperatureTestModel: typeof TemperatureTest,
    @InjectModel(PulseTest)
    private readonly pulseTestModel: typeof PulseTest,
    @InjectModel(BmiTest)
    private readonly bmiTestModel: typeof BmiTest,
    @InjectModel(RandomBloodSugarTest)
    private readonly randomBloodSugarTestModel: typeof RandomBloodSugarTest,
    @InjectModel(HaemoglobinTest)
    private readonly haemoglobinTestModel: typeof HaemoglobinTest,
    @InjectModel(AlcoholTest)
    private readonly alcoholTestModel: typeof AlcoholTest,
    @InjectModel(EcgTest)
    private readonly ecgTestModel: typeof EcgTest,
    @InjectModel(VisionTest)
    private readonly visionTestModel: typeof VisionTest,
    @InjectModel(RombergTest)
    private readonly rombergTestModel: typeof RombergTest,
    @InjectModel(PulmonaryFunctionTest)
    private readonly pulmonaryFunctionTestModel: typeof PulmonaryFunctionTest,
    @InjectModel(HivTest)
    private readonly hivTestModel: typeof HivTest,
    @InjectModel(EyeTest)
    private readonly eyeTestModel: typeof EyeTest,

    private readonly sequelize: Sequelize,
    private readonly testDataParser: TestDataParserUtil,
    private readonly dataValidator: DataValidatorUtil,
    private readonly migrationLogger: MigrationLoggerUtil,
  ) {}

  /**
   * Start health records migration
   */
  async startMigration(config: MigrationConfig): Promise<StartMigrationResponseDto> {
    const operationId = uuidv4();
    
    try {
      // Create operation log
      const operation = this.migrationLogger.createOperation(operationId, config);

      // Count total records to process
      const totalRecords = await this.countRecordsToProcess(config);
      this.migrationLogger.updateOperationStats(operationId, { totalRecords });

      this.logger.log(`Starting migration operation ${operationId} with ${totalRecords} records`);

      // Start migration in background
      this.processMigrationInBackground(operationId, config);

      return {
        success: true,
        operationId,
        message: `Migration started successfully. Operation ID: ${operationId}`,
        initialStats: {
          totalRecords,
          processedRecords: 0,
          successfulRecords: 0,
          failedRecords: 0,
          skippedRecords: 0,
          testTypeStats: {},
        },
      };
    } catch (error) {
      this.logger.error(`Failed to start migration: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get migration status
   */
  async getMigrationStatus(operationId: string): Promise<MigrationStatusDto> {
    const operation = this.migrationLogger.getOperation(operationId);
    
    if (!operation) {
      throw new NotFoundException(`Migration operation ${operationId} not found`);
    }

    const progress = this.migrationLogger.calculateProgress(operationId);

    return {
      operationId,
      status: operation.status as MigrationStatus,
      progress,
      stats: operation.stats,
      estimatedCompletion: this.calculateEstimatedCompletion(operation),
      currentMessage: this.getCurrentProcessingMessage(operation),
    };
  }

  /**
   * Validate migration data without actual migration
   */
  async validateMigration(sampleSize: number = 10): Promise<ValidationResponseDto> {
    try {
      const healthCheckups = await this.healthCheckupModel.findAll({
        where: {
          selected_test: {
            [Op.ne]: null,
          },
        },
        limit: sampleSize,
        order: [['id', 'DESC']],
      });

      const testResults = [];
      const errors = [];
      const warnings = [];

      for (const checkup of healthCheckups) {
        try {
          const selectedTest = this.parseSelectedTestJson(checkup.selected_test);
          const parsedData = this.testDataParser.parseSelectedTestData(selectedTest, checkup.id);
          const validation = this.dataValidator.validateParsedData(parsedData, checkup.id);

          testResults.push({
            testType: 'all',
            success: validation.isValid,
            error: validation.errors.join(', ') || undefined,
            data: parsedData,
          });

          errors.push(...validation.errors);
          warnings.push(...validation.warnings);
        } catch (error) {
          testResults.push({
            testType: 'parsing',
            success: false,
            error: error.message,
          });
          errors.push(`Health checkup ${checkup.id}: ${error.message}`);
        }
      }

      return {
        success: errors.length === 0,
        recordsValidated: healthCheckups.length,
        testResults,
        errors: Array.from(new Set(errors)),
        warnings: Array.from(new Set(warnings)),
      };
    } catch (error) {
      this.logger.error(`Validation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Preview migration data for a specific health checkup
   */
  async previewMigration(healthCheckupId: number): Promise<PreviewResponseDto> {
    try {
      const healthCheckup = await this.healthCheckupModel.findByPk(healthCheckupId);
      
      if (!healthCheckup) {
        throw new NotFoundException(`Health checkup ${healthCheckupId} not found`);
      }

      const originalData = this.parseSelectedTestJson(healthCheckup.selected_test);
      const parsedData = this.testDataParser.parseSelectedTestData(originalData, healthCheckupId);
      const validation = this.dataValidator.validateParsedData(parsedData, healthCheckupId);

      return {
        healthCheckupId,
        originalData,
        parsedData,
        parsingSuccess: validation.isValid,
        errors: validation.errors,
      };
    } catch (error) {
      this.logger.error(`Preview failed for health checkup ${healthCheckupId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Rollback migration operation
   */
  async rollbackMigration(operationId: string): Promise<{ success: boolean; message: string }> {
    try {
      const operation = this.migrationLogger.getOperation(operationId);
      
      if (!operation) {
        throw new NotFoundException(`Migration operation ${operationId} not found`);
      }

      if (operation.status !== 'COMPLETED') {
        throw new Error(`Cannot rollback operation ${operationId}. Status: ${operation.status}`);
      }

      this.logger.log(`Starting rollback for operation ${operationId}`);
      
      // Begin transaction for rollback
      const transaction = await this.sequelize.transaction();

      try {
        // Delete all test records created during this migration
        // Note: This is a simplified approach. In production, you might want to track specific records
        const deletionPromises = [
          this.spo2TestModel.destroy({ where: {}, transaction }),
          this.bloodPressureTestModel.destroy({ where: {}, transaction }),
          this.temperatureTestModel.destroy({ where: {}, transaction }),
          this.pulseTestModel.destroy({ where: {}, transaction }),
          this.bmiTestModel.destroy({ where: {}, transaction }),
          this.randomBloodSugarTestModel.destroy({ where: {}, transaction }),
          this.haemoglobinTestModel.destroy({ where: {}, transaction }),
          this.alcoholTestModel.destroy({ where: {}, transaction }),
          this.ecgTestModel.destroy({ where: {}, transaction }),
          this.visionTestModel.destroy({ where: {}, transaction }),
          this.rombergTestModel.destroy({ where: {}, transaction }),
          this.pulmonaryFunctionTestModel.destroy({ where: {}, transaction }),
          this.hivTestModel.destroy({ where: {}, transaction }),
          this.eyeTestModel.destroy({ where: {}, transaction }),
        ];

        await Promise.all(deletionPromises);
        await transaction.commit();

        this.migrationLogger.updateOperationStatus(operationId, 'ROLLED_BACK');
        
        this.logger.log(`Successfully rolled back migration operation ${operationId}`);
        
        return {
          success: true,
          message: `Migration operation ${operationId} has been successfully rolled back`,
        };
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      this.logger.error(`Rollback failed for operation ${operationId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Process migration in background
   */
  private async processMigrationInBackground(operationId: string, config: MigrationConfig): Promise<void> {
    try {
      this.migrationLogger.updateOperationStatus(operationId, 'RUNNING');

      let offset = config.startFromId || 0;
      const limit = config.batchSize;
      let batchNumber = 1;
      let hasMoreRecords = true;

      while (hasMoreRecords) {
        const healthCheckups = await this.getHealthCheckupBatch(offset, limit, config);
        
        if (healthCheckups.length === 0) {
          hasMoreRecords = false;
          break;
        }

        await this.processBatch(operationId, healthCheckups, batchNumber, config.dryRun);
        
        offset += limit;
        batchNumber++;

        // Check if we've reached the end limit
        if (config.endAtId && offset >= config.endAtId) {
          hasMoreRecords = false;
        }

        // Small delay to prevent overwhelming the database
        await this.sleep(100);
      }

      this.migrationLogger.updateOperationStatus(operationId, 'COMPLETED');
      
      const summary = this.migrationLogger.generateSummary(operationId);
      this.logger.log(`Migration completed:\n${summary}`);
      
      // Cleanup old operations
      this.migrationLogger.cleanupOldOperations();
      
    } catch (error) {
      this.migrationLogger.updateOperationStatus(operationId, 'FAILED');
      this.migrationLogger.addError(operationId, `Migration failed: ${error.message}`);
      this.logger.error(`Migration operation ${operationId} failed: ${error.message}`, error.stack);
    }
  }

  /**
   * Process a batch of health checkups
   */
  private async processBatch(
    operationId: string,
    healthCheckups: driverhealthcheckup[],
    batchNumber: number,
    dryRun: boolean,
  ): Promise<void> {
    let processedInBatch = 0;
    let successfulInBatch = 0;
    let failedInBatch = 0;

    for (const healthCheckup of healthCheckups) {
      try {
        const selectedTest = this.parseSelectedTestJson(healthCheckup.selected_test);
        const parsedData = this.testDataParser.parseSelectedTestData(selectedTest, healthCheckup.id);
        const validation = this.dataValidator.validateParsedData(parsedData, healthCheckup.id);

        if (!validation.isValid) {
          this.migrationLogger.addError(operationId, `Validation failed for health checkup ${healthCheckup.id}: ${validation.errors.join(', ')}`);
          failedInBatch++;
        } else {
          if (!dryRun) {
            await this.insertTestData(parsedData);
          }
          
          // Log test type statistics
          Object.keys(parsedData).forEach(testType => {
            this.migrationLogger.logTestTypeStats(operationId, testType);
          });
          
          successfulInBatch++;
        }

        // Add warnings to operation log
        validation.warnings.forEach(warning => {
          this.migrationLogger.addWarning(operationId, `Health checkup ${healthCheckup.id}: ${warning}`);
        });

        processedInBatch++;
      } catch (error) {
        this.migrationLogger.addError(operationId, `Error processing health checkup ${healthCheckup.id}: ${error.message}`);
        failedInBatch++;
        processedInBatch++;
      }
    }

    // Update operation statistics
    const operation = this.migrationLogger.getOperation(operationId);
    if (operation) {
      operation.stats.processedRecords += processedInBatch;
      operation.stats.successfulRecords += successfulInBatch;
      operation.stats.failedRecords += failedInBatch;
    }

    this.migrationLogger.logBatchProgress(operationId, batchNumber, healthCheckups.length, processedInBatch);
  }

  /**
   * Insert parsed test data into respective tables
   */
  private async insertTestData(parsedData: ParsedTestData): Promise<void> {
    const transaction = await this.sequelize.transaction();

    try {
      const insertPromises = [];

      if (parsedData.spo2) {
        insertPromises.push(this.spo2TestModel.create(parsedData.spo2 as any, { transaction }));
      }
      if (parsedData.bloodPressure) {
        insertPromises.push(this.bloodPressureTestModel.create(parsedData.bloodPressure as any, { transaction }));
      }
      if (parsedData.temperature) {
        insertPromises.push(this.temperatureTestModel.create(parsedData.temperature as any, { transaction }));
      }
      if (parsedData.pulse) {
        insertPromises.push(this.pulseTestModel.create(parsedData.pulse as any, { transaction }));
      }
      if (parsedData.bmi) {
        insertPromises.push(this.bmiTestModel.create(parsedData.bmi as any, { transaction }));
      }
      if (parsedData.randomBloodSugar) {
        insertPromises.push(this.randomBloodSugarTestModel.create(parsedData.randomBloodSugar as any, { transaction }));
      }
      if (parsedData.haemoglobin) {
        insertPromises.push(this.haemoglobinTestModel.create(parsedData.haemoglobin as any, { transaction }));
      }
      if (parsedData.alcohol) {
        insertPromises.push(this.alcoholTestModel.create(parsedData.alcohol as any, { transaction }));
      }
      if (parsedData.ecg) {
        insertPromises.push(this.ecgTestModel.create(parsedData.ecg as any, { transaction }));
      }
      if (parsedData.vision) {
        insertPromises.push(this.visionTestModel.create(parsedData.vision as any, { transaction }));
      }
      if (parsedData.romberg) {
        insertPromises.push(this.rombergTestModel.create(parsedData.romberg as any, { transaction }));
      }
      if (parsedData.pulmonaryFunction) {
        insertPromises.push(this.pulmonaryFunctionTestModel.create(parsedData.pulmonaryFunction as any, { transaction }));
      }
      if (parsedData.hiv) {
        insertPromises.push(this.hivTestModel.create(parsedData.hiv as any, { transaction }));
      }
      if (parsedData.eye) {
        insertPromises.push(this.eyeTestModel.create(parsedData.eye as any, { transaction }));
      }

      await Promise.all(insertPromises);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Helper methods
   */
  private async countRecordsToProcess(config: MigrationConfig): Promise<number> {
    const whereClause: any = {
      selected_test: {
        [Op.ne]: null,
      },
    };

    if (config.startFromId) {
      whereClause.id = { [Op.gte]: config.startFromId };
    }
    if (config.endAtId) {
      whereClause.id = { 
        ...whereClause.id,
        [Op.lte]: config.endAtId,
      };
    }

    return this.healthCheckupModel.count({ where: whereClause });
  }

  private async getHealthCheckupBatch(
    offset: number,
    limit: number,
    config: MigrationConfig,
  ): Promise<driverhealthcheckup[]> {
    const whereClause: any = {
      selected_test: {
        [Op.ne]: null,
      },
    };

    if (config.startFromId) {
      whereClause.id = { [Op.gte]: config.startFromId };
    }
    if (config.endAtId) {
      whereClause.id = { 
        ...whereClause.id,
        [Op.lte]: config.endAtId,
      };
    }

    return this.healthCheckupModel.findAll({
      where: whereClause,
      offset,
      limit,
      order: [['id', 'ASC']],
    });
  }

  private parseSelectedTestJson(selectedTest: any): any {
    if (typeof selectedTest === 'string') {
      try {
        return JSON.parse(selectedTest);
      } catch (error) {
        throw new Error(`Invalid JSON in selected_test: ${error.message}`);
      }
    }
    return selectedTest || {};
  }

  private calculateEstimatedCompletion(operation: any): Date | undefined {
    if (operation.status !== 'RUNNING' || operation.stats.processedRecords === 0) {
      return undefined;
    }

    const elapsedTime = Date.now() - operation.startTime.getTime();
    const recordsPerMs = operation.stats.processedRecords / elapsedTime;
    const remainingRecords = operation.stats.totalRecords - operation.stats.processedRecords;
    const estimatedRemainingTime = remainingRecords / recordsPerMs;

    return new Date(Date.now() + estimatedRemainingTime);
  }

  private getCurrentProcessingMessage(operation: any): string {
    if (operation.status === 'PENDING') {
      return 'Migration is queued for processing';
    } else if (operation.status === 'RUNNING') {
      return `Processing records... ${operation.stats.processedRecords}/${operation.stats.totalRecords} completed`;
    } else if (operation.status === 'COMPLETED') {
      return 'Migration completed successfully';
    } else if (operation.status === 'FAILED') {
      return 'Migration failed';
    } else if (operation.status === 'ROLLED_BACK') {
      return 'Migration has been rolled back';
    }
    return 'Unknown status';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Stop migration operation
   */
  async stopMigration(operationId: string): Promise<{ success: boolean; message: string }> {
    try {
      const operation = this.migrationLogger.getOperation(operationId);
      
      if (!operation) {
        throw new NotFoundException(`Migration operation ${operationId} not found`);
      }

      if (operation.status !== 'RUNNING') {
        throw new Error(`Cannot stop operation ${operationId}. Status: ${operation.status}`);
      }

      // Update operation status to stopped
      this.migrationLogger.updateOperationStatus(operationId, 'FAILED');
      this.migrationLogger.addError(operationId, 'Operation stopped by user');

      return {
        success: true,
        message: `Migration operation ${operationId} has been stopped`,
      };
    } catch (error) {
      this.logger.error(`Failed to stop migration ${operationId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get migration report
   */
  async getMigrationReport(operationId: string): Promise<any> {
    try {
      const operation = this.migrationLogger.getOperation(operationId);
      
      if (!operation) {
        throw new NotFoundException(`Migration operation ${operationId} not found`);
      }

      return {
        operationId: operation.id,
        status: operation.status,
        startTime: operation.startTime,
        endTime: operation.endTime,
        duration: operation.endTime ? operation.endTime.getTime() - operation.startTime.getTime() : null,
        config: operation.config,
        stats: operation.stats,
        errors: operation.errors,
        warnings: operation.warnings,
      };
    } catch (error) {
      this.logger.error(`Failed to get migration report ${operationId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get all migration operations
   */
  async getAllOperations(status?: string, limit?: number): Promise<any[]> {
    try {
      const operations = this.migrationLogger.getAllOperations();
      
      let filteredOps = operations;
      
      if (status) {
        filteredOps = operations.filter(op => op.status === status);
      }

      if (limit) {
        filteredOps = filteredOps.slice(0, limit);
      }

      return filteredOps.map(op => ({
        operationId: op.id,
        status: op.status,
        startTime: op.startTime,
        endTime: op.endTime,
        stats: op.stats,
        config: op.config,
      }));
    } catch (error) {
      this.logger.error(`Failed to get all operations: ${error.message}`, error.stack);
      throw error;
    }
  }
}
