import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { OHCRadiology } from '../../models/OHCRadiology.model';
import { OHCRadiologyTestResult } from '../../models/OHCRadiologyTestResult.model';
import { OhcRadiologyService } from './ohc_radiology.service';
import { OhcRadiologyController } from './ohc_radiology.controller';

@Module({
  imports: [SequelizeModule.forFeature([OHCRadiology,
      OHCRadiologyTestResult,])],
  providers: [OhcRadiologyService],
  controllers: [OhcRadiologyController],
})
export class OhcRadiologyModule {}