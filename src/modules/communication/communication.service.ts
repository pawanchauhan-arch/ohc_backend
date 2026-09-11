import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from './email.service';
import {
  SendEmailDto,
  EmailTemplateDto,
  EmailTemplate,
} from './dto/send-email.dto';
import { EmailRecord } from '../../models/EmailRecord';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { getOperationalDateRangeWindow } from '../../utils/operational-day.util';
import { driverhealthcheckup } from '../../models/DriverHealthCheckup';
import { Prescription } from '../../models/Prescription';
import {
  buildDetailedHealthConcernEmailTemplate,
  DetailedHealthEmailTemplateContext,
} from './templates/detailed-health-concern-email.template';

export interface CommunicationResult {
  success: boolean;
  emailSent: boolean;
  errors: string[];
}

export interface ManualEmailData {
  concernId: number;
  spocName: string;
  spocPhone: string;
  prescriptionFile?: Express.Multer.File;
  receiverEmails: string[];
  ccEmails?: string[];
  customSubject?: string;
  customMessage?: string;
}

export interface DetailedEmailData {
  driverName: string;
  vehicleNo: string;
  dlNo: string;
  driverContact: string;
  centreName: string;

  // Test Details
  testParameter: string; // e.g., "Random Blood Sugar"
  concernLevel: string; // e.g., "Moderate Concern"
  concernLevelRange: string; // e.g., "200-349mg/dL"
  levelTested: string; // e.g., "278mg/dL"
  recommendation: string; // e.g., "Lifestyle modification..."

  // Narrative details
  supervisorName: string;
  supervisorContact: string;

  // Sending details
  receiverEmails: string[];
  customSubject?: string;
  prescriptionFile?: any; // Express.Multer.File
  ccEmails?: string[];
  senderUserName?: string;
  centerId?: number;
  /** Primary key of `driverhealthcheckups` — used to load fitness status and linked prescription. */
  id: number | string;
}
interface FetchEmailRecordParams {
  startDate?: string;
  endDate?: string;
  centerId?: number;
  page?: number;
  limit?: number;
}
@Injectable()
export class CommunicationService {
  private readonly logger = new Logger(CommunicationService.name);

  constructor(
    private readonly emailService: EmailService,
    @InjectModel(EmailRecord)
    private readonly emailRecordModel: typeof EmailRecord,
    @InjectModel(driverhealthcheckup)
    private readonly driverhealth: typeof driverhealthcheckup,
    @InjectModel(Prescription)
    private readonly prescriptionModel: typeof Prescription,
  ) {}

  /**
   * Send manual health concern email with user-provided details
   */
  async sendManualHealthConcernEmail(
    emailData: ManualEmailData,
  ): Promise<CommunicationResult> {
    const result: CommunicationResult = {
      success: false,
      emailSent: false,
      errors: [],
    };

    try {
      // Validate input
      if (!emailData.receiverEmails || emailData.receiverEmails.length === 0) {
        result.errors.push('At least one receiver email is required');
        return result;
      }

      if (!emailData.spocName || !emailData.spocPhone) {
        result.errors.push('SPOC name and phone number are required');
        return result;
      }

      // Generate email content
      const emailContent = this.generateManualEmailContent(emailData);
      const subject =
        emailData.customSubject || 'Health Concern Alert - Manual Notification';

      // Send email to all recipients
      const emailPromises = emailData.receiverEmails.map((email) =>
        this.emailService.sendEmailWithAttachment({
          to: email,
          subject,
          content: emailContent,
          attachment: emailData.prescriptionFile,
          ccEmails: emailData.ccEmails || ['Test@gmail.com'], // Ensure cc is an array of strings even if not provided
        }),
      );

      const emailResults = await Promise.allSettled(emailPromises);
      const successfulEmails = emailResults.filter(
        (r) => r.status === 'fulfilled' && r.value === true,
      );
      const failedEmails = emailResults.filter(
        (r) => r.status === 'rejected' || r.value === false,
      );

      result.emailSent = successfulEmails.length > 0;
      result.success =
        successfulEmails.length === emailData.receiverEmails.length;

      // Collect errors
      failedEmails.forEach((failedResult, index) => {
        if (failedResult.status === 'rejected') {
          result.errors.push(
            `Email to ${emailData.receiverEmails[index]} failed: ${failedResult.reason}`,
          );
        } else {
          result.errors.push(
            `Email to ${emailData.receiverEmails[index]} failed: Unknown error`,
          );
        }
      });

      this.logger.log(
        `Manual health concern email sent. Success: ${result.success}, Emails sent: ${successfulEmails.length}/${emailData.receiverEmails.length}`,
      );
    } catch (error) {
      result.errors.push(`Manual email service error: ${error.message}`);
      this.logger.error('Failed to send manual health concern email:', error);
    }

    return result;
  }

