import { Column, Model, Table, BelongsTo, DataType, PrimaryKey } from 'sequelize-typescript';
import { driverhealthcheckup } from '../DriverHealthCheckup';

/**
 * Romberg Test Model
 * Represents Romberg test results
 */
@Table({
  tableName: 'romberg_tests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class RombergTest extends Model {
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
    type: DataType.STRING(20),
    allowNull: true,
  })
  value: string;

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

  @BelongsTo(() => driverhealthcheckup, { foreignKey: 'health_checkup_id', as: 'driverHealthRombergCheckup' })
  driverHealthRombergCheckup: driverhealthcheckup;
}
