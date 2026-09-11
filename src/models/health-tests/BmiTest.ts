import { Column, Model, Table, BelongsTo, DataType, PrimaryKey } from 'sequelize-typescript';
import { driverhealthcheckup } from '../DriverHealthCheckup';

/**
 * BMI Test Model
 * Represents BMI (Body Mass Index) test results
 */
@Table({
  tableName: 'bmi_tests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class BmiTest extends Model {
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
    type: DataType.DECIMAL(4, 2),
    allowNull: true,
  })
  value: number;

  @Column({
    type: DataType.STRING(10),
    defaultValue: 'kg/m2',
    allowNull: true,
  })
  units: string;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: true,
    field: 'height_cm',
  })
  height: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: true,
    field: 'weight_kg',
  })
  weight: number;

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

  @BelongsTo(() => driverhealthcheckup, { foreignKey: 'health_checkup_id', as: 'driverHealthBmiCheckup' })
  driverHealthBmiCheckup: driverhealthcheckup;
}
