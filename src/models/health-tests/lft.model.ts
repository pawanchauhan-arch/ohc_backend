// models/lft.model.ts
import { Column, DataType, Model, Table, ForeignKey } from 'sequelize-typescript';
import { driverhealthcheckup } from '../DriverHealthCheckup'; // Assuming this is your main parent table

@Table({ tableName: 'lft', timestamps: false })
export class Lft extends Model<Lft> {
  @ForeignKey(() => driverhealthcheckup)
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    allowNull: false,
    field: 'driverhealthcheckups_id',
  })
  driverhealthcheckups_id: number;

  // Mapped Tests: Albumin (ID: 1), Total_Protein (ID: 12), Bilirubin_Total (ID: 23), SGOT (ID: 24), SGPT (ID: 25)
  @Column({ type: DataType.FLOAT, allowNull: true })
  total_protein: number | null;

  @Column({ type: DataType.FLOAT, allowNull: true })
  albumin: number | null;

  @Column({ type: DataType.FLOAT, allowNull: true })
  bilirubin_total: number | null;

  @Column({ type: DataType.FLOAT, allowNull: true })
  sgot: number | null;

  @Column({ type: DataType.FLOAT, allowNull: true })
  sgpt: number | null;

  // ... Include all other FLOAT columns from your SQL statement ...
  @Column({ type: DataType.FLOAT, allowNull: true })
  globulin: number | null;
  @Column({ type: DataType.FLOAT, allowNull: true })
  ag_ratio: number | null;
  @Column({ type: DataType.FLOAT, allowNull: true })
  bilirubin_direct: number | null;
  @Column({ type: DataType.FLOAT, allowNull: true })
  bilirubin_indirect: number | null;
  @Column({ type: DataType.FLOAT, allowNull: true })
  ast_alt_ratio: number | null;
  @Column({ type: DataType.FLOAT, allowNull: true })
  alkaline_phosphatase: number | null;
  @Column({ type: DataType.FLOAT, allowNull: true })
  ggtp: number | null;
}