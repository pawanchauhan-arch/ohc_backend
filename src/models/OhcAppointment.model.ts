import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { BaseModel } from './base.model';

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  PENDING = 'PENDING',
}

@Table({
  tableName: 'ohc_appointments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class OHCAppointment extends BaseModel<OHCAppointment> {

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  appointment_datetime: Date;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  ohc_location: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  doctor_id: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  visit_type?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
   employee_id: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  token_number?: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  check_in_time?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  check_out_time?: Date;

  @Column({
    type: DataType.ENUM(...Object.values(AppointmentStatus)),
    allowNull: false,
    defaultValue: AppointmentStatus.SCHEDULED,
  })
  status: AppointmentStatus;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  remark?: string;
    @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  patient_id?: number;
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
}