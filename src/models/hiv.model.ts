import {
  Table,
  Column,
  Model,
  DataType,
} from 'sequelize-typescript';

@Table({
  tableName: 'Hivs',
  timestamps: true, // set false if your table doesn't use createdAt / updatedAt
})
export class Hiv extends Model<Hiv> {

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
