import { Module } from '@nestjs/common';
import { PatientController } from './patient.controller';
import { PatientService } from './patient.service';
import { DRIVERMASTER } from '../../models/DriverMaster';
import { SequelizeModule } from '@nestjs/sequelize';
import { PicasoOpdDailyPatientListModel } from 'src/models/PicasoOpdDailyPatientList';

@Module({
  imports: [
    SequelizeModule.forFeature([DRIVERMASTER, PicasoOpdDailyPatientListModel]),
  ],
  controllers: [PatientController],
  providers: [PatientService],
  exports: [PatientService],
})
export class PatientModule { }
