/**
 * Per-shift or overall service counts for MIS reporting.
 */
export interface ServiceCountRow {
  basic: number;
  advance: number;
  counselling: number;
  total: number;
}

/**
 * Health checkup record IDs grouped by service category.
 */
export interface ServiceRecordIdsRow {
  basic: number[];
  advance: number[];
  counselling: number[];
}

/**
 * Shift summary row with service counts and matching record IDs.
 */
export interface ShiftServiceSummaryRow extends ServiceCountRow {
  record_ids: ServiceRecordIdsRow;
}

export type ShiftCode = 'A' | 'B' | 'C';

/**
 * Shift-wise health checkup summary for one operational day.
 */
export interface ShiftSummaryData {
  operational_date: string;
  center_id: number | string;
  timezone: string;
  window: {
    start: string;
    end: string;
  };
  shifts: Record<ShiftCode, ShiftServiceSummaryRow>;
  overall: ServiceCountRow;
}

/**
 * API envelope for shift summary endpoint.
 */
export interface ShiftSummaryResponse {
  status: boolean;
  message: string;
  data: ShiftSummaryData;
}
