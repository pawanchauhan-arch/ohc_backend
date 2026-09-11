import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { HealthAnalysisController } from './health-analysis.controller';
import { HealthAnalysisService } from './health-analysis.service';
import { HealthAnalysisIntegrationService } from './health-analysis-integration.service';
import { driverhealthcheckup } from '../../models/DriverHealthCheckup';
import { DRIVERMASTER } from '../../models/DriverMaster';
import { CETMANAGEMENT } from '../../models/CetManagement';
import { Center } from '../../models/Center';
import { User } from '../../models/User';
import { Corporate } from '../../models/corporate';
import { HealthConcernsModule } from '../health-concerns/health-concerns.module';
import { SpocManagementModule } from '../spoc-management/spoc-management.module';
import { CommunicationModule } from '../communication/communication.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      driverhealthcheckup,
      DRIVERMASTER,
      CETMANAGEMENT,
      Center,
      User,
      Corporate,
    ]),
    HealthConcernsModule,
    SpocManagementModule,
    CommunicationModule,
  ],
  controllers: [HealthAnalysisController],
  providers: [HealthAnalysisService, HealthAnalysisIntegrationService],
  exports: [HealthAnalysisService, HealthAnalysisIntegrationService],
})
export class HealthAnalysisModule {}
