import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SequelizeModule } from '@nestjs/sequelize';
import { JslIntegrationController } from './jsl-integration.controller';
import { JslIntegrationService } from './jsl-integration.service';
import { JslShipmentDetailModel } from 'src/models/jsl-shipment-detail.model';

@Module({
  imports: [HttpModule, SequelizeModule.forFeature([JslShipmentDetailModel])],
  controllers: [JslIntegrationController],
  providers: [JslIntegrationService],
})
export class JslIntegrationModule {}


