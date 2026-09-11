/**
 * DTO for migration status responses
 * Provides structured response for migration operation status
 */
export class MigrationStatusDto {
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
  errorCount: number;
  warningCount: number;
  backupId?: string;
  metadata?: Record<string, any>;
} 