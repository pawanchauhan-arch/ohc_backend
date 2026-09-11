import { Column, Model, Table, ForeignKey, BelongsTo, DataType, PrimaryKey } from 'sequelize-typescript';
import { Prescription } from './Prescription';

@Table({
  tableName: 'prescription_edit_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})
export class PrescriptionEditLogs extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    allowNull: false,
  })
  log_id: string;

  @ForeignKey(() => Prescription)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  prescription_id: string;

  @BelongsTo(() => Prescription)
  prescription: Prescription;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
  })
  changes: {
    type: 'PRESCRIPTION' | 'PRESCRIPTION_MEDICINE';
    action: 'UPDATE' | 'DELETE';
    medicine_id?: string;
    previous: Record<string, any>;
    current: Record<string, any>;
    changed_fields: string[];
  };
} 