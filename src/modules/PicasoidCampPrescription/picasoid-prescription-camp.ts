import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PicasoidPrescriptionCampController } from './picasoid-prescription-camp.controller';
import { PicasoidCampPrescriptionService } from './picasoid-prescription-camp.service';
import { PrescriptionModule } from '../Prescription/Prescription.module';
import { driverhealthcheckup }
from '../../models/DriverHealthCheckup';
import { PicasoPatientCampConsultingSheetDetails } from 'src/models/PatientCampConsultingSheetdetails';
import { PicasoCampAdviceList } from 'src/models/CampAdviceList';
@Module({
 
   imports: [

  SequelizeModule.forFeature([

    PicasoPatientCampConsultingSheetDetails,

    PicasoCampAdviceList,

    driverhealthcheckup,

    
  ]),

    PrescriptionModule
  ],
  controllers: [PicasoidPrescriptionCampController],
  providers: [PicasoidCampPrescriptionService],
})
export class PicasoidCampPrescriptionModule {}
