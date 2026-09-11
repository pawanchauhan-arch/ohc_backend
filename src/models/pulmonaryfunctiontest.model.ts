import {
  Table,
  Column,
  Model,
  DataType,
} from 'sequelize-typescript';

@Table({
  tableName: 'Pulmonaryfunctiontests',
  timestamps: true, // set false if your table doesn't have createdAt/updatedAt
})
export class Pulmonaryfunctiontest extends Model<Pulmonaryfunctiontest> {

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  standard_value_min: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  standard_value_max: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  within_deviation_value_min: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  within_deviation_value_max: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  out_of_range: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  units: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  within_deviation_value_min_below: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  within_deviation_value_max_below: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  out_of_range_below: string;
}
