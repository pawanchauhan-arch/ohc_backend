import { Column, Model, Table, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'payment_modes',
  timestamps: false, 
})
export class PaymentMode extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  PaymentModeID: number;

  @Column({ type: DataType.STRING, allowNull: false })
  Code: string;

  @Column({ type: DataType.STRING, allowNull: true })
  Descriptions: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  UserloginID: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  AddedBy: number;

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  AddedDate: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  ModifiedDate: Date;

  @Column({ type: DataType.INTEGER, allowNull: true })
  ModifiedBy: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  HospitalID: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  IsActive: boolean;
}
