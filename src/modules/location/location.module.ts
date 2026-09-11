import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { Country } from '../../models/country';
import { State } from '../../models/state';
import { District } from '../../models/district';

@Module({
  imports: [SequelizeModule.forFeature([Country, State, District])],
  controllers: [LocationController],
  providers: [LocationService],
  exports: [LocationService],
})
export class LocationModule { }
