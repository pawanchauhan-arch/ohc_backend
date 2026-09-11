import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PhlebotomistController, CampPhlebotomistController } from './phlebotomist.controller';
import { PhlebotomistService } from './phlebotomist.service';
import { CenterUser } from '../../models/CenterUser';
import { User } from '../../models/User';
import { Center } from '../../models/Center';
import { CampList } from '../../models/CampList';
import { CampListItem } from '../../models/CampListItem';
import { DRIVERMASTER } from '../../models/DriverMaster';

@Module({
  imports: [
    SequelizeModule.forFeature([
      CenterUser,
      User,
      Center,
      CampList,
      CampListItem,
      DRIVERMASTER,
    ]),
  ],
  controllers: [PhlebotomistController, CampPhlebotomistController],
  providers: [PhlebotomistService],
  exports: [PhlebotomistService],
})
export class PhlebotomistModule {}
