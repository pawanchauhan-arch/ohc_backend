import * as twilio from 'twilio';
import {
  WP_TWILIO_ACCOUNT_SID,
  WP_TWILIO_AUTH_TOKEN,
  WP_TWILIO_AIVIDEO2_TEMPLATE_SID,
  WP_TWILIO_TEMPLATE_SID,
} from 'config/envConfig';

/**
 * WhatsApp Helper
 * ----------------
 * - Pure helper (no @Injectable)
 * - Explicit config passing
 * - Safe for services, queues, cron jobs
 */

const LEGACY_TEMPLATE_SID = 'HX20cadf53e9dedee2dbfd7f16d5d7232b';
const DEFAULT_WHATSAPP_FROM = 'whatsapp:+917209152555';

export interface WhatsAppConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
  templateSid: string;
}

export class WhatsAppHelper {
  private static getClient() {
    return twilio(WP_TWILIO_ACCOUNT_SID, WP_TWILIO_AUTH_TOKEN);
  }

  private static async sendContentTemplate(
    name: string,
    url: string,
    phoneNumber: string,
    contentSid: string,
    config?: WhatsAppConfig,
  ): Promise<{ sid: string; status: string }> {
    const client = this.getClient();
    const toNumber = `+91${phoneNumber}`;
    const from =
      config?.fromNumber != null
        ? config.fromNumber.startsWith('whatsapp:')
          ? config.fromNumber
          : `whatsapp:${config.fromNumber}`
        : DEFAULT_WHATSAPP_FROM;

    const message = await client.messages.create({
      from,
      to: `whatsapp:${toNumber}`,
      contentSid,
      contentVariables: JSON.stringify({
        '1': name,
        '2': url,
      }),
    });

    return {
      sid: message.sid,
      status: message.status,
    };
  }

  /**
   * Sends the approved `aivideo2` media template after concern / AI video merge.
   * Body: Dear {{1}}, … | Media URL: {{2}}
   */
  static async sendAiConcernVideoMessage(
    name: string,
    url: string,
    phoneNumber: string,
    config?: WhatsAppConfig,
  ): Promise<{ sid: string; status: string }> {
    const contentSid =
      config?.templateSid ?? WP_TWILIO_AIVIDEO2_TEMPLATE_SID;
    if (!contentSid) {
      throw new Error(
        'WP_TWILIO_AIVIDEO2_TEMPLATE_SID is not set (Twilio template aivideo2)',
      );
    }
    return this.sendContentTemplate(name, url, phoneNumber, contentSid, config);
  }

  /** Generic template (e.g. driver OTP); does not use aivideo2. */
  static async sendTemplateMessage(
    name: string,
    url: string,
    phoneNumber: string,
    config?: WhatsAppConfig,
  ): Promise<{ sid: string; status: string }> {
    const contentSid =
      config?.templateSid ?? WP_TWILIO_TEMPLATE_SID ?? LEGACY_TEMPLATE_SID;
    return this.sendContentTemplate(name, url, phoneNumber, contentSid, config);
  }
}
