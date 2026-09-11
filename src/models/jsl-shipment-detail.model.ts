import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'jsl_shipment_details',
  timestamps: true,
  underscored: true,
})
export class JslShipmentDetailModel extends Model {
  @Column({
    field: 'serno',
    type: DataType.STRING(32),
    allowNull: false,
    primaryKey: true,
  })
  serno!: string;

  @Column({ field: 'tdlnr', type: DataType.STRING(32), allowNull: true })
  tdlnr!: string | null;

  @Column({ field: 'tran_name', type: DataType.STRING(255), allowNull: true })
  tranName!: string | null;

  @Column({ field: 'veh_no', type: DataType.STRING(32), allowNull: true })
  vehNo!: string | null;

  @Column({ field: 'outb_in_date', type: DataType.DATEONLY, allowNull: true })
  outbInDate!: Date | null;

  @Column({ field: 'outb_in_time', type: DataType.TIME, allowNull: true })
  outbInTime!: string | null;

  @Column({ field: 'zdelete', type: DataType.STRING(32), allowNull: true })
  zdelete!: string | null;

  @Column({ field: 'tknum', type: DataType.STRING(32), allowNull: true })
  tknum!: string | null;

  @Column({ field: 'drname', type: DataType.STRING(255), allowNull: true })
  drname!: string | null;

  @Column({ field: 'conno', type: DataType.STRING(64), allowNull: true })
  conno!: string | null;

  @Column({ field: 'licno', type: DataType.STRING(64), allowNull: true })
  licno!: string | null;

  @Column({ field: 'drv_dob', type: DataType.DATEONLY, allowNull: true })
  drvDob!: Date | null;

  @Column({ field: 'age', type: DataType.INTEGER, allowNull: true })
  age!: number | null;

  @Column({ field: 'gender', type: DataType.STRING(8), allowNull: true })
  gender!: string | null;

  @Column({ field: 'raw_payload', type: DataType.JSONB, allowNull: false })
  rawPayload!: Record<string, unknown>;

  @Column({ field: 'fetched_at', type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  fetchedAt!: Date;

  @Column({ field: 'created_at', type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  createdAt!: Date;

  @Column({ field: 'updated_at', type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  updatedAt!: Date;
}


