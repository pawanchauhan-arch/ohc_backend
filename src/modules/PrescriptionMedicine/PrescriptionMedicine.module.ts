import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PrescriptionMedicine } from '../../models/PrescriptionMedicine';
import { PrescriptionMedicineController } from './PrescriptionMedicine.controller';
import { PrescriptionMedicineService } from './PrescriptionMedicine.service';
import { Prescription } from 'src/models/Prescription';
import { PrescriptionEditLogsModule } from '../PrescriptionEditLogs/PrescriptionEditLogs.module';

@Module({
  imports: [
    SequelizeModule.forFeature([PrescriptionMedicine, Prescription]),
    PrescriptionEditLogsModule
  ],
  controllers: [PrescriptionMedicineController],
  providers: [PrescriptionMedicineService],
  exports: [PrescriptionMedicineService],
})
export class PrescriptionMedicineModule {}
