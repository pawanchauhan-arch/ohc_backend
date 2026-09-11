import { WhereOptions } from 'sequelize';
import { driverhealthcheckup } from '../models/DriverHealthCheckup';

type DriverHealthCheckupUpdateFields = Partial<driverhealthcheckup>;

/**
 * Persists admin edits on driverhealthcheckups without bumping updatedAt.
 * Any new admin endpoint that mutates this table must use these helpers.
 * report_confirmed_at is never overwritten once frozen.
 */
export async function saveDriverHealthCheckupAsAdmin(
  instance: driverhealthcheckup,
  changes?: DriverHealthCheckupUpdateFields,
): Promise<driverhealthcheckup> {
  if (changes) {
    const safeChanges = { ...changes };
    if (instance.report_confirmed_at) {
      delete safeChanges.report_confirmed_at;
    }
    Object.assign(instance, safeChanges);
  }
  instance.updated_by_admin_at = new Date();
  await instance.save({ silent: true });
  return instance;
}

/**
 * Bulk admin update that sets updated_by_admin_at and preserves updatedAt.
 * report_confirmed_at is never overwritten once frozen.
 */
export async function updateDriverHealthCheckupAsAdmin(
  where: WhereOptions<driverhealthcheckup>,
  fields: DriverHealthCheckupUpdateFields,
): Promise<[affectedCount: number]> {
  const payload: DriverHealthCheckupUpdateFields = {
    ...fields,
    updated_by_admin_at: new Date(),
  };

  if (Object.prototype.hasOwnProperty.call(payload, 'report_confirmed_at')) {
    const existing = await driverhealthcheckup.findOne({
      where,
      attributes: ['id', 'report_confirmed_at'],
    });
    if (existing?.report_confirmed_at) {
      delete payload.report_confirmed_at;
    }
  }

  const result = await driverhealthcheckup.update(payload, {
    where,
    silent: true,
  });
  return [result[0]];
}
