// otp.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Otp } from '../../models/OTP';
import { TestAccountService } from '../test-account/test-account.service';
// import { User } from '../models/User';
const { sendOTP } = require('../../helper/sendOtp');

@Injectable()
export class OtpService {
  constructor(
    @InjectModel(Otp)
    private otpModel: typeof Otp,
    private readonly testAccountService: TestAccountService,
  ) {}

  async generateOtp(phoneNumber: string) {
    // Check if this is a test account
    const isTestAccount = await this.testAccountService.isTestAccount(phoneNumber);
    
    if (isTestAccount) {
      // For test accounts, retrieve the hardcoded OTP
      const testAccount = await this.testAccountService.getTestAccountByPhone(phoneNumber);
      return { 
        message: 'OTP sent successfully (Test Account)', 
        otp: testAccount.otp 
      };
    }
    
    // Normal OTP flow for non-test accounts
    const otpData = await sendOTP(phoneNumber);
    await this.otpModel.create({
      phone: phoneNumber,
      otp: otpData.otp,
    });
    return { message: 'OTP sent successfully', otp: otpData.otp };
  }

  async verifyOtp(phoneNumber: string, otp: string) {
    // Check if this is a test account
    const isTestAccount = await this.testAccountService.isTestAccount(phoneNumber);
    
    if (isTestAccount) {
      // For test accounts, verify against the hardcoded OTP
      const isValid = await this.testAccountService.verifyTestAccountOtp(phoneNumber, otp);
      
      if (isValid) {
        return { message: 'OTP verified successfully (Test Account)' };
      } else {
        throw new Error('Invalid OTP for test account');
      }
    }
    
    // Normal OTP verification for non-test accounts
    const otpEntry = await this.otpModel.findOne({ where: { phone: phoneNumber, otp } });
    if (otpEntry) {
      // Optionally, delete OTP entry after verification
      await otpEntry.destroy();
      return { message: 'OTP verified successfully' };
    } else {
      throw new Error('Invalid OTP');
    }
  }
}
