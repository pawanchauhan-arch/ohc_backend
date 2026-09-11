import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import * as sql from 'mssql';
import { getDatabaseConfig } from '../config/database.config';

/**
 * Database Connection Service
 * Manages SQL Server connections for data copying operations
 */
@Injectable()
export class DatabaseConnectionService implements OnModuleDestroy {
  private readonly logger = new Logger(DatabaseConnectionService.name);
  private sourceConnection: sql.ConnectionPool | null = null;
  private connectionAttempts = 0;
  private readonly maxConnectionAttempts = 3;

  /**
   * Connects to the source SQL Server database
   * Implements connection pooling and retry logic
   */
  async connectToSource(): Promise<sql.ConnectionPool> {
    try {
      if (!this.sourceConnection || !this.sourceConnection.connected) {
        this.logger.log('Establishing connection to SQL Server...');
        
        const config = getDatabaseConfig();
        const sqlConfig: sql.config = {
          server: config.source.host,
          port: config.source.port,
          database: config.source.database,
          user: config.source.username,
          password: config.source.password,
          options: {
            encrypt: config.source.options.encrypt,
            trustServerCertificate: config.source.options.trustServerCertificate,
            enableArithAbort: true,
            requestTimeout: 30000, // 30 seconds
          },
          pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000,
          },
        };

        this.sourceConnection = await sql.connect(sqlConfig);
        this.connectionAttempts = 0;
        this.logger.log('Successfully connected to SQL Server');
      }

      return this.sourceConnection;
    } catch (error) {
      this.connectionAttempts++;
      this.logger.error(`Failed to connect to SQL Server (attempt ${this.connectionAttempts}): ${error.message}`);
      
      if (this.connectionAttempts >= this.maxConnectionAttempts) {
        throw new Error(`Failed to connect to SQL Server after ${this.maxConnectionAttempts} attempts: ${error.message}`);
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
      return this.connectToSource();
    }
  }

  /**
   * Tests the connection to the source database
   */
  async testConnection(): Promise<boolean> {
    try {
      const connection = await this.connectToSource();
      const result = await connection.request().query('SELECT 1 as test');
      return result.recordset.length > 0;
    } catch (error) {
      this.logger.error(`Connection test failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Executes a query on the source database
   */
  async executeQuery(query: string, params?: any[]): Promise<any[]> {
    try {
      const connection = await this.connectToSource();
      const request = connection.request();
      
      if (params) {
        params.forEach((param, index) => {
          request.input(`param${index}`, param);
        });
      }

      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      this.logger.error(`Query execution failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gets table information from the source database
   */
  async getTableInfo(tableName: string): Promise<any> {
    const query = `
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = @tableName
      ORDER BY ORDINAL_POSITION
    `;

    try {
      const connection = await this.connectToSource();
      const result = await connection.request()
        .input('tableName', sql.VarChar, tableName)
        .query(query);
      
      return result.recordset;
    } catch (error) {
      this.logger.error(`Failed to get table info for ${tableName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gets record count for a table
   */
  async getRecordCount(tableName: string): Promise<number> {
    try {
      const connection = await this.connectToSource();
      const result = await connection.request()
        .input('tableName', sql.VarChar, tableName)
        .query(`SELECT COUNT(*) as count FROM ${tableName}`);
      
      return result.recordset[0]?.count || 0;
    } catch (error) {
      this.logger.error(`Failed to get record count for ${tableName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    if (this.sourceConnection && this.sourceConnection.connected) {
      try {
        await this.sourceConnection.close();
        this.logger.log('SQL Server connection closed');
      } catch (error) {
        this.logger.error(`Error closing SQL Server connection: ${error.message}`);
      }
    }
  }
} 