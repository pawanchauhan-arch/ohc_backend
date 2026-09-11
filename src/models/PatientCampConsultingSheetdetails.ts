import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { PicasoCampAdviceList } from './CampAdviceList';
import { Sequelize } from 'sequelize-typescript';

@Table({
  tableName: 'picaso_patientcampconsultingsheetdetails',
  timestamps: false,
})
export class PicasoPatientCampConsultingSheetDetails extends Model {
  @Column({
    field: 'ID',
    type: DataType.BIGINT,
    primaryKey: true,
    allowNull: false,
    autoIncrement: true,
  })
  ID!: number;

  @Column({
    field: 'ConsultingID',
    type: DataType.BIGINT,
    allowNull: true,
  })
  consultingId!: number | null;

  @Column({
    field: 'PicasoID',
    type: DataType.STRING(100),
    allowNull: true,
  })
  picasoId!: string | null;

  @Column({
    field: 'BillNo',
    type: DataType.STRING(100),
    allowNull: true,
  })
  billNo!: string | null;

  @Column({
    field: 'PatientName',
    type: DataType.STRING(100),
    allowNull: true,
  })
  patientName!: string | null;

  @Column({
    field: 'ContactNo',
    type: DataType.STRING(11),
    allowNull: true,
  })
  contactNo!: string | null;

  @Column({
    field: 'Age',
    type: DataType.STRING(50),
    allowNull: true,
  })
  age!: string | null;

  @Column({
    field: 'Gender',
    type: DataType.STRING(20),
    allowNull: true,
  })
  gender!: string | null;

  @Column({
    field: 'PatientType',
    type: DataType.STRING(50),
    allowNull: true,
  })
  patientType!: string | null;

  @Column({
    field: 'BPsystolic',
    type: DataType.STRING(50),
    allowNull: true,
  })
  bpSystolic!: string | null;

  @Column({
    field: 'BPdiastolic',
    type: DataType.STRING(100),
    allowNull: true,
  })
  bpDiastolic!: string | null;

  @Column({
    field: 'PulseRate',
    type: DataType.STRING(50),
    allowNull: true,
  })
  pulseRate!: string | null;

  @Column({
    field: 'SPO2',
    type: DataType.STRING(50),
    allowNull: true,
  })
  spo2!: string | null;

  @Column({
    field: 'Temperature',
    type: DataType.STRING(50),
    allowNull: true,
  })
  temperature!: string | null;

  @Column({
    field: 'Height',
    type: DataType.STRING(50),
    allowNull: true,
  })
  height!: string | null;

  @Column({
    field: 'Weight',
    type: DataType.STRING(50),
    allowNull: true,
  })
  weight!: string | null;

  @Column({
    field: 'OtherInstructions',
    type: DataType.STRING(100),
    allowNull: true,
  })
  otherInstructions!: string | null;

  @Column({
    field: 'ChiefComplaints',
    type: DataType.STRING(100),
    allowNull: true,
  })
  chiefComplaints!: string | null;

  @Column({
    field: 'Labs',
    type: DataType.STRING(500),
    allowNull: true,
  })
  labs!: string | null;

  @Column({
    field: 'OtherLabs',
    type: DataType.STRING(500),
    allowNull: true,
  })
  otherLabs!: string | null;

  @Column({
    field: 'NextFollowup',
    type: DataType.STRING(200),
    allowNull: true,
  })
  nextFollowup!: string | null;

  @Column({
    field: 'PreventiveAdvice',
    type: DataType.STRING(1000),
    allowNull: true,
  })
  preventiveAdvice!: string | null;

  @Column({
    field: 'History',
    type: DataType.STRING(100),
    allowNull: true,
  })
  history!: string | null;

  @Column({
    field: 'PhysicalFindings',
    type: DataType.STRING(100),
    allowNull: true,
  })
  physicalFindings!: string | null;

  @Column({
    field: 'TreatmentPlan',
    type: DataType.STRING(100),
    allowNull: true,
  })
  treatmentPlan!: string | null;

  @Column({
    field: 'Referrals',
    type: DataType.STRING(100),
    allowNull: true,
  })
  referrals!: string | null;

  @Column({
    field: 'AddedBy',
    type: DataType.BIGINT,
    allowNull: true,
  })
  addedBy!: number | null;

  @Column({
    field: 'AddedDate',
    type: DataType.DATE,
    allowNull: true,
    defaultValue: Sequelize.literal("timezone('Asia/Kolkata', now())"),
  })
  addedDate!: Date | null;

  @Column({
    field: 'ModifiedDate',
    type: DataType.DATE,
    allowNull: true,
    defaultValue: Sequelize.literal("timezone('Asia/Kolkata', now())"),
  })
  modifiedDate!: Date | null;

  @Column({
    field: 'ModifiedBy',
    type: DataType.STRING(50),
    allowNull: true,
  })
  modifiedBy!: string | null;

  @Column({
    field: 'Remarks',
    type: DataType.STRING(100),
    allowNull: true,
  })
  remarks!: string | null;

  @Column({
    field: 'HospitalID',
    type: DataType.INTEGER,
    allowNull: true,
  })
  hospitalId!: number | null;

  @Column({
    field: 'FinancialYearID',
    type: DataType.INTEGER,
    allowNull: true,
  })
  financialYearId!: number | null;

  @Column({
    field: 'IsActive',
    type: DataType.BOOLEAN,
    allowNull: true,
  })
  isActive!: boolean | null;

  @HasMany(() => PicasoCampAdviceList, {
    foreignKey: 'PrescriptionID',
    sourceKey: 'ID',
  })
  adviceList?: PicasoCampAdviceList[];

  @Column({
    field: 'center_id',
    type: DataType.BIGINT,
    allowNull: true,
  })
  center_id!: number | null;
  @Column({
    field: 'tenant_id',
    type: DataType.BIGINT,
    allowNull: true,
  })
  tenant_id!: number | null;
  @Column({
  field: 'Glucose',
  type: DataType.STRING(50),
  allowNull: true,
})
glucose!: string | null;
}
