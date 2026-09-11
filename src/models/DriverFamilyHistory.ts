import { Column, Model, Table, BelongsTo } from 'sequelize-typescript';
import { DRIVERMASTER } from './DriverMaster';  // Assuming you have a DRIVERMASTER model

@Table({
  tableName: 'DRIVERFAMILYHISTORies',
  timestamps: true,
})
export class DRIVERFAMILYHISTORY extends Model {
  @Column
  driver_phone: string;

  @Column
  driver_id: number;

  @Column
  family_member_1_relation: string;

  @Column
  family_member_2_relation: string;

  @Column
  family_member_1: string;

  @Column
  family_member_2: string;

  @Column
  parent_diabetic: boolean;

  @Column
  parent_hypertension: boolean;

  @Column
  parent_hypotension: boolean;

  @Column
  other_genetic_disease: string;

  @BelongsTo(() => DRIVERMASTER, { foreignKey: 'driver_id' })
  driver: DRIVERMASTER;
}
