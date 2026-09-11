import { Controller, Post, Body } from '@nestjs/common';
import { FcmService } from './fcm.service';
import { RegisterFcmTokenDto } from './dto/register-fcm-token.dto';
import { SendNotificationDto } from './dto/send-notification.dto';

@Controller('fcm')
export class FcmController {
  constructor(private readonly fcmService: FcmService) {}

  @Post('register')
  async registerToken(@Body() dto: RegisterFcmTokenDto) {
    return this.fcmService.registerToken(dto);
  }

  @Post('send')
  async sendNotification(@Body() dto: SendNotificationDto) {
    return this.fcmService.sendNotification(dto);
  }
} 