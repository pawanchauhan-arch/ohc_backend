/**
 * Excel row mapping — uses human-readable names, NOT database IDs.
 * Backend resolves names → IDs before calling registerPatient.
 */
export interface BulkUploadRowDto {
  rowNumber: number;
  name: string;
  contactNumber: string;
  gender: string;
  title?: string;
  employeeId?: string;
  dateOfBirthOrAge?: string;
  idProof_name?: string;
  idProof_number?: string;
  blood_group?: string;
  category?: string;
  occupation?: string;
  country: string;
  state: string;
  district: string;
  department?: string;
  designation?: string;
  localAddress?: string;
  permanentAddress?: string;
  pin?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  co?: string;
  relationship?: string;
  residentialstatus?: string;
  healthCardNumber?: string;
  iage?: number;
  imonth?: number;
  idays?: number;
  age?: number;
}

export interface BulkUploadResult {
  totalRows: number;
  successCount: number;
  failureCount: number;
  successes: Array<{ row: number; name: string; external_id: string }>;
  errors: Array<{ row: number; field?: string; message: string }>;
}

export interface ResolvedBulkRow extends BulkUploadRowDto {
  country_id: number;
  state_id: number;
  district_id: number;
  department_id?: number;
  designation_id?: number;
}
