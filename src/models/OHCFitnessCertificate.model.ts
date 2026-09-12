import {
  Table,
  Column,
  DataType,
  ForeignKey,
} from 'sequelize-typescript';
import { BaseModel } from './base.model';
import { DRIVERMASTER } from 'src/models/DriverMaster';

@Table({
  tableName: 'ohc_fitness_certificates',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class OHCFitnessCertificate extends BaseModel<OHCFitnessCertificate> {
  @ForeignKey(() => DRIVERMASTER)
  @Column({ type: DataType.INTEGER, allowNull: true })
  patient_id?: number;

  @Column({ type: DataType.STRING, allowNull: false })
  certificate_number: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  center_id?: number;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  tenant_id: number;

  @Column({ type: DataType.STRING, allowNull: true })
  project_name?: string;

  @Column({ type: DataType.STRING, allowNull: false })
  workman_name: string;

  @Column({ type: DataType.STRING, allowNull: false })
  trade: string;

  @Column({ type: DataType.STRING, allowNull: true })
  identification_mark_1?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  identification_mark_2?: string;

  @Column({ type: DataType.STRING, allowNull: false })
  guardian_name: string;

  @Column({ type: DataType.STRING, allowNull: false })
  sex: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  residence_address: string;

  @Column({ type: DataType.DATE, allowNull: false })
  date_of_birth: Date;

  @Column({ type: DataType.STRING, allowNull: false })
  certificate_age: string;

  @Column({ type: DataType.STRING, allowNull: true })
  reason_refusal?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  reason_revoked?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  height?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  weight?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  blood_pressure?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  pulse?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  hearing?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  refractive_error?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  color_vision?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  any_disability?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  arm_grip?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  leg_foot_function?: string;

  // Section 3: Previous History (yes/no + text)
  @Column({ type: DataType.STRING, allowNull: true })
  prev_varicose?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  prev_seizure?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  prev_vertigo?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  prev_acrophobia?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  prev_diabetes?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  prev_stroke?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  prev_heart_diseases?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  prev_major_illness_surgery?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  prev_symptoms_visible?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  prev_others?: string;

  // Section 4: Operator & Drivers
  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  op_general_physique?: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  op_vision?: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  op_hearing?: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  op_breathing?: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  op_upper_limbs?: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  op_lower_limbs?: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  op_spine?: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  op_general_mental_alertness?: boolean;

  @Column({ type: DataType.TEXT, allowNull: true })
  op_other_examination?: string;

  // Section 5: Food Handlers & Welders
  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  fh_skin_diseases?: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  fh_personal_hygiene?: boolean;

  @Column({ type: DataType.STRING, allowNull: true })
  fh_chest_xray?: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  welder_respiratory_diseases?: boolean;

  @Column({ type: DataType.STRING, allowNull: true })
  welder_chest_xray?: string;

  @Column(DataType.TEXT)
  pdf_url?: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  is_deleted: boolean;

  @Column({ type: DataType.INTEGER, allowNull: false })
  created_by: number;

  @Column(DataType.INTEGER)
  updated_by?: number;
}
