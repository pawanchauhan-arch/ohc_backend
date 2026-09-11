import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Notification } from '../../models/notification.model';
import { FcmModule } from '../fcm/fcm.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Notification]),
    FcmModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {} 