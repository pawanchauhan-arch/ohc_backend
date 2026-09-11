import { createNamespace } from 'cls-hooked';

export const tenantNamespace = createNamespace('tenant-namespace');

export const setTenant = (user: any) => {
  tenantNamespace.set('user', user);
};

export const getTenant = () => {
  return tenantNamespace.get('user');
};