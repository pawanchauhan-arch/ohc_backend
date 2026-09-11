import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, AllowNull, Default } from 'sequelize-typescript';

/**
 * Center group model mapping to `center_groups` table.
 * Stores logical groupings of centers via `center_ids` JSONB array.
 */
@Table({
  tableName: 'center_groups',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class CenterGroup extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @AllowNull(false)
  @Column({ type: DataType.STRING(255), unique: true })
  group_name!: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  group_description?: string;

  @AllowNull(false)
  @Default([])
  @Column(DataType.JSONB)
  center_ids!: Array<string | number>;

  @AllowNull(true)
  @Default(true)
  @Column(DataType.BOOLEAN)
  is_active?: boolean;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  created_by?: number;
}


