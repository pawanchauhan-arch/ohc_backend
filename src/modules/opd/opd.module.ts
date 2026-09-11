import { Module } from '@nestjs/common';
import { OpdController } from './opd.controller';
import { OpdBillingService } from './opd.service';

import { OPDBilling } from "../../models/OpdBilling";
import { OPDBillDetail } from "../../models/OpdBillingDetails";
import { SequelizeModule } from '@nestjs/sequelize';
import { ViewOpdBillingSummary } from '../../models/viewOpdBilling';
import { DRIVERMASTER } from '../../models/DriverMaster';
import { PicasoOpdDailyPatientListModel } from 'src/models/PicasoOpdDailyPatientList';
import { PicasoPharmacyRevenueModel } from "src/models/PharmacyRevenue";
import { PicasoSpectacleRevenueModel } from "src/models/SpectacleRevenue";
import { PicasoOpdPhrgBillHeaderModel } from 'src/models/MedicineOpdBillHeader';
import { PicasoOpdPhrfBillFooterModel } from 'src/models/MedicineOpdBillFooter';
@Module({
    imports: [
        SequelizeModule.forFeature([OPDBilling, OPDBillDetail, ViewOpdBillingSummary, DRIVERMASTER, PicasoOpdDailyPatientListModel, PicasoPharmacyRevenueModel, PicasoSpectacleRevenueModel, PicasoOpdPhrgBillHeaderModel, PicasoOpdPhrfBillFooterModel]),
    ],
    controllers: [OpdController],
    providers: [OpdBillingService],
})
export class OpdModule { }
