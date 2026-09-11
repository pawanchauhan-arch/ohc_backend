import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, BelongsToMany } from 'sequelize-typescript';
import { Center } from './Center';
import { CampListItem } from './CampListItem';
import { CenterUser } from './CenterUser';
import { CETMANAGEMENT } from './CetManagement';

@Table({
  tableName: 'camp_lists',
  timestamps: true,
})
export class CampList extends Model {
  @ForeignKey(() => Center)
  @Column({ type: DataType.INTEGER, allowNull: false })
  center_id: number;

  @BelongsTo(() => Center, { foreignKey: 'center_id', as: 'center' })
  center: Center;

  @ForeignKey(() => CETMANAGEMENT)
  @Column({ type: DataType.INTEGER, allowNull: true })
  cet_id?: number;

  @BelongsTo(() => CETMANAGEMENT, { foreignKey: 'cet_id', as: 'cet' })
  cet: CETMANAGEMENT;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  scheduled_on: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  location_text: string | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  is_completed: boolean;

  @Column({ 
    type: DataType.JSONB, 
    allowNull: false, 
    defaultValue: '[]' 
  })
  assigned_phlebotomist_ids: number[];

  @HasMany(() => CampListItem, { foreignKey: 'camp_id', as: 'items' })
  items: CampListItem[];

  // Virtual association for assigned phlebotomists
  assignedPhlebotomists?: CenterUser[];

  @Column({ type: DataType.TEXT , allowNull: false})
  camp_spoc_name: string;

  @Column({ type: DataType.TEXT , allowNull: false})
  camp_spoc_phone: string;

  @Column({ type: DataType.TEXT , allowNull: false})
  camp_spoc_email: string;

  @Column({type: DataType.TEXT , allowNull: false})
  pincode: string;

  @Column({type: DataType.TEXT , allowNull: true})
  corporate_name: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  invoice_url: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  po_url: string | null;

  @Column({type: DataType.TEXT , allowNull: true})
  remark: string | null;

  @Column({type: DataType.TEXT , allowNull: true})
  camp_ref_id: string;

  @Column({type: DataType.TEXT , allowNull: true})
  camp_unique_id: string;

  @Column({type: DataType.TEXT , allowNull: true})
  statusSamplify: string;
}
