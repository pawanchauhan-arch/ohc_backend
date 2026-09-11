import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { BaseModel } from './base.model';

@Table({
  tableName: 'ohc_vitals',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class OhcVitals extends BaseModel<OhcVitals> {

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  employee_id: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
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
  bpsystolic?: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  bpdiastolic?: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  pulserate?: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  spo2?: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: true,
  })
  temperature?: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: true,
  })
  height?: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: true,
  })
  weight?: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: true,
  })
  bmi?: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    
  })
  respiratory_rate?: number;
   @Column({ type: DataType.INTEGER, allowNull: false })
    patient_id: number;

  @Column({
  type: DataType.BOOLEAN,
  defaultValue: false,
})
is_deleted: boolean;
}