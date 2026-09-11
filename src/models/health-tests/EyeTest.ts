import { Column, Model, Table, BelongsTo, DataType, PrimaryKey } from 'sequelize-typescript';
import { driverhealthcheckup } from '../DriverHealthCheckup';

/**
 * Eye Test Model
 * Represents comprehensive eye test results
 */
@Table({
  tableName: 'eye_tests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class EyeTest extends Model {
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
    field: 'spherical_right',
  })
  spherical_right_eye: number;

  @Column({
    type: DataType.DECIMAL(4, 2),
    allowNull: true,
    field: 'cylindrical_right',
  })
  cylindrical_right_eye: number;

  @Column({
    type: DataType.DECIMAL(4, 2),
    allowNull: true,
    field: 'spherical_left',
  })
  spherical_left_eye: number;

  @Column({
    type: DataType.DECIMAL(4, 2),
    allowNull: true,
    field: 'cylindrical_left',
  })
  cylindrical_left_eye: number;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  colour_blindness: string;

  @Column({
    type: DataType.STRING(10),
    defaultValue: 'D',
    allowNull: true,
  })
  units: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  spherical_right_status: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  spherical_left_status: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  cylindrical_right_status: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  cylindrical_left_status: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  colour_blindness_status: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  remark: string;

  @BelongsTo(() => driverhealthcheckup, { foreignKey: 'health_checkup_id', as: 'driverHealthEyeCheckup' })
  driverHealthEyeCheckup: driverhealthcheckup;
}
