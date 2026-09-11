import { IsOptional, IsEnum, IsNumber, IsString, IsDateString } from 'class-validator';
import { ConcernType, ConcernLevel } from './create-concern.dto';
import { ConcernStatus } from './update-concern.dto';

export class ConcernFiltersDto {
  @IsEnum(ConcernStatus)
  @IsOptional()
  status?: ConcernStatus;

  @IsEnum(ConcernLevel)
  @IsOptional()
  level?: ConcernLevel;

  @IsEnum(ConcernType)
  @IsOptional()
  type?: ConcernType;

  @IsNumber()
  @IsOptional()
  driverId?: number;

  @IsNumber()
  @IsOptional()
  cetId?: number;

  @IsNumber()
  @IsOptional()
  centerId?: number;

  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @IsNumber()
  @IsOptional()
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  limit?: number = 10;
}
