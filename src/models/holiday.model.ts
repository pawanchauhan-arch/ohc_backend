import { 
  Column, 
  Model, 
  Table, 
  DataType, 
  PrimaryKey 
} from 'sequelize-typescript';

@Table({
  tableName: 'holidays',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Holiday extends Model {

  @PrimaryKey
  @Column({
    type: DataType.BIGINT,
    autoIncrement: true,
    allowNull: false,
  })
  id: number;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
    unique: true,
  })
  holiday_date: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.ENUM('NATIONAL', 'COMPANY', 'OPTIONAL'),
    allowNull: false,
    defaultValue: 'NATIONAL',
  })
  type: 'NATIONAL' | 'COMPANY' | 'OPTIONAL';

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description: string;
}