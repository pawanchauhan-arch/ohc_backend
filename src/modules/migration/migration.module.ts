import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MigrationLog } from './models/migration-log.model';
import { BackupLog } from './models/backup-log.model';
import { MigrationController } from './controllers/migration.controller';
import { MigrationService } from './services/migration.service';
import { DatabaseConnectionService } from './services/database-connection.service';
import { BackupService } from './services/backup.service';
import { ValidationService } from './services/validation.service';
import { DataTransformationService } from './services/data-transformation.service';
import { IncrementalMigrationService } from './services/incremental-migration.service';
import { SourceConfigurationService } from './services/source-configuration.service';
import { MultiSourceDatabaseConnectionService } from './services/multi-source-database-connection.service';
import { MultiSourceMigrationService } from './services/multi-source-migration.service';

/**
 * Migration Module
 * Provides data copying functionality from Picaso to Last Mile Care system
 */
@Module({
  imports: [
    SequelizeModule.forFeature([MigrationLog, BackupLog]),
  ],
  controllers: [MigrationController],
  providers: [
    // Legacy services (for backward compatibility)
    MigrationService,
    DatabaseConnectionService,
    BackupService,
    ValidationService,
    DataTransformationService,
    IncrementalMigrationService,
    
    // New multi-source services
    SourceConfigurationService,
    MultiSourceDatabaseConnectionService,
    MultiSourceMigrationService,
  ],
  exports: [
    // Legacy services
    MigrationService,
    DatabaseConnectionService,
    BackupService,
    ValidationService,
    DataTransformationService,
    IncrementalMigrationService,
    
    // New multi-source services
    SourceConfigurationService,
    MultiSourceDatabaseConnectionService,
    MultiSourceMigrationService,
  ],
})
export class MigrationModule {} 