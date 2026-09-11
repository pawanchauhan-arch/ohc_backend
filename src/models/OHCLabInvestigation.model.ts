import {
  Table,
  Column,
  DataType,
  ForeignKey,
  HasMany,
} from 'sequelize-typescript';
import { BaseModel } from './base.model';
import { DRIVERMASTER } from 'src/models/DriverMaster';
import { OHCLabTestResult } from './OHCLabTestResult.model';

@Table({
  tableName: 'ohc_lab_investigations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class OHCLabInvestigation extends BaseModel<OHCLabInvestigation> {

  @ForeignKey(() => DRIVERMASTER)
  @Column({ type: DataType.INTEGER, allowNull: false })
  patient_id: number;

  @Column(DataType.DATE)
  investigation_date?: Date;

  @Column(DataType.TEXT)
  remarks?: string;

  @HasMany(() => OHCLabTestResult)
  tests: OHCLabTestResult[];

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  is_deleted: boolean;

  @Column({ type: DataType.INTEGER, allowNull: false })
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