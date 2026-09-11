import {
  Table,
  Column,
  DataType,
  ForeignKey,
} from 'sequelize-typescript';
import { BaseModel } from './base.model';
import { DRIVERMASTER } from 'src/models/DriverMaster';

@Table({
  tableName: 'ohc_radiology_tests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class OHCRadiologyTest extends BaseModel<OHCRadiologyTest> {

  @ForeignKey(() => DRIVERMASTER)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  patient_id: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  test_type: string;

  @Column(DataType.TEXT)
  result_summary?: string;

  @Column(DataType.TEXT)
  doctor_remarks?: string;

  @Column(DataType.TEXT)
  report_url?: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  is_deleted: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  created_by: number;

  @Column(DataType.INTEGER)
  updated_by?: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name?: string;
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  gender?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  age?: number;
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  employee_id: string;
}