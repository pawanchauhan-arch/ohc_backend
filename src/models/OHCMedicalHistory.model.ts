import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
} from 'sequelize-typescript';
import { DRIVERMASTER } from 'src/models/DriverMaster';
import { BaseModel } from './base.model';

@Table({
  tableName: 'ohc_medical_history',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class OHCMedicalHistory extends BaseModel<OHCMedicalHistory> {

  @ForeignKey(() => DRIVERMASTER)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  patient_id: number;

  @Column(DataType.TEXT)
  past_illness?: string;

  @Column(DataType.TEXT)
  surgical_history?: string;

  @Column(DataType.TEXT)
  family_medical_history?: string;

  @Column(DataType.TEXT)
  current_medications?: string;

  @Column(DataType.TEXT)
  allergies?: string;

  @Column(DataType.TEXT)
  smoking?: string;

  @Column(DataType.TEXT)
  alcohol?: string;

  @Column(DataType.TEXT)
  tobacco_use?: string;

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