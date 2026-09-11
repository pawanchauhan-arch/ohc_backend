import { Column, Model, Table, BelongsTo, DataType, PrimaryKey } from 'sequelize-typescript';
import { driverhealthcheckup } from '../DriverHealthCheckup';

/**
 * Pulse Test Model
 * Represents Pulse test results
 */
@Table({
  tableName: 'pulse_tests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class PulseTest extends Model {
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
    type: DataType.INTEGER,
    allowNull: true,
  })
  value: number;

  @Column({
    type: DataType.STRING(10),
    defaultValue: 'bpm',
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

  @BelongsTo(() => driverhealthcheckup, { foreignKey: 'health_checkup_id', as: 'driverHealthPulseCheckup' })
  driverHealthPulseCheckup: driverhealthcheckup;
}
