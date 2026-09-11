import { Column, Model, Table, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Corporate } from './corporate';
import { User } from './User';
import { Center } from './Center'; 

@Table({ tableName: 'corporate_users', timestamps: true })
export class CorporateUser extends Model<CorporateUser> {
  
  // RENAMED from cet_id
  @ForeignKey(() => Corporate)
  @Column
  corporate_id: number;

  @ForeignKey(() => User)
  @Column
  user_id: number;

  @ForeignKey(() => Center)
  @Column
  center_id: number;

  @Column({ defaultValue: true, field: 'is_active' })
  isActive: boolean;

  // --- Relationships ---

  @BelongsTo(() => Corporate)
  corporate: Corporate;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => Center)
  center: Center;
}