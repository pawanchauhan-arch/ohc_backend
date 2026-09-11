import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/sequelize';
import { lastValueFrom } from 'rxjs';
import { ABDMToken } from 'src/models/abdm-token';
import { v4 as uuidv4 } from 'uuid';
import { rsaEncrypt } from 'src/utils/rsa-encryptor.util'; // Assuming you have this utility

@Injectable()
export class ABDMService {
  constructor(
    private readonly httpService: HttpService,
    @InjectModel(ABDMToken)
    private readonly abdmTokenModel: typeof ABDMToken,
  ) {}

  async getSessionToken(): Promise<string> {
    const existingToken = await this.abdmTokenModel.findOne({
      where: { type: false, expiresAt: { $gt: new Date() } }, // Session token and valid
      order: [['createdAt', 'DESC']],
    });

    if (existingToken) return existingToken.accessToken;

    const url = 'https://dev.abdm.gov.in/gateway/v0.5/sessions';
    const payload = {
      clientId: process.env.ABDM_CLIENT_ID,
      clientSecret: process.env.ABDM_CLIENT_SECRET,
      grantType: 'client_credentials',
    };

    try {
      const response = await lastValueFrom(
        this.httpService.post(url, payload, { headers: { 'Content-Type': 'application/json' } }),
      );
      const { accessToken, expiresIn } = response.data;
      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      await this.abdmTokenModel.create({
        type: false,
        accessToken,
        expiresAt,
      });

      return accessToken;
    } catch (error) {
      throw new Error('Failed to generate session token');
    }
  }

  async getOTP(aadhaarNumber: string, phoneNumber: string): Promise<{ txnId: string }> {
    const url = 'https://abhasbx.abdm.gov.in/abha/api/v3/enrollment/request/otp';
    const sessionToken = await this.getSessionToken();
    const encryptedAadhaar = rsaEncrypt(aadhaarNumber);

    const payload = {
      scope: ['abha-enrol'],
      loginHint: 'aadhaar',
      loginId: encryptedAadhaar,
      otpSystem: 'aadhaar',
    };

    const headers = {
      Authorization: `Bearer ${sessionToken}`,
      'Content-Type': 'application/json',
      'REQUEST-ID': uuidv4(),
      TIMESTAMP: new Date().toISOString(),
    };

    try {
      const response = await lastValueFrom(this.httpService.post(url, payload, { headers }));
      const txnId = response.data.txnId;

      await this.abdmTokenModel.create({
        type: true,
        phoneNumber,
        txnId,
      });

      return { txnId };
    } catch (error) {
      throw new HttpException('Failed to request OTP', 500);
    }
  }

  async enrolByAadhaar(otpValue: string, phoneNumber: string): Promise<{
    xToken: string;
    ABHANumber: string;
    phrAddress: string[];
    profile: any;
    message: string;
  }> {
    const userToken = await this.abdmTokenModel.findOne({
      where: { type: true, phoneNumber },
      order: [['createdAt', 'DESC']],
    });
  
    if (!userToken || !userToken.txnId) {
      throw new Error('Transaction ID not found. Please request OTP first.');
    }
  
    const url = 'https://abhasbx.abdm.gov.in/abha/api/v3/enrollment/enrol/byAadhaar';
    const sessionToken = await this.getSessionToken();
    const encryptedOtp = rsaEncrypt(otpValue);
  
    const payload = {
      authData: {
        authMethods: ['otp'],
        otp: {
          txnId: userToken.txnId,
          otpValue: encryptedOtp,
          mobile: phoneNumber,
        },
      },
      consent: { code: 'abha-enrollment', version: '1.4' },
    };
  
    const headers = {
      Authorization: `Bearer ${sessionToken}`,
      'Content-Type': 'application/json',
      'REQUEST-ID': uuidv4(),
      TIMESTAMP: new Date().toISOString(),
    };
  
    try {
      const response = await lastValueFrom(this.httpService.post(url, payload, { headers }));
      const { tokens, ABHAProfile } = response.data;
  
      const xToken = tokens.token; // Extract X-Token
      const { ABHANumber, phrAddress, ...profile } = ABHAProfile; // Extract ABHA details
  
      // Update the user token in the database
      await userToken.update({ xToken });
  
      // Return relevant response data
      return {
        xToken,
        ABHANumber,
        phrAddress,
        profile,
        message: 'OTP verified successfully',
      };
    } catch (error) {
      throw new HttpException('Failed to verify OTP', 500);
    }
  }
  

  async downloadAbhaCard(phoneNumber: string): Promise<Buffer> {
    // Step 1: Retrieve user-specific token from DB
    const userToken = await this.abdmTokenModel.findOne({
      where: { type: true, phoneNumber },
      order: [['createdAt', 'DESC']],
    });
  
    if (!userToken) {
      throw new Error('User token not found for the provided phone number.');
    }
  
    if (!userToken.xToken) {
      throw new Error('X-Token not found. Please verify OTP first.');
    }
  
    // Step 2: Get session token
    const sessionToken = await this.getSessionToken();
  
    const url = 'https://abhasbx.abdm.gov.in/abha/api/v3/profile/account/abha-card';
  
    // Step 3: Prepare headers with proper prefixes
    const headers = {
      Authorization: `Bearer ${sessionToken}`, // Session token with Bearer prefix
      'X-Token': `Bearer ${userToken.xToken}`, // X-Token with Bearer prefix
      'REQUEST-ID': uuidv4(),                // Generate a unique request ID
      TIMESTAMP: new Date().toISOString(),    // ISO format timestamp
      Accept: '*/*',
      Connection: 'keep-alive',
    };
  
    // Step 4: Make the API request
    try {
      const response = await lastValueFrom(
        this.httpService.get(url, {
          headers,
          responseType: 'arraybuffer', // Expect binary data for the card
        }),
      );
  
      // Step 5: Return the buffer containing the ABHA card
      return response.data;
    } catch (error) {
      console.error('Error downloading ABHA card:', error.response?.data || error.message);
      throw new HttpException('Failed to download ABHA card', error.response?.status || 500);
    }
  }
  
  
}
