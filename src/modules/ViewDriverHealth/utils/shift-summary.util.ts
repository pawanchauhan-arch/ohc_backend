import {
  ShiftServiceSummaryRow,
  ServiceRecordIdsRow,
  ShiftCode,
  ShiftSummaryData,
} from '../types/shift-summary-response.type';
import { OperationalDayWindow } from '../../../utils/operational-day.util';

export interface ShiftAggregationRow {
  shift: string;
  service_type: string | null;
  count: number;
  record_ids?: number[] | null;
}

/**
 * Creates an empty service count row.
 */
export function createEmptyServiceRecordIdsRow(): ServiceRecordIdsRow {
  return { basic: [], advance: [], counselling: [] };
}

/**
 * Creates an empty shift summary row with counts and IDs.
 */
export function createEmptyShiftSummaryRow(): ShiftServiceSummaryRow {
  return {
    basic: 0,
    advance: 0,
    counselling: 0,
    total: 0,
    record_ids: createEmptyServiceRecordIdsRow(),
  };
}

/**
 * Builds the initial shift summary structure with zero counts.
 */
export function buildEmptyShiftSummary(
  operationalDate: string,
  centerId: number | string,
  window: OperationalDayWindow,
): ShiftSummaryData {
  const emptyShiftRow = createEmptyShiftSummaryRow();
  return {
    operational_date: operationalDate,
    center_id: centerId,
    timezone: 'Asia/Kolkata',
    window: { start: window.startUtc, end: window.endUtc },
    shifts: {
      A: { ...emptyShiftRow, record_ids: createEmptyServiceRecordIdsRow() },
      B: { ...emptyShiftRow, record_ids: createEmptyServiceRecordIdsRow() },
      C: { ...emptyShiftRow, record_ids: createEmptyServiceRecordIdsRow() },
    },
    overall: { basic: 0, advance: 0, counselling: 0, total: 0 },
  };
}

/**
 * Folds SQL aggregation rows into shift and overall totals.
 */
export function foldShiftAggregationRows(
  summary: ShiftSummaryData,
  rows: ShiftAggregationRow[],
): ShiftSummaryData {
  const result = buildEmptyShiftSummary(
    summary.operational_date,
    summary.center_id,
    { startUtc: summary.window.start, endUtc: summary.window.end },
  );
  rows.forEach((row) => {
    const shift = row.shift as ShiftCode;
    const serviceType = row.service_type;
    if (!['A', 'B', 'C'].includes(shift) || !serviceType) {
      return;
    }
    if (!['basic', 'advance', 'counselling'].includes(serviceType)) {
      return;
    }
    const category = serviceType as 'basic' | 'advance' | 'counselling';
    const count = Number(row.count) || 0;
    const recordIds = Array.isArray(row.record_ids)
      ? row.record_ids
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0)
      : [];
    result.shifts[shift][category] += count;
    result.shifts[shift].record_ids[category].push(...recordIds);
    result.shifts[shift].total += count;
    result.overall[category] += count;
    result.overall.total += count;
  });
  return result;
}
