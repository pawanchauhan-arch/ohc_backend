import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
  Query,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CommunicationService } from './communication.service';
import {
  SendEmailDto,
  EmailTemplateDto,
  ManualEmailDto,
} from './dto/send-email.dto';
import { DetailedEmailData } from './communication.service';

@Controller('api/communication')
export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

  /**
   * Send manual health concern email with user-provided details
   */
  @Post('send-manual-health-email')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('prescriptionFile'))
  async sendManualHealthEmail(
    @Body() emailData: ManualEmailDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB max
          new FileTypeValidator({ fileType: '.(pdf|doc|docx|jpg|jpeg|png)' }),
        ],
        fileIsRequired: false,
      }),
    )
    prescriptionFile?: Express.Multer.File,
  ) {
    return this.communicationService.sendManualHealthConcernEmail({
      ...emailData,
      prescriptionFile,
    });
  }

  /**
   * Send individual email
   */
  @Post('send-email')
  @HttpCode(HttpStatus.OK)
  async sendEmail(@Body() sendEmailDto: SendEmailDto): Promise<boolean> {
    return this.communicationService.sendEmail(sendEmailDto);
  }

  /**
   * Generate email content from template
   */
  @Post('generate-email-content')
  @HttpCode(HttpStatus.OK)
  async generateEmailContent(
    @Body() templateDto: EmailTemplateDto,
  ): Promise<{ content: string }> {
    const content = this.communicationService.generateEmailContent(templateDto);
    return { content };
  }

  /**
   * Test SendGrid email sending with template
   */
  @Post('send-template-email')
  @HttpCode(HttpStatus.OK)
  async sendTemplateEmail(
    @Body() templateDto: EmailTemplateDto & { to: string },
  ): Promise<{ success: boolean; messageId?: string }> {
    const content = this.communicationService.generateEmailContent(templateDto);
    const success = await this.communicationService.sendEmail({
      to: templateDto.to,
      subject: `Health Concern Alert - ${templateDto.concernLevel} Level`,
      content,
    });

    return {
      success,
      messageId: success ? 'template-email-sent' : undefined,
    };
  }

  /**
   * Test SendGrid email sending with custom content
   */
  @Post('test-email')
  @HttpCode(HttpStatus.OK)
  async testEmail(
    @Body() data: { to: string; subject?: string; content?: string },
  ): Promise<{ success: boolean; messageId?: string }> {
    const success = await this.communicationService.sendEmail({
      to: data.to,
      subject: data.subject || 'Test Email from Health Concern System',
      content:
        data.content ||
        `
        <h1>Test Email</h1>
        <p>This is a test email from the Health Concern Alert System.</p>
        <p>If you receive this email, the SendGrid integration is working correctly!</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      `,
    });

    return {
      success,
      messageId: success ? 'test-email-sent' : undefined,
    };
  }

  @Post('send-alert')
  async sendAlert() {
    const emailData: DetailedEmailData = {
      driverName: 'Prabhash Chandra Rai',
      vehicleNo: 'NL01L9779',
      dlNo: 'GJ1220040514370',
      driverContact: '9898781806',
      centreName: 'Jindal Steel, Kavach Raigarh',

      testParameter: 'Random Blood Sugar',
      concernLevel: 'High Concern',
      concernLevelRange: '200-349mg/dL',
      levelTested: '400mg/dL',
      recommendation: 'Lifestyle modification and proper medication',

      supervisorName: 'Raman Singh',
      supervisorContact: '7763800609',

      receiverEmails: [
        'amansharma1924@gmail.com',
        'gaurav@lastmilecare.in',
        'anupam@lastmilecare.in',
        'Abhinavj@lastmilecare.in',
        'pooja@lastmilecare.in',
      ],
      customSubject: 'Health Alert: Mr. Prabhash Chandra Rai',
      id:1
      // prescriptionFile: file // if you have an attachment
    };

    return await this.communicationService.sendDetailedHealthConcernEmail(
      emailData,
    );
  }

  @Post('send-detailed-concern')
  async sendDetailedConcern(@Body() data: DetailedEmailData) {
    return await this.communicationService.sendDetailedHealthConcernEmail(data);
  }
  @Post('email-record')
  async fetchEmailRecords(
    @Query('fromDate') fromDateQuery?: string,
    @Query('toDate') toDateQuery?: string,
    @Query('centerId') centerIdQuery?: string,
    @Query('page') pageQuery?: string,
    @Query('limit') limitQuery?: string,
    @Body() body?: Record<string, unknown>,
  ) {
    const fromDate = String(body?.fromDate ?? fromDateQuery ?? '').trim();
    const toDate = String(body?.toDate ?? toDateQuery ?? '').trim();
    const centerIdRaw = body?.centerId ?? centerIdQuery;
    const pageRaw = body?.page ?? pageQuery;
    const limitRaw = body?.limit ?? limitQuery;

    let parsedCenterId: number | undefined;

    if (fromDate && Number.isNaN(new Date(fromDate).getTime())) {
      throw new BadRequestException('Invalid fromDate');
    }
    if (toDate && Number.isNaN(new Date(toDate).getTime())) {
      throw new BadRequestException('Invalid toDate');
    }
    if (centerIdRaw !== undefined && centerIdRaw !== null && centerIdRaw !== '') {
      const id = Number(centerIdRaw);
      if (Number.isNaN(id)) {
        throw new BadRequestException('Invalid centerId');
      }
      parsedCenterId = id;
    }

    return this.communicationService.fetchEmailRecords({
      startDate: fromDate || undefined,
      endDate: toDate || undefined,
      centerId: parsedCenterId,
      page: pageRaw != null && pageRaw !== '' ? Number(pageRaw) : undefined,
      limit: limitRaw != null && limitRaw !== '' ? Number(limitRaw) : undefined,
    });
  }
}
