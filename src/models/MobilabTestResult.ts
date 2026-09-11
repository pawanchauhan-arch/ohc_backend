// models/MobilabBooking.ts
import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'mobilab_bookings', timestamps: true })
export class MobilabBooking extends Model<MobilabBooking> {
  @Column({ type: DataType.STRING, primaryKey: true, allowNull: false })
  booking_id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  patient_fullname: string;

  @Column({ type: DataType.INTEGER })
  patient_age: number;

  @Column({ type: DataType.STRING })
  patient_gender: string;

  @Column({ type: DataType.STRING })
  patient_phone: string;

  // Stores the initial booking request (tests or profiles)
  @Column({ type: DataType.JSON, allowNull: false })
  requested_payload: any; 

  // Stores the final results
  @Column({ type: DataType.JSON, allowNull: true })
  results: any; 

  @Column({ type: DataType.STRING, defaultValue: 'PENDING' })
  status: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  driver_id: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  health_checkup_id: number;

  @Column
  center_id: number;
}