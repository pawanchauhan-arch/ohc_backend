import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { Ambulance } from '../../models/ambulance.model';

import { AmbulancesController } from './ambulance.controller';
import { AmbulancesService } from './ambulance.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Ambulance,
    ]),
  ],

  controllers: [
    AmbulancesController,
  ],

  providers: [
    AmbulancesService,
  ],

  exports: [
    AmbulancesService,
  ],
})
export class AmbulancesModule {}
