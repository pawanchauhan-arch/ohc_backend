# Migration API Documentation

## Multi-Source Migration APIs

### 1. Copy Driver Data from All Sources
**Endpoint:** `POST /migration/multi-source/copy/driver`

**Description:** Copies driver/patient data from all active source databases to the LMC DRIVERMASTER table in parallel.

**Request Body:**
```json
{
  "batchSize": 100,
  "enableBackup": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Multi-source driver migration completed",
  "data": {
    "success": true,
    "totalSources": 2,
    "successfulSources": 2,
    "failedSources": 0,
    "totalRecordsProcessed": 1500,
    "totalRecordsFailed": 0,
    "totalRecordsSkipped": 200,
    "startTime": "2024-01-15T10:00:00.000Z",
    "endTime": "2024-01-15T10:05:30.000Z",
    "duration": 330000,
    "sourceResults": [
      {
        "sourceName": "PICASO",
        "success": true,
        "totalRecords": 1000,
        "processedRecords": 800,
        "failedRecords": 0,
        "skippedRecords": 200,
        "errorCount": 0,
        "warningCount": 0,
        "startTime": "2024-01-15T10:00:00.000Z",
        "endTime": "2024-01-15T10:03:15.000Z",
        "duration": 195000,
        "errors": [],
        "warnings": [],
        "backupId": "backup_1234567890"
      },
      {
        "sourceName": "NEW_SOURCE",
        "success": true,
        "totalRecords": 500,
        "processedRecords": 700,
        "failedRecords": 0,
        "skippedRecords": 0,
        "errorCount": 0,
        "warningCount": 0,
        "startTime": "2024-01-15T10:00:00.000Z",
        "endTime": "2024-01-15T10:05:30.000Z",
        "duration": 330000,
        "errors": [],
        "warnings": [],
        "backupId": "backup_1234567891"
      }
    ],
    "aggregatedErrors": [],
    "aggregatedWarnings": []
  }
}
```

**Features:**
- **Parallel Processing:** Both sources are processed simultaneously
- **Source-Specific Creator IDs:** Each source uses its configured creator ID (99 for PICASO, 98 for NEW_SOURCE)
- **Duplicate Prevention:** Checks for existing records by `driverId` and `external_id`
- **Backup Creation:** Creates backups before migration (if enabled)
- **Error Isolation:** If one source fails, the other continues processing
- **Detailed Reporting:** Provides per-source and aggregated statistics

### 2. Copy Health Checkup Data from All Sources

#### **POST /migration/multi-source/copy/health-checkup**
Migrates health checkup data from all active sources in parallel.

**Request Body:**
```json
{
  "batchSize": 100,
  "enableBackup": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Multi-source health checkup migration completed",
  "operationId": "uuid",
  "result": {
    "success": true,
    "totalSources": 2,
    "successfulSources": 2,
    "failedSources": 0,
    "totalRecordsProcessed": 1500,
    "totalRecordsFailed": 0,
    "totalRecordsSkipped": 50,
    "sourceResults": [
      {
        "sourceName": "PICASO",
        "success": true,
        "totalRecords": 1000,
        "processedRecords": 950,
        "failedRecords": 0,
        "skippedRecords": 50
      },
      {
        "sourceName": "NEW_SOURCE",
        "success": true,
        "totalRecords": 500,
        "processedRecords": 550,
        "failedRecords": 0,
        "skippedRecords": 0
      }
    ]
  }
}
```

#### **POST /migration/multi-source/incremental/trigger**
Triggers incremental migration from all active sources (past hour records).

**Response:**
```json
{
  "success": true,
  "message": "Multi-source incremental migration completed",
  "result": {
    "success": true,
    "totalSources": 2,
    "successfulSources": 2,
    "failedSources": 0,
    "totalNewRecordsFound": 25,
    "totalRecordsMigrated": 20,
    "totalRecordsSkipped": 5,
    "sourceResults": [
      {
        "sourceName": "PICASO",
        "success": true,
        "newRecordsFound": 15,
        "recordsMigrated": 12,
        "recordsSkipped": 3
      },
      {
        "sourceName": "NEW_SOURCE",
        "success": true,
        "newRecordsFound": 10,
        "recordsMigrated": 8,
        "recordsSkipped": 2
      }
    ]
  }
}
```

