import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'diseases', timestamps: false })
export class Disease extends Model<Disease> {
  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  name: string;

  @Column(DataType.STRING)
  code: string;

  @Column(DataType.STRING)
  category: string;

  @Column(DataType.TEXT)
  description: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  is_active: boolean;
}
