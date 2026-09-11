import { Controller, Post, Body } from '@nestjs/common';
import { OtpService } from './otp.service';

@Controller('api/otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('generate-otp')
  async generateOtp(@Body('phoneNumber') phoneNumber: string) {
    return this.otpService.generateOtp(phoneNumber);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() body: { phoneNumber: string, otp: string }) {
    return this.otpService.verifyOtp(body.phoneNumber, body.otp);
  }
}
