import { Injectable, Logger } from '@nestjs/common';
import { MigrationOperation } from '../interfaces/migration.interface';

/**
 * Migration logging utility
 */
@Injectable()
export class MigrationLoggerUtil {
  private readonly logger = new Logger(MigrationLoggerUtil.name);
  private readonly operations = new Map<string, MigrationOperation>();

  /**
   * Create a new migration operation
   */
  createOperation(operationId: string, config: any): MigrationOperation {
    const operation: MigrationOperation = {
      id: operationId,
      status: 'PENDING',
      startTime: new Date(),
      config,
      stats: {
        totalRecords: 0,
        processedRecords: 0,
        successfulRecords: 0,
        failedRecords: 0,
        skippedRecords: 0,
        testTypeStats: {},
      },
      errors: [],
      warnings: [],
    };

    this.operations.set(operationId, operation);
    this.logger.log(`Created migration operation: ${operationId}`);
    
    return operation;
  }

  /**
   * Update operation status
   */
  updateOperationStatus(operationId: string, status: string): void {
    const operation = this.operations.get(operationId);
    if (operation) {
      operation.status = status;
      if (status === 'COMPLETED' || status === 'FAILED') {
        operation.endTime = new Date();
      }
      this.logger.log(`Operation ${operationId} status updated to: ${status}`);
    }
  }

  /**
   * Update operation statistics
   */
  updateOperationStats(operationId: string, stats: Partial<MigrationOperation['stats']>): void {
    const operation = this.operations.get(operationId);
    if (operation) {
      Object.assign(operation.stats, stats);
    }
  }

  /**
   * Add error to operation
   */
  addError(operationId: string, error: string): void {
    const operation = this.operations.get(operationId);
    if (operation) {
      operation.errors.push(error);
      this.logger.error(`Operation ${operationId} error: ${error}`);
    }
  }

  /**
   * Add warning to operation
   */
  addWarning(operationId: string, warning: string): void {
    const operation = this.operations.get(operationId);
    if (operation) {
      operation.warnings.push(warning);
      this.logger.warn(`Operation ${operationId} warning: ${warning}`);
    }
  }

  /**
   * Get operation by ID
   */
  getOperation(operationId: string): MigrationOperation | undefined {
    return this.operations.get(operationId);
  }

  /**
   * Get all operations
   */
  getAllOperations(): MigrationOperation[] {
    return Array.from(this.operations.values());
  }

  /**
   * Calculate migration progress percentage
   */
  calculateProgress(operationId: string): number {
    const operation = this.operations.get(operationId);
    if (!operation || operation.stats.totalRecords === 0) {
      return 0;
    }

    return Math.round((operation.stats.processedRecords / operation.stats.totalRecords) * 100);
  }

  /**
   * Log batch processing progress
   */
  logBatchProgress(operationId: string, batchNumber: number, batchSize: number, processedCount: number): void {
    const operation = this.operations.get(operationId);
    if (operation) {
      const progress = this.calculateProgress(operationId);
      this.logger.log(
        `Operation ${operationId} - Batch ${batchNumber}: Processed ${processedCount}/${batchSize} records. Overall progress: ${progress}%`
      );
    }
  }

  /**
   * Log test type statistics
   */
  logTestTypeStats(operationId: string, testType: string): void {
    const operation = this.operations.get(operationId);
    if (operation) {
      if (!operation.stats.testTypeStats[testType]) {
        operation.stats.testTypeStats[testType] = 0;
      }
      operation.stats.testTypeStats[testType]++;
    }
  }

  /**
   * Generate migration summary
   */
  generateSummary(operationId: string): string {
    const operation = this.operations.get(operationId);
    if (!operation) {
      return `Operation ${operationId} not found`;
    }

    const duration = operation.endTime 
      ? Math.round((operation.endTime.getTime() - operation.startTime.getTime()) / 1000)
      : 0;

    const summary = [
      `Migration Operation Summary: ${operationId}`,
      `Status: ${operation.status}`,
      `Duration: ${duration} seconds`,
      `Total Records: ${operation.stats.totalRecords}`,
      `Processed: ${operation.stats.processedRecords}`,
      `Successful: ${operation.stats.successfulRecords}`,
      `Failed: ${operation.stats.failedRecords}`,
      `Skipped: ${operation.stats.skippedRecords}`,
      `Errors: ${operation.errors.length}`,
      `Warnings: ${operation.warnings.length}`,
      '',
      'Test Type Statistics:',
      ...Object.entries(operation.stats.testTypeStats).map(([type, count]) => `  ${type}: ${count}`),
    ];

    if (operation.errors.length > 0) {
      summary.push('', 'Errors:', ...operation.errors.map(err => `  - ${err}`));
    }

    if (operation.warnings.length > 0) {
      summary.push('', 'Warnings:', ...operation.warnings.slice(0, 10).map(warn => `  - ${warn}`));
      if (operation.warnings.length > 10) {
        summary.push(`  ... and ${operation.warnings.length - 10} more warnings`);
      }
    }

    return summary.join('\n');
  }

  /**
   * Clean up old operations (keep only last 10)
   */
  cleanupOldOperations(): void {
    const operations = Array.from(this.operations.entries())
      .sort(([, a], [, b]) => b.startTime.getTime() - a.startTime.getTime());

    if (operations.length > 10) {
      const toRemove = operations.slice(10);
      toRemove.forEach(([id]) => {
        this.operations.delete(id);
      });
      this.logger.log(`Cleaned up ${toRemove.length} old migration operations`);
    }
  }
}
