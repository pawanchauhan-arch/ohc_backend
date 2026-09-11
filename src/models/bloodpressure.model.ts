import {
  Table,
  Column,
  Model,
  DataType,
} from 'sequelize-typescript';

@Table({
  tableName: 'Bloodpressures',
  timestamps: true, // set false if your table doesn't have createdAt/updatedAt
})
export class Bloodpressure extends Model<Bloodpressure> {

  /* =======================
     Systolic Values
     ======================= */

  @Column({ type: DataType.INTEGER, allowNull: true })
  systolic_standard_value_min: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  systolic_standard_value_max: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  systolic_within_deviation_value_min: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  systolic_within_deviation_value_max: number;

  @Column({ type: DataType.STRING, allowNull: true })
  systolic_units: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  systolic_out_of_range: number;

  @Column({ type: DataType.STRING, allowNull: true })
  systolic_within_deviation_value_min_below: string;

  @Column({ type: DataType.STRING, allowNull: true })
  systolic_within_deviation_value_max_below: string;

  @Column({ type: DataType.STRING, allowNull: true })
  systolic_out_of_range_below: string;

  /* =======================
     Diastolic Values
     ======================= */

  @Column({ type: DataType.INTEGER, allowNull: true })
  diastolic_standard_value_min: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  diastolic_standard_value_max: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  diastolic_within_deviation_value_min: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  diastolic_within_deviation_value_max: number;

  @Column({ type: DataType.STRING, allowNull: true })
  diastolic_units: string;

  @Column({ type: DataType.STRING, allowNull: true })
  diastolic_out_of_range: string;

  @Column({ type: DataType.STRING, allowNull: true })
  diastolic_within_deviation_value_min_below: string;

  @Column({ type: DataType.STRING, allowNull: true })
  diastolic_within_deviation_value_max_below: string;

  @Column({ type: DataType.STRING, allowNull: true })
  diastolic_out_of_range_below: string;

  /* =======================
     Common / Legacy Fields
     ======================= */

  @Column({ type: DataType.STRING, allowNull: true })
  within_deviation_value_min_below: string;

  @Column({ type: DataType.STRING, allowNull: true })
  within_deviation_value_max_below: string;
}
