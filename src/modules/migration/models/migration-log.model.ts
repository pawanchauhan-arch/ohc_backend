import { Column, Model, Table, DataType } from 'sequelize-typescript';

/**
 * Migration Log Model
 * Tracks all migration operations for audit and monitoring purposes
 */
@Table({
  tableName: 'migration_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class MigrationLog extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @Column({
    type: DataType.ENUM('DRIVER_MASTER', 'HEALTH_CHECKUP', 'INCREMENTAL_MIGRATION'),
    allowNull: false,
    field: 'operation_type',
  })
  operationType: string;

  @Column({
    type: DataType.ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'ROLLED_BACK'),
    allowNull: false,
    defaultValue: 'PENDING',
  })
  status: string;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    field: 'total_records',
  })
  totalRecords: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    field: 'processed_records',
  })
  processedRecords: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    field: 'failed_records',
  })
  failedRecords: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    field: 'skipped_records',
  })
  skippedRecords: number;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    field: 'error_logs',
  })
  errorLogs: object[];

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    field: 'warnings',
  })
  warnings: string[];

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'backup_id',
  })
  backupId: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'start_time',
  })
  startTime: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'end_time',
  })
  endTime: Date;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  metadata: object;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  duration: number; // in milliseconds

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'initiated_by',
  })
  initiatedBy: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'source_system',
  })
  sourceSystem: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'target_system',
  })
  targetSystem: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'created_by',
  })
  createdBy: string;
} 