// models/kft.model.ts
import { Column, DataType, Model, Table, ForeignKey } from 'sequelize-typescript';
import { driverhealthcheckup } from '../DriverHealthCheckup';

@Table({ tableName: 'kft', timestamps: false })
export class Kft extends Model<Kft> {
  @ForeignKey(() => driverhealthcheckup)
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    allowNull: false,
    field: 'driverhealthcheckups_id',
  })
  driverhealthcheckups_id: number;

  // Mapped Tests: Urea (ID: 6), Creatinine (ID: 20), Uric_Acid (ID: 16)
  @Column({ type: DataType.FLOAT, allowNull: true })
  urea: number | null;

  @Column({ type: DataType.FLOAT, allowNull: true })
  creatinine: number | null;

  @Column({ type: DataType.FLOAT, allowNull: true })
  uric_acid: number | null;
  
  // ... Include all other FLOAT columns from your SQL statement ...
  @Column({ type: DataType.FLOAT, allowNull: true })
  bun: number | null;
  @Column({ type: DataType.FLOAT, allowNull: true })
  egfr_mdrd: number | null;
  @Column({ type: DataType.FLOAT, allowNull: true })
  egfr_ckd_epi: number | null;
  @Column({ type: DataType.FLOAT, allowNull: true })
  bun_creatinine_ratio: number | null;
  @Column({ type: DataType.FLOAT, allowNull: true })
  calcium: number | null;
  @Column({ type: DataType.FLOAT, allowNull: true })
  sodium: number | null;
  @Column({ type: DataType.FLOAT, allowNull: true })
  potassium: number | null;
  @Column({ type: DataType.FLOAT, allowNull: true })
  chloride: number | null;
  @Column({ type: DataType.FLOAT, allowNull: true })
  phosphorus: number | null;
}