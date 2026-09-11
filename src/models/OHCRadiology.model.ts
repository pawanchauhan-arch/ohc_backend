import {
  Table,
  Column,
  DataType,
  ForeignKey,
  HasMany
} from 'sequelize-typescript';
import { BaseModel } from './base.model';
import { DRIVERMASTER } from 'src/models/DriverMaster';
import { OHCRadiologyTestResult } from './OHCRadiologyTestResult.model';
@Table({
  tableName: 'ohc_radiology',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class OHCRadiology extends BaseModel<OHCRadiology> {

  @ForeignKey(() => DRIVERMASTER)
  @Column({ allowNull: false })
  patient_id: number;

  @Column(DataType.STRING)
  name: string;

  @Column(DataType.STRING)
  gender?: string;

  @Column(DataType.INTEGER)
  age?: number;

  @Column(DataType.STRING)
  employee_id?: string;

  @Column(DataType.TEXT)
  remarks?: string;

  @HasMany(() => OHCRadiologyTestResult)
  tests: OHCRadiologyTestResult[];

  @Column({ defaultValue: false })
  is_deleted: boolean;

  @Column({ allowNull: false })
  created_by: number;

  @Column
  updated_by?: number;
}