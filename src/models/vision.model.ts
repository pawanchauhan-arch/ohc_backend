import {
  Table,
  Column,
  Model,
  DataType,
} from 'sequelize-typescript';

@Table({
  tableName: 'Visions',
  timestamps: true, // set false if your table doesn't use createdAt / updatedAt
})
export class Vision extends Model<Vision> {
  @Column({ type: DataType.ARRAY(DataType.STRING), allowNull: true })
  left_eye_options: string[];

  @Column({ type: DataType.ARRAY(DataType.STRING), allowNull: true })
  right_eye_options: string[];

  @Column({ type: DataType.STRING, allowNull: true })
  option_1: string;

  @Column({ type: DataType.STRING, allowNull: true })
  option_2: string;

  @Column({ type: DataType.STRING, allowNull: true })
  option_3: string;

  @Column({ type: DataType.STRING, allowNull: true })
  option_4: string;

  @Column({ type: DataType.STRING, allowNull: true })
  option_5: string;

  @Column({ type: DataType.STRING, allowNull: true })
  option_6: string;

  @Column({ type: DataType.STRING, allowNull: true })
  option_7: string;
}
