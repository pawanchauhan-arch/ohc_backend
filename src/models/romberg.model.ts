import {
  Table,
  Column,
  Model,
  DataType,
} from 'sequelize-typescript';

@Table({
  tableName: 'Rombergs',
  timestamps: true, // set false if your table doesn't use createdAt / updatedAt
})
export class Romberg extends Model<Romberg> {

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  option_one: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  option_two: string;
}
