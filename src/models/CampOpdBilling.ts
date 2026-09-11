import {
  Column,
  Model,
  Table,
  DataType,
  HasMany,
} from 'sequelize-typescript';
import { PicasoOpdCampBillFooter } from './CampOpdBillingDetails';
import { DRIVERMASTER } from './DriverMaster';
@Table({
  tableName: 'picaso_opd_campbill_header',
  timestamps: false,
})
export class PicasoOpdCampBillHeader extends Model {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  })
  ID: number;

  @Column({ type: DataType.BIGINT, allowNull: true })
  BillHeadID: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  BillNo: number;

  @Column({ type: DataType.BIGINT, allowNull: true })
  PatientID: number;

  @Column({ type: DataType.STRING(100), allowNull: true })
  PicasoNo: string;

  @Column({ type: DataType.STRING(50), allowNull: true })
  Mobile: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  ServiceTypeID: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  PatientType: number;

    @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })
    TotalServiceAmount: number;

  @Column({
    type: DataType.DECIMAL(19, 4),
    allowNull: true,
  })
  TotalDiscount: number;

  @Column({ type: DataType.BIGINT, allowNull: true })
  DiscountBy: number;

  @Column({
    type: DataType.DECIMAL(19, 4),
    allowNull: true,
  })
  AdjustedAmount: number;

  @Column({
    type: DataType.DECIMAL(19, 4),
    allowNull: true,
  })
  HospitalCharge: number;

  @Column({
    type: DataType.DECIMAL(19, 4),
    allowNull: true,
  })
  DoctorCharge: number;

  @Column({
    type: DataType.DECIMAL(19, 4),
    allowNull: false,
  })
  PaidAmount: number;

  @Column({
    type: DataType.DECIMAL(19, 4),
    allowNull: true,
  })
  CashAmount: number;

  @Column({
    type: DataType.DECIMAL(19, 4),
    allowNull: true,
  })
  CardAmount: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  PayMode: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  DepartmentID: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  Visitype: number;

  @Column({ type: DataType.BIGINT, allowNull: true })
  ConsultantDoctorID: number;

  @Column({ type: DataType.STRING(500), allowNull: true })
  BankName: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  ChallanNo: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  VisitID: number;

  @Column({ type: DataType.STRING(200), allowNull: true })
  Remarks: string;

  @Column({ type: DataType.STRING(200), allowNull: true })
  DeleteRemarks: string;

  @Column({ type: DataType.STRING(50), allowNull: true })
  ReferTo: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  Isdiscount: number;

  @Column({ type: DataType.BOOLEAN, allowNull: true })
  SMSAlert: boolean;

  @Column({ type: DataType.BIGINT, allowNull: false })
  AddedBy: number;

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
    AddedDate: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  ModifiedDate: Date;

  @Column({ type: DataType.STRING(50), allowNull: true })
  ModifiedBy: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  HospitalID: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  FinancialYearID: number;

  @Column({ type: DataType.BOOLEAN, allowNull: true })
  IsActive: boolean;

  @Column({ type: DataType.INTEGER, allowNull: true })
  CentreID: number;

  @Column({
    type: DataType.DECIMAL(19, 4),
    allowNull: true,
  })
  DueAmount: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  center_id: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  tenant_id: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  token: number;

  @Column({ type: DataType.STRING, allowNull: true })
  complaint: string;


  @HasMany(() => PicasoOpdCampBillFooter, {
    foreignKey: 'BillNo',
    sourceKey: 'BillNo',
  })
  billDetails: PicasoOpdCampBillFooter[];
  
    @HasMany(()=> DRIVERMASTER, { foreignKey: 'id', sourceKey: 'PatientID' })
  driverDetails: DRIVERMASTER[];
}