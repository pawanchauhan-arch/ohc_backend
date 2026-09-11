import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, BelongsToMany } from 'sequelize-typescript';
import { Center } from './Center';
import { OrganizationCenter } from './Organization_center';
import { int } from 'aws-sdk/clients/datapipeline';

@Table({
  tableName: 'organization',
  timestamps: false,
})
export class Organization extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  organization_id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  organization_name: string;

  @BelongsToMany(() => Center, () => OrganizationCenter)
  centerIds: Center[];

  @Column({
    type: DataType.STRING,
    allowNull: false,
    })
    email: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  contact_number: string;
}
