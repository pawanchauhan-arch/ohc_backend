import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CorporateService } from './corporate.service';
import { CorporateController } from './corporate.controller';
import { Corporate } from '../../models/corporate';
import { CorporateUser } from '../../models/corporate-user';
import { User } from '../../models/User';
import { Center } from '../../models/Center';
import { Doctor } from '../../models/Doctor';
import { driverhealthcheckup } from '../../models/DriverHealthCheckup';
import { CenterUser } from '../../models/CenterUser';
import { DRIVERMASTER } from '../../models/DriverMaster';
import { Prescription } from '../../models/Prescription';
import { PrescriptionMedicine } from '../../models/PrescriptionMedicine';
import { HealthCheckupService } from './health-checkup.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Corporate,
      CorporateUser,
      User,
      Center,
      Doctor,
      driverhealthcheckup,
      CenterUser,
      DRIVERMASTER,
      Prescription,
      PrescriptionMedicine,
      Doctor,
      driverhealthcheckup,
      CenterUser,
      DRIVERMASTER,
      Prescription,
      PrescriptionMedicine,
    ]),
  ],
  controllers: [CorporateController],
  providers: [CorporateService, HealthCheckupService, HealthCheckupService],
  exports: [CorporateService],
})
export class CorporateModule {}