  /**
   * Generate email content for manual sending
   */
  private generateManualEmailContent(emailData: ManualEmailData): string {
    const concernDetails = this.getConcernDetails(emailData.concernId);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Health Concern Alert</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background-color: #f8f9fa; padding: 20px; border-bottom: 3px solid #dc3545; }
          .content { padding: 20px; }
          .alert-box { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .details { background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .contact-info { background-color: #e9ecef; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🚨 Health Concern Alert</h1>
          <p><strong>Manual Notification</strong></p>
        </div>
        
        <div class="content">
          <div class="alert-box">
            <h2>⚠️ Health Concern Detected</h2>
            <p>This is a manual notification regarding a health concern that requires attention.</p>
          </div>

          <div class="details">
            <h3>📋 Concern Details</h3>
            <p><strong>Driver Name:</strong> ${concernDetails.driverName || 'N/A'}</p>
            <p><strong>Concern Type:</strong> ${concernDetails.concernType || 'N/A'}</p>
            <p><strong>Concern Level:</strong> ${concernDetails.concernLevel || 'N/A'}</p>
            <p><strong>Parameter Value:</strong> ${concernDetails.parameterValue || 'N/A'}</p>
            <p><strong>Threshold Value:</strong> ${concernDetails.thresholdValue || 'N/A'}</p>
            ${concernDetails.customNotes ? `<p><strong>Additional Notes:</strong> ${concernDetails.customNotes}</p>` : ''}
          </div>

          <div class="contact-info">
            <h3>📞 Contact Information</h3>
            <p><strong>SPOC Name:</strong> ${emailData.spocName}</p>
            <p><strong>SPOC Phone:</strong> ${emailData.spocPhone}</p>
          </div>

          ${
            emailData.customMessage
              ? `
          <div class="details">
            <h3>💬 Additional Message</h3>
            <p>${emailData.customMessage}</p>
          </div>
          `
              : ''
          }

          ${
            emailData.prescriptionFile
              ? `
          <div class="details">
            <h3>📎 Attachments</h3>
            <p>A prescription file has been attached to this email for your reference.</p>
          </div>
          `
              : ''
          }
        </div>

        <div class="footer">
          <p>This is an automated health concern alert system notification.</p>
          <p>Please take appropriate action based on the concern details provided.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get concern details from database (placeholder - needs integration with health concerns service)
   */
  private getConcernDetails(concernId: number): any {
    // TODO: Integrate with HealthConcernsService to get actual concern details
    // For now, return placeholder data
    return {
      driverName: 'Driver Name (from database)',
      concernType: 'Health Parameter (from database)',
      concernLevel: 'MODERATE/HIGH (from database)',
      parameterValue: 'Actual Value (from database)',
      thresholdValue: 'Threshold Value (from database)',
      customNotes: 'Additional notes (from database)',
    };
  }

  /**
   * Send individual email
   */
  async sendEmail(sendEmailDto: SendEmailDto): Promise<boolean> {
    return this.emailService.sendEmail(sendEmailDto);
  }

  /**
   * Generate email content from template
   */
  generateEmailContent(templateDto: EmailTemplateDto): string {
    return this.emailService.generateEmailContent(templateDto);
  }

  async sendDetailedHealthConcernEmail(
    data: DetailedEmailData,
  ): Promise<CommunicationResult> {
    const result: CommunicationResult = {
      success: false,
      emailSent: false,
      errors: [],
    };

    try {
      if (!data.receiverEmails || data.receiverEmails.length === 0) {
        result.errors.push('At least one receiver email is required');
        return result;
      }

      const healthId = data.id;
      const record = await this.driverhealth.findByPk(healthId);

      if (!record) {
        result.errors.push(`DriverHealthCheckup with id ${healthId} not found`);
        return result;
      }

      const prescription = await this.prescriptionModel.findOne({
        where: { driver_health_checkup_id: healthId },
        order: [['updatedAt', 'DESC']],
      });

      const templateContext: DetailedHealthEmailTemplateContext = {
        checkupFitnessStatus: record.fitness_status ?? null,
        prescriptionFitnessStatus: prescription?.fitness_status ?? null,
        referenceDate: record.date_time ?? record.updatedAt ?? null,
      };

      // Generate the specific HTML format
      const emailContent = buildDetailedHealthConcernEmailTemplate(
        data,
        templateContext,
      );
      const subject =
        data.customSubject || `Health Concern Alert - ${data.driverName}`;

      const emailPromises = data.receiverEmails.map((email) =>
        this.emailService.sendEmailWithAttachment({
          to: email,
          subject,
          content: emailContent,
          attachment: data.prescriptionFile,
          ccEmails: data.ccEmails || [],
        }),
      );

      const emailResults = await Promise.allSettled(emailPromises);
      const successfulEmails = emailResults.filter(
        (r) => r.status === 'fulfilled' && r.value === true,
      );

      result.emailSent = successfulEmails.length > 0;
      result.success = successfulEmails.length === data.receiverEmails.length;

      this.logger.log(`Detailed health email sent. Success: ${result.success}`);
      const sentEmailRecord = await this.emailRecordModel.create({
        recipient: data.receiverEmails || [],
        cc: data.ccEmails || [],
        supervisor_name: data.supervisorName,
        supervisor_contact_number: data.supervisorContact,
        email_sent_by: data.senderUserName, // logged in user
        center_id: data.centerId,
        concern: data.concernLevel,
        driver_name: data.driverName,
        parameter: data.testParameter,
      });

      const concerns = (record.concerns as any[]) ?? [];

      const updatedConcerns = concerns.map((c) => {
        if (c.parameter === data.testParameter) {
          return {
            ...c,
            email_sent: true,
            email_sent_at: new Date(),
          };
        }
        return c;
      });

      await record.update({
        concerns: updatedConcerns,
      });
    } catch (error) {
      result.errors.push(`Email service error: ${error.message}`);
      this.logger.error('Failed to send detailed email:', error);
    }

    return result;
  }

  async fetchEmailRecords(filter: FetchEmailRecordParams) {
    const page = Math.max(Number(filter.page) || 1, 1);
    const limit = Math.min(Math.max(Number(filter.limit) || 10, 1), 100);
    const offset = (page - 1) * limit;

    const { startDate, endDate, centerId } = filter;
    const whereCondition: any = {};

    if (startDate && endDate) {
      const window = getOperationalDateRangeWindow(startDate, endDate);
      whereCondition.created_on = {
        [Op.between]: [window.startUtc, window.endUtc],
      };
    }

    if (centerId) {
      whereCondition.center_id = centerId;
    }

    const { rows, count } = await this.emailRecordModel.findAndCountAll({
      where: whereCondition,
      order: [['created_on', 'DESC']],
      limit,
      offset,
    });

    return {
      status: true,
      total: count,
      page,
      limit,
      data: rows,
    };
  }
}
