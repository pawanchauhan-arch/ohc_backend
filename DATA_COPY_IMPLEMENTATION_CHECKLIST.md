# Data Copy Implementation Checklist
## Last Mile Care - Picaso to PostgreSQL Data Copy System

### Project Overview
- **Source**: Microsoft SQL Server (Picaso system)
- **Target**: PostgreSQL (Last Mile Care system) - same database as current project
- **Operation**: COPY (not transfer) - data remains in source
- **Critical Requirement**: Everything must be undoable/reversible

---

## Phase 1: Project Foundation & Setup

### Step 1.1: Create Migration Module Structure
```bash
# Create migration module directory structure
mkdir -p src/modules/migration/{controllers,services,dto,models,utils,tests}
mkdir -p src/modules/migration/config
mkdir -p src/modules/migration/types
mkdir -p docs/migration
mkdir -p scripts/migration
```

### Step 1.2: Install Required Dependencies
```bash
# Install SQL Server driver for source database
npm install mssql @types/mssql

# Install additional utilities
npm install node-cron @types/node-cron
npm install winston @types/winston

# Install development dependencies
npm install --save-dev @types/jest
```

### Step 1.3: Create Configuration Files

#### File: `src/modules/migration/config/database.config.ts`
```typescript
// Database connection configurations
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
  };
}
```

#### File: `src/modules/migration/config/migration.config.ts`
```typescript
// Migration-specific configurations
export interface MigrationConfig {
  batchSize: number;
  retryAttempts: number;
  timeout: number;
  enableLogging: boolean;
  enableBackup: boolean;
}
```

### Step 1.4: Create Environment Variables
```bash
# Add to .env file
# Source Database (Picaso SQL Server)
SOURCE_DB_HOST=localhost
SOURCE_DB_PORT=1433
SOURCE_DB_NAME=LastMileCareDB
SOURCE_DB_USER=sa
SOURCE_DB_PASSWORD=your_password

# Migration Configuration
MIGRATION_BATCH_SIZE=100
MIGRATION_RETRY_ATTEMPTS=3
MIGRATION_TIMEOUT=300000
MIGRATION_ENABLE_BACKUP=true
MIGRATION_ENABLE_LOGGING=true
```

---

## Phase 2: Core Types & Interfaces

### Step 2.1: Create Type Definitions

#### File: `src/modules/migration/types/migration.types.ts`
```typescript
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
}

export interface CopyResult {
  success: boolean;
  copiedRecords: number;
  skippedRecords: number;
  failedRecords: number;
  errors: string[];
  backupId?: string;
}

export interface RollbackResult {
  success: boolean;
  rolledBackRecords: number;
  errors: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
```

### Step 2.2: Create DTOs

#### File: `src/modules/migration/dto/copy-data.dto.ts`
```typescript
import { IsEnum, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CopyDataDto {
  @IsEnum(['DRIVER_MASTER', 'HEALTH_CHECKUP'])
  dataType: 'DRIVER_MASTER' | 'HEALTH_CHECKUP';

  @IsOptional()
  @IsNumber()
  batchSize?: number;

  @IsOptional()
  @IsBoolean()
  enableBackup?: boolean;

  @IsOptional()
  @IsBoolean()
  validateOnly?: boolean;
}
```

#### File: `src/modules/migration/dto/migration-status.dto.ts`
```typescript
export class MigrationStatusDto {
  operationId: string;
  status: string;
  progress: number;
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  startTime: Date;
  estimatedCompletion?: Date;
}
```

---

## Phase 3: Database Models

### Step 3.1: Create Migration Log Model

#### File: `src/modules/migration/models/migration-log.model.ts`
```typescript
import { Column, Model, Table, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'migration_logs',
  timestamps: true,
})
export class MigrationLog extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @Column({
    type: DataType.ENUM('DRIVER_MASTER', 'HEALTH_CHECKUP'),
    allowNull: false,
  })
  operationType: string;

  @Column({
    type: DataType.ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'ROLLED_BACK'),
    allowNull: false,
  })
  status: string;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  totalRecords: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  processedRecords: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  failedRecords: number;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  errorLogs: object[];

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  backupId: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  startTime: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  endTime: Date;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  metadata: object;
}
```

