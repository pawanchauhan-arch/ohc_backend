import { Column, Model, Table, BelongsTo, DataType, PrimaryKey } from 'sequelize-typescript';
import { driverhealthcheckup } from '../DriverHealthCheckup';

/**
 * Temperature Test Model
 * Represents Temperature test results
 */
@Table({
  tableName: 'temperature_tests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class TemperatureTest extends Model {
  @PrimaryKey
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    allowNull: false,
  })
  id: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  health_checkup_id: number;

  @Column({
    type: DataType.DECIMAL(4, 1),
    allowNull: true,
  })
  value: number;

  @Column({
    type: DataType.STRING(5),
    defaultValue: 'F',
    allowNull: true,
  })
  units: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  status: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  remark: string;

  @BelongsTo(() => driverhealthcheckup, { foreignKey: 'health_checkup_id', as: 'driverHealthTempCheckup' })
  driverHealthTempCheckup: driverhealthcheckup;
}
