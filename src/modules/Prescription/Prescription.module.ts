import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Prescription } from '../../models/Prescription';
import { PrescriptionController } from './Prescription.controller';
import { PrescriptionService } from './Prescription.service';
import { Consultation } from 'src/models/Consultation';
import { Doctor } from 'src/models/Doctor';
import { PrescriptionMedicine } from 'src/models/PrescriptionMedicine';
import { DRIVERMASTER } from 'src/models/DriverMaster';
import { User } from 'src/models/User';
import { PrescriptionEditLogsModule } from '../PrescriptionEditLogs/PrescriptionEditLogs.module';
import { driverhealthcheckup } from '../../models/DriverHealthCheckup';
import { InstavansParkflowModule } from '../instavans-parkflow/instavans-parkflow.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Prescription,
      Consultation,
      Doctor,
      PrescriptionMedicine,
      DRIVERMASTER,
      User,
      driverhealthcheckup
    ]),
    PrescriptionEditLogsModule,
    InstavansParkflowModule
  ],
  controllers: [PrescriptionController],
  providers: [PrescriptionService],
  exports: [PrescriptionService],
})
export class PrescriptionModule {}
