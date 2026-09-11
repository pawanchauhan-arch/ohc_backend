import { Test, TestingModule } from '@nestjs/testing';
import { MigrationService } from '../services/migration.service';
import { DatabaseConnectionService } from '../services/database-connection.service';
import { BackupService } from '../services/backup.service';
import { ValidationService } from '../services/validation.service';
import { DataTransformationService } from '../services/data-transformation.service';

describe('MigrationService', () => {
  let service: MigrationService;
  let databaseConnectionService: DatabaseConnectionService;
  let backupService: BackupService;
  let validationService: ValidationService;
  let dataTransformationService: DataTransformationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MigrationService,
        {
          provide: DatabaseConnectionService,
          useValue: {
            testConnection: jest.fn(),
            executeQuery: jest.fn(),
          },
        },
        {
          provide: BackupService,
          useValue: {
            createBackup: jest.fn(),
            restoreBackup: jest.fn(),
          },
        },
        {
          provide: ValidationService,
          useValue: {
            validateDriverData: jest.fn(),
            validateHealthCheckupData: jest.fn(),
          },
        },
        {
          provide: DataTransformationService,
          useValue: {
            transformDriverData: jest.fn(),
            transformHealthCheckupData: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MigrationService>(MigrationService);
    databaseConnectionService = module.get<DatabaseConnectionService>(DatabaseConnectionService);
    backupService = module.get<BackupService>(BackupService);
    validationService = module.get<ValidationService>(ValidationService);
    dataTransformationService = module.get<DataTransformationService>(DataTransformationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have all required dependencies', () => {
    expect(databaseConnectionService).toBeDefined();
    expect(backupService).toBeDefined();
    expect(validationService).toBeDefined();
    expect(dataTransformationService).toBeDefined();
  });

  describe('copyDriverData', () => {
    it('should throw error when database connection fails', async () => {
      const operationId = 'test_operation';
      
      jest.spyOn(databaseConnectionService, 'executeQuery').mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(service.copyDriverData(operationId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('copyHealthCheckupData', () => {
    it('should throw error when database connection fails', async () => {
      const operationId = 'test_operation';
      
      jest.spyOn(databaseConnectionService, 'executeQuery').mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(service.copyHealthCheckupData(operationId)).rejects.toThrow('Database connection failed');
    });
  });
}); 