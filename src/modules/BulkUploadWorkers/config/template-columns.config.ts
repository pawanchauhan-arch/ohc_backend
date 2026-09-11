/**
 * Excel template column definitions.
 * Keys match BulkUploadRowDto / portal form field names.
 * Fields with *_id are entered as human-readable names in Excel.
 */
export interface TemplateColumn {
  header: string;
  key: string;
  width: number;
  required?: boolean;
  hint?: string;
  dropdown?: string[]; // static dropdown values
}

export const TEMPLATE_COLUMNS: TemplateColumn[] = [
  { header: 'Name', key: 'name', width: 28, required: true },
  { header: 'Contact Number', key: 'contactNumber', width: 16, required: true, hint: '10 digits, no spaces' },
  { header: 'Gender', key: 'gender', width: 14, required: true, dropdown: ['Male', 'Female', 'Other'] },
  { header: 'Title', key: 'title', width: 10, dropdown: ['Mr', 'Mrs', 'Ms', 'Dr'] },
  { header: 'Employee ID', key: 'employeeId', width: 16 },
  { header: 'Date of Birth', key: 'dateOfBirthOrAge', width: 16, hint: 'YYYY-MM-DD' },
  { header: 'ID Proof Type', key: 'idProof_name', width: 16, dropdown: ['aadhaar', 'pan', 'voter_id', 'driving_license', 'passport'] },
  { header: 'ID Proof Number', key: 'idProof_number', width: 22 },
  { header: 'Blood Group', key: 'blood_group', width: 12, dropdown: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
  { header: 'Category', key: 'category', width: 12, dropdown: ['APL', 'BPL'] },
  { header: 'Occupation', key: 'occupation', width: 22 },
  { header: 'Country', key: 'country', width: 18, required: true, hint: 'Use name from Countries sheet' },
  { header: 'State', key: 'state', width: 20, required: true, hint: 'Use name from States sheet' },
  { header: 'District', key: 'district', width: 22, required: true, hint: 'Use name from Districts sheet' },
  { header: 'Department', key: 'department', width: 24, hint: 'Use name from Departments sheet' },
  { header: 'Designation', key: 'designation', width: 24, hint: 'Use name from Designations sheet' },
  { header: 'Local Address', key: 'localAddress', width: 32 },
  { header: 'Permanent Address', key: 'permanentAddress', width: 32 },
  { header: 'PIN Code', key: 'pin', width: 12 },
  { header: 'Emergency Contact Name', key: 'emergencyContactName', width: 24 },
  { header: 'Emergency Contact Number', key: 'emergencyContactNumber', width: 22, hint: '10 digits' },
  { header: 'C/O', key: 'co', width: 18 },
  { header: 'Relationship', key: 'relationship', width: 16, dropdown: ['Self', 'Spouse', 'Father', 'Mother', 'Son', 'Daughter', 'Other'] },
  { header: 'Residential Status', key: 'residentialstatus', width: 18 },
  { header: 'Health Card Number', key: 'healthCardNumber', width: 20 },
];

/** Sample row shown in template — user must delete before upload */
export const SAMPLE_ROW: Record<string, string> = {
  name: 'Raju Kumar (DELETE THIS ROW)',
  contactNumber: '9876543210',
  gender: 'Male',
  title: 'Mr',
  employeeId: 'EMP-001',
  dateOfBirthOrAge: '1990-05-15',
  idProof_name: 'aadhaar',
  idProof_number: '123456789012',
  blood_group: 'O+',
  category: 'APL',
  occupation: 'Small Business',
  country: 'India',
  state: 'Maharashtra',
  district: 'Mumbai',
  department: 'Operations',
  designation: 'Worker',
  localAddress: '123 Main Street, Andheri',
  permanentAddress: '',
  pin: '400001',
  emergencyContactName: 'Suresh Kumar',
  emergencyContactNumber: '9876543211',
  co: 'N/A',
  relationship: 'Other',
  residentialstatus: '',
  healthCardNumber: '',
};

export const TEMPLATE_SHEET_NAME = 'Patient Data';
export const MAX_DATA_ROWS = 500;
export const DATA_START_ROW = 2;