import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { AmbulanceService } from '../../models/ambulance-service.model';
import { Ambulance } from '../../models/ambulance.model';

import { AmbulanceServicesController } from './ambulance-services.controller';
import { AmbulanceServicesService } from './ambulance-services.service';

@Module({
  imports: [SequelizeModule.forFeature([AmbulanceService, Ambulance])],

  controllers: [AmbulanceServicesController],

  providers: [AmbulanceServicesService],
})
export class AmbulanceServicesModule {}
