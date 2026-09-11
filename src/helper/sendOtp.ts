import * as twilio from 'twilio';
import { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } from 'config/envConfig';

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

/**
 * Generates a 4-digit OTP
 * @returns Promise<string> - The generated OTP
 */
async function generateOTP(): Promise<string> {
    const otp = Math.floor(1000 + Math.random() * 9000);
    return otp.toString();
}

interface OTPResponse {
    response: any;
    otp: string;
}

/**
 * Sends OTP via Twilio SMS
 * @param phoneNumber - The phone number to send OTP to (without country code)
 * @returns Promise<OTPResponse> - The response and generated OTP
 */
async function sendOTP(phoneNumber: string): Promise<OTPResponse> {
    const otp = await generateOTP();
    
    try {
        const messageText = `Your OTP is ${otp}. Please share this with the respective personnel to get your mobile verified and generate your request for an appointment.`;
        const formattedPhoneNumber = `+91${phoneNumber}`;
        
        const message = await client.messages.create({
            body: messageText,
            from: TWILIO_PHONE_NUMBER,
            to: formattedPhoneNumber,
        });
        
        const resData: OTPResponse = {
            response: message,
            otp: otp
        };
        
        return resData;
        
    } catch (error) {
        throw error;
    }
}

export { sendOTP };
