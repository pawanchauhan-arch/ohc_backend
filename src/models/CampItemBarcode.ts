import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { CampListItem } from './CampListItem';

@Table({
  tableName: 'camp_item_barcodes',
  timestamps: true,
})
export class CampItemBarcode extends Model {
  @ForeignKey(() => CampListItem)
  @Column({ type: DataType.INTEGER, allowNull: false })
  camp_list_item_id: number;

  @BelongsTo(() => CampListItem, { foreignKey: 'camp_list_item_id', as: 'item' })
  item: CampListItem;

  @Column({ type: DataType.STRING(120), allowNull: false })
  code: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  image_url: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  comment: string | null;

  @Column({
    type: DataType.ENUM('SST', 'EDTA', 'Sodium Fluoride'),
    allowNull: true,
  })
  test_name: 'SST' | 'EDTA' | 'Sodium Fluoride' | null;

  // JSon field

}


