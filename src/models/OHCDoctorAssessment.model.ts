import {
  Table,
  Column,
  DataType,
  ForeignKey,
} from 'sequelize-typescript';
import { BaseModel } from './base.model';
import { DRIVERMASTER } from 'src/models/DriverMaster';

export enum FitnessCategory {
  FIT = 'FIT',
  FIT_WITH_RESTRICTIONS = 'FIT_WITH_RESTRICTIONS',
  UNFIT = 'UNFIT',
}

@Table({
  tableName: 'ohc_doctor_assessments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class OHCDoctorAssessment extends BaseModel<OHCDoctorAssessment> {

  @ForeignKey(() => DRIVERMASTER)
  @Column({ type: DataType.INTEGER, allowNull: false })
  patient_id: number;

  @Column(DataType.TEXT)
  overall_health_status?: string;

  @Column({
    type: DataType.ENUM(...Object.values(FitnessCategory)),
    allowNull: false,
  })
  fitness_category: FitnessCategory;

  @Column(DataType.TEXT)
  restrictions?: string;

  @Column(DataType.TEXT)
  recommendations?: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  follow_up_required: boolean;

  @Column(DataType.TEXT)
  comments?: string;

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