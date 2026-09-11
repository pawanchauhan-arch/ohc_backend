import {
  Table,
  Column,
  Model,
  DataType,
} from 'sequelize-typescript';

@Table({
  tableName: 'picasoid_hsndetails',
  timestamps: false,
  underscored: true,
})
export class PicasoHSNDetailsModel extends Model<PicasoHSNDetailsModel> {

  @Column({
    field: 'HSNID',
    type: DataType.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  })
  hsnid!: number;

  @Column({
    field: 'HSNCode',
    type: DataType.STRING(50),
    allowNull: true,
  })
  hsncode!: string | null;

  @Column({
    field: 'SGST',
    type: DataType.STRING(30),
    allowNull: true,
  })
  sgst!: string | null;

  @Column({
    field: 'CGST',
    type: DataType.STRING(30),
    allowNull: true,
  })
  cgst!: string | null;

  @Column({
    field: 'IGST',
    type: DataType.STRING(30),
    allowNull: true,
  })
  igst!: string | null;

  @Column({
    field: 'AddedBy',
    type: DataType.BIGINT,
    allowNull: true,
  })
  added_by!: number | null;

  @Column({
    field: 'AddedDate',
    type: DataType.DATE,
    allowNull: true,
    defaultValue: DataType.NOW,
  })
  added_date!: Date | null;

  @Column({
    field: 'Modifiedby',
    type: DataType.BIGINT,
    allowNull: true,
  })
  modifiedby!: number | null;

  @Column({
    field: 'ModifiedDate',
    type: DataType.DATE,
    allowNull: true,
  })
  modifieddate!: Date | null;

  @Column({
    field: 'IsActive',
    type: DataType.BOOLEAN,
    allowNull: true,
  })
  isactive!: boolean | null;
}
