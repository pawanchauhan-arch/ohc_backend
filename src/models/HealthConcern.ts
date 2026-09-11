import { Column, Model, Table, BelongsTo, DataType } from 'sequelize-typescript';
import { driverhealthcheckup } from './DriverHealthCheckup';
import { DRIVERMASTER } from './DriverMaster';
import { CETMANAGEMENT } from './CetManagement';
import { Center } from './Center';

@Table({
  tableName: 'health_concerns',
  timestamps: true,
})
export class HealthConcern extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  health_checkup_id: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  driver_id: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  cet_id: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  center_id: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  concern_type: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
  })
  concern_level: string;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
  })
  parameter_value: object;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
  })
  threshold_value: object;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  spoc_details: object;

  @Column({
    type: DataType.STRING(30),
    defaultValue: 'PENDING',
  })
  status: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  email_template: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  final_email_content: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  custom_notes: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  reviewed_by: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  reviewed_at: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  email_sent_at: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  whatsapp_sent_at: Date;

  // Associations
  @BelongsTo(() => driverhealthcheckup, { foreignKey: 'health_checkup_id', as: 'healthCheckup' })
  healthCheckup: driverhealthcheckup;

  @BelongsTo(() => DRIVERMASTER, { foreignKey: 'driver_id', as: 'driver' })
  driver: DRIVERMASTER;

  @BelongsTo(() => CETMANAGEMENT, { foreignKey: 'cet_id', as: 'cet' })
  cet: CETMANAGEMENT;

  @BelongsTo(() => Center, { foreignKey: 'center_id', as: 'center' })
  center: Center;
}
