import { Column, Model, Table, HasOne, HasMany, BelongsTo, BelongsToMany, DataType } from 'sequelize-typescript';
import { Doctor } from './Doctor';  // Assuming you have a Doctor model
import { CenterUser } from './CenterUser';  // Assuming you have a Centeruser model
import { Center } from './Center';  // Assuming you have a Center model
import { Role } from './Role';  // Assuming you have a Role model
import { Permission } from './Permissions';  // Assuming you have a Permission model
import { Cetuser } from './CetUser';  // Assuming you have a Cetuser model
import { CETMANAGEMENT } from './CetManagement';  // Assuming you have a CETMANAGEMENT model
import { integer } from 'aws-sdk/clients/cloudfront';

@Table({
  tableName: 'Users',
  timestamps: true,
})
export class User extends Model {
  @Column
  username: string;

  @Column
  name: string;

  @Column
  role_id: bigint;

  @Column
  permission_id: bigint;

  @Column
  email: string;

  @Column
  password: string;

  @Column
  phone: string;

  @Column
  isAdmin: boolean;

  @Column
  status: boolean;

  @Column
  external_id: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: {},
  })
  attributes: Record<string, any>;


  // Associations
  @HasOne(() => Doctor, { foreignKey: 'user_id', as: 'doctor' })
  doctor: Doctor;

  @HasMany(() => CenterUser, { foreignKey: 'user_id', as: 'centerusers' })
  centerusers: CenterUser[];

  @BelongsToMany(() => Center, {
    through: () => CenterUser,
    foreignKey: 'user_id',
    otherKey: 'center_id',
    as: 'centers'
  })
  centers: Center[];

  @BelongsTo(() => Role, { foreignKey: 'role_id', as: 'role' })
  role: Role;

  @BelongsTo(() => Permission, { foreignKey: 'permission_id', as: 'permission' })
  permission: Permission;

  @HasMany(() => Cetuser, { foreignKey: 'user_id', as: 'Cetusers' })
  Cetusers: Cetuser[];

  @BelongsToMany(() => CETMANAGEMENT, {
    through: () => Cetuser,
    foreignKey: 'user_id',
    otherKey: 'cet_id',
    as: 'CETManagements'
  })
  CETManagements: CETMANAGEMENT[];
}
