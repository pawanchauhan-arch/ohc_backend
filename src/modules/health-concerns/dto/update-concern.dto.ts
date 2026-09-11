import { IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';
import { ConcernType, ConcernLevel } from './create-concern.dto';

export enum ConcernStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
}

export class UpdateConcernDto {
  @IsEnum(ConcernStatus)
  @IsOptional()
  status?: ConcernStatus;

  @IsString()
  @IsOptional()
  email_template?: string;

  @IsString()
  @IsOptional()
  custom_notes?: string;

  @IsNumber()
  @IsOptional()
  reviewed_by?: number;
}
