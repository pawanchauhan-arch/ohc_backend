import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { OHCDoctorAssessment } from '../../models/OHCDoctorAssessment.model';
import { OhcDoctorAssessmentService } from './ohc_doctorAssessment.service';
import { OhcDoctorAssessmentController } from './ohc_doctorAssessment.controller';

@Module({
  imports: [SequelizeModule.forFeature([OHCDoctorAssessment])],
  providers: [OhcDoctorAssessmentService],
  controllers: [OhcDoctorAssessmentController],
})
export class OhcDoctorAssessmentModule {}