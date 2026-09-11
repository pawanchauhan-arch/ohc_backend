import { Injectable, Logger } from '@nestjs/common';
import * as sql from 'mssql';
import { MigrationSource } from '../config/migration.config';
import { SourceConfigurationService } from './source-configuration.service';
import { ConnectionPool } from 'mssql';

/**
 * Service responsible for managing multiple source database connections
 * Handles connection pooling, testing, and query execution for multiple sources
 */
@Injectable()
export class MultiSourceDatabaseConnectionService {
  private readonly logger = new Logger(MultiSourceDatabaseConnectionService.name);
  private readonly connections: Map<string, ConnectionPool> = new Map();
  private readonly sourceConfigService: SourceConfigurationService;

  constructor(sourceConfigService: SourceConfigurationService) {
    this.sourceConfigService = sourceConfigService;
  }

  /**
   * Gets an existing connection for a source or creates a new one
   */
  private async getConnection(sourceName: string): Promise<ConnectionPool> {
    const existingConnection = this.connections.get(sourceName);
    
    if (existingConnection) {
      try {
        // Check if connection is still valid by trying to use it
        await existingConnection.request().query('SELECT 1');
        return existingConnection;
      } catch (error) {
        this.logger.warn(`Connection for ${sourceName} is invalid, creating new one`);
        await this.closeConnection(sourceName);
      }
    }

    return await this.createConnection(sourceName);
  }

  /**
   * Creates a new connection for a source
   */
  private async createConnection(sourceName: string): Promise<ConnectionPool> {
    const source = this.sourceConfigService.getSourceByName(sourceName);
    if (!source) {
      throw new Error(`Source with name "${sourceName}" not found.`);
    }

    const config: sql.config = {
      server: source.database.host,
      port: source.database.port,
      database: source.database.database,
      user: source.database.username,
      password: source.database.password,
      options: {
        encrypt: false,
        trustServerCertificate: true,
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    };

    try {
      const pool = new sql.ConnectionPool(config);
      await pool.connect();
      this.logger.log(`Connected to source database: ${sourceName}`);
      return pool;
    } catch (error) {
      this.logger.error(`Failed to connect to source database ${sourceName}:`, error.message);
      throw new Error(`Connection failed for source ${sourceName}: ${error.message}`);
    }
  }

  /**
   * Tests connection for a specific source
   */
  async testConnection(source: MigrationSource): Promise<{ success: boolean; error?: string }> {
    try {
      const connection = await this.getConnection(source.name);
      const result = await connection.request().query('SELECT 1 as test');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Tests connections for all active sources
   */
  async testAllConnections(): Promise<Record<string, { success: boolean; error?: string }>> {
    const activeSources = this.sourceConfigService.getActiveSources();
    const results: Record<string, { success: boolean; error?: string }> = {};

    for (const source of activeSources) {
      results[source.name] = await this.testConnection(source);
    }

    return results;
  }

  /**
   * Executes a query on a specific source
   */
  async executeQuery(source: MigrationSource, query: string, params?: any[]): Promise<any[]> {
    const connection = await this.getConnection(source.name);
    
    try {
      const request = connection.request();
      
      if (params) {
        params.forEach((param, index) => {
          request.input(`param${index}`, param);
        });
      }
      
      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      this.logger.error(`Query execution failed for source ${source.name}:`, error.message);
      throw new Error(`Query failed for source ${source.name}: ${error.message}`);
    }
  }

  /**
   * Gets table information for a specific source
   */
  async getTableInfo(source: MigrationSource, tableName: string): Promise<any[]> {
    const query = `
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = @tableName
      ORDER BY ORDINAL_POSITION
    `;
    
    return this.executeQuery(source, query, [tableName]);
  }

  /**
   * Gets record count for a table in a specific source
   */
  async getRecordCount(source: MigrationSource, tableName: string): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM ${tableName}`;
    const result = await this.executeQuery(source, query);
    return result[0]?.count || 0;
  }

  /**
   * Gets sample data from a table in a specific source
   */
  async getSampleData(source: MigrationSource, tableName: string, limit: number = 5): Promise<any[]> {
    const query = `SELECT TOP ${limit} * FROM ${tableName}`;
    return this.executeQuery(source, query);
  }

  /**
   * Closes a specific connection
   */
  private async closeConnection(sourceName: string): Promise<void> {
    const connection = this.connections.get(sourceName);
    
    if (connection) {
      try {
        await connection.close();
        this.connections.delete(sourceName);
        this.logger.log(`Closed connection for ${sourceName}`);
      } catch (error) {
        this.logger.error(`Error closing connection for ${sourceName}:`, error);
      }
    }
  }

  /**
   * Closes all connections
   */
  async closeAllConnections(): Promise<void> {
    this.logger.log('Closing all database connections...');
    
    const closePromises = Array.from(this.connections.entries()).map(async ([sourceName, connection]) => {
      try {
        await connection.close();
        this.logger.log(`Closed connection for ${sourceName}`);
      } catch (error) {
        this.logger.error(`Error closing connection for ${sourceName}:`, error);
      }
    });

    await Promise.all(closePromises);
    this.connections.clear();
  }

  /**
   * Gets connection status for a specific source
   */
  getConnectionStatus(sourceName: string): { connected: boolean; sourceName: string; error?: string } {
    const connection = this.connections.get(sourceName);
    
    if (!connection) {
      return {
        connected: false,
        sourceName,
        error: 'No connection established',
      };
    }

    try {
      // Try to check if connection is still valid
      return {
        connected: true,
        sourceName,
      };
    } catch (error) {
      return {
        connected: false,
        sourceName,
        error: error.message,
      };
    }
  }

  /**
   * Gets health status for all sources
   */
  async getHealthStatus(): Promise<{ sources: Array<{ name: string; healthy: boolean; error?: string }> }> {
    const sources = this.sourceConfigService.getActiveSources();
    const healthResults = await Promise.all(
      sources.map(async (source) => {
        try {
          const connection = await this.getConnection(source.name);
          // Test the connection
          await connection.request().query('SELECT 1');
          
          return {
            name: source.name,
            healthy: true,
          };
        } catch (error) {
          return {
            name: source.name,
            healthy: false,
            error: error.message,
          };
        }
      })
    );

    return { sources: healthResults };
  }
}
