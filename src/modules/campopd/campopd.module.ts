import { Module } from '@nestjs/common';
import { CampOpdController } from './campopd.controller';
import { CampOpdBillingService } from './campopd.service';

// import { OPDBilling } from "../../models/OpdBilling";
import { PicasoOpdCampBillHeader } from 'src/models/CampOpdBilling';
import { PicasoOpdCampBillFooter } from 'src/models/CampOpdBillingDetails';
import { SequelizeModule } from '@nestjs/sequelize';
// import { ViewOpdBillingSummary } from '../../models/viewOpdBilling';
import { ViewCampOpdBillingSummary } from 'src/models/viewCampOpdBilling';
import { DRIVERMASTER } from '../../models/DriverMaster';
@Module({
    imports: [
        SequelizeModule.forFeature([PicasoOpdCampBillHeader, PicasoOpdCampBillFooter, ViewCampOpdBillingSummary, DRIVERMASTER]),
    ],
    controllers: [CampOpdController],
    providers: [CampOpdBillingService],
})
export class CampOpdModule { }
