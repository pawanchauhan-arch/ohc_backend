import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { DesignationController } from './ohc-designation.controller';
import { DesignationService } from './ohc-designation.service';

import { Designation } from '../../models/designation.model';
import { Center } from '../../models/Center';

@Module({
  imports: [SequelizeModule.forFeature([Designation, Center])],

  controllers: [DesignationController],

  providers: [DesignationService],

  exports: [DesignationService],
})
export class DesignationModule {}
