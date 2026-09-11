import {
  Table,
  Column,
  Model,
  DataType,
} from 'sequelize-typescript';

@Table({
  tableName: 'Picaso_OPD_Daily_PatientList',
  timestamps: false,
  underscored: false,
})
export class PicasoOpdDailyPatientListModel extends Model {
  @Column({
    field: 'DailyID',
    type: DataType.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  })
  DailyID!: number;

  @Column({
    field: 'PatientID',
    type: DataType.BIGINT,
  })
  PatientID!: number | null;

  @Column({
    field: 'PicasoNo',
    type: DataType.STRING(100),
  })
  PicasoNo!: string | null;

  @Column({
    field: 'DepartmentID',
    type: DataType.INTEGER,
  })
  DepartmentID!: number | null;

  @Column({
    field: 'Visitype',
    type: DataType.INTEGER,
  })
  Visitype!: number | null;

  @Column({
    field: 'ConsultantDoctorID',
    type: DataType.BIGINT,
  })
  ConsultantDoctorID!: number | null;

  @Column({
    field: 'TreatemntStatus',
    type: DataType.INTEGER,
  })
  TreatemntStatus!: number | null;

  @Column({
    field: 'VisitDate',
    type: DataType.DATE,
  })
  VisitDate!: Date | null;

  @Column({
    field: 'AddedBy',
    type: DataType.BIGINT,
    allowNull: false,
  })
  AddedBy!: number;

  @Column({
    field: 'AddedDate',
    type: DataType.DATE,
  })
  AddedDate!: Date | null;

  @Column({
    field: 'ModifiedDate',
    type: DataType.DATE,
  })
  ModifiedDate!: Date | null;

  @Column({
    field: 'ModifiedBy',
    type: DataType.STRING(50),
  })
  ModifiedBy!: string | null;

  @Column({
    field: 'HospitalID',
    type: DataType.INTEGER,
  })
  HospitalID!: number | null;

  @Column({
    field: 'FinancialYearID',
    type: DataType.INTEGER,
  })
  FinancialYearID!: number | null;

  @Column({
    field: 'IsActive',
    type: DataType.BOOLEAN,
  })
  IsActive!: boolean | null;

  @Column({
    field: 'tenant_id',
    type: DataType.INTEGER,
  })
  tenant_id!: number | null;

  @Column({
    field: 'center_id',
    type: DataType.INTEGER,
  })
  center_id!: number | null;
}