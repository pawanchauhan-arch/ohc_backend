import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';
import { PatientType } from '../../../common/enum';

export class CreateAmbulanceServiceDto {
  @IsUUID()
  ambulance_id: string;

  @IsString()
  @IsNotEmpty()
  start_point: string;

  @IsString()
  @IsNotEmpty()
  end_point: string;

  @IsString()
  @IsNotEmpty()
  pickup_address: string;

  @IsString()
  @IsNotEmpty()
  drop_address: string;

  @IsString()
  @IsNotEmpty()
  patient_name: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{10}$/, { message: 'patient_mobile must be 10 digits' })
  patient_mobile?: string;

  @IsOptional()
  @IsString()
  major_symptom?: string;

  @IsEnum(PatientType)
  patient_type: PatientType;
}
