import {
  Table,
  Column,
  Model,
  DataType,
} from 'sequelize-typescript';

@Table({
  tableName: 'Alcholtests',
  timestamps: true,
})
export class Alcholtest extends Model<Alcholtest> {

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
}
