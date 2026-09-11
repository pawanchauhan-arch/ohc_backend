import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { AmbulanceType, FuelType } from '../../../common/enum';

export class CreateAmbulanceDto {
  @IsString()
  @IsNotEmpty()
  company_name: string;

  @IsEnum(AmbulanceType)
  ambulance_type: AmbulanceType;

  @IsOptional()
  @IsInt()
  @Min(0)
  per_month_range?: number;

  @IsEnum(FuelType)
  fuel_type: FuelType;

  @IsString()
  @IsNotEmpty()
  number_plate: string;

  @IsString()
  @IsNotEmpty()
  driver_name: string;

  @IsString()
  @Matches(/^[0-9]{10}$/, { message: 'driver_number must be 10 digits' })
  driver_number: string;
}
