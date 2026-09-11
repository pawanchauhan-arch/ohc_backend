import { Column, Model, Table, BelongsTo, DataType, PrimaryKey } from 'sequelize-typescript';
import { driverhealthcheckup } from '../DriverHealthCheckup';

/**
 * Blood Pressure Test Model
 * Represents Blood Pressure test results (Systolic & Diastolic)
 */
@Table({
  tableName: 'blood_pressure_tests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class BloodPressureTest extends Model {
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
  systolic_value: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  diastolic_value: number;

  @Column({
    type: DataType.STRING(10),
    defaultValue: 'mm Hg',
    allowNull: true,
  })
  units: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  systolic_status: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  diastolic_status: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  systolic_remark: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  diastolic_remark: string;

  @BelongsTo(() => driverhealthcheckup, { foreignKey: 'health_checkup_id', as: 'driverHealthBloodCheckup' })
  driverHealthBloodCheckup: driverhealthcheckup;
}
