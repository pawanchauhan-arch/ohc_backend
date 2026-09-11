import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { FcmToken } from '../../models/fcm-token.model';
import { RegisterFcmTokenDto } from './dto/register-fcm-token.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { sendNotification } from '../../utils/firebase.util';
import { NotificationPriority } from '../../models/notification.model';

@Injectable()
export class FcmService {
  constructor(
    @InjectModel(FcmToken)
    private fcmTokenModel: typeof FcmToken,
  ) {}

  async registerToken(dto: RegisterFcmTokenDto): Promise<FcmToken> {
    const [token, created] = await this.fcmTokenModel.findOrCreate({
      where: { phone_number: dto.phone_number },
      defaults: {
        fcm_token: dto.fcm_token,
      },
    });

    if (!created) {
      token.fcm_token = dto.fcm_token;
      await token.save();
    }

    return token;
  }

  async getToken(phone_number: string): Promise<string | null> {
    const token = await this.fcmTokenModel.findOne({
      where: { phone_number },
    });
    return token?.fcm_token || null;
  }

  async sendNotification(dto: SendNotificationDto): Promise<string> {
    const token = await this.getToken(dto.phone_number);
    if (!token) {
      throw new Error('FCM token not found for the given phone number');
    }

    try {
      const response = await sendNotification(
        token,
        dto.title,
        dto.message,
        dto.image_url,
      );
      return response;
    } catch (error) {
      throw new Error(`Failed to send notification: ${error.message}`);
    }
  }
} 