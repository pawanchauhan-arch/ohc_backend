import { IsNumber, IsNotEmpty, IsString, IsEnum, IsObject, IsOptional } from 'class-validator';

export enum ConcernType {
  BLOOD_SUGAR = 'BLOOD_SUGAR',
  BLOOD_PRESSURE = 'BLOOD_PRESSURE',
  PULSE = 'PULSE',
  HEMOGLOBIN = 'HEMOGLOBIN',
  EYE_VISION = 'EYE_VISION',
}

export enum ConcernLevel {
  MODERATE = 'MODERATE',
  HIGH = 'HIGH',
}

export class CreateConcernDto {
  @IsNumber()
  @IsNotEmpty()
  health_checkup_id: number;

  @IsNumber()
  @IsNotEmpty()
  driver_id: number;

  @IsNumber()
  @IsNotEmpty()
  cet_id: number;

  @IsNumber()
  @IsNotEmpty()
  center_id: number;

  @IsEnum(ConcernType)
  @IsNotEmpty()
  concern_type: ConcernType;

  @IsEnum(ConcernLevel)
  @IsNotEmpty()
  concern_level: ConcernLevel;

  @IsNotEmpty()
  parameter_value: string | number | object;

  @IsNotEmpty()
  threshold_value: string | number | object;

  @IsObject()
  @IsOptional()
  spoc_details?: object;
}
