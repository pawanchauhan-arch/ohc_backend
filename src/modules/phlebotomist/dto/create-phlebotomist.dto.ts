import { IsString, IsEmail, IsPhoneNumber, IsOptional, IsNumber, Length } from 'class-validator';

/**
 * DTO for creating a new phlebotomist
 */
export class CreatePhlebotomistDto {
  @IsOptional()
  @IsNumber()
  center_id?: number;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  name?: string;

  // Email and password are auto-generated, not provided by user

  @IsOptional()
  @IsPhoneNumber('IN', { message: 'Phone number must be a valid Indian phone number' })
  @Length(10, 13, { message: 'Phone number must be between 10 and 13 characters' })
  phone?: string;

  @IsOptional()
  @IsString()
  signature?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100, { message: 'Employee code must be between 1 and 100 characters' })
  employee_code?: string;
}