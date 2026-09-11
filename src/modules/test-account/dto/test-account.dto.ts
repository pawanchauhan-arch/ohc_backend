import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

/**
 * Data transfer object for creating or updating a test account
 */
export class TestAccountDto {
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  otp: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isTestAccount?: boolean;
} 