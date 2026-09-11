import { BadRequestException } from '@nestjs/common';
import {
  getOperationalDateRangeWindow,
} from './operational-day.util';

export interface HealthCheckupListPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface HealthCheckupListResult<T> {
  records: T[];
  pagination: HealthCheckupListPagination;
}

export interface HealthCheckupListQueryParams {
  center_id?: string | number | null;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  uniqueId?: string;
  name?: string;
  external_id?: string;
  date_time?: string;
  confirm_report?: string;
  list_mode?: 'checkups' | 'pending_concerns';
  concern_type?: string;
  concern_level?: string;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export function parseHealthCheckupListParams(
  body: HealthCheckupListQueryParams,
): {
  page: number;
  limit: number;
  offset: number;
  listMode: 'checkups' | 'pending_concerns';
  filters: HealthCheckupListQueryParams;
} {
  const page = Math.max(Number(body?.page) || DEFAULT_PAGE, 1);
  const limit = Math.min(
    Math.max(Number(body?.limit) || DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  );
  const offset = (page - 1) * limit;
  const listMode =
    body?.list_mode === 'pending_concerns' ? 'pending_concerns' : 'checkups';

  return {
    page,
    limit,
    offset,
    listMode,
    filters: body ?? {},
  };
}

export function validateHealthCheckupDateRange(
  startDate?: string,
  endDate?: string,
): void {
  if (startDate && endDate && endDate < startDate) {
    throw new BadRequestException('End date should be after start date');
  }
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number,
): HealthCheckupListPagination {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export interface HealthCheckupSqlFilterContext {
  whereClauses: string[];
  replacements: Record<string, unknown>;
}

/**
 * Builds shared WHERE clauses for health checkup list queries.
 */
export function buildHealthCheckupListFilters(
  body: HealthCheckupListQueryParams,
  centerIds: number[],
): HealthCheckupSqlFilterContext {
  validateHealthCheckupDateRange(body.startDate, body.endDate);

  const whereClauses: string[] = [];
  const replacements: Record<string, unknown> = {
    center_ids: centerIds,
  };

  if (centerIds.length) {
    whereClauses.push(`dhc."createdBy" IN (:center_ids)`);
  }

  if (body.startDate && body.endDate) {
    const window = getOperationalDateRangeWindow(body.startDate, body.endDate);
    whereClauses.push(`dhc."createdAt" BETWEEN :windowStart AND :windowEnd`);
    replacements.windowStart = window.startUtc;
    replacements.windowEnd = window.endUtc;
  }

  const uniqueId = body.uniqueId?.trim();
  if (uniqueId) {
    whereClauses.push(`dhc."uniqueId" ILIKE :uniqueId`);
    replacements.uniqueId = `%${uniqueId}%`;
  }

  const name = body.name?.trim();
  if (name) {
    whereClauses.push(`d.name ILIKE :driverName`);
    replacements.driverName = `%${name}%`;
  }

  const externalId = body.external_id?.trim();
  if (externalId) {
    whereClauses.push(`d.external_id ILIKE :externalId`);
    replacements.externalId = `%${externalId}%`;
  }

  const dateTime = body.date_time?.trim();
  if (dateTime) {
    whereClauses.push(`CAST(dhc.date_time AS TEXT) ILIKE :dateTimeFilter`);
    replacements.dateTimeFilter = `%${dateTime}%`;
  }

  const confirmReport = body.confirm_report?.trim();
  if (confirmReport) {
    whereClauses.push(`LOWER(TRIM(dhc.confirm_report)) = :confirmReport`);
    replacements.confirmReport = confirmReport.toLowerCase();
  }

  const concernTypes = (body.concern_type ?? '')
    .split(',')
    .map((type) => type.trim().toUpperCase().replace(/-/g, '_'))
    .filter(Boolean);
  if (concernTypes.length === 1) {
    whereClauses.push(
      `UPPER(REPLACE(concern_elem->>'type', '-', '_')) = :concernType`,
    );
    replacements.concernType = concernTypes[0];
  } else if (concernTypes.length > 1) {
    whereClauses.push(
      `UPPER(REPLACE(concern_elem->>'type', '-', '_')) IN (:concernTypes)`,
    );
    replacements.concernTypes = concernTypes;
  }

  const concernLevel = body.concern_level?.trim();
  if (concernLevel) {
    whereClauses.push(`UPPER(concern_elem->>'level') = :concernLevel`);
    replacements.concernLevel = concernLevel.toUpperCase();
  }

  return { whereClauses, replacements };
}

export const HEALTH_CHECKUP_LIST_JOINS = `
  FROM "driverhealthcheckups" dhc
  LEFT JOIN "DRIVERMASTERs" d ON d.id = dhc.driver_id
  LEFT JOIN "CETMANAGEMENTs" c ON c.id = dhc.transpoter
  LEFT JOIN "Centers" center ON center.id = dhc."createdBy"
`;

export const HEALTH_CHECKUP_DRIVER_JSON = `
  json_build_object(
    'id', d.id,
    'driver_cetid', d.driver_cetid,
    'driver_cetname', d.driver_cetname,
    'external_id', d.external_id,
    'createdBy', d."createdBy",
    'name', d.name,
    'healthCardNumber', d."healthCardNumber",
    'driverId', d."driverId",
    'abhaNumber', d."abhaNumber",
    'dateOfBirthOrAge', d."dateOfBirthOrAge",
    'gender', d.gender,
    'photographOfDriver', d."photographOfDriver",
    'localAddress', d."localAddress",
    'localAddressDistrict', d."localAddressDistrict",
    'localAddressState', d."localAddressState",
    'contactNumber', d."contactNumber",
    'emergencyContactName', d."emergencyContactName",
    'emergencyContactNumber', d."emergencyContactNumber",
    'idProof_name', d."idProof_name",
    'idProof', d."idProof",
    'idProof_number', d."idProof_number",
    'idProof_doc', d."idProof_doc",
    'blood_group', d."blood_group",
    'employee_id', d."employee_id",
    'createdAt', d."createdAt",
    'updatedAt', d."updatedAt"
  ) AS "driver"
`;

export const HEALTH_CHECKUP_CET_JSON = `
  json_build_object(
    'id', c.id,
    'external_id', c.external_id,
    'cet_type', c.cet_type,
    'center_id', c.center_id,
    'name', c.name,
    'uniqueId', c."uniqueId",
    'registeredAddress', c."registeredAddress",
    'correspondenceAddress', c."correspondenceAddress",
    'contactNumber', c."contactNumber",
    'spocName', c."spocName",
    'spocWhatsappNumber', c."spocWhatsappNumber",
    'spocEmail', c."spocEmail",
    'alternateSpocName', c."alternateSpocName",
    'alternateSpocContactNumber', c."alternateSpocContactNumber",
    'alternateSpocEmail', c."alternateSpocEmail",
    'pan', c."pan",
    'short_code', c."short_code",
    'attachPanCopy', c."attachPanCopy",
    'gstin', c."gstin",
    'attachGstin', c."attachGstin",
    'accountNumber', c."accountNumber",
    'ifscCode', c."ifscCode",
    'bankName', c."bankName",
    'status', c."status",
    'attachCancelledChequeOrPassbook', c."attachCancelledChequeOrPassbook",
    'attachCertificateOfIncorporation', c."attachCertificateOfIncorporation",
    'createdAt', c."createdAt",
    'updatedAt', c."updatedAt"
  ) AS "CETMANAGEMENT"
`;

export const HEALTH_CHECKUP_CENTER_JSON = `
  CASE WHEN center.id IS NULL THEN NULL ELSE json_build_object(
    'id', center.id,
    'external_id', center.external_id,
    'name', center.project_name,
    'project_name', center.project_name,
    'agency_name', center.agency_name,
    'short_code', center.short_code,
    'district', center.project_district,
    'state', center.project_state,
    'createdAt', center."createdAt",
    'updatedAt', center."updatedAt"
  ) END AS "center"
`;

export const PENDING_CONCERN_LATERAL_JOIN = `
  CROSS JOIN LATERAL (
    SELECT elem AS concern_elem
    FROM jsonb_array_elements(
      CASE
        WHEN dhc.concerns IS NULL THEN '[]'::jsonb
        WHEN jsonb_typeof(dhc.concerns::jsonb) = 'array' THEN dhc.concerns::jsonb
        ELSE '[]'::jsonb
      END
    ) AS elem
    WHERE COALESCE((elem->>'email_sent')::boolean, false) = false
      AND elem->>'email_sent' IS DISTINCT FROM 'true'
  ) concerns_expanded
`;
