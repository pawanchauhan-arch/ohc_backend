import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateFitnessCertificateDto {
  @IsOptional()
  @IsInt()
  patient_id?: number;

  @IsOptional()
  @IsString()
  project_name?: string;

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

  @IsString()
  @IsNotEmpty()
  date_of_birth: string;

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
  @IsString()
  height?: string;

  @IsOptional()
  @IsString()
  weight?: string;

  @IsOptional()
  @IsString()
  blood_pressure?: string;

  @IsOptional()
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
  @IsBoolean()
  op_general_physique?: boolean;

  @IsOptional()
  @IsBoolean()
  op_vision?: boolean;

  @IsOptional()
  @IsBoolean()
  op_hearing?: boolean;

  @IsOptional()
  @IsBoolean()
  op_breathing?: boolean;

  @IsOptional()
  @IsBoolean()
  op_upper_limbs?: boolean;

  @IsOptional()
  @IsBoolean()
  op_lower_limbs?: boolean;

  @IsOptional()
  @IsBoolean()
  op_spine?: boolean;

  @IsOptional()
  @IsBoolean()
  op_general_mental_alertness?: boolean;

  @IsOptional()
  @IsString()
  op_other_examination?: string;

  @IsOptional()
  @IsBoolean()
  fh_skin_diseases?: boolean;

  @IsOptional()
  @IsBoolean()
  fh_personal_hygiene?: boolean;

  @IsOptional()
  @IsString()
  fh_chest_xray?: string;

  @IsOptional()
  @IsBoolean()
  welder_respiratory_diseases?: boolean;

  @IsOptional()
  @IsString()
  welder_chest_xray?: string;

  @IsOptional()
  @IsString()
  certificate_number?: string;
}
