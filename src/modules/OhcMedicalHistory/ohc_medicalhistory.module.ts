import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { OHCMedicalHistory } from '../../models/OHCMedicalHistory.model';
import { OhcMedicalHistoryService } from './ohc_medicalhistory.service';
import { OhcMedicalHistoryController } from './ohc_medicalhistory.controller';

@Module({
  imports: [SequelizeModule.forFeature([OHCMedicalHistory])],
  providers: [OhcMedicalHistoryService],
  controllers: [OhcMedicalHistoryController],
  exports: [OhcMedicalHistoryService],
})
export class OhcMedicalHistoryModule {}     