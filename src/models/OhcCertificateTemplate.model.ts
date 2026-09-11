import { BaseModel } from './base.model';

import { Table, Column, DataType, Model } from 'sequelize-typescript';

@Table({
  tableName: 'certificate_templates',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class CertificateTemplate extends BaseModel<CertificateTemplate> {
  @Column(DataType.INTEGER)
  tenant_id: number;

  @Column(DataType.STRING)
  name: string;

  @Column(DataType.TEXT)
  template_html: string;

  @Column(DataType.INTEGER)
  created_by: number;

  @Column(DataType.INTEGER)
  updated_by: number;

  @Column(DataType.BOOLEAN)
  is_deleted: boolean;
}
