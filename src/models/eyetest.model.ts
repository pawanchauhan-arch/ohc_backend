import {
  Table,
  Column,
  Model,
  DataType,
} from 'sequelize-typescript';

@Table({
  tableName: 'Eyetests',
  timestamps: true,
})
export class Eyetest extends Model<Eyetest> {

  @Column({ type: DataType.STRING, allowNull: true })
  spherical_right_within_deviation_value_min_below: string;

  @Column({ type: DataType.STRING, allowNull: true })
  spherical_right_within_deviation_value_min: string;

  @Column({ type: DataType.STRING, allowNull: true })
  spherical_right_out_of_range_below: string;

  @Column({ type: DataType.STRING, allowNull: true })
  spherical_right_out_of_range: string;

  @Column({ type: DataType.STRING, allowNull: true })
  cylindrical_right_within_deviation_value_min_below: string;

  @Column({ type: DataType.STRING, allowNull: true })
  cylindrical_right_within_deviation_value_min: string;

  @Column({ type: DataType.STRING, allowNull: true })
  cylindrical_right_out_of_range_below: string;

  @Column({ type: DataType.STRING, allowNull: true })
  cylindrical_right_out_of_range: string;

  @Column({ type: DataType.STRING, allowNull: true })
  spherical_left_within_deviation_value_min_below: string;

  @Column({ type: DataType.STRING, allowNull: true })
  spherical_left_within_deviation_value_min: string;

  @Column({ type: DataType.STRING, allowNull: true })
  spherical_left_out_of_range_below: string;

  @Column({ type: DataType.STRING, allowNull: true })
  spherical_left_out_of_range: string;

  @Column({ type: DataType.STRING, allowNull: true })
  cylindrical_left_within_deviation_value_min_below: string;

  @Column({ type: DataType.STRING, allowNull: true })
  cylindrical_left_within_deviation_value_min: string;

  @Column({ type: DataType.STRING, allowNull: true })
  cylindrical_left_out_of_range_below: string;

  @Column({ type: DataType.STRING, allowNull: true })
  cylindrical_left_out_of_range: string;

  @Column({ type: DataType.STRING, allowNull: true })
  colour_blindness_option_1: string;

  @Column({ type: DataType.STRING, allowNull: true })
  colour_blindness_option_2: string;
}
