import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { PharmacyRevenueController } from './pharmacy-revenue.controller';
import { PharmacyRevenueService } from './pharmacy-revenue.service';
import { PicasoPharmacyRevenueModel } from 'src/models/PharmacyRevenue';

@Module({
  imports: [
    SequelizeModule.forFeature([
      PicasoPharmacyRevenueModel,
    ]),
  ],
  controllers: [
    PharmacyRevenueController,
  ],
  providers: [
    PharmacyRevenueService,
  ],
})
export class PharmacyRevenueModule {}