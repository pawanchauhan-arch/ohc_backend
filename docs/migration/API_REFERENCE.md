# Migration API Reference

## Overview
The Migration API provides endpoints for copying data from Picaso SQL Server to Last Mile Care PostgreSQL system. All operations are safe, reversible, and include comprehensive logging.

## Base URL
```
http://localhost:3000/migration
```

## Authentication
All endpoints require authentication. Include your authentication token in the request headers.

## Endpoints

### 1. Copy Driver Data
**POST** `/copy/driver-data`

Copies driver master data from Picaso to Last Mile Care system.

**Request Body:**
```json
{
  "dataType": "DRIVER_MASTER",
  "batchSize": 100,
  "enableBackup": true,
  "validateOnly": false,
  "skipValidation": false
}
```

**Response:**
```json
{
  "success": true,
  "operationId": "driver_1703123456789_abc123def",
  "message": "Driver data copy operation initiated successfully",
  "result": {
    "copiedRecords": 150,
    "skippedRecords": 0,
    "failedRecords": 0,
    "backupId": "backup_DRIVERMASTERs_1703123456789",
    "duration": 45000
  },
  "timestamp": "2023-12-21T10:30:45.789Z"
}
```

### 2. Copy Health Checkup Data
**POST** `/copy/health-checkup`

Copies health checkup data from Picaso to Last Mile Care system.

**Request Body:**
```json
{
  "dataType": "HEALTH_CHECKUP",
  "batchSize": 50,
  "enableBackup": true,
  "validateOnly": false,
  "skipValidation": false
}
```

**Response:**
```json
{
  "success": true,
  "operationId": "health_1703123456789_xyz789ghi",
  "message": "Health checkup data copy operation initiated successfully",
  "result": {
    "copiedRecords": 75,
    "skippedRecords": 0,
    "failedRecords": 0,
    "backupId": "backup_driverhealthcheckups_1703123456789",
    "duration": 32000
  },
  "timestamp": "2023-12-21T10:30:45.789Z"
}
```

### 3. Get Migration Status
**GET** `/status/:operationId`

Gets the current status of a migration operation.

**Response:**
```json
{
  "operationId": "driver_1703123456789_abc123def",
  "status": "IN_PROGRESS",
  "progress": 65,
  "totalRecords": 1000,
  "processedRecords": 650,
  "failedRecords": 0,
  "startTime": "2023-12-21T10:30:45.789Z",
  "estimatedCompletion": "2023-12-21T10:35:30.123Z",
  "currentBatch": 7,
  "totalBatches": 10,
  "errorCount": 0,
  "warningCount": 0,
  "backupId": "backup_DRIVERMASTERs_1703123456789",
  "metadata": {}
}
```

### 4. Rollback Migration
**POST** `/rollback/:operationId`

Rolls back a migration operation using the backup created before the operation.

**Response:**
```json
{
  "success": true,
  "operationId": "driver_1703123456789_abc123def",
  "message": "Rollback operation completed successfully",
  "result": {
    "rolledBackRecords": 150,
    "duration": 15000
  },
  "timestamp": "2023-12-21T10:30:45.789Z"
}
```

### 5. Test Connection
**GET** `/admin/test`

Tests the connectivity to both source and target databases.

**Response:**
```json
{
  "success": true,
  "message": "Migration system is operational",
  "connections": {
    "source": "Connected",
    "target": "Connected"
  },
  "timestamp": "2023-12-21T10:30:45.789Z",
  "version": "1.0.0"
}
```

### 6. Health Check
**GET** `/admin/health`

Gets the health status of all migration services.

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2023-12-21T10:30:45.789Z",
  "services": {
    "migrationService": "operational",
    "databaseConnection": "connected",
    "backupService": "operational",
    "validationService": "operational",
    "dataTransformationService": "operational"
  },
  "uptime": 3600,
  "memory": {
    "rss": 52428800,
    "heapTotal": 20971520,
    "heapUsed": 10485760,
    "external": 1048576
  }
}
```

### 7. Migration Statistics
**GET** `/admin/stats`

Gets migration statistics and performance metrics.

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalOperations": 25,
    "successfulOperations": 23,
    "failedOperations": 2,
    "totalRecordsProcessed": 15000,
    "averageProcessingTime": 45000,
    "lastOperationTime": "2023-12-21T10:30:45.789Z"
  },
  "timestamp": "2023-12-21T10:30:45.789Z"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "dataType must be one of the following values: DRIVER_MASTER, HEALTH_CHECKUP",
    "batchSize must not be greater than 1000"
  ]
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Migration operation not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Copy operation failed: Database connection failed",
  "error": "Database connection failed"
}
```

## Status Codes

- `PENDING`: Operation is queued but not started
- `IN_PROGRESS`: Operation is currently running
- `COMPLETED`: Operation completed successfully
- `FAILED`: Operation failed with errors
- `ROLLED_BACK`: Operation was rolled back

## Data Types

### DRIVER_MASTER
Copies driver master data including:
- Basic driver information
- Contact details
- Address information
- Health card details
- ABHA information

### HEALTH_CHECKUP
Copies health checkup data including:
- Consultation details
- Vital signs
- Test results
- Health metrics
- Medical history

## Safety Features

1. **Backup Creation**: Automatic backup before each operation
2. **Duplicate Prevention**: Skips existing records
3. **Data Validation**: Comprehensive validation before copying
4. **Rollback Capability**: Complete rollback functionality
5. **Progress Tracking**: Real-time progress monitoring
6. **Error Logging**: Detailed error tracking and reporting

## Rate Limiting

- Maximum 1 concurrent operation per data type
- Batch size limited to 1000 records
- Timeout set to 5 minutes per operation

## Monitoring

- All operations are logged with timestamps
- Progress tracking with estimated completion times
- Health monitoring for all services
- Performance metrics and statistics 