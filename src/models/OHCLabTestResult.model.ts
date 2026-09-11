import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BaseModel } from './base.model';
import { OHCLabInvestigation } from './OHCLabInvestigation.model';

@Table({
  tableName: 'ohc_lab_test_results',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class OHCLabTestResult extends BaseModel<OHCLabTestResult> {

  @ForeignKey(() => OHCLabInvestigation)
  @Column({ type: DataType.INTEGER, allowNull: false })
  investigation_id: number;

  @BelongsTo(() => OHCLabInvestigation)
  investigation: OHCLabInvestigation;

  @Column({ type: DataType.TEXT, allowNull: false })
  test_name: string;

  @Column(DataType.TEXT)
  result_value?: string;

  @Column(DataType.TEXT)
  normal_range?: string;

  @Column(DataType.TEXT)
  remarks?: string;

  @Column(DataType.TEXT)
  report_url?: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  is_deleted: boolean;

  @Column({ type: DataType.INTEGER, allowNull: false })
  created_by: number;

  @Column(DataType.INTEGER)
  updated_by?: number;
}