#### **GET /migration/multi-source/stats**
Gets statistics for all configured sources.

**Response:**
```json
{
  "success": true,
  "message": "Multi-source statistics retrieved successfully",
  "stats": {
    "totalSources": 2,
    "activeSources": 2,
    "sourceDetails": [
      {
        "name": "PICASO",
        "isActive": true,
        "creatorId": 99,
        "connectionStatus": {
          "healthy": true
        }
      },
      {
        "name": "NEW_SOURCE",
        "isActive": true,
        "creatorId": 98,
        "connectionStatus": {
          "healthy": true
        }
      }
    ]
  }
}
```

#### **GET /migration/multi-source/health**
Gets health status for all sources and services.

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-08-12T10:30:00.000Z",
  "sources": {
    "total": 2,
    "active": 2,
    "inactive": 0,
    "connections": {
      "PICASO": {
        "healthy": true
      },
      "NEW_SOURCE": {
        "healthy": true
      }
    }
  },
  "services": {
    "sourceConfigurationService": "operational",
    "multiSourceDatabaseConnectionService": "operational",
    "multiSourceMigrationService": "operational"
  }
}
```

#### **GET /migration/multi-source/test-connections**
Tests connections to all active source databases.

**Response:**
```json
{
  "success": true,
  "message": "Connection tests completed",
  "results": {
    "PICASO": {
      "success": true
    },
    "NEW_SOURCE": {
      "success": true
    }
  }
}
```

### Legacy Endpoints (Backward Compatibility)

All existing endpoints continue to work with the first configured source:

- `POST /migration/copy/health-checkup` - Migrates from first source only
- `POST /migration/copy/driver-data` - Migrates from first source only
- `GET /migration/status/:operationId` - Legacy migration status
- `POST /migration/rollback/:operationId` - Legacy rollback
- `POST /migration/incremental/trigger` - Legacy incremental migration
- `GET /migration/incremental/stats` - Legacy incremental stats

## Database Schema & Table Mapping

### Source Database Tables (SQL Server)
- **PICASO Database:**
  - `Picaso_PatientMaster` → **Target:** `DRIVERMASTERs` (PostgreSQL)
  - `Picaso_PatientConsultingSheetdetails` → **Target:** `driverhealthcheckups` (PostgreSQL)

- **NEW_SOURCE Database:**
  - `Picaso_PatientMaster` → **Target:** `DRIVERMASTERs` (PostgreSQL)
  - `Picaso_PatientConsultingSheetdetails` → **Target:** `driverhealthcheckups` (PostgreSQL)

### Creator ID Mapping
- **PICASO Source:** Creator ID `99` (configurable via `PICASO_CREATOR_ID`)
- **NEW_SOURCE:** Creator ID `98` (configurable via `NEW_SOURCE_CREATOR_ID`)

### Database Schema Compatibility
The system is designed to work with the existing database schema. No additional columns are required for basic functionality.

## Scheduled Jobs & Automation

### Multi-Source Scheduled Migration

The system automatically runs incremental migration every hour for all active sources:

```typescript
// Runs every hour at minute 0
cron.schedule('0 0 * * * *', async () => {
  // Processes all active sources in parallel
  await multiSourceMigrationService.migrateNewRecordsFromAllSources();
}, {
  timezone: "Asia/Kolkata"
});
```

### Parallel Processing Benefits

1. **Performance**: Both sources processed simultaneously
2. **Efficiency**: Reduced total migration time
3. **Reliability**: Independent error handling
4. **Scalability**: Easy to add more sources

### Monitoring & Logging

The system provides comprehensive logging for each source:

```typescript
// Example log output
"Starting multi-source health checkup migration for 2 sources"
"Starting migration from source: PICASO"
"Starting migration from source: NEW_SOURCE"
"Migration completed for source PICASO: 950 processed, 50 skipped, 0 failed"
"Migration completed for source NEW_SOURCE: 550 processed, 0 skipped, 0 failed"
"Multi-source migration completed. Success: 2/2 sources"
```

## Environment Variables Configuration

### Required Environment Variables

Add these to your `.env` file:

```env
# PICASO Database Configuration
PICASO_DB_HOST=your_picaso_host
PICASO_DB_PORT=1433
PICASO_DB_NAME=your_picaso_database_name
PICASO_DB_USER=your_picaso_username
PICASO_DB_PASSWORD=your_picaso_password
PICASO_CREATOR_ID=99
PICASO_IS_ACTIVE=true

