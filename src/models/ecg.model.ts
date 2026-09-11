import {
  Table,
  Column,
  Model,
  DataType,
} from 'sequelize-typescript';

@Table({
  tableName: 'ECGs',
  timestamps: true, // set false if your table doesn't use createdAt / updatedAt
})
export class ECG extends Model<ECG> {

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
  doc: string;
}
