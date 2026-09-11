import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LabTestSetting } from '../../models/health-tests/LabTestSetting';
import { LabSettingsController } from './labTest.controller';
import { LabSettingsService } from './labTest.service';

@Module({
  imports: [
    
    SequelizeModule.forFeature([LabTestSetting]), // Register DriverMaster model
  ],
  controllers: [LabSettingsController], // Register DriverMaster controller
  providers: [LabSettingsService], // Register DriverMaster service
  exports:[LabSettingsService]
})
export class LabTestModule {}
