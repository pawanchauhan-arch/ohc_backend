/**
 * Database connection configurations for migration system
 * Handles both source (SQL Server) and target (PostgreSQL) database connections
 */

export interface DatabaseConfig {
  source: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    options: {
      encrypt: boolean;
      trustServerCertificate: boolean;
    };
  };
  target: {
    // Uses existing PostgreSQL connection from app.module.ts
    // No additional configuration needed as it uses the main app's connection
  };
}

export const getDatabaseConfig = (): DatabaseConfig => {
  return {
    source: {
      host: process.env.SOURCE_DB_HOST || 'localhost',
      port: parseInt(process.env.SOURCE_DB_PORT || '1433'),
      database: process.env.SOURCE_DB_NAME || 'LastMileCareDB',
      username: process.env.SOURCE_DB_USER || 'sa',
      password: process.env.SOURCE_DB_PASSWORD || '',
      options: {
        encrypt: true,
        trustServerCertificate: true,
      },
    },
    target: {},
  };
}; 