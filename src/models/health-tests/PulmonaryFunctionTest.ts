import { Column, Model, Table, BelongsTo, DataType, PrimaryKey } from 'sequelize-typescript';
import { driverhealthcheckup } from '../DriverHealthCheckup';

/**
 * Pulmonary Function Test Model
 * Represents Pulmonary Function test results
 */
@Table({
  tableName: 'pulmonary_function_tests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class PulmonaryFunctionTest extends Model {
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
    defaultValue: 'L/min',
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

  @BelongsTo(() => driverhealthcheckup, { foreignKey: 'health_checkup_id', as: 'driverHealthPulmonaryCheckup' })
  driverHealthPulmonaryCheckup: driverhealthcheckup;
}
