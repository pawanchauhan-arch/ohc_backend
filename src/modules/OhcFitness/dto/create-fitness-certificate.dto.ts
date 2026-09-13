import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

const ToOptionalString = () =>
  Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return value;
    return String(value);
  });

export class CreateFitnessCertificateDto {
  @IsOptional()
  @IsInt()
  patient_id?: number;

  @IsOptional()
  @IsString()
  project_name?: string;

  @IsOptional()
  @IsInt()
  doctor_id?: number;

  @IsOptional()
  @IsString()
  doctor_name?: string;

  @IsString()
  @IsNotEmpty()
  workman_name: string;

  @IsString()
  @IsNotEmpty()
  trade: string;

  @IsOptional()
  @IsString()
  identification_mark_1?: string;

  @IsOptional()
  @IsString()
  identification_mark_2?: string;

  @IsString()
  @IsNotEmpty()
  guardian_name: string;

  @IsString()
  @IsNotEmpty()
  sex: string;

  @IsString()
  @IsNotEmpty()
  residence_address: string;

  @IsOptional()
  @IsString()
  date_of_birth?: string;

  @IsString()
  @IsNotEmpty()
  certificate_age: string;

  @IsOptional()
  @IsString()
  reason_refusal?: string;

  @IsOptional()
  @IsString()
  reason_revoked?: string;

  @IsOptional()
  @ToOptionalString()
  @IsString()
  height?: string;

  @IsOptional()
  @ToOptionalString()
  @IsString()
  weight?: string;

  @IsOptional()
  @ToOptionalString()
  @IsString()
  blood_pressure?: string;

  @IsOptional()
  @ToOptionalString()
  @IsString()
  pulse?: string;

  @IsOptional()
  @IsString()
  hearing?: string;

  @IsOptional()
  @IsString()
  refractive_error?: string;

  @IsOptional()
  @IsString()
  color_vision?: string;

  @IsOptional()
  @IsString()
  any_disability?: string;

  @IsOptional()
  @IsString()
  arm_grip?: string;

  @IsOptional()
  @IsString()
  leg_foot_function?: string;

  @IsOptional()
  @IsString()
  prev_varicose?: string;

  @IsOptional()
  @IsString()
  prev_seizure?: string;

  @IsOptional()
  @IsString()
  prev_vertigo?: string;

  @IsOptional()
  @IsString()
  prev_acrophobia?: string;

  @IsOptional()
  @IsString()
  prev_diabetes?: string;

  @IsOptional()
  @IsString()
  prev_stroke?: string;

  @IsOptional()
  @IsString()
  prev_heart_diseases?: string;

  @IsOptional()
  @IsString()
  prev_major_illness_surgery?: string;

  @IsOptional()
  @IsString()
  prev_symptoms_visible?: string;

  @IsOptional()
  @IsString()
  prev_others?: string;

  @IsOptional()
  @IsString()
  op_general_physique?: string;

  @IsOptional()
  @IsString()
  op_vision?: string;

  @IsOptional()
  @IsString()
  op_hearing?: string;

  @IsOptional()
  @IsString()
  op_breathing?: string;

  @IsOptional()
  @IsString()
  op_upper_limbs?: string;

  @IsOptional()
  @IsString()
  op_lower_limbs?: string;

  @IsOptional()
  @IsString()
  op_spine?: string;

  @IsOptional()
  @IsString()
  op_general_mental_alertness?: string;

  @IsOptional()
  @IsString()
  op_other_examination?: string;

  @IsOptional()
  @IsString()
  fh_skin_diseases?: string;

  @IsOptional()
  @IsString()
  fh_personal_hygiene?: string;

  @IsOptional()
  @IsString()
  fh_chest_xray?: string;

  @IsOptional()
  @IsString()
  welder_respiratory_diseases?: string;

  @IsOptional()
  @IsString()
  welder_chest_xray?: string;

  @IsOptional()
  @IsString()
  certificate_number?: string;
}
