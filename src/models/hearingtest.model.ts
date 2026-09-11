import {
  Table,
  Column,
  Model,
  DataType,
} from 'sequelize-typescript';

@Table({
  tableName: 'Hearingtests',
  timestamps: true, // set false if your table does not have createdAt / updatedAt
})
export class Hearingtest extends Model<Hearingtest> {

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  option_1: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  option_2: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  option_3: number;
}
