import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { SpectacleRevenueController } from './spectacle-revenue.controller';
import { PicasoSpectacleRevenueModel } from 'src/models/SpectacleRevenue';
import { SpectacleRevenueService } from './spectacle-revenue.service';
@Module({
  imports: [
    SequelizeModule.forFeature([
      PicasoSpectacleRevenueModel,
    ]),
  ],
  controllers: [
    SpectacleRevenueController,
  ],
  providers: [
    SpectacleRevenueService,
  ],
})
export class SpectacleRevenueModule {}