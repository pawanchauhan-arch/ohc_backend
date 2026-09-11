import { Module } from '@nestjs/common';
import { PicasoPatientConsultingSheetDetails } from '../../models/PatientConsultingSheetdetails';
import { PicasoAdviceList } from '../../models/AdviceList';
import { SequelizeModule } from '@nestjs/sequelize';
import { PicasoidPrescriptionController } from './picasoid-prescription.controller';
import { PicasoidPrescriptionService } from './picasoid-prescription.service';
import { PrescriptionModule } from '../Prescription/Prescription.module';
import { driverhealthcheckup }
from '../../models/DriverHealthCheckup';

import { OhcVitals } from '../../models/ohcVitals.model';

import { OHCClinicalExamination } from '../../models/OHCClinicalExamination.model';

import { OHCLabInvestigation } from '../../models/OHCLabInvestigation.model';

import { OHCLabTestResult } from '../../models/OHCLabTestResult.model';

import { OHCRadiology } from '../../models/OHCRadiology.model';

import { OHCRadiologyTestResult } from '../../models/OHCRadiologyTestResult.model';
import { HealthCheckupModuleLMC } from '../healthCheckup/health-checkup.module';
@Module({
 
   imports: [

  SequelizeModule.forFeature([

    PicasoPatientConsultingSheetDetails,

    PicasoAdviceList,

    driverhealthcheckup,

    OhcVitals,

    OHCClinicalExamination,

    OHCLabInvestigation,

    OHCLabTestResult,

    OHCRadiology,

    OHCRadiologyTestResult,
  ]),

    PrescriptionModule
  ],
  controllers: [PicasoidPrescriptionController],
  providers: [PicasoidPrescriptionService],
})
export class PicasoidPrescriptionModule {}
