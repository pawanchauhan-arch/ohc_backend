import {
  Table,
  Column,
  Model,
  DataType,
} from 'sequelize-typescript';

@Table({
  tableName: 'BMIs',
  timestamps: true, // set false if your table doesn't use createdAt / updatedAt
})
export class BMI extends Model<BMI> {

  /* =======================
     BMI Values
     ======================= */

  @Column({ type: DataType.INTEGER, allowNull: true })
  bmi_standard_value_min: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  bmi_standard_value_max: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  bmi_within_deviation_value_min: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  bmi_within_deviation_value_max: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  bmi_out_of_range: number;

  @Column({ type: DataType.STRING, allowNull: true })
  bmi_units: string;

  /* =======================
     Weight Values
     ======================= */

  @Column({ type: DataType.INTEGER, allowNull: true })
  weight_standard_value_min: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  weight_standard_value_max: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  weight_within_deviation_value_min: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  weight_within_deviation_value_max: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  weight_out_of_range: number;

  @Column({ type: DataType.STRING, allowNull: true })
  weight_units: string;

  /* =======================
     Height Values
     ======================= */

  @Column({ type: DataType.INTEGER, allowNull: true })
  height_standard_value_min: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  height_standard_value_max: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  height_within_deviation_value_min: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  height_within_deviation_value_max: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  height_out_of_range: number;

  @Column({ type: DataType.STRING, allowNull: true })
  height_units: string;

  /* =======================
     Below Range Values
     ======================= */

  @Column({ type: DataType.INTEGER, allowNull: true })
  bmi_within_deviation_value_min_below: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  bmi_within_deviation_value_max_below: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  bmi_out_of_range_below: number;
}
