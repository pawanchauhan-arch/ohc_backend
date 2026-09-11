import { IsNotEmpty, IsString, IsEmail, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateAndAssignUserDto {
  // --- Association Details ---
  @IsNumber()
  @IsNotEmpty()
  corporate_id: number;

  @IsNumber()
  @IsOptional()
  center_id?: number;

  // --- User Details (Matches your SQL INSERT) ---
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsNumber()
  @IsNotEmpty()
  role_id: number; // e.g., 2

  @IsNumber()
  @IsOptional()
  permission_id?: number; // e.g., 1

  @IsString()
  @IsOptional()
  external_id?: string;

  @IsBoolean()
  @IsOptional()
  isAdmin?: boolean;
}