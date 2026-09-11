import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsEmail, 
  IsEnum, 
  IsArray, 
  IsNumber, 
  ArrayMinSize 
} from 'class-validator';
import { Type } from 'class-transformer';


export class CreateCorporateDto {
  // --- Basic Information ---
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  corporate_type: string;

  @IsString()
  @IsOptional()
  external_id?: string;

  // The List of Center IDs associated with this Corporate
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  @Type(() => Number)
  center_ids: number[];

  @IsString()
  @IsNotEmpty()
  contactNumber: string;

  @IsString()
  @IsOptional()
  registeredAddress?: string;

  @IsString()
  @IsOptional()
  correspondenceAddress?: string;

  // --- SPOC Details (Single Point of Contact) ---
  @IsString()
  @IsNotEmpty()
  spocName: string;

  @IsEmail()
  @IsNotEmpty()
  spocEmail: string;

  @IsString()
  @IsNotEmpty()
  spocWhatsappNumber: string;

  // --- Alternate SPOC (Optional) ---
  @IsString()
  @IsOptional()
  alternateSpocName?: string;

  @IsString()
  @IsOptional()
  alternateSpocContactNumber?: string;

  @IsEmail()
  @IsOptional()
  alternateSpocEmail?: string;

  // --- Banking & Tax Information ---
  @IsString()
  @IsOptional()
  pan?: string;

  @IsString()
  @IsOptional()
  gstin?: string;

  @IsString()
  @IsOptional()
  accountNumber?: string;

  @IsString()
  @IsOptional()
  ifscCode?: string;

  @IsString()
  @IsOptional()
  bankName?: string;

  @IsString()
  @IsOptional()
  short_code?: string;

  // --- File Attachments (URLs as strings) ---
  @IsString()
  @IsOptional()
  attachPanCopy?: string;

  @IsString()
  @IsOptional()
  attachGstin?: string;

  @IsString()
  @IsOptional()
  attachCancelledChequeOrPassbook?: string;

  @IsString()
  @IsOptional()
  attachCertificateOfIncorporation?: string;

  // --- Status ---
  @IsOptional()
  status?: string;
}