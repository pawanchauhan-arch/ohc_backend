import { Column, Model, Table, DataType } from 'sequelize-typescript';

/**
 * Backup Log Model
 * Tracks database backups for rollback operations
 */
@Table({
  tableName: 'backup_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class BackupLog extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'backup_name',
  })
  backupName: string;

  @Column({
    type: DataType.ENUM('DRIVER_MASTER', 'HEALTH_CHECKUP'),
    allowNull: false,
    field: 'table_type',
  })
  tableType: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'record_count',
  })
  recordCount: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'backup_time',
  })
  backupTime: Date;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'file_path',
  })
  filePath: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    field: 'is_restored',
  })
  isRestored: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'restored_by',
  })
  restoredBy: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'restored_at',
  })
  restoredAt: Date;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  metadata: object;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'file_size',
  })
  fileSize: number; // in bytes

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  checksum: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description: string;
} 