# NEW_SOURCE Database Configuration
NEW_SOURCE_DB_HOST=your_new_source_host
NEW_SOURCE_DB_PORT=1433
NEW_SOURCE_DB_NAME=your_new_source_database_name
NEW_SOURCE_DB_USER=your_new_source_username
NEW_SOURCE_DB_PASSWORD=your_new_source_password
NEW_SOURCE_CREATOR_ID=98
NEW_SOURCE_IS_ACTIVE=true

# Migration Configuration
MIGRATION_ENABLE_PARALLEL=true
MIGRATION_PARALLEL_DELAY=0
MIGRATION_BATCH_SIZE=100
MIGRATION_ENABLE_BACKUP=true
```

### Source Management

**Enable/Disable Sources:**
```bash
# Disable a specific source
PICASO_IS_ACTIVE=false
NEW_SOURCE_IS_ACTIVE=false
```

**Change Creator IDs:**
```bash
# Change creator IDs for migrated records
PICASO_CREATOR_ID=45
NEW_SOURCE_CREATOR_ID=50
```

**Parallel Processing:**
```bash
# Enable/disable parallel processing
MIGRATION_ENABLE_PARALLEL=true
MIGRATION_PARALLEL_DELAY=0  # Delay between sources (ms)
```

### Performance Tuning

```bash
# Batch processing
MIGRATION_BATCH_SIZE=100

# Connection pooling
MIGRATION_MAX_CONCURRENT=1

