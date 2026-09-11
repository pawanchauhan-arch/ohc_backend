import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { PicasoItemDetailModel } from './MedicineItemDetails';
import { Sequelize } from 'sequelize-typescript';
@Table({
  tableName: 'picaso_itemtypes',
  timestamps: false,
  underscored: true,
})
export class PicasoItemTypeModel extends Model {
  @Column({
    field: 'ID',
    type: DataType.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  })
  ID!: number;

  @Column({
    field: 'Code',
    type: DataType.STRING(50),
    allowNull: true,
  })
  Code!: string | null;

  @Column({
    field: 'Descriptions',
    type: DataType.STRING(100),
    allowNull: true,
  })
  Descriptions!: string | null;

  @Column({
    field: 'UserLoginId',
    type: DataType.BIGINT,
    allowNull: true,
  })
  UserLoginId!: number | null;

  @Column({
    field: 'AddedBy',
    type: DataType.BIGINT,
    allowNull: true,
  })
  AddedBy!: number | null;

  @Column({
    field: 'AddedDate',
    type: DataType.DATE,
    allowNull: true,
  })
  AddedDate!: Date | null;

  @Column({
    field: 'ModifiedDate',
    type: DataType.DATE,
    allowNull: true,
    
    
  })
  ModifiedDate!: Date | null;

  @Column({
    field: 'ModifiedBy',
    type: DataType.STRING(50),
    allowNull: true,
  })
  ModifiedBy!: string | null;

  @Column({
    field: 'IsActive',
    type: DataType.BOOLEAN,
    allowNull: true,
    defaultValue: Sequelize.literal("timezone('Asia/Kolkata', now())"),
    
  })
  IsActive!: boolean | null;
  @HasMany(() => PicasoItemDetailModel, {
    foreignKey: 'itemtypeid',
    sourceKey: 'ID',
  })
  itemDetails?: PicasoItemDetailModel[];

  @Column({
    field: 'client_id',
    type: DataType.BIGINT,
    allowNull: true,
  })
  client_id!: number | null;
  

  @Column({
    field: 'tenant_id',
    type: DataType.BIGINT,
    allowNull: true,
  })
  tenant_id!: number | null;
}
