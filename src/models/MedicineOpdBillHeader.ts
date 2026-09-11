import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';

import { PicasoOpdPhrfBillFooterModel } from './MedicineOpdBillFooter';

@Table({
  tableName: 'picaso_opd_phrgbill_header',
  timestamps: false,
  underscored: false,
})
export class PicasoOpdPhrgBillHeaderModel extends Model {
  @Column({
    field: 'ID',
    type: DataType.BIGINT,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  })
  ID!: number;

  @Column({
    field: 'BillHeadID',
    type: DataType.BIGINT,
  })
  BillHeadID!: number | null;

  // ============================================================
  // THIS IS THE KEY USED FOR HEADER -> FOOTER RELATION
  // ============================================================

  @Column({
    field: 'BillNo',
    type: DataType.STRING(100),
    allowNull: true,
  })
  BillNo!: string | null;

  // ============================================================

  @Column({
    field: 'PicasoID',
    type: DataType.STRING(100),
  })
  PicasoID!: string | null;

  @Column({
    field: 'CustommerName',
    type: DataType.STRING(100),
  })
  CustommerName!: string | null;

  @Column({
    field: 'Ages',
    type: DataType.STRING(30),
  })
  Ages!: string | null;

  @Column({
    field: 'Gender',
    type: DataType.STRING(20),
  })
  Gender!: string | null;

  @Column({
    field: 'PatientType',
    type: DataType.STRING(50),
  })
  PatientType!: string | null;

  @Column({
    field: 'Mobileno',
    type: DataType.STRING(20),
  })
  Mobileno!: string | null;

  @Column({
    field: 'OPDBillNo',
    type: DataType.STRING(50),
  })
  OPDBillNo!: string | null;

  @Column({
    field: 'OpeningBalance',
    type: DataType.DECIMAL(15, 2),
  })
  OpeningBalance!: number | null;

  @Column({
    field: 'TotalQty',
    type: DataType.INTEGER,
  })
  TotalQty!: number | null;

  @Column({
    field: 'Rate',
    type: DataType.DECIMAL(15, 2),
  })
  Rate!: number | null;

  @Column({
    field: 'PayMode',
    type: DataType.INTEGER,
  })
  PayMode!: number | null;

  @Column({
    field: 'CashAmount',
    type: DataType.DECIMAL(15, 2),
  })
  CashAmount!: number | null;

  @Column({
    field: 'CardAmount',
    type: DataType.DECIMAL(15, 2),
  })
  CardAmount!: number | null;

  @Column({
    field: 'ChequeAmount',
    type: DataType.DECIMAL(15, 2),
  })
  ChequeAmount!: number | null;

  @Column({
    field: 'TotalAmount',
    type: DataType.DECIMAL(15, 2),
  })
  TotalAmount!: number | null;

  @Column({
    field: 'DiscountAmount',
    type: DataType.DECIMAL(15, 2),
  })
  DiscountAmount!: number | null;

  @Column({
    field: 'PaidAmount',
    type: DataType.DECIMAL(15, 2),
  })
  PaidAmount!: number | null;

  @Column({
    field: 'BalanceAmount',
    type: DataType.DECIMAL(15, 2),
  })
  BalanceAmount!: number | null;

  @Column({
    field: 'CGSTAmount',
    type: DataType.DECIMAL(15, 2),
  })
  CGSTAmount!: number | null;

  @Column({
    field: 'SGSTAmount',
    type: DataType.DECIMAL(15, 2),
  })
  SGSTAmount!: number | null;

  @Column({
    field: 'TaxableAmount',
    type: DataType.DECIMAL(15, 2),
  })
  TaxableAmount!: number | null;

  @Column({
    field: 'GrossAmount',
    type: DataType.DECIMAL(15, 2),
  })
  GrossAmount!: number | null;

  @Column({
    field: 'InitialPaidAmount',
    type: DataType.DECIMAL(15, 2),
  })
  InitialPaidAmount!: number | null;

  @Column({
    field: 'InitialDueAmount',
    type: DataType.DECIMAL(15, 2),
  })
  InitialDueAmount!: number | null;

  @Column({
    field: 'Cashmode',
    type: DataType.INTEGER,
  })
  Cashmode!: number | null;

  @Column({
    field: 'Cardmode',
    type: DataType.INTEGER,
  })
  Cardmode!: number | null;

  @Column({
    field: 'Chequemode',
    type: DataType.INTEGER,
  })
  Chequemode!: number | null;

  @Column({
    field: 'Remarks',
    type: DataType.STRING(200),
  })
  Remarks!: string | null;

  @Column({
    field: 'Isdiscount',
    type: DataType.INTEGER,
  })
  Isdiscount!: number | null;

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
    type: DataType.STRING(100),
  })
  ModifiedBy!: string | null;

  @Column({
    field: 'GSTBilling',
    type: DataType.INTEGER,
  })
  GSTBilling!: number | null;

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
    type: DataType.STRING(1),
  })
  IsActive!: string | null;

  // ============================================================
  // HEADER -> FOOTER
  // HEADER.BillNo = FOOTER.BillNo
  // ============================================================

  @HasMany(() => PicasoOpdPhrfBillFooterModel, {
    foreignKey: 'BillNo',
    sourceKey: 'BillNo',
    as: 'footerItems',
  })
  footerItems?: PicasoOpdPhrfBillFooterModel[];

  @Column({
    type: DataType.INTEGER,
  })
  center_id!: number;

  @Column({
    type: DataType.INTEGER,
  })
  tenant_id!: number;
}
