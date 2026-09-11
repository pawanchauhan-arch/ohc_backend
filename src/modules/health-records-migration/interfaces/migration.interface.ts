/**
 * Interface for parsed test data from selected_test JSON
 */
export interface ParsedTestData {
  spo2?: Spo2Data;
  bloodPressure?: BloodPressureData;
  temperature?: TemperatureData;
  pulse?: PulseData;
  bmi?: BmiData;
  randomBloodSugar?: RandomBloodSugarData;
  haemoglobin?: HaemoglobinData;
  alcohol?: AlcoholData;
  ecg?: EcgData;
  vision?: VisionData;
  romberg?: RombergData;
  pulmonaryFunction?: PulmonaryFunctionData;
  hiv?: HivData;
  eye?: EyeData;
}

/**
 * Individual test data interfaces
 */
export interface Spo2Data {
  health_checkup_id: number;
  value?: number;
  units?: string;
  status?: string;
  remark?: string;
}

export interface BloodPressureData {
  health_checkup_id: number;
  systolic_value?: number;
  diastolic_value?: number;
  units?: string;
  systolic_status?: string;
  diastolic_status?: string;
  systolic_remark?: string;
  diastolic_remark?: string;
}

export interface TemperatureData {
  health_checkup_id: number;
  value?: number;
  units?: string;
  status?: string;
  remark?: string;
}

export interface PulseData {
  health_checkup_id: number;
  value?: number;
  units?: string;
  status?: string;
  remark?: string;
}

export interface BmiData {
  health_checkup_id: number;
  value?: number;
  units?: string;
  status?: string;
  remark?: string;
  height?: number;
  weight?: number;
}

export interface RandomBloodSugarData {
  health_checkup_id: number;
  value?: number;
  units?: string;
  status?: string;
  remark?: string;
}

export interface HaemoglobinData {
  health_checkup_id: number;
  value?: number;
  units?: string;
  status?: string;
  remark?: string;
}

export interface AlcoholData {
  health_checkup_id: number;
  value?: string;
  units?: string;
  status?: string;
  remark?: string;
}

export interface EcgData {
  health_checkup_id: number;
  value?: string;
  status?: string;
  remark?: string;
}

export interface VisionData {
  health_checkup_id: number;
  value?: string;
  status?: string;
  remark?: string;
}

export interface RombergData {
  health_checkup_id: number;
  value?: string;
  status?: string;
  remark?: string;
}

export interface PulmonaryFunctionData {
  health_checkup_id: number;
  value?: number;
  units?: string;
  status?: string;
  remark?: string;
}

export interface HivData {
  health_checkup_id: number;
  value?: string;
  status?: string;
  remark?: string;
}

export interface EyeData {
  health_checkup_id: number;
  spherical_right_eye?: number;
  spherical_left_eye?: number;
  cylindrical_right_eye?: number;
  cylindrical_left_eye?: number;
  colour_blindness?: string;
  units?: string;
  spherical_right_status?: string;
  spherical_left_status?: string;
  cylindrical_right_status?: string;
  cylindrical_left_status?: string;
  colour_blindness_status?: string;
  remark?: string;
}

/**
 * Migration configuration interface
 */
export interface MigrationConfig {
  batchSize: number;
  dryRun: boolean;
  startFromId?: number;
  endAtId?: number;
}

/**
 * Migration operation interface
 */
export interface MigrationOperation {
  id: string;
  status: string;
  startTime: Date;
  endTime?: Date;
  config: MigrationConfig;
  stats: {
    totalRecords: number;
    processedRecords: number;
    successfulRecords: number;
    failedRecords: number;
    skippedRecords: number;
    testTypeStats: Record<string, number>;
  };
  errors: string[];
  warnings: string[];
}
