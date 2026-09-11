import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Otp } from '../../models/OTP';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';
import { TestAccountModule } from '../test-account/test-account.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Otp]), // Register OTP model
    TestAccountModule
  ],
  controllers: [OtpController], // Register Otp controller
  providers: [OtpService], // Register Otp service
  exports: [OtpService],
})
export class OtpModule {}
