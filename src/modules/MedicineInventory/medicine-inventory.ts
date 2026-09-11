import { Module } from '@nestjs/common';
import { PicasoItemTypeModel } from '../../models/MedicineItemTypes';
import { PicasoItemDetailModel } from '../../models/MedicineItemDetails';
import { SequelizeModule } from '@nestjs/sequelize';
import { MedicineInvetoryController } from './medicine-inventory.controller';
import { MedicineInvetoryService } from './medicine-inventory.service';
import { PicasoStrStockdetailsModel } from 'src/models/StockDetails';
import { PicasoOpdPhrgBillHeaderModel } from 'src/models/MedicineOpdBillHeader';
import { PicasoOpdPhrfBillFooterModel } from 'src/models/MedicineOpdBillFooter';
import { PicasoOpdPhrfcampBillFooterModel } from 'src/models/MedicineOpdcampBillFooter';
import { PicasoOpdPhrgcampBillHeaderModel } from 'src/models/MedicineOpdcampBillHeader';
@Module({
  imports: [
    SequelizeModule.forFeature([
      PicasoItemTypeModel,
      PicasoItemDetailModel,
      PicasoStrStockdetailsModel,
      PicasoOpdPhrgBillHeaderModel,
      PicasoOpdPhrfBillFooterModel,
      PicasoOpdPhrgcampBillHeaderModel,
      PicasoOpdPhrfcampBillFooterModel,
    ]),
  ],
  controllers: [MedicineInvetoryController],
  providers: [MedicineInvetoryService],
})
export class MedicineInventoryModule {}
