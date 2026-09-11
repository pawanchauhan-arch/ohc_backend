import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MobilabService } from './mobilab.service';
import { MobilabController } from './mobilab.controller';
import { DRIVERMASTER } from '../../models/DriverMaster';
import { MobilabBooking } from '../../models/MobilabTestResult';
import { HttpModule } from "@nestjs/axios";
import { driverhealthcheckup } from '../../models/DriverHealthCheckup';

import { Cbc } from '../../models/health-tests/cbc.model';
import { Biochemistry } from '../../models/health-tests/biochemistry.model';
import { LipidProfile } from '../../models/health-tests/lipid_profile.model';
import { Kft } from '../../models/health-tests/kft.model';
import { Lft } from '../../models/health-tests/lft.model';
import { Center } from '../../models/Center'; // Import Center Model

import { LabResultService } from './lab-result.service';


@Module({
  imports: [
    HttpModule,
    SequelizeModule.forFeature([DRIVERMASTER, MobilabBooking, driverhealthcheckup, Cbc, Biochemistry, LipidProfile, Kft, Lft, Center]), // Register DriverMaster model
  ],
  controllers: [MobilabController], // Register DriverMaster controller
  providers: [MobilabService, LabResultService], // Register DriverMaster service
  exports:[MobilabService, LabResultService]
})
export class MobiLabModule {}