### Step 3.2: Create Backup Log Model

#### File: `src/modules/migration/models/backup-log.model.ts`
```typescript
import { Column, Model, Table, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'backup_logs',
  timestamps: true,
})
export class BackupLog extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  backupName: string;

  @Column({
    type: DataType.ENUM('DRIVER_MASTER', 'HEALTH_CHECKUP'),
    allowNull: false,
  })
  tableType: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  recordCount: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  backupTime: Date;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  filePath: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isRestored: boolean;
}
```

---

## Phase 4: Core Services Implementation

### Step 4.1: Database Connection Service

#### File: `src/modules/migration/services/database-connection.service.ts`
```typescript
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import * as sql from 'mssql';

@Injectable()
export class DatabaseConnectionService implements OnModuleDestroy {
  private sourceConnection: sql.ConnectionPool | null = null;

  async connectToSource(): Promise<sql.ConnectionPool> {
    if (!this.sourceConnection) {
      const config: sql.config = {
        server: process.env.SOURCE_DB_HOST,
        port: parseInt(process.env.SOURCE_DB_PORT),
        database: process.env.SOURCE_DB_NAME,
        user: process.env.SOURCE_DB_USER,
        password: process.env.SOURCE_DB_PASSWORD,
        options: {
          encrypt: true,
          trustServerCertificate: true,
        },
      };
      this.sourceConnection = await sql.connect(config);
    }
    return this.sourceConnection;
  }

  async onModuleDestroy() {
    if (this.sourceConnection) {
      await this.sourceConnection.close();
    }
  }
}
```

### Step 4.2: Backup Service

#### File: `src/modules/migration/services/backup.service.ts`
```typescript
import { Injectable } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { BackupLog } from '../models/backup-log.model';

@Injectable()
export class BackupService {
  constructor(private readonly sequelize: Sequelize) {}

  async createBackup(tableName: string, recordCount: number): Promise<string> {
    const backupId = `backup_${tableName}_${Date.now()}`;
    
    // Create backup using PostgreSQL pg_dump or similar
    // Store backup metadata in BackupLog table
    
    return backupId;
  }

  async restoreBackup(backupId: string): Promise<boolean> {
    // Implement backup restoration logic
    return true;
  }
}
```

### Step 4.3: Validation Service

#### File: `src/modules/migration/services/validation.service.ts`
```typescript
import { Injectable } from '@nestjs/common';
import { ValidationResult } from '../types/migration.types';

@Injectable()
export class ValidationService {
  async validateDriverData(sourceData: any[]): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    // Check data types
    // Validate business rules
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  async validateHealthCheckupData(sourceData: any[]): Promise<ValidationResult> {
    // Similar validation logic for health checkup data
    return { isValid: true, errors: [], warnings: [] };
  }
}
```

### Step 4.4: Data Transformation Service

#### File: `src/modules/migration/services/data-transformation.service.ts`
```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class DataTransformationService {
  transformDriverData(picasoData: any): any {
    return {
      driverId: picasoData.PatientId,
      driver_cetid: picasoData.CetId,
      driver_cetname: picasoData.CetName,
      external_id: picasoData.PatientId,
      name: picasoData.PatientName,
      healthCardNumber: picasoData.HealthCardNumber,
      abhaNumber: picasoData.AbhaNumber,
      dateOfBirthOrAge: this.transformDate(picasoData.DateOfBirth),
      gender: this.transformGender(picasoData.Gender),
      // ... other field mappings
    };
  }

  transformHealthCheckupData(picasoData: any): any {
    return {
      driver_id: picasoData.PatientId,
      doctor_id: picasoData.DoctorId,
      uniqueId: picasoData.ConsultationId,
      external_id: picasoData.PatientId,
      // ... other field mappings
      selected_test: this.buildHealthTestJson(picasoData),
    };
  }

  private transformDate(dateString: string): string {
    // Handle invalid dates like 1752
    if (!dateString || dateString === '1752-01-01') {
      return null;
    }
    return dateString;
  }

  private transformGender(gender: string): string {
    const genderMap = {
      'M': 'Male',
      'F': 'Female',
      'O': 'Other',
    };
    return genderMap[gender] || 'Other';
  }

  private buildHealthTestJson(picasoData: any): object {
    // Build complex JSON structure for health test data
    return {
      bmi: this.calculateBMI(picasoData.Height, picasoData.Weight),
      bloodPressure: {
        systolic: picasoData.BPSystolic,
        diastolic: picasoData.BPDiastolic,
      },
      // ... other health metrics
    };
  }

  private calculateBMI(height: number, weight: number): number {
    if (!height || !weight) return null;
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  }
}
```

