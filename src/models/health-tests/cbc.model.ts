import { Column, DataType, Model, Table, ForeignKey } from 'sequelize-typescript';
import { driverhealthcheckup } from '../DriverHealthCheckup';

@Table({ tableName: 'cbc', timestamps: false })
export class Cbc extends Model<Cbc> {
  
  @ForeignKey(() => driverhealthcheckup)
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    allowNull: false,
    field: 'driverhealthcheckups_id',
  })
  driverhealthcheckups_id: number;

  // --- Red Blood Cell Parameters ---
  @Column({ type: DataType.FLOAT, allowNull: true })
  haemoglobin: number | null; // HGB

  @Column({ type: DataType.FLOAT, allowNull: true })
  packed_cell_volume: number | null; // HCT

  @Column({ type: DataType.FLOAT, allowNull: true })
  rbc_count: number | null; // RBC

  @Column({ type: DataType.FLOAT, allowNull: true })
  mcv: number | null;

  @Column({ type: DataType.FLOAT, allowNull: true })
  mch: number | null;

  @Column({ type: DataType.FLOAT, allowNull: true })
  mchc: number | null;

  @Column({ type: DataType.FLOAT, allowNull: true })
  rdw_cv: number | null;

  @Column({ type: DataType.FLOAT, allowNull: true })
  rdw_sd: number | null;

  // --- White Blood Cell Parameters ---
  @Column({ type: DataType.FLOAT, allowNull: true })
  total_leucocyte_count: number | null; // WBC / TLC

  // --- Differential Count (Percentages %) ---
  @Column({ type: DataType.FLOAT, allowNull: true })
  neutrophils: number | null; // NEUT%

  @Column({ type: DataType.FLOAT, allowNull: true })
  lymphocytes: number | null; // LYM%

  @Column({ type: DataType.FLOAT, allowNull: true })
  monocytes: number | null; // MONO%

  @Column({ type: DataType.FLOAT, allowNull: true })
  eosinophils: number | null; // EOS%

  @Column({ type: DataType.FLOAT, allowNull: true })
  basophils: number | null; // BASO%
  
  @Column({ type: DataType.FLOAT, allowNull: true })
  mixed_cells_percent: number | null; // MXD%

  // --- Differential Count (Absolute Numbers #) ---
  @Column({ type: DataType.FLOAT, allowNull: true })
  abs_neutrophil_count: number | null; // NEUT#

  @Column({ type: DataType.FLOAT, allowNull: true })
  abs_lymphocyte_count: number | null; // LYM#

  @Column({ type: DataType.FLOAT, allowNull: true })
  abs_monocyte_count: number | null; // MONO#

  @Column({ type: DataType.FLOAT, allowNull: true })
  abs_eosinophil_count: number | null; // EOS#
  
  @Column({ type: DataType.FLOAT, allowNull: true })
  abs_basophil_count: number | null; // BASO#

  @Column({ type: DataType.FLOAT, allowNull: true })
  abs_mixed_cells_count: number | null; // MXD#

  // --- Platelet Parameters ---
  @Column({ type: DataType.FLOAT, allowNull: true })
  platelet_count: number | null; // PLT

  @Column({ type: DataType.FLOAT, allowNull: true })
  mpv: number | null;

  @Column({ type: DataType.FLOAT, allowNull: true })
  pdw: number | null;

  @Column({ type: DataType.FLOAT, allowNull: true })
  pct: number | null;

  @Column({ type: DataType.FLOAT, allowNull: true })
  p_lcr: number | null;

  @Column({ type: DataType.FLOAT, allowNull: true })
  p_lcc: number | null;

  // --- Ratios ---
  @Column({ type: DataType.FLOAT, allowNull: true })
  plr: number | null; // Platelet-to-Lymphocyte Ratio

  @Column({ type: DataType.FLOAT, allowNull: true })
  nlr: number | null; // Neutrophil-to-Lymphocyte Ratio
}