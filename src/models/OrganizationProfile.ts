import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';

import { Tenant } from './Tenant';
import { Center } from './Center';

@Table({
  tableName: 'organization_profiles',
  timestamps: true,
  underscored: true,
})
export class OrganizationProfile extends Model<OrganizationProfile> {
  @Column({
    type: DataType.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  tenant_id: number;

  @ForeignKey(() => Center)
  @Column({
    type: DataType.BIGINT,
    allowNull: true,
  })
  center_id: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  display_name: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  address: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  mobile: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  email: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
  })
  logo: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
  })
  secondary_logo: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  watermark_text: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  gst_number: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  licance_no: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  website: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  theme_color: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  report_header: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  report_footer: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  invoice_prefix: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  is_active: boolean;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @BelongsTo(() => Center)
  center: Center;
}