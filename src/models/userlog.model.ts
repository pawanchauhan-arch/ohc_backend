import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  AllowNull,
} from 'sequelize-typescript';
import { User } from './User';

@Table({
  tableName: 'userlogs',
  timestamps: true, // set true only if createdAt/updatedAt exist
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
})
export class UserLog extends Model<UserLog> {

  @ForeignKey(() => User)
  @AllowNull(true)
  @Column({
    type: DataType.INTEGER,
  })
  user_id: number;

  @AllowNull(true)
  @Column({
    type: DataType.STRING,
  })
  user_ip: string;

  @AllowNull(true)
  @Column({
    type: DataType.STRING,
  })
  action_type: string;

  @AllowNull(true)
  @Column({
    type: DataType.JSON,
  })
  action_description: Record<string, any>;

  @AllowNull(true)
  @Column({
    type: DataType.DATE,
  })
  action_time: Date;

  /** Associations */

  @BelongsTo(() => User, {
    foreignKey: 'user_id',
    as: 'User',
  })
  User: User;
}
