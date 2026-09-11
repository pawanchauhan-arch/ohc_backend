import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Packagemanagment } from './packagemanagment.model';
import { Center } from './Center';

@Table({
  tableName: 'Centerpackages',
  timestamps: true, // set false if table doesn't have createdAt/updatedAt
})
export class Centerpackage extends Model<Centerpackage> {

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  external_id: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  package_price: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  package_frequency: string;

  /* =======================
     Foreign Keys
     ======================= */

  @ForeignKey(() => Packagemanagment)
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  package_id: number;

  @ForeignKey(() => Center)
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  center_id: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  status: boolean;

  /* =======================
     Associations
     ======================= */

  @BelongsTo(() => Packagemanagment, {
    foreignKey: 'package_id',
    as: 'package',
  })
  package: Packagemanagment;

  @BelongsTo(() => Center, {
    foreignKey: 'center_id',
    as: 'center',
  })
  center: Center;
}
