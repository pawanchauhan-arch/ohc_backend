import { Column, Model, Table, BelongsTo, DataType, PrimaryKey } from 'sequelize-typescript';
import { driverhealthcheckup } from '../DriverHealthCheckup';

/**
 * Alcohol Test Model
 * Represents Alcohol test results
 */
@Table({
  tableName: 'alcohol_tests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class AlcoholTest extends Model {
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
    type: DataType.STRING(10),
    allowNull: true,
  })
  value: string;

  @Column({
    type: DataType.STRING(10),
    defaultValue: 'mg/ml',
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

  @BelongsTo(() => driverhealthcheckup, { foreignKey: 'health_checkup_id', as: 'driverHealthAlcoholCheckup' })
  driverHealthAlcoholCheckup: driverhealthcheckup;
}
