import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';

@Table({
  tableName: 'designation',
  timestamps: false,
})
export class Designation extends Model<Designation> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  id: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description?: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  code?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  center_id?: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
    defaultValue: true,
  })
  is_active: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  modified_by?: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: DataType.NOW,
  })
  modified_date: Date;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  department_id?: number;
}
