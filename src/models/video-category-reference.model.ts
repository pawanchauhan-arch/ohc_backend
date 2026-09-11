import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AllowNull,
} from 'sequelize-typescript';

@Table({
  tableName: 'video_category_references',
  timestamps: true,
})
export class VideoCategoryReference extends Model<VideoCategoryReference> {

  @PrimaryKey
  @AllowNull(false)
  @Column({
    type: DataType.STRING,
  })
  test_category!: string;

  @AllowNull(false)
  @Column({
    type: DataType.JSONB,
    defaultValue: {},
  })
  video_links!: Record<string, any>;
}
