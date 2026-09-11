export enum AmbulanceType {
  BASIC = 'basic',
  ADVANCED = 'advanced',
  ICU = 'icu',
  NEONATAL = 'neonatal',
  PATIENT_TRANSPORT = 'patient_transport',
}

export enum FuelType {
  PETROL = 'petrol',
  DIESEL = 'diesel',
  CNG = 'cng',
  ELECTRIC = 'electric',
}

export enum AmbulanceStatus {
  AVAILABLE = 'available',
  ON_TRIP = 'on_trip',
  MAINTENANCE = 'maintenance',
  INACTIVE = 'inactive',
}

export enum PatientType {
  OUTSIDER = 'outsider',
  COMPANY = 'company',
}

export enum ServiceStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}
