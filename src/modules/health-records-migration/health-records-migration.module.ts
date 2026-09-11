import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

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

// Import service, controller, and utilities
import { HealthRecordsMigrationService } from './health-records-migration.service';
import { HealthRecordsMigrationController } from './health-records-migration.controller';
import { TestDataParserUtil } from './utils/test-data-parser.util';
import { DataValidatorUtil } from './utils/data-validator.util';
import { MigrationLoggerUtil } from './utils/migration-logger.util';

/**
 * Health Records Migration Module
 * Provides functionality for migrating selected_test JSON data to individual test tables
 */
@Module({
  imports: [
    SequelizeModule.forFeature([
      // Existing models
      driverhealthcheckup,
      
      // Health test models
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
    ]),
  ],
  controllers: [HealthRecordsMigrationController],
  providers: [
    HealthRecordsMigrationService,
    TestDataParserUtil,
    DataValidatorUtil,
    MigrationLoggerUtil,
  ],
  exports: [
    HealthRecordsMigrationService,
    TestDataParserUtil,
    DataValidatorUtil,
    MigrationLoggerUtil,
  ],
})
export class HealthRecordsMigrationModule {}
