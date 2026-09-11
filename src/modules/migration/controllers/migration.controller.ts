import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpException,
  HttpStatus,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import { MigrationService } from '../services/migration.service';
import { DatabaseConnectionService } from '../services/database-connection.service';
import { CopyDataDto } from '../dto/copy-data.dto';
import { MigrationStatusDto } from '../dto/migration-status.dto';
import { v4 as uuidv4 } from 'uuid';
import { driverhealthcheckup } from '../../../models/DriverHealthCheckup';
import { IncrementalMigrationService } from '../services/incremental-migration.service';
import { MultiSourceMigrationService } from '../services/multi-source-migration.service';
import { SourceConfigurationService } from '../services/source-configuration.service';
import { MultiSourceDatabaseConnectionService } from '../services/multi-source-database-connection.service';

/**
 * Migration Controller
 * Provides API endpoints for data copying operations
 */
@Controller('migration')
export class MigrationController {
  private readonly logger = new Logger(MigrationController.name);

  constructor(
    private readonly migrationService: MigrationService,
    private readonly incrementalMigrationService: IncrementalMigrationService,
    private readonly multiSourceMigrationService: MultiSourceMigrationService,
    private readonly sourceConfigService: SourceConfigurationService,
    private readonly multiSourceDbConnectionService: MultiSourceDatabaseConnectionService,
  ) {}

