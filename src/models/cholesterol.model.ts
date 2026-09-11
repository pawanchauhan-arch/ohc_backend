import {
  Table,
  Column,
  Model,
  DataType,
} from 'sequelize-typescript';

@Table({
  tableName: 'CHOLESTEROLs',
  timestamps: true, // set false if your table doesn't use createdAt / updatedAt
})
export class CHOLESTEROL extends Model<CHOLESTEROL> {

  /* =======================
     Total Cholesterol
     ======================= */

  @Column({ type: DataType.INTEGER, allowNull: true })
  total_cholesterol_standard_value_min: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  total_cholesterol_standard_value_max: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  total_cholesterol_within_deviation_value_min: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  total_cholesterol_within_deviation_value_max: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  total_cholesterol_out_of_range: number;

  @Column({ type: DataType.STRING, allowNull: true })
  total_cholesterol_units: string;

  /* =======================
     LDL Cholesterol
     ======================= */

  @Column({ type: DataType.INTEGER, allowNull: true })
  ld_cholesterol_standard_value_min: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  ld_cholesterol_standard_value_max: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  ld_cholesterol_within_deviation_value_min: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  ld_cholesterol_within_deviation_value_max: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  ld_cholesterol_out_of_range: number;

  @Column({ type: DataType.STRING, allowNull: true })
  ld_cholesterol_units: string;

  /* =======================
     HDL Cholesterol
     ======================= */

  @Column({ type: DataType.INTEGER, allowNull: true })
  hd_cholesterol_standard_value_min: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  hd_cholesterol_standard_value_max: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  hd_cholesterol_within_deviation_value_min: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  hd_cholesterol_within_deviation_value_max: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  hd_cholesterol_out_of_range: number;

  @Column({ type: DataType.STRING, allowNull: true })
  hd_cholesterol_units: string;
}
