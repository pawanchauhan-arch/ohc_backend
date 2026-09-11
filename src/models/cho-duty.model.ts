import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'cho_duty',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at', 
})
export class ChoDuty extends Model<ChoDuty> {
  @Column({ type: DataType.INTEGER, allowNull: false })
  cho_id: number;

  @Column({ type: DataType.DATE, allowNull: false })
  start_time: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  end_time: Date;

  @Column({ type: DataType.INTEGER, allowNull: true })
  center_id: number;
}
