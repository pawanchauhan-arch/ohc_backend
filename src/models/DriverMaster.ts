import {
  Column,
  Model,
  Table,
  HasOne,
  DataType,
  PrimaryKey,
  AllowNull,
  HasMany,
} from 'sequelize-typescript';
import { DRIVERFAMILYHISTORY } from './DriverFamilyHistory'; // Assuming you have a DRIVERFAMILYHISTORY model
import { DRIVERMASTERPERSONAL } from './DriverMasterPersonal'; // Assuming you have a DRIVERMASTERPERSONAL model
import { Request } from './Request';
import { Consultation } from './Consultation';
import { Prescription } from './Prescription';

@Table({
  tableName: 'DRIVERMASTERs',
  timestamps: true,
})
export class DRIVERMASTER extends Model {
  @PrimaryKey
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    allowNull: false,
  })
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  driverId: string;

  @Column
  driver_cetid: number;

  @Column
  driver_cetname: string;

  @Column
  external_id: string;

  @Column({
    field: 'employee_id',
    type: DataType.STRING,
    allowNull: true,
  })
  employeeId: string;

  @Column({
    field: 'client_id',
    type: DataType.STRING,
    allowNull: true,
  })
  clientId: string;

  @Column
  createdBy: number;

  @Column
  name: string;

  @Column
  healthCardNumber: string;

  @Column
  abhaNumber: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  abhaDocument: string;

  @Column
  dateOfBirthOrAge: string;

  @Column({
    type: DataType.ENUM('Male', 'Female', 'Other'),
    allowNull: true,
  })
  gender: string;

  @Column
  photographOfDriver: string;

  @Column
  localAddress: string;

  @Column
  localAddressDistrict: string;

  @Column
  localAddressState: string;

  @Column
  contactNumber: string;

  @Column
  emergencyContactName: string;

  @Column
  emergencyContactNumber: string;

  @Column
  idProof_name: string;

  @Column
  idProof: string;

  @Column
  idProof_number: string;

  @Column
  idProof_doc: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  consent_form: string;

  @Column
  blood_group: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  abhaDetailsJson: object;

  @Column({
    type: DataType.STRING,
    allowNull: true, // or set to false if the column is required
  })
  preferred_language: string;

  // Associations
  @HasOne(() => DRIVERFAMILYHISTORY, { foreignKey: 'driver_id' })
  driverFamilyHistory: DRIVERFAMILYHISTORY;

  @HasOne(() => DRIVERMASTERPERSONAL, { foreignKey: 'driver_id' })
  driverMasterPersonal: DRIVERMASTERPERSONAL;

  @HasMany(() => Request, { foreignKey: 'driver_id', as: 'requests' })
  requests: Request[];

  @HasMany(() => Consultation, {
    foreignKey: 'driver_id',
    as: 'driverConsultations',
  })
  driverConsultations: Consultation[];

  @HasMany(() => Prescription, { foreignKey: 'driver_id', as: 'prescriptions' })
  prescriptions: Prescription[];

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
  })
  isBanned: boolean;

  @Column
  age: number;

  @Column
  mobilab_user_id: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  abhaSkipReason: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  })
  isayushmancard: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  })
  needassistanceayushman: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  comingFromWebsite: string;
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  pin: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  email: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  iage: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  idays: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  imonth: number;

  @Column({
    type: DataType.ARRAY(DataType.INTEGER),
    allowNull: false,
    defaultValue: [],
  })
  disease_ids: number[];

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  country_id: number;
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  state_id: number;
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  district_id: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  category: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  occupation: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  relationship: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  title: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  co: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  residentialstatus: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  is_deleted: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  ReferredBy: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  center_id: number;
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  tenant_id: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  legacy_patient_id: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isCampRegistration: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  department_id: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  designation_id: string;
}
