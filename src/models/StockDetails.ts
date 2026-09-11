import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'picaso_str_stockdetails',
  timestamps: true,
  createdAt: 'AddedDate',
  updatedAt: false,
})
export class PicasoStrStockdetailsModel extends Model {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  ID!: number;

  @Column(DataType.DATE)
  InvoiceDate!: Date;

  @Column(DataType.BIGINT)
  StockID!: number;

  @Column(DataType.STRING(200))
  StockNo!: string;

  @Column(DataType.STRING(100))
  RecieptNo!: string;

  @Column(DataType.INTEGER)
  ItemTypeID!: number;

  @Column(DataType.BIGINT)
  ItemID!: number;

  @Column(DataType.STRING(200))
  ItemName!: string;

  @Column(DataType.STRING(50))
  BatchNo!: string;

  @Column(DataType.STRING(100))
  SupplierName!: string;

  @Column(DataType.INTEGER)
  SupplierID!: number;

  @Column(DataType.INTEGER)
  CentreID!: number;

  @Column(DataType.STRING(20))
  CGST!: string;

  @Column(DataType.STRING(20))
  SGST!: string;

  @Column(DataType.DECIMAL(19, 4))
  CGSTAmount!: number;

  @Column(DataType.DECIMAL(19, 4))
  SGSTAmount!: number;

  @Column(DataType.DATE)
  MenufacturingDate!: Date;

  @Column(DataType.DATE)
  ExpiryDate!: Date;

  @Column(DataType.STRING(50))
  RagNo!: string;

  @Column(DataType.STRING(50))
  HSNCode!: string;

  @Column(DataType.DECIMAL(19, 4))
  TotalAmount!: number;

  @Column(DataType.DECIMAL(19, 4))
  TotalDiscount!: number;

  @Column(DataType.DECIMAL(19, 4))
  GrandTotal!: number;

  @Column(DataType.INTEGER)
  NoStrip!: number;

  @Column(DataType.INTEGER)
  NoQtyperStrip!: number;

  @Column(DataType.DECIMAL(19, 4))
  CPperStrip!: number;

  @Column(DataType.DECIMAL(19, 4))
  MRPperStrip!: number;

  @Column(DataType.DECIMAL(19, 4))
  CP!: number;

  @Column(DataType.DECIMAL(19, 4))
  MRP!: number;

  @Column(DataType.INTEGER)
  FreeRecvQty!: number;

  @Column(DataType.INTEGER)
  RecvQty!: number;

  @Column(DataType.DECIMAL(19, 4))
  DiscountPCperitem!: number;

  @Column(DataType.DECIMAL(19, 4))
  Discountperitem!: number;

  @Column(DataType.DECIMAL(19, 4))
  CPU!: number;

  @Column(DataType.DECIMAL(19, 4))
  MRPU!: number;

  @Column(DataType.INTEGER)
  BalQty!: number;

  @Column(DataType.INTEGER)
  IssueQty!: number;

  @Column(DataType.INTEGER)
  CondmQty!: number;

  @Column(DataType.INTEGER)
  ReturnQty!: number;

  @Column(DataType.INTEGER)
  IsDeathStock!: number;

  @Column(DataType.STRING(100))
  Remarks!: string;

  @Column(DataType.BIGINT)
  UserloginID!: number;

  @Column(DataType.BIGINT)
  AddedBy!: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  AddedDate!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  ModifiedDate!: Date;

  @Column(DataType.STRING(50))
  ModifiedBy!: string;
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  Isopen!: boolean;

  @Column({
    type: DataType.INTEGER,
  })
  StockStatus!: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  IsActive!: boolean;

  @Column({
    type: DataType.INTEGER,
  })
  center_id!: number;

  @Column({
    type: DataType.INTEGER,
  })
  tenant_id!: number;
}
