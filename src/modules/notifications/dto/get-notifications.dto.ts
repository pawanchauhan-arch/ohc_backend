import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class GetNotificationsDto {
  @IsString()
  @IsNotEmpty()
  phone_number: string;

  @IsBoolean()
  @IsOptional()
  unread_only?: boolean;
} 