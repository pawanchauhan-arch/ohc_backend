import { Column, Model, Table, ForeignKey, BelongsTo, DataType, PrimaryKey, HasMany } from 'sequelize-typescript';
import { Consultation } from './Consultation';
import { Doctor } from './Doctor';
import { DRIVERMASTER } from './DriverMaster';
import { PrescriptionMedicine } from './PrescriptionMedicine';
import { driverhealthcheckup } from './DriverHealthCheckup';

export const FITNESS_STATUS_VALUES = [
  'FIT',
  'UNFIT AND REFERRED FOR HIGHER CENTER',
  'FIT WITH MEDICATION',
] as const;

@Table({
  tableName: 'prescription',
  timestamps: true,
})
export class Prescription extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  prescription_id: string;

  @ForeignKey(() => Consultation)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  consultation_id: string;

  @BelongsTo(() => Consultation)
  consultation: Consultation;

  @ForeignKey(() => Doctor)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  doctor_id: number;

  @BelongsTo(() => Doctor)
  doctor: Doctor;

  @ForeignKey(() => DRIVERMASTER)
  @Column({
    type: DataType.INTEGER, // Matches the type of `id` in DriverMaster
    allowNull: false,
  })
  driver_id: number;

  @BelongsTo(() => DRIVERMASTER, { as: 'prescriptionDriver' })
  prescriptionDriver: DRIVERMASTER;

  @HasMany(() => PrescriptionMedicine)
  medicines: PrescriptionMedicine[];


  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: true,
    defaultValue: [],
  })
  lab: string[];

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  other_lab: string;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: true,
    defaultValue: [],
  })
  instructions: string[];

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: true,
    defaultValue: [],
  })
  chief_complaints: string[];

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  follow_up: Date;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: true,
    defaultValue: [],
  })
  preventive_advice: string[];

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  prescription_slip_image: string; // URL or path to the image

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  prescription_slip_text: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  })
  isReady: boolean;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  vitals: object;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  health_conditions: object;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: true,
    defaultValue: [],
  })
  drug_allergies: string[];

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  diagnose: string;

  @Column({
    type: DataType.ENUM(...FITNESS_STATUS_VALUES),
    allowNull: true,
  })
  fitness_status: string | null;

  @ForeignKey(() => driverhealthcheckup) @Column({ type: DataType.INTEGER, allowNull: true, }) driver_health_checkup_id: number;
  @BelongsTo(() => driverhealthcheckup, { foreignKey: 'driver_health_checkup_id', as: 'healthCheckupRecord', }) healthCheckup: driverhealthcheckup;
  @ForeignKey(() => driverhealthcheckup)
  // @Column({
  //   type: DataType.INTEGER, // Assuming PK of driverhealthcheckup is INTEGER
  //   allowNull: true,
  //   comment: 'Foreign key referencing the driverhealthcheckups table ID',
  // })
  // driver_health_checkup_id: number;

// Bill number id from opd table

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  bill_no: number;
  @BelongsTo(() => driverhealthcheckup, 'driver_health_checkup_id')
  driverHealthCheckup: driverhealthcheckup;
}
