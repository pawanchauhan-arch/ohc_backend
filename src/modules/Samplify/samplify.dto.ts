import { IsString, IsArray, IsOptional, ValidateNested, IsInt, IsEmail, IsDateString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export class CampPatientDto {
  @IsString() patient_ref_id: string;
  @IsString() first_name: string | null;
  @IsString() last_name: string | null;
  @IsString() gender: string | null;
  @IsInt() age: number | null;
  @IsOptional() @IsString() phone_no?: string;
  @IsOptional() @IsDateString() dob?: string;
  @IsOptional() @IsString() reports?: string;
  @IsOptional() @IsString() parameter_metadata?: string;
  @IsOptional() @IsString() specimen_barcodes?: {
    specimens: {
      barcode: string;
      name: string;
    }[];
  };
  @IsOptional()  test_codes?: string[];
  @IsOptional() @IsString() trf_barcode?: string;
  @IsOptional() @IsString() sample_collection_time?: string;
}

export class CreateCustomerCampDto {
  @IsString() pincode: string;
  @IsString() date: string; // YYYY-MM-DD
  @IsString() address: string;
  @IsString() camp_ref_id?: string;
  @IsOptional() @IsString() remark?: string;
  @IsString() corporate_name?: string;

  @IsOptional() @IsInt() cet_id?: number;

  @IsOptional() @IsString()
  invoice_url?: string;

  @IsOptional() @IsString()
  po_url?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  patient_metadata_fields?: string[];

  camp_spoc_name: string;
  camp_spoc_phone: string;
  @IsEmail() camp_spoc_email: string;

  @IsOptional() @IsArray() @IsEmail()
  patient_report_email_ids?: string[];

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CampPatientDto)
  camp_patients?: CampPatientDto[];

  @IsOptional()  test_codes?: string[];

  @IsOptional() @IsBoolean()
  isCompleted?: boolean;
}

export class UpdateCustomerCampDto extends PartialType(CreateCustomerCampDto) {}

