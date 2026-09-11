import {
  Table,
  Column,
  Model,
  DataType,
} from 'sequelize-typescript';

@Table({
  tableName: 'Packagemanagments',
  timestamps: true,
})
export class Packagemanagment extends Model<Packagemanagment> {

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  package_name: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  package_id: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  package_type: string;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  package_list: Record<string, any>;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  status: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  external_id: string;

   @Column({
    type: DataType.BIGINT,
    allowNull: true,
  })
  tenant_id: number;

  @Column({
    type: DataType.BIGINT,
    allowNull: true,
  })
  center_id: number;

  @Column({
    type: DataType.DECIMAL(10,2),
    allowNull: true,
  })
  package_price: number;

}
