import { Injectable, Logger } from '@nestjs/common';
import {
  SendEmailDto,
  SendEmailWithAttachmentDto,
  EmailTemplateDto,
  EmailTemplate,
} from './dto/send-email.dto';
import { emailFrom, healthConcernConfig } from '../../../config/envConfig';
import {
  SESClient,
  SendEmailCommand,
  SendRawEmailCommand,
} from '@aws-sdk/client-ses';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly sesClient: SESClient;

  constructor() {
    // Debug logging for AWS credentials
    this.logger.log('Initializing SES Client with credentials:');
    this.logger.log(`Region: ${process.env.AWS_REGION || 'us-east-1'}`);
    this.logger.log(
      `Access Key ID: ${process.env.AWS_ACCESS_KEY_ID ? '***' + process.env.AWS_ACCESS_KEY_ID.slice(-4) : 'NOT SET'}`,
    );
    this.logger.log(
      `Secret Access Key: ${process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET'}`,
    );
    this.logger.log(`Email From: ${process.env.EMAIL_FROM || 'NOT SET'}`);

    this.sesClient = new SESClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  /**
   * Send email using Amazon SES
   */
  async sendEmail(sendEmailDto: SendEmailDto): Promise<boolean> {
    try {
      // Check if email service is enabled
      if (!healthConcernConfig?.emailService?.enabled) {
        this.logger.warn('Email service is disabled');
        return false;
      }

      // Validate required configuration
      if (
        !process.env.AWS_ACCESS_KEY_ID ||
        !process.env.AWS_SECRET_ACCESS_KEY ||
        !emailFrom
      ) {
        this.logger.error('Missing AWS SES configuration');
        return false;
      }

      this.logger.log(`Sending email to: ${sendEmailDto.to}`);
      this.logger.log(`Subject: ${sendEmailDto.subject}`);

      // Prepare email message for SES
      const params = {
        Source: emailFrom,
        Destination: {
          ToAddresses: [sendEmailDto.to],
        },
        Message: {
          Subject: {
            Data: sendEmailDto.subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: sendEmailDto.content,
              Charset: 'UTF-8',
            },
          },
        },
      };

      // Send email using SES
      const command = new SendEmailCommand(params);
      const response = await this.sesClient.send(command);

      this.logger.log(
        `Email sent successfully to ${sendEmailDto.to}. Message ID: ${response.MessageId}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${sendEmailDto.to}:`, error);

      // Log detailed error information
      if (error.name) {
        this.logger.error('AWS SES Error Details:', {
          name: error.name,
          message: error.message,
          code: error.$metadata?.httpStatusCode,
        });
      }

      return false;
    }
  }

  /**
   * Send email with attachment using Amazon SES
   */
  async sendEmailWithAttachment(
    sendEmailDto: SendEmailWithAttachmentDto,
  ): Promise<boolean> {
    try {
      // Check if email service is enabled
      if (!healthConcernConfig?.emailService?.enabled) {
        this.logger.warn('Email service is disabled');
        return false;
      }

      // Validate required configuration
      if (
        !process.env.AWS_ACCESS_KEY_ID ||
        !process.env.AWS_SECRET_ACCESS_KEY ||
        !emailFrom
      ) {
        this.logger.error('Missing AWS SES configuration');
        return false;
      }

      this.logger.log(`Sending email with attachment to: ${sendEmailDto.to}`);
      this.logger.log(`Subject: ${sendEmailDto.subject}`);

      // Prepare email message for SES with attachment
      const params = {
        Source: emailFrom,
        Destination: {
          ToAddresses: [sendEmailDto.to],
          CcAddresses: sendEmailDto.ccEmails ?? [],
        },
        Message: {
          Subject: {
            Data: sendEmailDto.subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: sendEmailDto.content,
              Charset: 'UTF-8',
            },
          },
        },
      };

      // Add attachment if provided
      if (sendEmailDto.attachment) {
        // For SES, we need to use SendRawEmailCommand for attachments
        const rawEmailParams = this.buildRawEmailWithAttachment(sendEmailDto);
        const command = new SendRawEmailCommand(rawEmailParams);
        const response = await this.sesClient.send(command);

        this.logger.log(
          `Email with attachment sent successfully to ${sendEmailDto.to}. Message ID: ${response.MessageId}`,
        );
        return true;
      } else {
        // Send regular email without attachment
        const command = new SendEmailCommand(params);
        const response = await this.sesClient.send(command);

        this.logger.log(
          `Email sent successfully to ${sendEmailDto.to}. Message ID: ${response.MessageId}`,
        );
        return true;
      }
    } catch (error) {
      this.logger.error(
        `Failed to send email with attachment to ${sendEmailDto.to}:`,
        error,
      );

      // Log detailed error information
      if (error.name) {
        this.logger.error('AWS SES Error Details:', {
          name: error.name,
          message: error.message,
          code: error.$metadata?.httpStatusCode,
        });
      }

      return false;
    }
  }

  /**
   * Build raw email with attachment for SES
   */
  private buildRawEmailWithAttachment(
    sendEmailDto: SendEmailWithAttachmentDto,
  ): any {
    const boundary = 'boundary_' + Math.random().toString(36).substring(2);
    const attachment = sendEmailDto.attachment;

    const emailContent = [
      `From: ${emailFrom}`,
      `To: ${sendEmailDto.to}`,
      `Subject: ${sendEmailDto.subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: 7bit`,
      '',
      sendEmailDto.content,
      '',
      `--${boundary}`,
      `Content-Type: ${attachment.mimetype}; name="${attachment.originalname}"`,
      `Content-Disposition: attachment; filename="${attachment.originalname}"`,
      `Content-Transfer-Encoding: base64`,
      '',
      attachment.buffer.toString('base64'),
      '',
      `--${boundary}--`,
    ].join('\r\n');

    return {
      RawMessage: {
        Data: Buffer.from(emailContent, 'utf-8'),
      },
    };
  }

  /**
   * Generate email content from template
   */
  generateEmailContent(templateDto: EmailTemplateDto): string {
    const templates = {
      [EmailTemplate.CET_MODERATE]:
        this.generateCetModerateTemplate(templateDto),
      [EmailTemplate.CET_HIGH]: this.generateCetHighTemplate(templateDto),
      [EmailTemplate.CLIENT_MODERATE]:
        this.generateClientModerateTemplate(templateDto),
      [EmailTemplate.CLIENT_HIGH]: this.generateClientHighTemplate(templateDto),
    };

    return (
      templates[templateDto.template] ||
      this.generateDefaultTemplate(templateDto)
    );
  }

  /**
   * Generate CET Moderate Concern Email Template
   */
  private generateCetModerateTemplate(data: EmailTemplateDto): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Health Concern Alert - Moderate</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #ff6b35;">🚨 Health Concern Alert - Moderate Level</h2>
          
          <p><strong>Dear CET SPOC,</strong></p>
          
          <p>A moderate health concern has been identified for driver <strong>${data.driverName}</strong>.</p>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #856404;">Concern Details:</h3>
            <ul>
              <li><strong>Parameter:</strong> ${data.concernType}</li>
              <li><strong>Level:</strong> ${data.concernLevel}</li>
              <li><strong>Value:</strong> ${data.parameterValue}</li>
              <li><strong>Threshold:</strong> ${data.thresholdValue}</li>
            </ul>
          </div>
          
          <p><strong>Recommended Action:</strong> Lifestyle Counselling / Doctor consultation</p>
          
          ${data.customNotes ? `<p><strong>Additional Notes:</strong> ${data.customNotes}</p>` : ''}
          
          <p>Please take appropriate action and update the system accordingly.</p>
          
          <p>Best regards,<br>Health Monitoring System</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate CET High Concern Email Template
   */
  private generateCetHighTemplate(data: EmailTemplateDto): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>URGENT: Health Concern Alert - High</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #dc3545;">🚨 URGENT: Health Concern Alert - High Level</h2>
          
          <p><strong>Dear CET SPOC,</strong></p>
          
          <p><strong>URGENT:</strong> A high-level health concern has been identified for driver <strong>${data.driverName}</strong>.</p>
          
          <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #721c24;">Critical Concern Details:</h3>
            <ul>
              <li><strong>Parameter:</strong> ${data.concernType}</li>
              <li><strong>Level:</strong> ${data.concernLevel}</li>
              <li><strong>Value:</strong> ${data.parameterValue}</li>
              <li><strong>Threshold:</strong> ${data.thresholdValue}</li>
            </ul>
          </div>
          
          <p><strong>IMMEDIATE ACTION REQUIRED:</strong> MANDATORY Doctor Consultation</p>
          
          ${data.customNotes ? `<p><strong>Additional Notes:</strong> ${data.customNotes}</p>` : ''}
          
          <p><strong>Please take immediate action and ensure the driver receives medical attention.</strong></p>
          
          <p>Best regards,<br>Health Monitoring System</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate Client Moderate Concern Email Template
   */
  private generateClientModerateTemplate(data: EmailTemplateDto): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Health Concern Alert - Moderate</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #ff6b35;">🚨 Health Concern Alert - Moderate Level</h2>
          
          <p><strong>Dear Client SPOC,</strong></p>
          
          <p>A moderate health concern has been identified for driver <strong>${data.driverName}</strong> from your organization.</p>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #856404;">Concern Details:</h3>
            <ul>
              <li><strong>Parameter:</strong> ${data.concernType}</li>
              <li><strong>Level:</strong> ${data.concernLevel}</li>
              <li><strong>Value:</strong> ${data.parameterValue}</li>
              <li><strong>Threshold:</strong> ${data.thresholdValue}</li>
            </ul>
          </div>
          
          <p><strong>Recommended Action:</strong> Lifestyle Counselling / Doctor consultation</p>
          
          ${data.customNotes ? `<p><strong>Additional Notes:</strong> ${data.customNotes}</p>` : ''}
          
          <p>Please ensure appropriate action is taken and the driver receives necessary medical attention.</p>
          
          <p>Best regards,<br>Health Monitoring System</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate Client High Concern Email Template
   */
  private generateClientHighTemplate(data: EmailTemplateDto): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>URGENT: Health Concern Alert - High</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #dc3545;">🚨 URGENT: Health Concern Alert - High Level</h2>
          
          <p><strong>Dear Client SPOC,</strong></p>
          
          <p><strong>URGENT:</strong> A high-level health concern has been identified for driver <strong>${data.driverName}</strong> from your organization.</p>
          
          <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #721c24;">Critical Concern Details:</h3>
            <ul>
              <li><strong>Parameter:</strong> ${data.concernType}</li>
              <li><strong>Level:</strong> ${data.concernLevel}</li>
              <li><strong>Value:</strong> ${data.parameterValue}</li>
              <li><strong>Threshold:</strong> ${data.thresholdValue}</li>
            </ul>
          </div>
          
          <p><strong>IMMEDIATE ACTION REQUIRED:</strong> MANDATORY Doctor Consultation</p>
          
          ${data.customNotes ? `<p><strong>Additional Notes:</strong> ${data.customNotes}</p>` : ''}
          
          <p><strong>Please take immediate action and ensure the driver receives medical attention.</strong></p>
          
          <p>Best regards,<br>Health Monitoring System</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate default email template
   */
  private generateDefaultTemplate(data: EmailTemplateDto): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Health Concern Alert</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #007bff;">Health Concern Alert</h2>
          
          <p>A health concern has been identified for driver <strong>${data.driverName}</strong>.</p>
          
          <div style="background-color: #e7f3ff; border: 1px solid #b3d9ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Concern Details:</h3>
            <ul>
              <li><strong>Parameter:</strong> ${data.concernType}</li>
              <li><strong>Level:</strong> ${data.concernLevel}</li>
              <li><strong>Value:</strong> ${data.parameterValue}</li>
              <li><strong>Threshold:</strong> ${data.thresholdValue}</li>
            </ul>
          </div>
          
          ${data.customNotes ? `<p><strong>Additional Notes:</strong> ${data.customNotes}</p>` : ''}
          
          <p>Please take appropriate action.</p>
          
          <p>Best regards,<br>Health Monitoring System</p>
        </div>
      </body>
      </html>
    `;
  }
}
