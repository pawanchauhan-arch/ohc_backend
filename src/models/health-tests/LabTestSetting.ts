// models/LabTestSetting.ts
import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'lab_test_settings', timestamps: false })
export class LabTestSetting extends Model<LabTestSetting> {
@Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true, 
  })
  id: number;
  
  @Column({ type: DataType.STRING, allowNull: false })
  test_profile: string; // 'cbc'

  @Column({ type: DataType.STRING, allowNull: false })
  column_name: string; // 'haemoglobin'


  @Column({ type: DataType.STRING })
  unit: string;

  // General Ranges
  @Column({ type: DataType.FLOAT })
  min_range: number;

  @Column({ type: DataType.FLOAT })
  max_range: number;

}