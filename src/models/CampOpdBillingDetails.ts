import {
  Column,
  Model,
  Table,
  DataType,
  BelongsTo,
  ForeignKey,
} from 'sequelize-typescript';
import { PicasoOpdCampBillHeader } from './CampOpdBilling';

@Table({
  tableName: 'picaso_opd_campbill_footer',
  timestamps: false,
})
export class PicasoOpdCampBillFooter extends Model {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  })
  BillFooterID : number;

  @ForeignKey(() => PicasoOpdCampBillHeader)
  @Column({ type: DataType.BIGINT, allowNull: true })
  BillHeadID: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  BillNo: number;

  @Column({ type: DataType.BIGINT, allowNull: true })
  PatientID: number;

  @Column({ type: DataType.STRING(100), allowNull: true })
  PicasoNo: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  ServiceTypeID: number;

  @Column({ type: DataType.BIGINT, allowNull: true })
  ServiceID: number;

  @Column({ type: DataType.STRING(300), allowNull: true })
  ServiceName: string;

  @Column({
    type: DataType.DECIMAL(19, 4),
    allowNull: true,
  })
  ServiceAmount: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  Qty: number;

  @Column({
    type: DataType.DECIMAL(19, 4),
    allowNull: true,
  })
  NetServiceAmount: number;

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
    allowNull: true,
  })
  Discount: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  Isdiscount: number;

  @Column({ type: DataType.BIGINT, allowNull: true })
  DiscountBy: number;

  @Column({ type: DataType.BIGINT, allowNull: true })
  DoctorID: number;

  @Column({ type: DataType.BIGINT, allowNull: true })
  AddedBy: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  MonthID: number;

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

  @BelongsTo(() => PicasoOpdCampBillHeader, {
    foreignKey: 'BillHeadID',
    targetKey: 'ID',
  })
  campBillHeader: PicasoOpdCampBillHeader;
}