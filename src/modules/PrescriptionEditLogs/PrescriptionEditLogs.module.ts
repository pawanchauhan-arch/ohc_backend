import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PrescriptionEditLogs } from '../../models/PrescriptionEditLogs';
import { PrescriptionEditLogsService } from './PrescriptionEditLogs.service';
import { PrescriptionEditLogsController } from './PrescriptionEditLogs.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([PrescriptionEditLogs])
  ],
  controllers: [PrescriptionEditLogsController],
  providers: [PrescriptionEditLogsService],
  exports: [PrescriptionEditLogsService],
})
export class PrescriptionEditLogsModule {} 