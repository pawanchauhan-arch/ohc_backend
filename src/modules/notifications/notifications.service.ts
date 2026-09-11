import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Notification, NotificationPriority } from '../../models/notification.model';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { GetNotificationsDto } from './dto/get-notifications.dto';
import { FcmService } from '../fcm/fcm.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification)
    private notificationModel: typeof Notification,
    private fcmService: FcmService,
  ) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    // Only store Type 1 and Type 2 notifications
    if (dto.priority === NotificationPriority.TYPE1 || dto.priority === NotificationPriority.TYPE2) {
      const notification = await this.notificationModel.create({
        ...dto,
        is_read: false,
      });

      // Send the notification via Firebase
      await this.fcmService.sendNotification({
        phone_number: dto.phone_number,
        title: dto.title,
        message: dto.message,
        image_url: dto.image_url,
        priority: dto.priority,
      });

      return notification;
    } else {
      // For Type 3, just send via Firebase without storing
      await this.fcmService.sendNotification({
        phone_number: dto.phone_number,
        title: dto.title,
        message: dto.message,
        image_url: dto.image_url,
        priority: dto.priority,
      });
      return null;
    }
  }

  async getNotifications(dto: GetNotificationsDto): Promise<Notification[]> {
    const where: any = {
      phone_number: dto.phone_number,
    };

    if (dto.unread_only) {
      where.is_read = false;
    }

    return this.notificationModel.findAll({
      where,
      order: [['created_at', 'DESC']],
    });
  }

  async markAsRead(id: number): Promise<Notification> {
    const notification = await this.notificationModel.findByPk(id);
    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.is_read = true;
    await notification.save();
    return notification;
  }
} 