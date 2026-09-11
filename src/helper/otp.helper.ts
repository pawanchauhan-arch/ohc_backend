import axios from 'axios';
import * as twilio from 'twilio';

/**
 * NOTE:
 * - This is a pure helper (no @Injectable)
 * - Config is passed explicitly to avoid tight coupling
 * - Easy to reuse, test, and migrate
 */

export interface SendOtpConfig {
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  textLocalUsername: string;
  textLocalApiKey: string;
  textLocalSender: string;
}

export class OtpHelper {
  private static generateOTP(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  static async sendOTP(
    phoneNumber: string,
    config?: SendOtpConfig,
  ): Promise<{
    otp: string;
    response: any;
  }> {
    const otp = this.generateOTP();

    try {
      const messageText = `Your OTP is ${otp}. Please share this with the respective personnel to get your mobile verified and generate your request for an appointment.`;

      // key and other field hardcoded as refence taken from the old application.
      const username = 'anupam@senpiper.com';
      const apiKey = encodeURIComponent('NzU3YTU1MzY3MjZjNjM0MjQ0NDI3MDQ5Njk3Njc3MzE=');
      const numbers = encodeURIComponent(`+91${phoneNumber}`);
      const sender = encodeURIComponent('last mile care');
      const message = encodeURIComponent(messageText);

      const data = `hash=${apiKey}&username=${username}&numbers=${numbers}&sender=${sender}&message=${message}`;

      const response = await axios.get(
        `https://api.textlocal.in/send/?${data}`,
      );

      return {
        otp,
        response: response.data,
      };
    } catch (error) {
      throw error;
    }
  }
}
