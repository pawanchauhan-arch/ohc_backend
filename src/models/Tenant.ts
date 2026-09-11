import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  HasMany,
} from 'sequelize-typescript';

@Table({
  tableName: 'tenants',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Tenant extends Model<Tenant> {
  @PrimaryKey
  @Column({ autoIncrement: true, type: DataType.INTEGER })
  declare id: number;
  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  declare name: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  declare status: boolean;

  @Column({ type: DataType.STRING, allowNull: true })
  declare tenant_type: string;
}
