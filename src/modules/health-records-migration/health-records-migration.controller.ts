import { Controller, Post, Get, Body, Param, Query, HttpStatus, HttpException } from '@nestjs/common';

import { HealthRecordsMigrationService } from './health-records-migration.service';
import {
  StartMigrationDto,
  RollbackMigrationDto,
  ValidateMigrationDto,
} from './dto/migration-request.dto';
import {
  StartMigrationResponseDto,
  MigrationStatusDto,
  ValidationResponseDto,
  PreviewResponseDto,
} from './dto/migration-response.dto';

/**
 * Health Records Migration Controller
 * Provides API endpoints for managing health records data migration
 */
@Controller('api/health-records-migration')
export class HealthRecordsMigrationController {
  constructor(
    private readonly migrationService: HealthRecordsMigrationService,
  ) {}

  /**
   * Start health records migration
   */
  @Post('start')
  async startMigration(
    @Body() startMigrationDto: StartMigrationDto,
  ): Promise<StartMigrationResponseDto> {
    try {
      const config = {
        batchSize: startMigrationDto.batchSize || 100,
        dryRun: startMigrationDto.dryRun || false,
        startFromId: startMigrationDto.startFromId,
        endAtId: startMigrationDto.endAtId,
      };

      const result = await this.migrationService.startMigration(config);
      return result;
    } catch (error) {
      throw new HttpException(
        `Failed to start migration: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get migration status
   */
  @Get('status/:operationId')
  async getMigrationStatus(
    @Param('operationId') operationId: string,
  ): Promise<MigrationStatusDto> {
    try {
      const status = await this.migrationService.getMigrationStatus(operationId);
      return status;
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        `Failed to get migration status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Stop migration operation
   */
  @Post('stop/:operationId')
  async stopMigration(
    @Param('operationId') operationId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.migrationService.stopMigration(operationId);
      return result;
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        `Failed to stop migration: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Validate migration data without actual migration
   */
  @Post('validate')
  async validateMigration(
    @Body() validateDto: ValidateMigrationDto,
  ): Promise<ValidationResponseDto> {
    try {
      const sampleSize = validateDto.sampleSize || 10;
      const result = await this.migrationService.validateMigration(sampleSize);
      return result;
    } catch (error) {
      throw new HttpException(
        `Failed to validate migration: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Preview migration data for a specific health checkup
   */
  @Get('preview/:healthCheckupId')
  async previewMigration(
    @Param('healthCheckupId') healthCheckupId: number,
  ): Promise<PreviewResponseDto> {
    try {
      const result = await this.migrationService.previewMigration(Number(healthCheckupId));
      return result;
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        `Failed to preview migration: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Rollback migration operation
   */
  @Post('rollback')
  async rollbackMigration(
    @Body() rollbackDto: RollbackMigrationDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.migrationService.rollbackMigration(rollbackDto.operationId.toString());
      return result;
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        `Failed to rollback migration: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get migration report
   */
  @Get('report/:operationId')
  async getMigrationReport(
    @Param('operationId') operationId: string,
  ): Promise<any> {
    try {
      const report = await this.migrationService.getMigrationReport(operationId);
      return report;
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        `Failed to get migration report: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all migration operations
   */
  @Get('operations')
  async getAllOperations(
    @Query('status') status?: string,
    @Query('limit') limit?: number,
  ): Promise<any[]> {
    try {
      const operations = await this.migrationService.getAllOperations(status, limit);
      return operations;
    } catch (error) {
      throw new HttpException(
        `Failed to get operations: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  getHealthStatus(): { status: string; timestamp: string } {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Test endpoint for development/debugging
   */
  @Get('test')
  async testEndpoint(): Promise<{ message: string; timestamp: string }> {
    return {
      message: 'Health Records Migration API is working',
      timestamp: new Date().toISOString(),
    };
  }
}