import { Table, Column, Model, DataType, ForeignKey } from 'sequelize-typescript';
import { Organization } from './Organization';
import { Center } from './Center';

@Table({
  tableName: 'organization_centers',
  timestamps: false,
})
export class OrganizationCenter extends Model {
  @ForeignKey(() => Organization)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  organization_id: number;

  @ForeignKey(() => Center)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  center_id: number;
}
