import { Controller, Post, Body, Get, HttpException, Res, Query } from '@nestjs/common';
import { ABDMService } from './ABDM.service';

@Controller('abdm')
export class ABDMController {
  constructor(private readonly abdmService: ABDMService) {}

  @Post('send-otp')
  async sendOtp(@Body('aadhaar') aadhaar: string, @Body('phoneNumber') phoneNumber: string) {
    return this.abdmService.getOTP(aadhaar, phoneNumber);
  }

  @Post('verify-otp')
  async verifyOTP(
    @Body('otp') otp: string,
    @Body('phoneNumber') phoneNumber: string,
  ) {
    const result = await this.abdmService.enrolByAadhaar(otp, phoneNumber);
  
    // Return the enhanced response
    return {
      message: result.message,
      xToken: result.xToken,
      ABHANumber: result.ABHANumber,
      phrAddress: result.phrAddress,
      profile: result.profile, // Includes other details like name, dob, gender, etc.
    };
  }

  @Get('/download-card')
  async downloadAbhaCard(@Query('phoneNumber') phoneNumber: string, @Res() res): Promise<void> {
    try {
      const abhaCardBuffer = await this.abdmService.downloadAbhaCard(phoneNumber);
  
      // Set headers to force file download
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="abha_card.pdf"',
      });
  
      // Send the file as a response
      res.send(abhaCardBuffer);
    } catch (error) {
      console.error('Error in download-card API:', error.message);
      throw new HttpException(error.message, error.status || 500);
    }
  }
}
