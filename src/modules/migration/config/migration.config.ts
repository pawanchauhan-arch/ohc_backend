/**
 * Migration-specific configurations
 * Defines settings for batch processing, retry logic, and system behavior
 */

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export interface MigrationSource {
  name: string;
  isActive: boolean;
  database: DatabaseConfig;
  creatorId: number;
  priority: number;
}

export interface MigrationConfig {
  batchSize: number;
  retryAttempts: number;
  timeout: number;
  enableLogging: boolean;
  enableBackup: boolean;
  maxConcurrentOperations: number;
  progressUpdateInterval: number;
  enableParallel: boolean;
  parallelDelay: number;
  sources: MigrationSource[];
}

export const getMigrationConfig = (): MigrationConfig => {
  return {
    batchSize: parseInt(process.env.MIGRATION_BATCH_SIZE || '100'),
    retryAttempts: parseInt(process.env.MIGRATION_RETRY_ATTEMPTS || '3'),
    timeout: parseInt(process.env.MIGRATION_TIMEOUT || '300000'), // 5 minutes
    enableLogging: process.env.MIGRATION_ENABLE_LOGGING === 'true',
    enableBackup: process.env.MIGRATION_ENABLE_BACKUP === 'true',
    maxConcurrentOperations: parseInt(process.env.MIGRATION_MAX_CONCURRENT || '1'),
    progressUpdateInterval: parseInt(process.env.MIGRATION_PROGRESS_INTERVAL || '5000'), // 5 seconds
    enableParallel: process.env.MIGRATION_ENABLE_PARALLEL === 'true',
    parallelDelay: parseInt(process.env.MIGRATION_PARALLEL_DELAY || '0'),
    sources: [
      {
        name: 'PICASO_HSVK',
        isActive: process.env.PICASO_HSVK_IS_ACTIVE !== 'false',
        database: {
          host: process.env.PICASO_HSVK_DB_HOST || 'localhost',
          port: parseInt(process.env.PICASO_HSVK_DB_PORT || '1433'),
          database: process.env.PICASO_HSVK_DB_NAME || 'picaso_db',
          username: process.env.PICASO_HSVK_DB_USER || 'sa',
          password: process.env.PICASO_HSVK_DB_PASSWORD || '',
        },
        creatorId: parseInt(process.env.PICASO_HSVK_CREATOR_ID || '99'),
        priority: 1,
      },
      {
        name: 'PICASO_AMP',
        isActive: process.env.PICASO_AMP_IS_ACTIVE !== 'false',
        database: {
          host: process.env.PICASO_AMP_DB_HOST || 'localhost',
          port: parseInt(process.env.PICASO_AMP_DB_PORT || '1433'),
          database: process.env.PICASO_AMP_DB_NAME || 'new_source_db',
          username: process.env.PICASO_AMP_DB_USER || 'sa',
          password: process.env.PICASO_AMP_DB_PASSWORD || '',
        },
        creatorId: parseInt(process.env.PICASO_AMP_CREATOR_ID || '98'),
        priority: 2,
      },
    ],
  };
}; 