import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Banner } from '../../models/Banner';
import { BannersService } from './Banner.service';
import { BannersController } from './Banner.controller';

@Module({
  imports: [SequelizeModule.forFeature([Banner])],
  controllers: [BannersController],
  providers: [BannersService],
})
export class BannersModule {}
