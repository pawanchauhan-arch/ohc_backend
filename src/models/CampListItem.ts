import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { CampList } from './CampList';
import { DRIVERMASTER } from './DriverMaster';
import { driverhealthcheckup } from './DriverHealthCheckup';

@Table({
  tableName: 'camp_list_items',
  timestamps: true,
})
export class CampListItem extends Model {
  @ForeignKey(() => CampList)
  @Column({ type: DataType.INTEGER, allowNull: false })
  camp_id: number;

  @BelongsTo(() => CampList, { foreignKey: 'camp_id', as: 'camp' })
  camp: CampList;

  @ForeignKey(() => DRIVERMASTER)
  @Column({ type: DataType.INTEGER, allowNull: false })
  driver_id: number;

  // trf number added 
  @Column({ type: DataType.TEXT, allowNull: true })
  trf_number: string | null; // trf number added by phelos 

  @BelongsTo(() => DRIVERMASTER, { foreignKey: 'driver_id', as: 'driver' })
  driver: DRIVERMASTER;

  @ForeignKey(() => driverhealthcheckup)
  @Column({ type: DataType.INTEGER, allowNull: true })
  driver_health_checkup_id: number | null;

  @BelongsTo(() => driverhealthcheckup, { foreignKey: 'driver_health_checkup_id', as: 'driverHealthCheckup' })
  driverHealthCheckup: driverhealthcheckup;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  is_completed: boolean;

  @Column({ type: DataType.TEXT, allowNull: true })
  id_proof_image: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  remarks: string | null;

  // JSon field
  // test report 
  @Column({ type: DataType.JSON, allowNull: true })
  test_report: any;

  @Column({ 
    type: DataType.JSONB, 
    allowNull: true,
    defaultValue: []
  })
  report_url: string[] | null;

  @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: false })
  added_to_samplify: boolean;

  @Column({ type: DataType.TEXT, allowNull: true, defaultValue: '' })
  is_report_Uploaded: string;

  @Column({ type: DataType.TEXT, allowNull: true, defaultValue: '', field: 'merged_report_url' })
  merged_report_url: string;
}



