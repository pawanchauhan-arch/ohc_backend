import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CenterController } from './center.controller';
import { CenterService } from './center.service';
import { CETMANAGEMENT } from '../../models/CetManagement';
import { Corporate } from '../../models/corporate';
import { Center } from '../../models/Center';

@Module({
  imports: [
    SequelizeModule.forFeature([
      CETMANAGEMENT,
      Corporate,
      Center,
    ]),
  ],
  controllers: [CenterController],
  providers: [CenterService],
  exports: [CenterService],
})
export class CenterModule {}