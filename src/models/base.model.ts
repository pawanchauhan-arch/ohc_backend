// base.model.ts
import {
  Model,
  BeforeFind,
  BeforeCount,
  BeforeCreate,
  BeforeUpdate,
} from 'sequelize-typescript';
import {
  applyTenantScope,
  applyAuditFields,
} from '../common/tenant/tenant-sequelize.hook';

export abstract class BaseModel<
  TModelAttributes = any,
  TCreationAttributes = TModelAttributes
> extends Model<TModelAttributes, TCreationAttributes> {

  @BeforeFind
  static applyTenantFilter(options: any) {
    applyTenantScope(options);
  }

  @BeforeCount
  static applyTenantCountFilter(options: any) {
    applyTenantScope(options);
  }

  @BeforeCreate
  static setCreateAudit(instance: any) {
    applyAuditFields(instance, true);
  }

  @BeforeUpdate
  static setUpdateAudit(instance: any) {
    applyAuditFields(instance, false);
  }
}