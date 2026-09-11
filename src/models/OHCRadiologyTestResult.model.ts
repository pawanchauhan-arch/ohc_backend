import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BaseModel } from './base.model';
import { OHCRadiology } from './OHCRadiology.model'; 

@Table({
  tableName: 'ohc_radiology_test_results',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class OHCRadiologyTestResult extends BaseModel<OHCRadiologyTestResult> {

  @ForeignKey(() => OHCRadiology)
  @Column({ allowNull: false })
  radiology_id: number;

  @BelongsTo(() => OHCRadiology)
  radiology: OHCRadiology;

  @Column({ allowNull: false })
  test_type: string;

  @Column(DataType.TEXT)
  result_summary?: string;

  @Column(DataType.TEXT)
  doctor_remarks?: string;

  @Column(DataType.TEXT)
  report_url?: string;

  @Column({ defaultValue: false })
  is_deleted: boolean;

  @Column({ allowNull: false })
  created_by: number;

  @Column
  updated_by?: number;
}