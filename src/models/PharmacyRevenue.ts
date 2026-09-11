import {
  Table,
  Column,
  Model,
  DataType,
} from 'sequelize-typescript';

@Table({
  tableName: 'Picasoid_PharmacyRevenue',
  timestamps: false,
})
export class PicasoPharmacyRevenueModel extends Model<PicasoPharmacyRevenueModel> {
  
  @Column({
    field: 'RevenueID',
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  })
  RevenueID!: number;

  @Column({
    field: 'RevenueDate',
    type: DataType.DATE,
    allowNull: false,
  })
  RevenueDate!: Date;

  @Column({
    field: 'PaymentmodeID',
    type: DataType.INTEGER,
    allowNull: true,
  })
  PaymentmodeID!: number;

  @Column({
    field: 'RevenueAmount',
    type: DataType.DECIMAL(19, 4),
    allowNull: false,
  })
  RevenueAmount!: number;

  @Column({
    field: 'DueAmount',
    type: DataType.DECIMAL(19, 4),
    allowNull: true,
  })
  DueAmount!: number;

  @Column({
    field: 'AddedBy',
    type: DataType.BIGINT,
    allowNull: true,
  })
  AddedBy!: number;

  @Column({
    field: 'AddedDate',
    type: DataType.DATE,
    allowNull: true,
  })
  AddedDate!: Date;

  @Column({
    field: 'IsActive',
    type: DataType.BOOLEAN,
    allowNull: true,
  })
  IsActive!: boolean;

  @Column({
    field: 'tenant_id',
    type: DataType.INTEGER,
    allowNull: true,
  })
  tenant_id!: number;

  @Column({
    field: 'center_id',
    type: DataType.INTEGER,
    allowNull: true,
  })
  center_id!: number;
}