import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { DRIVERMASTER } from './DriverMaster';
import { CETMANAGEMENT } from './CetManagement';

@Table({
  tableName: 'view_history_permissions',
  timestamps: false, // As per original model
})
export class ViewHistoryPermission extends Model<ViewHistoryPermission> {

  @ForeignKey(() => DRIVERMASTER)
  @Column({ type: DataType.INTEGER, allowNull: false })
  driver_id: number;

  @BelongsTo(() => DRIVERMASTER)
  driver: DRIVERMASTER;

  @ForeignKey(() => CETMANAGEMENT)
  @Column({ type: DataType.INTEGER, allowNull: false })
  cet_id: number;

  @BelongsTo(() => CETMANAGEMENT)
  cet: CETMANAGEMENT;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  permission: boolean;
}
