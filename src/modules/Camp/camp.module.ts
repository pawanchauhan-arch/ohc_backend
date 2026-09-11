import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CampList } from '../../models/CampList';
import { CampListItem } from '../../models/CampListItem';
import { CampController } from './camp.controller';
import { CampService } from './camp.service';
import { CampItemBarcode } from '../../models/CampItemBarcode';
import { DRIVERMASTER } from '../../models/DriverMaster';
import { Center } from '../../models/Center';
import { CETMANAGEMENT } from '../../models/CetManagement';
import { CenterUser } from '../../models/CenterUser';
import { User } from '../../models/User';
import { driverhealthcheckup } from '../../models/DriverHealthCheckup';
import { SamplifyModule } from '../Samplify/samplify.module';
import { DriverMasterModule } from '../DriverMaster/DriverMaster.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      CampList,
      CampListItem,
      CampItemBarcode,
      DRIVERMASTER,
      Center,
      CETMANAGEMENT,
      CenterUser,
      User,
      driverhealthcheckup,
    ]),
    SamplifyModule,
    DriverMasterModule
  ],
  controllers: [CampController],
  providers: [CampService],
  exports: [CampService],
})
export class CampModule {}



