import { Column, Model, Table, BelongsTo } from 'sequelize-typescript';
import { DRIVERMASTER } from './DriverMaster';  // Assuming you have a DRIVERMASTER model

@Table({
  tableName: 'DRIVERMASTERPERSONALs',
  timestamps: true,
})
export class DRIVERMASTERPERSONAL extends Model {
  @Column
  driver_id: number;

  @Column
  driver_phone: string;

  @Column
  blood_group: string;

  @Column
  diabetes: boolean;

  @Column
  hypertension: boolean;

  @Column
  hypotension: boolean;

  @Column
  epilepsy: boolean;

  @Column
  physical_disability: boolean;

  @Column
  physical_disability_details: string;

  @Column
  mental_disability: boolean;

  @Column
  mental_disability_details: string;

  @Column
  vision_issues: boolean;

  @Column
  vision_issues_details: string;

  @Column
  hearing_issues: boolean;

  @Column
  hearing_issues_details: string;

  @Column
  major_accident: string;

  @Column
  allergies: string;

  @Column
  other_medical_info: string;

  @Column
  alcohol_consumption: boolean;

  @Column
  smoking: boolean;

  @Column
  tobacco_consumption: boolean;

  @Column
  birthmark_identification: string;

  @BelongsTo(() => DRIVERMASTER, { foreignKey: 'driver_id' })
  driver: DRIVERMASTER;
}
