import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SpocManagementController } from './spoc-management.controller';
import { SpocManagementService } from './spoc-management.service';
import { CETMANAGEMENT } from '../../models/CetManagement';
import { Center } from '../../models/Center';

@Module({
  imports: [
    SequelizeModule.forFeature([
      CETMANAGEMENT,
      Center,
    ]),
  ],
  controllers: [SpocManagementController],
  providers: [SpocManagementService],
  exports: [SpocManagementService],
})
export class SpocManagementModule {}
