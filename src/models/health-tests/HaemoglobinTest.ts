import { Column, Model, Table, BelongsTo, DataType, PrimaryKey } from 'sequelize-typescript';
import { driverhealthcheckup } from '../DriverHealthCheckup';

/**
 * Haemoglobin Test Model
 * Represents Haemoglobin test results
 */
@Table({
  tableName: 'haemoglobin_tests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class HaemoglobinTest extends Model {
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
    defaultValue: 'g/dl',
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

  @BelongsTo(() => driverhealthcheckup, { foreignKey: 'health_checkup_id', as: 'driverHealthHaemoglobinCheckup' })
  driverHealthHaemoglobinCheckup: driverhealthcheckup;
}