# Timeouts
MIGRATION_TIMEOUT=300000  # 5 minutes
MIGRATION_RETRY_ATTEMPTS=3
```

## Error Handling & Troubleshooting

### Common Issues & Solutions

#### 1. Database Connection Issues
**Error:** `Failed to connect to localhost:1433`
**Solution:** Update environment variables with correct database credentials

#### 2. Table Name Errors
**Error:** `Invalid object name 'driverhealthcheckups'`
**Solution:** System now correctly uses `Picaso_PatientConsultingSheetdetails` for source queries

#### 3. Backup Creation Failures
**Error:** `notNull Violation: BackupLog.tableType cannot be null`
**Solution:** Fixed in latest version - backup system now properly sets tableType

#### 4. Database Schema Issues
**Error:** `column "skipped_records" does not exist`
**Solution:** System updated to work with existing database schema

### Individual Source Failures

If one source fails, the other continues processing:

```json
{
  "success": false,  // Overall success is false if any source fails
  "totalSources": 2,
  "successfulSources": 1,
  "failedSources": 1,
  "sourceResults": [
    {
      "sourceName": "PICASO",
      "success": true,
      "processedRecords": 950
    },
    {
      "sourceName": "NEW_SOURCE",
      "success": false,
      "errors": ["Connection timeout"]
    }
  ]
}
```

### Error Aggregation

Errors from all sources are aggregated and deduplicated:

```json
{
  "aggregatedErrors": [
    "Connection timeout for NEW_SOURCE",
    "Validation failed for record 12345: Missing PatientID"
  ]
}
```

### Recovery Strategies

1. **Automatic Retry**: Failed sources can be retried manually
2. **Partial Success**: Some sources succeed, others fail
3. **Backup Protection**: Each source gets its own backup
4. **Detailed Logging**: Comprehensive error tracking

## Security Notes

### Database Security

1. **Connection Encryption**: All database connections use encrypted protocols
2. **Credential Management**: Database credentials stored in environment variables
3. **Read-Only Access**: Source databases accessed in read-only mode
4. **Connection Pooling**: Efficient connection management with timeouts

### API Security

1. **Input Validation**: All API inputs are validated
2. **Error Sanitization**: Error messages don't expose sensitive information
3. **Rate Limiting**: Consider implementing rate limiting for production
4. **Authentication**: Add authentication for production deployment

## Usage Examples

### Complete Migration Workflow

1. **Configure Sources:**
   ```bash
   export PICASO_DB_HOST=host1
   export PICASO_CREATOR_ID=99
   export NEW_SOURCE_DB_HOST=host2
   export NEW_SOURCE_CREATOR_ID=98
   ```

2. **Test Connections:**
   ```bash
   curl -X GET http://localhost:3001/migration/multi-source/test-connections
   ```

3. **Check Health:**
   ```bash
   curl -X GET http://localhost:3001/migration/multi-source/health
   ```

4. **Run Full Migration:**
   ```bash
   curl -X POST http://localhost:3001/migration/multi-source/copy/health-checkup \
     -H "Content-Type: application/json" \
     -d '{"batchSize": 100, "enableBackup": true}'
   ```

5. **Monitor Progress:**
   ```bash
   curl -X GET http://localhost:3001/migration/multi-source/stats
   ```

6. **Trigger Incremental:**
   ```bash
   curl -X POST http://localhost:3001/migration/multi-source/incremental/trigger
   ```

### Monitoring & Troubleshooting

**Check Source Status:**
```bash
curl -X GET http://localhost:3001/migration/multi-source/stats
```

**Test Individual Connections:**
```bash
curl -X GET http://localhost:3001/migration/multi-source/test-connections
```

**View Health Status:**
```bash
curl -X GET http://localhost:3001/migration/multi-source/health
```

**Check Incremental Migration Stats:**
```bash
curl -X GET http://localhost:3001/migration/incremental/stats
```

## Recent Updates & Fixes

### Version 2.0 Updates (Latest)

1. **✅ Multi-Source Architecture**: Complete support for multiple source databases
2. **✅ Parallel Processing**: Both sources processed simultaneously for better performance
3. **✅ Source-Specific Creator IDs**: Each source uses its own creator ID (99 for PICASO, 98 for NEW_SOURCE)
4. **✅ Table Name Corrections**: Fixed source table names (`Picaso_PatientConsultingSheetdetails`)
5. **✅ Database Schema Compatibility**: Works with existing database schema
6. **✅ Backup System Fixes**: Resolved backup creation issues
7. **✅ Error Handling**: Improved error isolation and reporting
8. **✅ Incremental Migration**: Hourly automatic migration for all sources
9. **✅ Connection Management**: Robust connection pooling and retry logic
10. **✅ Comprehensive Logging**: Detailed logs for monitoring and debugging

### Backward Compatibility

- **✅ Legacy APIs**: All existing single-source endpoints continue to work
- **✅ Existing Data**: No impact on existing migrated data
- **✅ Database Schema**: No required database changes
- **✅ Configuration**: Existing environment variables still supported

## Migration from Single-Source

If you're upgrading from the single-source system:

1. **Backward Compatibility**: All existing endpoints continue to work
2. **Gradual Migration**: Enable new sources one by one
3. **Testing**: Use test endpoints to verify connections
4. **Monitoring**: Monitor both old and new endpoints during transition

The multi-source system is designed to be a drop-in replacement that enhances the existing functionality without breaking changes.

## Performance Metrics

### Expected Performance

- **Full Migration**: ~10,000 records in 5-10 minutes (parallel processing)
- **Incremental Migration**: ~100 records in 30-60 seconds
- **Connection Testing**: < 5 seconds per source
- **Health Checks**: < 2 seconds

### Scalability

- **Current Support**: 2 source databases
- **Future Support**: Easily extensible to 5+ sources
- **Batch Processing**: Configurable batch sizes (default: 100)
- **Memory Usage**: Optimized for large datasets

## Support & Maintenance

### Regular Maintenance

1. **Monitor Logs**: Check application logs for errors
2. **Verify Connections**: Test database connections regularly
3. **Review Statistics**: Monitor migration success rates
4. **Backup Verification**: Ensure backups are created successfully

### Troubleshooting Commands

```bash
# Check if scheduled jobs are running
curl -X GET http://localhost:3001/migration/incremental/stats

# Test all database connections
curl -X GET http://localhost:3001/migration/multi-source/test-connections

# View system health
curl -X GET http://localhost:3001/migration/multi-source/health

# Check source configurations
curl -X GET http://localhost:3001/migration/multi-source/stats
```

The multi-source migration system is now fully operational and ready for production use!
