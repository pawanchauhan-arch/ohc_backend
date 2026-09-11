// tenant-sequelize.hook.ts
import { getTenant } from './tenant-context';

export function applyTenantScope(options: any) {
  const user = getTenant();

  if (!user) return;

  if (options?.skipTenant) return;

 
  if (!options.where) {
    options.where = {};
  }

  
  if (user.role !== 'LMC_ADMIN') {
    options.where.created_by = user.id;
  }

  
  options.where.is_deleted = false;
}
// 🔥 NEW: Audit fields auto injection
export function applyAuditFields(instance: any, isNew: boolean) {
  const user = getTenant();

  if (!user) return;

  if (isNew) {
    instance.created_by = user.id;
  }

  instance.updated_by = user.id;
}