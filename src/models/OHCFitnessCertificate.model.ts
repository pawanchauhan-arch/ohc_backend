import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BaseModel } from './base.model';
import { DRIVERMASTER } from 'src/models/DriverMaster';
import { CertificateTemplate } from './OhcCertificateTemplate.model';

export enum FitnessStatus {
  FIT = 'FIT',
  FIT_WITH_RESTRICTIONS = 'FIT_WITH_RESTRICTIONS',
  UNFIT = 'UNFIT',
}

@Table({
  tableName: 'ohc_fitness_certificates',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class OHCFitnessCertificate extends BaseModel<OHCFitnessCertificate> {
  
  @ForeignKey(() => DRIVERMASTER)
  @Column({ type: DataType.INTEGER, allowNull: false })
  patient_id: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  assessment_id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  certificate_number: string;

  @Column({ type: DataType.DATE, allowNull: false })
  issue_date: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  valid_till?: Date;

  @Column({
    type: DataType.ENUM(...Object.values(FitnessStatus)),
    allowNull: false,
  })
  fitness_status: FitnessStatus;

  @Column(DataType.TEXT)
  restrictions?: string;

  @Column(DataType.TEXT)
  recommendations?: string;

  @Column(DataType.TEXT)
  doctor_signature?: string;

  @Column(DataType.TEXT)
  organization_seal?: string;

  @Column(DataType.TEXT)
  pdf_url?: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  is_deleted: boolean;

  @Column({ type: DataType.INTEGER, allowNull: false })
  created_by: number;

  @Column(DataType.INTEGER)
  updated_by?: number;

  // ---- Patient snapshot fields ----
  @Column({ type: DataType.STRING, allowNull: false })
  name: string;

  @Column({ type: DataType.STRING, allowNull: true })
  gender?: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  age?: number;

  @Column({ type: DataType.STRING, allowNull: true })
  employee_id?: string;

  // ---- Template relation ----
  @ForeignKey(() => CertificateTemplate)
  @Column({ type: DataType.INTEGER, allowNull: true })
  template_id?: number;

  @BelongsTo(() => CertificateTemplate)
  template?: CertificateTemplate;

  // ---- Multi-tenant ----
  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  tenant_id: number;
}