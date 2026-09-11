// models/biochemistry.model.ts
import { Column, DataType, Model, Table, ForeignKey } from 'sequelize-typescript';
import { driverhealthcheckup } from '../DriverHealthCheckup';

@Table({ tableName: 'biochemistry', timestamps: false })
export class Biochemistry extends Model<Biochemistry> {
  @ForeignKey(() => driverhealthcheckup)
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    allowNull: false,
    field: 'driverhealthcheckups_id',
  })
  driverhealthcheckups_id: number;

  // Mapped Test: Glucose (ID: 3)
  @Column({ type: DataType.FLOAT, allowNull: true })
  glucose: number | null;

  // Mapped Test: HbA1C (ID: 39) - MOVED FROM DIABETES_PROFILE TABLE
  @Column({ type: DataType.FLOAT, allowNull: true })
  hba1c: number | null; 
}