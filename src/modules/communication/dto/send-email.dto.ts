import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
} from 'class-validator';

export enum EmailTemplate {
  CET_MODERATE = 'CET_MODERATE',
  CET_HIGH = 'CET_HIGH',
  CLIENT_MODERATE = 'CLIENT_MODERATE',
  CLIENT_HIGH = 'CLIENT_HIGH',
}

export class SendEmailDto {
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(EmailTemplate)
  @IsOptional()
  template?: EmailTemplate;

  @IsString()
  @IsOptional()
  customContent?: string;
}

export class SendEmailWithAttachmentDto {
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  ccEmails?: string[];

  @IsOptional()
  attachment?: Express.Multer.File;
}

export class ManualEmailDto {
  @IsNotEmpty()
  concernId: number;

  @IsString()
  @IsNotEmpty()
  spocName: string;

  @IsString()
  @IsNotEmpty()
  spocPhone: string;

  @IsArray()
  @IsEmail({}, { each: true })
  @IsNotEmpty()
  receiverEmails: string[];

  @IsString()
  @IsOptional()
  customSubject?: string;

  @IsString()
  @IsOptional()
  customMessage?: string;
}

export class EmailTemplateDto {
  @IsEnum(EmailTemplate)
  @IsNotEmpty()
  template: EmailTemplate;

  @IsString()
  @IsNotEmpty()
  driverName: string;

  @IsString()
  @IsNotEmpty()
  concernType: string;

  @IsString()
  @IsNotEmpty()
  concernLevel: string;

  @IsString()
  @IsNotEmpty()
  parameterValue: string;

  @IsString()
  @IsNotEmpty()
  thresholdValue: string;

  @IsString()
  @IsOptional()
  customNotes?: string;
}
