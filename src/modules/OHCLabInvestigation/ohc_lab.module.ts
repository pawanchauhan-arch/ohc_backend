import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { OHCLabInvestigation } from '../../models/OHCLabInvestigation.model';
import { OHCLabTestResult } from '../../models/OHCLabTestResult.model';
import { OhcLabService } from './ohc_lab.service';
import { OhcLabController } from './ohc_lab.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([
      OHCLabInvestigation,
      OHCLabTestResult,
    ]),
  ],
  providers: [OhcLabService],
  controllers: [OhcLabController],
})
export class OhcLabModule {}