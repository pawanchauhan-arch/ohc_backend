// Response DTOs for Health Records Migration

/**
 * Migration status enumeration
 */
export enum MigrationStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  ROLLED_BACK = 'ROLLED_BACK',
}

/**
 * Test parsing result interface
 */
export interface TestParsingResult {
  testType: string;
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Migration statistics interface
 */
export interface MigrationStats {
  totalRecords: number;
  processedRecords: number;
  successfulRecords: number;
  failedRecords: number;
  skippedRecords: number;
  testTypeStats: Record<string, number>;
}

/**
 * Migration report interface
 */
export interface MigrationReport {
  operationId: string;
  status: MigrationStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  stats: MigrationStats;
  errors: string[];
  warnings: string[];
}

/**
 * DTO for migration status response
 */
export class MigrationStatusDto {
  operationId: string;
  status: MigrationStatus;
  progress: number;
  stats: MigrationStats;
  estimatedCompletion?: Date;
  currentMessage?: string;
}

/**
 * DTO for migration start response
 */
export class StartMigrationResponseDto {
  success: boolean;
  operationId: string;
  message: string;
  initialStats: MigrationStats;
}

/**
 * DTO for validation response
 */
export class ValidationResponseDto {
  success: boolean;
  recordsValidated: number;
  testResults: TestParsingResult[];
  errors: string[];
  warnings: string[];
}

/**
 * DTO for preview response
 */
export class PreviewResponseDto {
  healthCheckupId: number;
  originalData: any;
  parsedData: Record<string, any>;
  parsingSuccess: boolean;
  errors: string[];
}
