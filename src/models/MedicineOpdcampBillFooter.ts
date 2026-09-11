import {
  Table,
  Column,
  Model,
  DataType,
  BelongsTo,
  ForeignKey,
} from 'sequelize-typescript';
import { PicasoOpdPhrgcampBillHeaderModel } from './MedicineOpdcampBillHeader';
import { Sequelize } from 'sequelize-typescript';
@Table({
  tableName: 'picaso_opd_phrfcampbill_footer',
  timestamps: false,
  underscored: false,
})
export class PicasoOpdPhrfcampBillFooterModel extends Model {
  @Column({
    field: 'BillFooterID',
    type: DataType.BIGINT,
    allowNull: false,
    primaryKey: true,
  })
  BillFooterID!: number;

  @ForeignKey(() => PicasoOpdPhrgcampBillHeaderModel)
  @Column({
    field: 'BillHeadID',
    type: DataType.BIGINT,
  })
  BillHeadID!: number | null;

  @BelongsTo(() => PicasoOpdPhrgcampBillHeaderModel, {
    foreignKey: 'BillHeadID',
    targetKey: 'BillHeadID',
  })
  header?: PicasoOpdPhrgcampBillHeaderModel;

  @Column({ field: 'BillNo', type: DataType.STRING(100) })
  BillNo!: string | null;

  @Column({ field: 'CustomerName', type: DataType.STRING(100) })
  CustomerName!: string | null;

  @Column({ field: 'PatientType', type: DataType.STRING(50) })
  PatientType!: string | null;

  @Column({ field: 'StockID', type: DataType.BIGINT })
  StockID!: number | null;

  @Column({ field: 'StockNo', type: DataType.STRING(100) })
  StockNo!: string | null;

  @Column({ field: 'ItemID', type: DataType.INTEGER })
  ItemID!: number | null;

  @Column({ field: 'ItemName', type: DataType.STRING(300) })
  ItemName!: string | null;

  @Column({ field: 'BatchNo', type: DataType.STRING(50) })
  BatchNo!: string | null;

  // MONEY → DECIMAL
  @Column({ field: 'Rate', type: DataType.DECIMAL(15, 2) })
  Rate!: number | null;

  @Column({ field: 'OpeningBalance', type: DataType.DECIMAL(15, 2) })
  OpeningBalance!: number | null;

  @Column({ field: 'Baseprice', type: DataType.DECIMAL(15, 2) })
  Baseprice!: number | null;

  @Column({ field: 'ExpiryDate', type: DataType.DATE })
  ExpiryDate!: Date | null;

  @Column({ field: 'HSNCode', type: DataType.STRING(50) })
  HSNCode!: string | null;

  @Column({ field: 'CGST', type: DataType.STRING(20) })
  CGST!: string | null;

  @Column({ field: 'SGST', type: DataType.STRING(20) })
  SGST!: string | null;

  @Column({ field: 'CGSTAmount', type: DataType.DECIMAL(15, 2) })
  CGSTAmount!: number | null;

  @Column({ field: 'SGSTAmount', type: DataType.DECIMAL(15, 2) })
  SGSTAmount!: number | null;

  @Column({ field: 'TaxableRate', type: DataType.DECIMAL(15, 2) })
  TaxableRate!: number | null;

  @Column({ field: 'TaxableAmount', type: DataType.DECIMAL(15, 2) })
  TaxableAmount!: number | null;

  @Column({ field: 'DiscountPC', type: DataType.DECIMAL(10, 2) })
  DiscountPC!: number | null;

  @Column({ field: 'DiscountAmt', type: DataType.DECIMAL(15, 2) })
  DiscountAmt!: number | null;

  @Column({ field: 'DiscountTotal', type: DataType.DECIMAL(15, 2) })
  DiscountTotal!: number | null;

  @Column({ field: 'IssueCartoon', type: DataType.INTEGER })
  IssueCartoon!: number | null;

  @Column({ field: 'IssueQty', type: DataType.INTEGER })
  IssueQty!: number | null;

  @Column({ field: 'TotalReturtnqty', type: DataType.INTEGER })
  TotalReturtnqty!: number | null;

  @Column({ field: 'TotalAmount', type: DataType.DECIMAL(15, 2) })
  TotalAmount!: number | null;

  @Column({ field: 'NetAmount', type: DataType.DECIMAL(15, 2) })
  NetAmount!: number | null;

  @Column({ field: 'DiscountAmount', type: DataType.DECIMAL(15, 2) })
  DiscountAmount!: number | null;

  @Column({ field: 'PaidAmount', type: DataType.DECIMAL(15, 2) })
  PaidAmount!: number | null;

  @Column({ field: 'ProfitAmount', type: DataType.DECIMAL(15, 2) })
  ProfitAmount!: number | null;

  @Column({ field: 'DueAmount', type: DataType.DECIMAL(15, 2) })
  DueAmount!: number | null;

  @Column({ field: 'IPDServiceID', type: DataType.BIGINT })
  IPDServiceID!: number | null;

  @Column({ field: 'AddedBy', type: DataType.BIGINT, allowNull: false })
  AddedBy!: number;

  @Column({ field: 'AddedDate', type: DataType.DATE, 
   })
  AddedDate!: Date | null;

  @Column({ field: 'ModifiedDate', type: DataType.DATE, 
   })
  ModifiedDate!: Date | null;

  @Column({ field: 'ModifiedBy', type: DataType.STRING(50) })
  ModifiedBy!: string | null;

  @Column({ field: 'HospitalID', type: DataType.INTEGER })
  HospitalID!: number | null;

  @Column({ field: 'FinancialYearID', type: DataType.INTEGER })
  FinancialYearID!: number | null;

 @Column({ field: 'IsActive', type: DataType.INTEGER })
IsActive!: number | null;
}
