import {
  Table,
  Column,
  Model,
  DataType,
  BelongsTo,
  ForeignKey,
} from 'sequelize-typescript';
import { PicasoItemTypeModel } from './MedicineItemTypes';
import { Sequelize } from 'sequelize-typescript';
@Table({
  tableName: 'picaso_itemdetails',
  timestamps: false,
  underscored: true,
})
export class PicasoItemDetailModel extends Model {
  @Column({
    field: 'id',
    type: DataType.BIGINT,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  })
  id!: number;

  @Column({
    field: 'itemid',
    type: DataType.BIGINT,
    allowNull: true,
  })
  itemid!: number | null;

  @Column({
    field: 'code',
    type: DataType.STRING(50),
    allowNull: true,
  })
  code!: string | null;

  @Column({
    field: 'descriptions',
    type: DataType.STRING(50),
    allowNull: true,
  })
  descriptions!: string | null;

  @Column({
    field: 'subgroupid',
    type: DataType.INTEGER,
    allowNull: true,
  })
  subgroupid!: number | null;

  @Column({
    field: 'storetype',
    type: DataType.INTEGER,
    allowNull: true,
  })
  storetype!: number | null;

  @Column({
    field: 'userloginid',
    type: DataType.BIGINT,
    allowNull: true,
  })
  userloginid!: number | null;

  @Column({
    field: 'addedby',
    type: DataType.BIGINT,
    allowNull: true,
  })
  addedby!: number | null;

  @Column({
    field: 'addeddate',
    type: DataType.DATE,
    allowNull: true,
    
  })
  addeddate!: Date | null;

  @Column({
    field: 'modifiedby',
    type: DataType.STRING(50),
    allowNull: true,
  })
  modifiedby!: string | null;

  @Column({
    field: 'modifieddate',
    type: DataType.DATE,
    allowNull: true,    
  })
  modifieddate!: Date | null;

  @Column({
    field: 'companyid',
    type: DataType.INTEGER,
    allowNull: true,
  })
  companyid!: number | null;

  @Column({
    field: 'isactive',
    type: DataType.BOOLEAN,
    allowNull: true,
  })
  isactive!: boolean | null;

  @ForeignKey(() => PicasoItemTypeModel)
  @Column({
    field: 'itemtypeid',
    type: DataType.INTEGER,
    allowNull: true,
  })
  itemtypeid!: number | null;

  // 🔗 BELONGS TO ItemType.ID (uppercase)
  @BelongsTo(() => PicasoItemTypeModel, {
    foreignKey: 'itemtypeid',
    targetKey: 'ID',
  })
  itemType?: PicasoItemTypeModel;

  @Column({
    type: DataType.INTEGER,
  })
  center_id!: number;

  @Column({
    type: DataType.INTEGER,
  })
  tenant_id!: number;
}
