import { Column, Model, Table, BelongsTo, DataType, PrimaryKey } from 'sequelize-typescript';
import { driverhealthcheckup } from '../DriverHealthCheckup';

/**
 * Vision Test Model
 * Represents Vision test results
 */
@Table({
  tableName: 'vision_tests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class VisionTest extends Model {
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
  left_eye_value: string;
  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  right_eye_value: string;
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  left_eye_remark: string;
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  right_eye_remark: string;
  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
  })
  is_wearing_specs: boolean;

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

  @BelongsTo(() => driverhealthcheckup, { foreignKey: 'health_checkup_id', as: 'driverHealthVisionCheckup' })
  driverHealthVisionCheckup: driverhealthcheckup;
}
