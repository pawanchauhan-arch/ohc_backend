import { Column, Model, Table, DataType } from 'sequelize-typescript';

export enum NotificationPriority {
  TYPE1 = 'TYPE1',
  TYPE2 = 'TYPE2',
}

@Table({
  tableName: 'notifications',
  timestamps: true,
})
export class Notification extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  phone_number: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  title: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  message: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  image_url: string;

  @Column({
    type: DataType.ENUM(...Object.values(NotificationPriority)),
    allowNull: false,
  })
  priority: NotificationPriority;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  is_read: boolean;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  createdAt: Date;
} 