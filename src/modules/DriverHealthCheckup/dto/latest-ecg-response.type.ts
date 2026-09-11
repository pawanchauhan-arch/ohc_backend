/**
 * ECG unit payload as stored in selected_test.
 */
export interface EcgUnitPayload {
  key: string;
  label: string;
  value: string | null;
  doc: string | null;
  standard_value: unknown;
  status: string | null;
  remark: string | null;
  units?: string;
}

/**
 * Response for GET /api/driver-health-checkup/latest-ecg.
 */
export interface LatestEcgByDriverResponse {
  health_checkup_id: number;
  driver_id: number;
  date_time: string | null;
  createdAt: Date;
  ecg_unit: EcgUnitPayload;
  ecg_report_url: string | null;
}
