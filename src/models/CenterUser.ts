import { Column, Model, Table, BelongsTo, ForeignKey, DataType } from 'sequelize-typescript';
import { User } from './User';
import { Center } from './Center';

@Table({
  tableName: 'Centerusers',  // Define the table name
  timestamps: true,          // Enable timestamps if needed
})
export class CenterUser extends Model {

  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column
  signature: string;

  @ForeignKey(() => Center)
  @Column
  center_id: bigint;

  // Foreign key for User
  @ForeignKey(() => User)
  @Column
  user_id: number;

  @Column({
    type: DataType.ENUM('PHLEBO', 'STAFF', 'ADMIN'),
    allowNull: true,
  })
  user_type: string | null;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  short_code: string | null;

  // Associations
  @BelongsTo(() => User, { foreignKey: 'user_id', as: 'user' })
  user: User;

  @BelongsTo(() => Center, { foreignKey: 'center_id', as: 'center' })
  center: Center;


  @Column({allowNull: true})
  isregistered: boolean;

  @Column({allowNull: true, type: DataType.STRING})
  dob: string;

  @Column({allowNull: true})
  id_proof: string;

  @Column({allowNull: true})
  phlebo_image: string;
}
