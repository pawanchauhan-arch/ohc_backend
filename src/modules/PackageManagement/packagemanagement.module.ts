import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { PackagemanagementController } from './packagemanagement.controller';
import { PackagemanagementService } from './packagemanagement.service';
import { Packagemanagment } from 'src/models/packagemanagment.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Packagemanagment,
    ]),
  ],
  controllers: [PackagemanagementController],
  providers: [PackagemanagementService],
  exports: [PackagemanagementService],
})
export class PackagemanagementModule {}