### Step 4.5: Main Migration Service

#### File: `src/modules/migration/services/migration.service.ts`
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Transaction } from 'sequelize';
import { DatabaseConnectionService } from './database-connection.service';
import { BackupService } from './backup.service';
import { ValidationService } from './validation.service';
import { DataTransformationService } from './data-transformation.service';
import { MigrationLog } from '../models/migration-log.model';
import { CopyOperation, CopyResult } from '../types/migration.types';

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);

  constructor(
    private readonly databaseConnection: DatabaseConnectionService,
    private readonly backupService: BackupService,
    private readonly validationService: ValidationService,
    private readonly dataTransformation: DataTransformationService,
  ) {}

  async copyDriverData(operationId: string): Promise<CopyResult> {
    const operation = await this.createMigrationLog(operationId, 'DRIVER_MASTER');
    
    try {
      // 1. Create backup
      const backupId = await this.backupService.createBackup('DRIVERMASTERs', 0);
      
      // 2. Fetch source data
      const sourceData = await this.fetchDriverDataFromPicaso();
      
      // 3. Validate data
      const validation = await this.validationService.validateDriverData(sourceData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      
      // 4. Transform and copy data
      const result = await this.copyDataInBatches(sourceData, 'DRIVER_MASTER');
      
      // 5. Update operation status
      await this.updateMigrationLog(operationId, 'COMPLETED', result);
      
      return result;
    } catch (error) {
      await this.updateMigrationLog(operationId, 'FAILED', { errors: [error.message] });
      throw error;
    }
  }

  async copyHealthCheckupData(operationId: string): Promise<CopyResult> {
    // Similar implementation for health checkup data
    return { success: true, copiedRecords: 0, skippedRecords: 0, failedRecords: 0, errors: [] };
  }

  async rollbackMigration(operationId: string): Promise<CopyResult> {
    const operation = await MigrationLog.findByPk(operationId);
    if (!operation) {
      throw new Error('Migration operation not found');
    }

    try {
      // Implement rollback logic
      const result = await this.backupService.restoreBackup(operation.backupId);
      
      await this.updateMigrationLog(operationId, 'ROLLED_BACK', {});
      
      return { success: true, copiedRecords: 0, skippedRecords: 0, failedRecords: 0, errors: [] };
    } catch (error) {
      throw error;
    }
  }

  private async createMigrationLog(operationId: string, type: string): Promise<MigrationLog> {
    return await MigrationLog.create({
      id: operationId,
      operationType: type,
      status: 'PENDING',
      startTime: new Date(),
    });
  }

  private async updateMigrationLog(operationId: string, status: string, result: any): Promise<void> {
    await MigrationLog.update(
      {
        status,
        endTime: new Date(),
        processedRecords: result.copiedRecords || 0,
        failedRecords: result.failedRecords || 0,
        errorLogs: result.errors || [],
      },
      { where: { id: operationId } }
    );
  }

  private async fetchDriverDataFromPicaso(): Promise<any[]> {
    const connection = await this.databaseConnection.connectToSource();
    const result = await connection.request()
      .query('SELECT * FROM Picaso_PatientMaster');
    return result.recordset;
  }

  private async copyDataInBatches(sourceData: any[], type: string): Promise<CopyResult> {
    // Implement batch copying logic
    return { success: true, copiedRecords: 0, skippedRecords: 0, failedRecords: 0, errors: [] };
  }
}
```

---

## Phase 5: Controller & Routes

### Step 5.1: Migration Controller

#### File: `src/modules/migration/controllers/migration.controller.ts`
```typescript
import { Controller, Post, Get, Param, Body, HttpException, HttpStatus } from '@nestjs/common';
import { MigrationService } from '../services/migration.service';
import { CopyDataDto } from '../dto/copy-data.dto';
import { MigrationStatusDto } from '../dto/migration-status.dto';

