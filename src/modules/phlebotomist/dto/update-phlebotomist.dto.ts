import { IsString, IsEmail, IsPhoneNumber, IsOptional, IsBoolean, Length } from 'class-validator';

/**
 * DTO for updating an existing phlebotomist
 */
export class UpdatePhlebotomistDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  password?: string;

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

  @IsOptional()
  @IsBoolean()
  status?: boolean;
}
