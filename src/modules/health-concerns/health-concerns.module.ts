import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { HealthConcernsController } from './health-concerns.controller';
import { HealthConcernsService } from './health-concerns.service';
import { HealthConcern } from '../../models/HealthConcern';
import { DRIVERMASTER } from '../../models/DriverMaster';
import { CETMANAGEMENT } from '../../models/CetManagement';
import { Center } from '../../models/Center';

@Module({
  imports: [
    SequelizeModule.forFeature([
      HealthConcern,
      DRIVERMASTER,
      CETMANAGEMENT,
      Center,
    ]),
  ],
  controllers: [HealthConcernsController],
  providers: [HealthConcernsService],
  exports: [HealthConcernsService],
})
export class HealthConcernsModule {}
