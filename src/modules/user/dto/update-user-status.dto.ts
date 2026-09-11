import { IsOptional, IsString, IsNumber, IsBoolean, IsEmail } from 'class-validator';

/**
 * DTO for updating user status
 */
export class UpdateUserStatusDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