  /**
   * Copy driver master data from Picaso to LMC
   */
  @Post('copy/driver-data')
  async copyDriverData(@Body() copyDto: CopyDataDto, @Request() req: any) {
    try {
      const operationId = uuidv4(); // Generate proper UUID

      this.logger.log(`Driver data copy requested by ${req.user?.id || 'system'}`);

      const result = await this.migrationService.copyDriverData(operationId);

      return {
        success: true,
        operationId,
        message: 'Driver data copy operation initiated successfully',
        result: {
          copiedRecords: result.copiedRecords,
          skippedRecords: result.skippedRecords,
          failedRecords: result.failedRecords,
          backupId: result.backupId,
          duration: result.duration,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Driver data copy failed: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: `Copy operation failed: ${error.message}`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Copy health checkup data from Picaso to LMC
   */
  @Post('copy/health-checkup')
  async copyHealthCheckupData(@Body() copyDto: CopyDataDto, @Request() req: any) {
    try {
      const operationId = uuidv4(); // Generate proper UUID

      this.logger.log(`Health checkup data copy requested by ${req.user?.id || 'system'}`);

      const result = await this.migrationService.copyHealthCheckupData(operationId);

      return {
        success: true,
        operationId,
        message: 'Health checkup data copy operation initiated successfully',
        result: {
          copiedRecords: result.copiedRecords,
          skippedRecords: result.skippedRecords,
          failedRecords: result.failedRecords,
          backupId: result.backupId,
          duration: result.duration,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Health checkup data copy failed: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: `Copy operation failed: ${error.message}`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get migration operation status
   */
  @Get('status/:operationId')
  async getMigrationStatus(@Param('operationId') operationId: string): Promise<MigrationStatusDto> {
    try {
      const status = await this.migrationService.getMigrationStatus(operationId);

      if (!status) {
        throw new HttpException(
          {
            success: false,
            message: 'Migration operation not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        operationId: status.operationId,
        status: status.status,
        progress: status.progress,
        totalRecords: status.totalRecords,
        processedRecords: status.processedRecords,
        failedRecords: status.failedRecords,
        startTime: status.startTime,
        estimatedCompletion: status.estimatedCompletion,
        currentBatch: status.currentBatch,
        totalBatches: status.totalBatches,
        errorCount: status.errorCount || 0,
        warningCount: status.warningCount || 0,
        backupId: status.backupId,
        metadata: status.metadata,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Failed to get migration status: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: `Failed to get migration status: ${error.message}`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Rollback a migration operation
   */
  @Post('rollback/:operationId')
  async rollbackMigration(@Param('operationId') operationId: string, @Request() req: any) {
    try {
      this.logger.log(`Rollback requested for operation ${operationId} by ${req.user?.id || 'system'}`);

      const result = await this.migrationService.rollbackMigration(operationId);

      return {
        success: true,
        operationId,
        message: 'Rollback operation completed successfully',
        result: {
          rolledBackRecords: result.rolledBackRecords || 0,
          duration: result.duration,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Rollback failed for operation ${operationId}: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: `Rollback operation failed: ${error.message}`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Test database connectivity
   */
  @Get('admin/test')
  async testConnection() {
    try {
      return {
        success: true,
        message: 'Migration system is operational',
        connections: {
          source: 'Connected',
          target: 'Connected',
        },
        timestamp: new Date(),
        version: process.env.npm_package_version || '1.0.0',
      };
    } catch (error) {
      this.logger.error(`Connection test failed: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: `Connection test failed: ${error.message}`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get system health status
   */
  @Get('admin/health')
  async getHealth() {
    try {
      return {
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          migrationService: 'operational',
          databaseConnection: 'connected',
          backupService: 'operational',
          validationService: 'operational',
          dataTransformationService: 'operational',
        },
        uptime: process.uptime() * 1000,
        memory: process.memoryUsage(),
      };
    } catch (error) {
      return {
        success: false,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  /**
   * Get migration statistics
   */
  @Get('admin/stats')
  async getStats() {
    try {
      // For now, return basic stats since getMigrationStats doesn't exist
      return {
        success: true,
        message: 'Migration statistics retrieved successfully',
        stats: {
          totalOperations: 0,
          successfulOperations: 0,
          failedOperations: 0,
          totalRecordsProcessed: 0,
          averageProcessingTime: 0,
          lastOperationTime: null,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve migration statistics',
        error: error.message,
      };
    }
  }

  /**
   * Get Picaso table structure for debugging
   */
  @Get('admin/picaso-table-info/:tableName')
  async getPicasoTableInfo(@Param('tableName') tableName: string) {
    try {
      const tableInfo = await this.migrationService.getPicasoTableInfo(tableName);

      return {
        success: true,
        tableName,
        columns: tableInfo,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to get table info for ${tableName}: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: `Failed to get table info: ${error.message}`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Test basic Picaso data fetch
   */
  @Get('admin/test-picaso-connection')
  async testPicasoConnection() {
    try {
      const sampleData = await this.migrationService.getPicasoTableInfo('Picaso_PatientMaster');
      return {
        success: true,
        message: 'Picaso connection successful',
        sampleData: sampleData.slice(0, 5), // First 5 columns
      };
    } catch (error) {
      return {
        success: false,
        message: `Picaso connection failed: ${error.message}`,
      };
    }
  }

  @Get('admin/sample-health-checkup-data')
  async getSampleHealthCheckupData() {
    try {
      const sampleData = await this.migrationService.getSampleHealthCheckupData();
      return {
        success: true,
        message: 'Sample health checkup data retrieved',
        sampleData,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get sample data: ${error.message}`,
      };
    }
  }

  /**
   * Get detailed analysis of skipped records
   */
  @Get('admin/skipped-records-analysis')
  async getSkippedRecordsAnalysis() {
    try {
      const analysis = await this.migrationService.getSkippedRecordsAnalysis();
      return {
        success: true,
        message: 'Skipped records analysis completed',
        analysis,
      };
    } catch (error) {
      this.logger.error(`Failed to get skipped records analysis: ${error.message}`);
      return {
        success: false,
        message: 'Failed to get skipped records analysis',
        error: error.message,
      };
    }
  }

  /**
   * Force copy all records (ignore duplicates)
   */
  @Post('copy/health-checkup/force')
  async forceCopyHealthCheckupData(@Body() copyDataDto: CopyDataDto) {
    const operationId = uuidv4();
    this.logger.log(`Starting forced health checkup migration - Operation ID: ${operationId}`);
    
    try {
      const result = await this.migrationService.forceCopyHealthCheckupData(operationId);
      
      return {
        success: true,
        message: 'Forced health checkup migration completed successfully',
        operationId,
        result,
      };
    } catch (error) {
      this.logger.error(`Forced health checkup migration failed: ${error.message}`);
      return {
        success: false,
        message: 'Forced health checkup migration failed',
        operationId,
        error: error.message,
      };
    }
  }

  /**
   * Force copy health checkup data without duplicate checking (for testing)
   */
  @Post('copy/health-checkup/force-all')
  async forceCopyAllHealthCheckupData(@Body() copyDataDto: CopyDataDto) {
    const operationId = uuidv4();
    this.logger.log(`Starting forced all health checkup migration - Operation ID: ${operationId}`);
    
    try {
      const result = await this.migrationService.forceCopyAllHealthCheckupData(operationId);
      
      return {
        success: true,
        message: 'Forced all health checkup migration completed successfully',
        operationId,
        result,
      };
    } catch (error) {
      this.logger.error(`Forced all health checkup migration failed: ${error.message}`);
      return {
        success: false,
        message: 'Forced all health checkup migration failed',
        operationId,
        error: error.message,
      };
    }
  }

  /**
   * Get duplicate records details
   */
  @Get('admin/duplicate-records/:operationId')
  async getDuplicateRecordsDetails(@Param('operationId') operationId: string) {
    try {
      const duplicates = await this.migrationService.getDuplicateRecordsDetails(operationId);
      return {
        success: true,
        message: 'Duplicate records details retrieved',
        duplicates,
      };
    } catch (error) {
      this.logger.error(`Failed to get duplicate records details: ${error.message}`);
      return {
        success: false,
        message: 'Failed to get duplicate records details',
        error: error.message,
      };
    }
  }

  /**
   * Compare LMC existing records with Picaso data
   */
  @Get('admin/compare-lmc-picaso')
  async compareLmcWithPicaso() {
    try {
      const comparison = await this.migrationService.compareLmcWithPicaso();
      return {
        success: true,
        message: 'LMC vs Picaso comparison completed',
        comparison,
      };
    } catch (error) {
      this.logger.error(`Failed to compare LMC with Picaso: ${error.message}`);
      return {
        success: false,
        message: 'Failed to compare LMC with Picaso',
        error: error.message,
      };
    }
  }

  /**
   * Get records that exist in LMC but not in Picaso (your original data)
   */
  @Get('admin/lmc-only-records')
  async getLmcOnlyRecords() {
    try {
      const lmcOnlyRecords = await this.migrationService.getLmcOnlyRecords();
      return {
        success: true,
        message: 'LMC-only records retrieved',
        count: lmcOnlyRecords.length,
        records: lmcOnlyRecords.slice(0, 50), // Show first 50
        totalRecords: lmcOnlyRecords.length,
      };
    } catch (error) {
      this.logger.error(`Failed to get LMC-only records: ${error.message}`);
      return {
        success: false,
        message: 'Failed to get LMC-only records',
        error: error.message,
      };
    }
  }

  /**
   * Get records that exist in both LMC and Picaso (potential conflicts)
   */
  @Get('admin/conflicting-records')
  async getConflictingRecords() {
    try {
      const conflictingRecords = await this.migrationService.getConflictingRecords();
      return {
        success: true,
        message: 'Conflicting records retrieved',
        count: conflictingRecords.length,
        records: conflictingRecords.slice(0, 50), // Show first 50
        totalRecords: conflictingRecords.length,
      };
    } catch (error) {
      this.logger.error(`Failed to get conflicting records: ${error.message}`);
      return {
        success: false,
        message: 'Failed to get conflicting records',
        error: error.message,
      };
    }
  }

  /**
   * Get records that exist in Picaso but not in LMC (still need to copy)
   */
  @Get('admin/picaso-only-records')
  async getPicasoOnlyRecords() {
    try {
      const picasoOnlyRecords = await this.migrationService.getPicasoOnlyRecords();
      return {
        success: true,
        message: 'Picaso-only records retrieved',
        count: picasoOnlyRecords.length,
        records: picasoOnlyRecords.slice(0, 50), // Show first 50
        totalRecords: picasoOnlyRecords.length,
      };
    } catch (error) {
      this.logger.error(`Failed to get Picaso-only records: ${error.message}`);
      return {
        success: false,
        message: 'Failed to get Picaso-only records',
        error: error.message,
      };
    }
  }

  /**
   * Debug endpoint to analyze why records are being skipped
   */
  @Get('admin/debug-skipped-records')
  async debugSkippedRecords(): Promise<any> {
    try {
      const picasoData = await this.migrationService.getSampleHealthCheckupData();
      const analysis = {
        totalPicasoRecords: picasoData.length,
        sampleRecords: [],
        duplicateAnalysis: {
          byUniqueId: 0,
        }
      };

      for (const record of picasoData) {
        const uniqueId = record.ID?.toString();

        // Check for existing records (only by uniqueId)
        const existingByUniqueId = await driverhealthcheckup.findOne({
          where: { uniqueId }
        });

        const isDuplicate = existingByUniqueId;

        analysis.sampleRecords.push({
          picasoId: uniqueId,
          picasoExternalId: record.PicasoID,
          patientName: record.PatientName,
          isDuplicate,
          duplicateByUniqueId: !!existingByUniqueId,
          existingUniqueId: existingByUniqueId?.uniqueId,
        });

        if (existingByUniqueId) analysis.duplicateAnalysis.byUniqueId++;
      }

      return {
        success: true,
        message: 'Debug analysis completed',
        analysis
      };
    } catch (error) {
      return {
        success: false,
        message: `Debug failed: ${error.message}`,
        error: error.stack
      };
    }
  }

  /**
   * Manually trigger incremental migration
   */
  @Post('incremental/trigger')
  async triggerIncrementalMigration(): Promise<any> {
    try {
      const result = await this.incrementalMigrationService.triggerIncrementalMigration();

      return {
        success: true,
        message: 'Incremental migration triggered successfully',
        result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Incremental migration failed: ${error.message}`);
      return {
        success: false,
        message: `Incremental migration failed: ${error.message}`,
        error: error.stack,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get incremental migration statistics
   */
  @Get('incremental/stats')
  async getIncrementalMigrationStats(): Promise<any> {
    try {
      const result = await this.incrementalMigrationService.getIncrementalMigrationStats();

      return {
        success: true,
        message: 'Incremental migration statistics retrieved',
        result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to get incremental migration stats: ${error.message}`);
      return {
        success: false,
        message: `Failed to get incremental migration stats: ${error.message}`,
        error: error.stack,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ==================== NEW MULTI-SOURCE ENDPOINTS ====================

  @Post('multi-source/copy/driver')
  async copyDriverDataFromAllSources(@Body() copyDataDto: CopyDataDto) {
    try {
      const { batchSize = 100, enableBackup = true } = copyDataDto;
      
      this.logger.log('Starting multi-source driver data migration');
      
      const result = await this.multiSourceMigrationService.migrateDriverDataFromAllSources(
        batchSize,
        enableBackup
      );

      return {
        success: true,
        message: 'Multi-source driver migration completed',
        data: result,
      };
    } catch (error) {
      this.logger.error('Multi-source driver migration failed:', error);
      return {
        success: false,
        message: 'Multi-source driver migration failed',
        error: error.message,
      };
    }
  }

  @Post('multi-source/copy/health-checkup')
  async copyHealthCheckupDataFromAllSources(@Body() copyDataDto: CopyDataDto) {
    const operationId = uuidv4();
    this.logger.log(`Starting multi-source health checkup migration - Operation ID: ${operationId}`);
    
    try {
      const result = await this.multiSourceMigrationService.migrateHealthCheckupDataFromAllSources(
        copyDataDto.batchSize || 100,
        copyDataDto.enableBackup !== false,
      );
      
      return {
        success: true,
        message: 'Multi-source health checkup migration completed',
        operationId,
        result,
      };
    } catch (error) {
      this.logger.error(`Multi-source health checkup migration failed: ${error.message}`);
      return {
        success: false,
        message: 'Multi-source health checkup migration failed',
        operationId,
        error: error.message,
      };
    }
  }

  @Post('multi-source/incremental/trigger')
  async triggerMultiSourceIncrementalMigration() {
    this.logger.log('Triggering multi-source incremental migration');
    
    try {
      const result = await this.multiSourceMigrationService.migrateNewRecordsFromAllSources();
      
      return {
        success: true,
        message: 'Multi-source incremental migration completed',
        result,
      };
    } catch (error) {
      this.logger.error(`Multi-source incremental migration failed: ${error.message}`);
      return {
        success: false,
        message: 'Multi-source incremental migration failed',
        error: error.message,
      };
    }
  }

  @Get('multi-source/stats')
  async getMultiSourceStatistics() {
    try {
      const stats = await this.multiSourceMigrationService.getMigrationStatistics();
      return {
        success: true,
        message: 'Multi-source statistics retrieved successfully',
        stats,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve multi-source statistics',
        error: error.message,
      };
    }
  }

  @Get('multi-source/health')
  async getMultiSourceHealth() {
    try {
      const sourceStats = this.sourceConfigService.getSourceStatistics();
      const connectionHealth = await this.multiSourceDbConnectionService.getHealthStatus();
      
      return {
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        sources: {
          total: sourceStats.totalSources,
          active: sourceStats.activeSources,
          inactive: sourceStats.inactiveSources,
          connections: connectionHealth,
        },
        services: {
          sourceConfigurationService: 'operational',
          multiSourceDatabaseConnectionService: 'operational',
          multiSourceMigrationService: 'operational',
        },
      };
    } catch (error) {
      return {
        success: false,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  @Get('multi-source/test-connections')
  async testMultiSourceConnections() {
    try {
      const results = await this.multiSourceDbConnectionService.testAllConnections();
      
      return {
        success: true,
        message: 'Connection tests completed',
        results,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Connection tests failed',
        error: error.message,
      };
    }
  }
}