import { Column, Model, Table, DataType, HasMany } from 'sequelize-typescript';
import { OPDBillDetail } from './OpdBillingDetails';
import { DRIVERMASTER } from './DriverMaster';
import { Sequelize } from 'sequelize';

@Table({
  tableName: 'opd_billing',
  timestamps: false,
})
export class OPDBilling extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  ID: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  PatientID: number;

  @Column({ type: DataType.STRING, allowNull: true })
  PicasoNo: string;

  @Column({ type: DataType.STRING, allowNull: true })
  Mobile: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  ServiceTypeID: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  PatientType: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })
  TotalServiceAmount: number;

  @Column({ type: DataType.DECIMAL(12, 2), defaultValue: 0 })
  TotalDiscount: number;

  @Column({ type: DataType.STRING, allowNull: true })
  DiscountBy: string;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  AdjustedAmount: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  HospitalCharge: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  DoctorCharge: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true, defaultValue: 0 })
  PaidAmount: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  CashAmount: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  CardAmount: number;

  @Column({ type: DataType.INTEGER, allowNull: true })  // take from the  paymentType
  PayMode: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  DepartmentID: number;

  @Column({ type: DataType.STRING, allowNull: true })
  Visitype: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  ConsultantDoctorID: number;

  @Column({ type: DataType.STRING, allowNull: true })
  BankName: string;

  @Column({ type: DataType.STRING, allowNull: true })
  ChallanNo: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  VisitID: number;

  @Column({ type: DataType.TEXT, allowNull: true })
  Remarks: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  DeleteRemarks: string;

  @Column({ type: DataType.STRING, allowNull: true })
  ReferTo: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  Isdiscount: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  SMSAlert: boolean;

  @Column({ type: DataType.INTEGER, allowNull: true })
  AddedBy: number;

  @Column({ type: DataType.DATE, defaultValue: Sequelize.literal("timezone('Asia/Kolkata', now())") })
  AddedDate: Date;



  @Column({ type: DataType.DATE, allowNull: true , defaultValue: Sequelize.literal("timezone('Asia/Kolkata', now())")})
  ModifiedDate: Date;

  @Column({ type: DataType.INTEGER, allowNull: true })
  ModifiedBy: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  HospitalID: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  FinancialYearID: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  IsActive: boolean;

  @Column({ type: DataType.INTEGER, allowNull: false })
  CenterID: number;

  @Column({ type: DataType.DECIMAL(12, 2), defaultValue: 0 })
  DueAmount: number;


  @Column({ type: DataType.INTEGER, allowNull: true })
  DoctorId: number;

  @Column({ type: DataType.STRING, allowNull: true })
  complaint: string;

  @HasMany(() => OPDBillDetail, { foreignKey: 'BillNo', sourceKey: 'ID' })
  billDetails: OPDBillDetail[];

  @Column({ type: DataType.INTEGER, allowNull: true })
  token: number;

  @HasMany(()=> DRIVERMASTER, { foreignKey: 'id', sourceKey: 'PatientID' })
  driverDetails: DRIVERMASTER[];

  @Column({ type: DataType.INTEGER, allowNull: true })
  center_id: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  tenant_id: number;
}
