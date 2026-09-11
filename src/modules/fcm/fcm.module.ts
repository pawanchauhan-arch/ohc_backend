import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { FcmController } from './fcm.controller';
import { FcmService } from './fcm.service';
import { FcmToken } from '../../models/fcm-token.model';

@Module({
  imports: [SequelizeModule.forFeature([FcmToken])],
  controllers: [FcmController],
  providers: [FcmService],
  exports: [FcmService],
})
export class FcmModule {} 