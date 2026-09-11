import { CetContact } from 'src/models/CetContact';
import { CETMANAGEMENT } from 'src/models/CetManagement';
import { FindOptions, Op, WhereOptions } from 'sequelize';

export type CetContactPayload = {
  name?: string | null;
  contactNumber?: string | null;
  email?: string | null;
};

export type ShapedCetContacts = {
  manager: CetContactPayload | null;
  supervisors: CetContactPayload[];
};

const hasAnyValue = (c?: CetContactPayload | null) =>
  !!(c && (c.name?.trim() || c.contactNumber?.trim() || c.email?.trim()));

const toRow = (
  cetId: number,
  contact_role: 'manager' | 'supervisor',
  contact: CetContactPayload,
  sort_order: number,
) => ({
  cet_id: cetId,
  contact_role,
  contact_name: contact.name?.trim() || null,
  contact_phone: contact.contactNumber?.trim() || null,
  contact_email: contact.email?.trim() || null,
  sort_order,
});

export const emptyShapedContacts = (): ShapedCetContacts => ({
  manager: null,
  supervisors: [],
});

/** Replace all manager/supervisor contacts for a CET (max 1 manager, max 10 supervisors). */
export async function replaceCetContacts(
  cetId: number,
  manager?: CetContactPayload | null,
  supervisors?: CetContactPayload[] | null,
): Promise<void> {
  const supervisorList = Array.isArray(supervisors) ? supervisors : [];
  if (supervisorList.length > 10) {
    throw new Error('Maximum 10 supervisors are allowed');
  }

  const rows: ReturnType<typeof toRow>[] = [];

  if (hasAnyValue(manager)) {
    rows.push(toRow(cetId, 'manager', manager as CetContactPayload, 0));
  }

  supervisorList.forEach((s, index) => {
    if (!hasAnyValue(s)) return;
    rows.push(toRow(cetId, 'supervisor', s, index + 1));
  });

  await CetContact.destroy({ where: { cet_id: cetId } });
  if (rows.length) {
    await CetContact.bulkCreate(rows);
  }
}

/**
 * Sync contacts only when payload includes manager/supervisors.
 * Does not fail the CET flow if cet_contacts table is missing.
 * Re-throws only business validation (max 10 supervisors).
 */
export async function safeSyncCetContacts(
  cetId: number,
  body: Record<string, any>,
): Promise<void> {
  if (!('manager' in body) && !('supervisors' in body)) {
    return;
  }

  try {
    await replaceCetContacts(cetId, body.manager, body.supervisors);
  } catch (error: any) {
    if (error?.message?.includes('Maximum 10 supervisors')) {
      throw error;
    }
    console.error(
      '[cet_contacts] sync skipped (CET save continues):',
      error?.message || error,
    );
  }
}

export function shapeContacts(
  contacts: Array<Partial<CetContact>> | null | undefined,
): ShapedCetContacts {
  const list = Array.isArray(contacts) ? contacts : [];
  const managerRow = list.find((c) => c.contact_role === 'manager');
  const supervisors = list
    .filter((c) => c.contact_role === 'supervisor')
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map((c) => ({
      name: c.contact_name || '',
      contactNumber: c.contact_phone || '',
      email: c.contact_email || '',
    }));

  return {
    manager: managerRow
      ? {
          name: managerRow.contact_name || '',
          contactNumber: managerRow.contact_phone || '',
          email: managerRow.contact_email || '',
        }
      : null,
    supervisors,
  };
}

/** Attach shaped manager/supervisors and remove raw contacts from a CET plain object. */
export function attachShapedContacts<T extends Record<string, any>>(
  plain: T,
): T & ShapedCetContacts {
  if (!plain) {
    return { ...(plain as any), ...emptyShapedContacts() };
  }
  const shaped = shapeContacts(plain.contacts);
  const { contacts: _omit, ...rest } = plain;
  return {
    ...rest,
    manager: shaped.manager,
    supervisors: shaped.supervisors,
  } as T & ShapedCetContacts;
}

export const cetContactInclude = {
  model: CetContact,
  as: 'contacts',
  required: false,
};

/**
 * Batch-load cet_contacts and merge manager/supervisors onto CET plain objects.
 * Safer than nested Sequelize includes for health-checkup list responses.
 */
export async function mergeContactsIntoCetObjects<
  T extends Record<string, any> | null | undefined,
>(cets: T[]): Promise<Array<T | (NonNullable<T> & ShapedCetContacts)>> {
  const ids = [
    ...new Set(
      cets
        .filter((c) => c && c.id != null)
        .map((c) => Number((c as any).id))
        .filter((id) => !Number.isNaN(id)),
    ),
  ];

  const byCetId: Record<number, Array<Partial<CetContact>>> = {};

  if (ids.length) {
    try {
      const rows = await CetContact.findAll({
        where: { cet_id: { [Op.in]: ids } },
      });
      for (const row of rows) {
        const plain = row.get({ plain: true }) as Partial<CetContact> & {
          cet_id: number;
        };
        if (!byCetId[plain.cet_id]) byCetId[plain.cet_id] = [];
        byCetId[plain.cet_id].push(plain);
      }
    } catch (error: any) {
      console.error(
        '[cet_contacts] batch load failed:',
        error?.message || error,
      );
    }
  }

  return cets.map((cet) => {
    if (!cet) return cet;
    return attachShapedContacts({
      ...cet,
      contacts: byCetId[Number(cet.id)] || [],
    }) as NonNullable<T> & ShapedCetContacts;
  });
}

/** List CETs with contacts; falls back without join if cet_contacts is unavailable. */
export async function findAllCetsWithContacts(
  options: FindOptions = {},
): Promise<Array<Record<string, any> & ShapedCetContacts>> {
  try {
    const rows = await CETMANAGEMENT.findAll({
      ...options,
      include: [...((options.include as any[]) || []), cetContactInclude],
    });
    return rows.map((row) =>
      attachShapedContacts(row.get({ plain: true })),
    );
  } catch (error: any) {
    console.error(
      '[cet_contacts] list include failed, falling back:',
      error?.message || error,
    );
    const rows = await CETMANAGEMENT.findAll(options);
    return rows.map((row) => ({
      ...row.get({ plain: true }),
      ...emptyShapedContacts(),
    }));
  }
}

/** Single CET with contacts; falls back without join if cet_contacts is unavailable. */
export async function findOneCetWithContacts(
  where: WhereOptions,
): Promise<(Record<string, any> & ShapedCetContacts) | null> {
  try {
    const row = await CETMANAGEMENT.findOne({
      where,
      include: [cetContactInclude],
    });
    if (!row) return null;
    return attachShapedContacts(row.get({ plain: true }));
  } catch (error: any) {
    console.error(
      '[cet_contacts] details include failed, falling back:',
      error?.message || error,
    );
    const row = await CETMANAGEMENT.findOne({ where });
    if (!row) return null;
    return {
      ...row.get({ plain: true }),
      ...emptyShapedContacts(),
    };
  }
}
