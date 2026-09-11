import { Column, Model, Table, DataType, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { OPDBilling } from './OpdBilling';
@Table({
  tableName: 'opd_bill_details',
  timestamps: false,
})
export class OPDBillDetail extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  Id: number;

  @ForeignKey(() => OPDBilling)
  @Column({ type: DataType.INTEGER, allowNull: false })
  BillNo: number;


  @Column({ type: DataType.INTEGER, allowNull: false })
  PatientID: number;

  @Column({ type: DataType.STRING, allowNull: true })
  PicasoNo: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  ServiceTypeID: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  ServiceID: number;

  @Column({ type: DataType.STRING, allowNull: false })
  ServiceName: string;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })
  ServiceAmount: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1 })
  Qty: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })
  NetServiceAmount: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  HospitalCharge: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  DoctorCharge: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true, defaultValue: 0 })
  Discount: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  Isdiscount: boolean;

  @Column({ type: DataType.STRING, allowNull: true })
  DiscountBy: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  DoctorID: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  AddedBy: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  MonthID: number;

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  AddedDate: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  ModifiedDate: Date;

  @Column({ type: DataType.INTEGER, allowNull: true })
  ModifiedBy: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  HospitalID: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  FinancialYearID: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  IsActive: boolean;

  @BelongsTo(() => OPDBilling, { foreignKey: 'BillNo', targetKey: 'ID' })
  opdBilling: OPDBilling;

  @Column({ type: DataType.INTEGER, allowNull: true })
  center_id: number;
  
  @Column({ type: DataType.INTEGER, allowNull: true })
  tenant_id: number;


}
