// src/modules/Samplify/samplify.module.ts
import { Module } from "@nestjs/common";
import { SamplifyController } from "./samplify.controller";
import { SamplifyService } from "./samplify.service";
import { HttpModule } from "@nestjs/axios";
import { CampListItem } from "../../models/CampListItem";
import { CampList } from "../../models/CampList";
import { Center } from "../../models/Center";
import { CampItemBarcode } from "../../models/CampItemBarcode";
import { SequelizeModule } from "@nestjs/sequelize";
import { PhlebotomistModule } from "../phlebotomist/phlebotomist.module";
import { DRIVERMASTER } from "../../models/DriverMaster";
import { driverhealthcheckup } from "../../models/DriverHealthCheckup";

import { KinesisStreamService } from './kinesis/kinesis.service';
import { KinesisWorker } from './kinesis/kinesis.worker';
import { CampProcessor } from './processor/camp.processor';
import { ScheduleModule } from '@nestjs/schedule';
import { Cbc } from '../../models/health-tests/cbc.model';
import { Biochemistry } from '../../models/health-tests/biochemistry.model';
import { LipidProfile } from '../../models/health-tests/lipid_profile.model';
import { Kft } from '../../models/health-tests/kft.model';
import { Lft } from '../../models/health-tests/lft.model';
import { HealthCheckupModuleLMC } from '../healthCheckup/health-checkup.module';


@Module({
  imports: [
    ScheduleModule.forRoot(),
    HttpModule,  // Add HttpModule here in the imports array
    SequelizeModule.forFeature([CampListItem, CampList, Center, CampItemBarcode, DRIVERMASTER, driverhealthcheckup, Cbc, Biochemistry, LipidProfile, 
      Kft,Lft
    ]),
    PhlebotomistModule,
    HealthCheckupModuleLMC,
  ],
  controllers: [SamplifyController],
  providers: [SamplifyService, KinesisStreamService, KinesisWorker, CampProcessor],
  exports: [SamplifyService]  
})
export class SamplifyModule {}