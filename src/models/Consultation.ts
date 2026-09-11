import { Column, Model, Table, ForeignKey, BelongsTo, DataType, PrimaryKey, AllowNull ,HasOne  } from 'sequelize-typescript';
import { Request } from './Request';
import { Prescription } from './Prescription';
import { Doctor } from './Doctor';
import { DRIVERMASTER } from './DriverMaster';
import { ConsultationRecording } from './consultationRecording';
import { Center } from './Center';

@Table({
  tableName: 'consultation',
  timestamps: true,
})
export class Consultation extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  consultation_id: string;

  @Column
  driver_contactNumber: string;

  @ForeignKey(() => DRIVERMASTER)
  @Column({
    type: DataType.INTEGER, // Matches the type of `id` in DriverMaster
    allowNull: true,
  })
  driver_id: number;
  
  @BelongsTo(() => DRIVERMASTER, { as: 'consultation_driver' })
  consultation_driver: DRIVERMASTER;

  @ForeignKey(() => Center)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  centerID: number;

  @BelongsTo(() => Center, { as: 'consultationCenter' })
  consultationCenter: Center;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isBooked: boolean;

  @Column({
    type: DataType.DATE,
  })
  scheduled_time: Date;

  @ForeignKey(() => Request)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  request_id: string;

  @BelongsTo(() => Request, { as: 'relatedRequest' })
  request: Request;

  @ForeignKey(() => Prescription, )
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  prescription_id: string;

  @BelongsTo(() => Prescription, { as: 'relatedPrescription' }) // Added association
  relatedPrescription: Prescription;

  @Column
  meet_link: string;

  @ForeignKey(() => Doctor)
  @Column({
    type: DataType.INTEGER, // Matches the type of `id` in Doctor
    allowNull: true,
  })
  doctor_id: number;
  
  @BelongsTo(() => Doctor)
  doctor: Doctor;

  @Column
  doctor_name: string;

  // ✅ Add vitals JSON column
  @Column({
    type: DataType.JSON,
    allowNull: true, // Change to false if vitals are required
  })
  vitals: Record<string, any>;


  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  iscomplete: boolean

  @Column(DataType.STRING)
  room_name: string;

  @HasOne(() => ConsultationRecording)
  consultation_recording: ConsultationRecording;
}
