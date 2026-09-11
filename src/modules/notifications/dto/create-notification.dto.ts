import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { NotificationPriority } from '../../../models/notification.model';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  phone_number: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsEnum(NotificationPriority)
  @IsNotEmpty()
  priority: NotificationPriority;
} 