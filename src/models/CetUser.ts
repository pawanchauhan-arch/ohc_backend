import { Column, Model, Table, BelongsTo } from 'sequelize-typescript';
import { User } from './User';  // Assuming you have a User model
import { CETMANAGEMENT } from './CetManagement';  // Assuming you have a CETMANAGEMENT model

@Table({
  tableName: 'Cetusers',
  timestamps: true,
})
export class Cetuser extends Model {
  @Column
  user_id: number;

  @Column
  cet_id: number;

  // Associations
  @BelongsTo(() => User, { foreignKey: 'user_id', as: 'user' })
  user: User;

  @BelongsTo(() => CETMANAGEMENT, { foreignKey: 'cet_id', as: 'cetManagement' })
  cetManagement: CETMANAGEMENT;
}
