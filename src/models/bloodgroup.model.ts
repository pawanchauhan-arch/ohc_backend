import {
  Table,
  Column,
  Model,
  DataType,
} from 'sequelize-typescript';

@Table({
  tableName: 'Bloodgroups',
  timestamps: true,
})
export class Bloodgroup extends Model<Bloodgroup> {

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  option_1: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  option_2: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  option_3: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  option_4: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  option_5: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  option_6: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  option_7: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  option_8: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  option_9: string;
}
