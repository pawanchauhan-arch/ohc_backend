import {
  Column,
  Model,
  Table,
  DataType,
  BelongsTo,
  ForeignKey,
} from 'sequelize-typescript';
import { CETMANAGEMENT } from './CetManagement';

@Table({
  tableName: 'cet_contacts',
  timestamps: true,
  underscored: true,
})
export class CetContact extends Model {
  @ForeignKey(() => CETMANAGEMENT)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  cet_id: number;

  /** manager | supervisor */
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  contact_role: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  contact_name: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  contact_phone: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  contact_email: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  sort_order: number;

  @BelongsTo(() => CETMANAGEMENT, { foreignKey: 'cet_id', as: 'cet' })
  cet: CETMANAGEMENT;
}
