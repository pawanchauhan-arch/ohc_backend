// models/lipid_profile.model.ts
import { Column, DataType, Model, Table, ForeignKey } from 'sequelize-typescript';
import { driverhealthcheckup } from '../DriverHealthCheckup';

@Table({ tableName: 'lipid_profile', timestamps: false })
export class LipidProfile extends Model<LipidProfile> {
  @ForeignKey(() => driverhealthcheckup)
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    allowNull: false,
    field: 'driverhealthcheckups_id',
  })
  driverhealthcheckups_id: number;

  // Mapped Test: Cholesterol (ID: 8)
  @Column({ type: DataType.FLOAT, allowNull: true })
  cholesterol: number | null;

  // Mapped Test: Triglyceride (ID: 7)
  @Column({ type: DataType.FLOAT, allowNull: true })
  triglycerides: number | null;

  // Mapped Test: LDL (ID: 10)
  @Column({ type: DataType.FLOAT, allowNull: true })
  ldl_cholesterol: number | null;
  
  // Default empty columns
  @Column({ type: DataType.FLOAT, allowNull: true })
  hdl_cholesterol: number | null;

}