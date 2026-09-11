/**
 * Core type definitions for the migration system
 * Defines interfaces for operations, results, and validation
 */

export interface CopyOperation {
  id: string;
  type: 'DRIVER_MASTER' | 'HEALTH_CHECKUP';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'ROLLED_BACK';
  startTime: Date;
  endTime?: Date;
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  errorLogs: string[];
  backupId?: string;
  metadata?: Record<string, any>;
}

export interface CopyResult {
  success: boolean;
  copiedRecords: number;
  skippedRecords: number;
  failedRecords: number;
  errors: string[];
  backupId?: string;
  operationId: string;
  duration: number; // in milliseconds
  rolledBackRecords?: number; // Added for rollback operations
}

export interface RollbackResult {
  success: boolean;
  rolledBackRecords: number;
  errors: string[];
  operationId: string;
  duration: number; // in milliseconds
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
}

export interface RecordValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface MigrationStatus {
  operationId: string;
  status: string;
  progress: number; // 0-100
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  startTime: Date;
  estimatedCompletion?: Date;
  currentBatch?: number;
  totalBatches?: number;
  errorCount: number; // Added missing property
  warningCount: number; // Added missing property
  backupId?: string; // Added missing property
  metadata?: Record<string, any>; // Added missing property
}

export interface BatchResult {
  batchNumber: number;
  success: boolean;
  processedRecords: number;
  failedRecords: number;
  errors: string[];
  duration: number;
}

export interface DataTransformationResult {
  originalRecord: any;
  transformedRecord: any;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface BackupInfo {
  id: string;
  tableName: string;
  recordCount: number;
  backupTime: Date;
  filePath?: string;
  isRestored: boolean;
}

/**
 * Source-specific migration result
 */
export interface SourceMigrationResult {
  sourceName: string;
  success: boolean;
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  skippedRecords: number;
  errorCount: number;
  warningCount: number;
  startTime: Date;
  endTime: Date;
  duration: number;
  errors: string[];
  warnings: string[];
  backupId?: string;
  metadata?: any;
}

/**
 * Multi-source migration result
 */
export interface MultiSourceMigrationResult {
  success: boolean;
  totalSources: number;
  successfulSources: number;
  failedSources: number;
  totalRecordsProcessed: number;
  totalRecordsFailed: number;
  totalRecordsSkipped: number;
  startTime: Date;
  endTime: Date;
  duration: number;
  sourceResults: SourceMigrationResult[];
  aggregatedErrors: string[];
  aggregatedWarnings: string[];
}

/**
 * Source-specific incremental migration result
 */
export interface SourceIncrementalResult {
  sourceName: string;
  success: boolean;
  newRecordsFound: number;
  recordsMigrated: number;
  recordsSkipped: number;
  errors: string[];
  fromDate: string;
  toDate: string;
}

/**
 * Multi-source incremental migration result
 */
export interface MultiSourceIncrementalResult {
  success: boolean;
  totalSources: number;
  successfulSources: number;
  failedSources: number;
  totalNewRecordsFound: number;
  totalRecordsMigrated: number;
  totalRecordsSkipped: number;
  sourceResults: SourceIncrementalResult[];
  aggregatedErrors: string[];
} 