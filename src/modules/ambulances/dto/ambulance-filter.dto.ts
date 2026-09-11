import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { AmbulanceType, FuelType } from '../../../common/enum';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class AmbulanceFilterDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  company_name?: string;

  @IsOptional()
  @IsEnum(AmbulanceType)
  ambulance_type?: AmbulanceType;

  @IsOptional()
  @IsEnum(FuelType)
  fuel_type?: FuelType;

  @IsOptional()
  @IsString()
  number_plate?: string;

  @IsOptional()
  @IsString()
  driver_name?: string;

  @IsOptional()
  @IsString()
  unique_name?: string;
}
