import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { OHCClinicalExamination } from '../../models/OHCClinicalExamination.model';
import { OhcClinicalExaminationService } from './ohc_clinicalexamination.service';
import { OhcClinicalExaminationController } from './ohc_clinicalexamination.controller';

@Module({
  imports: [SequelizeModule.forFeature([OHCClinicalExamination])],
  providers: [OhcClinicalExaminationService],
  controllers: [OhcClinicalExaminationController],
  exports: [OhcClinicalExaminationService],
})
export class OhcClinicalExaminationModule {}