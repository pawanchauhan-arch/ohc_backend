import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CamplistitemController } from './camplistitem.controller';
import { CamplistitemService } from './camplistitem.service';
import { CampListItem } from '../../models/CampListItem';
import { CampList } from '../../models/CampList';
import { DRIVERMASTER } from '../../models/DriverMaster';
import { CampItemBarcode } from '../../models/CampItemBarcode';


@Module({
  imports: [
    SequelizeModule.forFeature([
      CampListItem,
      CampList,
      DRIVERMASTER,
      CampItemBarcode,
    ]),
  ],
  controllers: [CamplistitemController],
  providers: [CamplistitemService],
  exports: [CamplistitemService],
})
export class CamplistitemModule {}
