import { Column, Model, Table, PrimaryKey, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './User';

@Table({
  tableName: 'Doctors',
  timestamps: true,
})
export class Doctor extends Model {
  @PrimaryKey
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    allowNull: false,
  })
  id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  user_id: number;

  @BelongsTo(() => User)
  user: User;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  external_id: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  registration_number: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  qualification: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  signature: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  contact_number: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  file_name: string;
}
