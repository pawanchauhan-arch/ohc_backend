import {
  Table,
  Column,
  Model,
  DataType,
} from 'sequelize-typescript';

@Table({
  tableName: 'Temperatures',
  timestamps: true, // set false if your table doesn't use createdAt / updatedAt
})
export class Temperature extends Model<Temperature> {

  @Column({ type: DataType.INTEGER, allowNull: true })
  standard_value_min: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  standard_value_max: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  within_deviation_value_min: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  within_deviation_value_max: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  out_of_range: number;

  @Column({ type: DataType.STRING, allowNull: true })
  units: string;

  @Column({ type: DataType.STRING, allowNull: true })
  within_deviation_value_min_below: string;

  @Column({ type: DataType.STRING, allowNull: true })
  within_deviation_value_max_below: string;

  @Column({ type: DataType.STRING, allowNull: true })
  out_of_range_below: string;
}