@Controller('migration')
export class MigrationController {
  constructor(private readonly migrationService: MigrationService) {}

  @Post('copy/driver-data')
  async copyDriverData(@Body() copyDto: CopyDataDto) {
    try {
      const operationId = `driver_${Date.now()}`;
      const result = await this.migrationService.copyDriverData(operationId);
      
      return {
        success: true,
        operationId,
        message: 'Driver data copy operation initiated',
        result,
      };
    } catch (error) {
      throw new HttpException(
        `Copy operation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('copy/health-checkup')
  async copyHealthCheckupData(@Body() copyDto: CopyDataDto) {
    try {
      const operationId = `health_${Date.now()}`;
      const result = await this.migrationService.copyHealthCheckupData(operationId);
      
      return {
        success: true,
        operationId,
        message: 'Health checkup data copy operation initiated',
        result,
      };
    } catch (error) {
      throw new HttpException(
        `Copy operation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('status/:operationId')
  async getMigrationStatus(@Param('operationId') operationId: string): Promise<MigrationStatusDto> {
    // Implement status checking logic
    return {
      operationId,
      status: 'IN_PROGRESS',
      progress: 50,
      totalRecords: 1000,
      processedRecords: 500,
      failedRecords: 0,
      startTime: new Date(),
    };
  }

  @Post('rollback/:operationId')
  async rollbackMigration(@Param('operationId') operationId: string) {
    try {
      const result = await this.migrationService.rollbackMigration(operationId);
      
      return {
        success: true,
        message: 'Rollback operation completed successfully',
        result,
      };
    } catch (error) {
      throw new HttpException(
        `Rollback operation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('admin/test')
  async testConnection() {
    return {
      success: true,
      message: 'Migration system is operational',
      timestamp: new Date(),
    };
  }
}
```

### Step 5.2: Migration Module

#### File: `src/modules/migration/migration.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MigrationController } from './controllers/migration.controller';
import { MigrationService } from './services/migration.service';
import { DatabaseConnectionService } from './services/database-connection.service';
import { BackupService } from './services/backup.service';
import { ValidationService } from './services/validation.service';
import { DataTransformationService } from './services/data-transformation.service';
import { MigrationLog } from './models/migration-log.model';
import { BackupLog } from './models/backup-log.model';

@Module({
  imports: [
    SequelizeModule.forFeature([MigrationLog, BackupLog]),
  ],
  controllers: [MigrationController],
  providers: [
    MigrationService,
    DatabaseConnectionService,
    BackupService,
    ValidationService,
    DataTransformationService,
  ],
  exports: [MigrationService],
})
export class MigrationModule {}
```

---

## Phase 6: Integration with Main Application

### Step 6.1: Update App Module

#### File: `src/app.module.ts` (Update)
```typescript
// Add to imports array
import { MigrationModule } from './modules/migration/migration.module';
import { MigrationLog } from './modules/migration/models/migration-log.model';
import { BackupLog } from './modules/migration/models/backup-log.model';

@Module({
  imports: [
    SequelizeModule.forRoot({
      // ... existing configuration
      models: [
        // ... existing models
        MigrationLog,
        BackupLog,
      ],
    }),
    // ... existing modules
    MigrationModule,
  ],
})
export class AppModule {}
```

---

## Phase 7: Testing Implementation

### Step 7.1: Unit Tests

#### File: `src/modules/migration/tests/migration.service.spec.ts`
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MigrationService } from '../services/migration.service';

describe('MigrationService', () => {
  let service: MigrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MigrationService],
    }).compile();

    service = module.get<MigrationService>(MigrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Add more test cases
});
```

### Step 7.2: Integration Tests

#### File: `src/modules/migration/tests/migration.integration.spec.ts`
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../app.module';

describe('Migration Integration Tests', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/migration/admin/test (GET)', () => {
    return request(app.getHttpServer())
      .get('/migration/admin/test')
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });
});
```

---

## Phase 8: Documentation

### Step 8.1: API Documentation

#### File: `docs/migration/API_REFERENCE.md`
```markdown
# Migration API Reference

## Endpoints

### POST /migration/copy/driver-data
Copy driver master data from Picaso to Last Mile Care system.

**Request Body:**
```json
{
  "dataType": "DRIVER_MASTER",
  "batchSize": 100,
  "enableBackup": true,
  "validateOnly": false
}
```

### POST /migration/copy/health-checkup
Copy health checkup data from Picaso to Last Mile Care system.

### GET /migration/status/:operationId
Get the status of a migration operation.

### POST /migration/rollback/:operationId
Rollback a migration operation.

### GET /migration/admin/test
Test endpoint to verify system connectivity.
```

### Step 8.2: Implementation Guide

#### File: `docs/migration/IMPLEMENTATION_GUIDE.md`
```markdown
# Migration Implementation Guide

## Setup Instructions

1. Install dependencies
2. Configure environment variables
3. Set up database connections
4. Run database migrations
5. Test connections

## Usage Instructions

1. Start the application
2. Test connectivity
3. Run copy operations
4. Monitor progress
5. Handle errors and rollbacks

## Troubleshooting

Common issues and solutions...
```

---

## Phase 9: Deployment & Monitoring

### Step 9.1: Environment Configuration
- [ ] Set up production environment variables
- [ ] Configure database connections
- [ ] Set up logging
- [ ] Configure monitoring

### Step 9.2: Monitoring Setup
- [ ] Implement health checks
- [ ] Set up error monitoring
- [ ] Configure performance metrics
- [ ] Set up alerts

---

## Implementation Checklist

### Week 1: Foundation
- [ ] Create module structure
- [ ] Install dependencies
- [ ] Set up configuration files
- [ ] Create database models
- [ ] Implement basic services

### Week 2: Core Services
- [ ] Implement database connection service
- [ ] Implement backup service
- [ ] Implement validation service
- [ ] Implement data transformation service
- [ ] Implement main migration service

### Week 3: API Layer
- [ ] Create controller
- [ ] Implement routes
- [ ] Add error handling
- [ ] Implement status tracking
- [ ] Add rollback functionality

### Week 4: Testing & Documentation
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Create API documentation
- [ ] Create implementation guide
- [ ] Test all functionality

### Week 5: Deployment & Integration
- [ ] Integrate with main application
- [ ] Set up monitoring
- [ ] Configure production environment
- [ ] Perform end-to-end testing
- [ ] Deploy to production

---

## Success Criteria

### Functional Requirements
- [ ] Successfully copy driver master data
- [ ] Successfully copy health checkup data
- [ ] Handle all data transformations correctly
- [ ] Prevent duplicate records
- [ ] Provide complete rollback capability
- [ ] Run scheduled copying operations safely

### Non-Functional Requirements
- [ ] Process 1000+ records efficiently
- [ ] Handle connection failures gracefully
- [ ] Provide detailed error reporting
- [ ] Maintain data integrity
- [ ] Support complete rollback procedures
- [ ] Integrate seamlessly with existing system

---

## Risk Mitigation

### Technical Risks
- **Database Connection Issues**: Implement retry mechanisms and connection pooling
- **Data Quality Problems**: Add comprehensive validation and error handling
- **Performance Issues**: Implement batch processing and progress tracking
- **Memory Leaks**: Monitor memory usage and implement cleanup

### Operational Risks
- **Copy Failures**: Implement comprehensive error handling and rollback mechanisms
- **Data Loss**: Implement backup procedures before each operation
- **Security Breaches**: Implement proper authentication and data encryption
- **System Downtime**: Implement graceful error handling and monitoring

This implementation plan provides a comprehensive, step-by-step approach to building a robust, safe, and maintainable data copying system that integrates seamlessly with the existing Last Mile Care application while ensuring data integrity and operational safety. 