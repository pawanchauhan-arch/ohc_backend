import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { OHCFitnessCertificate } from '../../models/OHCFitnessCertificate.model';
import { OhcFitnessService } from './ohc_fitness.service';
import { OhcFitnessController } from './ohc_fitness.controller';
import { CertificateTemplate } from '../../models/OhcCertificateTemplate.model';
import { OrganizationProfile } from '../../models/OrganizationProfile';

@Module({
  imports: [
    SequelizeModule.forFeature([
      OHCFitnessCertificate,
      CertificateTemplate,
      OrganizationProfile,
    ]),
  ],
  providers: [OhcFitnessService],
  controllers: [OhcFitnessController],
})
export class OhcFitnessModule {}
