import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { OHCFitnessCertificate } from '../../models/OHCFitnessCertificate.model';
import { OHCDoctorAssessment } from '../../models/OHCDoctorAssessment.model';
import { OhcFitnessService } from './ohc_fitness.service';
import { OhcFitnessController } from './ohc_fitness.controller';
import { CertificateTemplate } from '../../models/OhcCertificateTemplate.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      OHCFitnessCertificate,
      OHCDoctorAssessment,
      CertificateTemplate,
    ]),
  ],
  providers: [OhcFitnessService],
  controllers: [OhcFitnessController],
})
export class OhcFitnessModule {}