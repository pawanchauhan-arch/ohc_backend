import {
  Column,
  Model,
  Table,
  DataType,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';

import { User } from './User';
import { Holiday } from './holiday.model';

/**
 * Attendance Model
 * Represents employee daily attendance
 */
@Table({
  tableName: 'b2cattendance',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Attendance extends Model {
  @PrimaryKey
  @Column({
    type: DataType.BIGINT,
    autoIncrement: true,
    allowNull: false,
  })
  id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  user_id: number;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  attendance_date: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  check_in: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  check_out: Date;

  @Column({
    type: DataType.ENUM('PRESENT', 'ABSENT', 'HALF_DAY'),
    allowNull: false,
  })
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY';

  @Column({
    type: DataType.ENUM('WEB', 'MOBILE', 'BIOMETRIC'),
    allowNull: true,
  })
  source: 'WEB' | 'MOBILE' | 'BIOMETRIC';

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  location: string;

  // Optional: store total working hours (in minutes)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  working_minutes: number;

  // 🔗 Relations
  @BelongsTo(() => User, { foreignKey: 'user_id', as: 'user' })
  user: User;

  // Optional: link to holiday (if needed)
  @ForeignKey(() => Holiday)
  @Column({
    type: DataType.BIGINT,
    allowNull: true,
  })
  holiday_id: number;

  @BelongsTo(() => Holiday, { foreignKey: 'holiday_id', as: 'holiday' })
  holiday: Holiday;
@Column({
  type: DataType.INTEGER,
  allowNull: true,
})
center_id: number;

@Column({
  type: DataType.INTEGER,
  allowNull: true,
})
tenant_id: number;
  
  @Column(DataType.INTEGER)
  added_by: number;
}
