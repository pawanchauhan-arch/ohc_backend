# Migration Implementation Guide

## Overview
This guide provides step-by-step instructions for setting up and using the data migration system that copies data from Picaso SQL Server to Last Mile Care PostgreSQL system.

## Prerequisites

### System Requirements
- Node.js 16+ 
- PostgreSQL 12+
- SQL Server 2016+
- NestJS framework
- TypeScript

### Database Access
- Read access to Picaso SQL Server database
- Write access to Last Mile Care PostgreSQL database
- Network connectivity between systems

## Installation & Setup

### Step 1: Install Dependencies
```bash
# Install SQL Server driver and utilities
npm install mssql @types/mssql node-cron @types/node-cron winston @types/winston

# Install development dependencies
npm install --save-dev @types/jest
```

### Step 2: Configure Environment Variables
Add the following to your `.env` file:

```bash
# Source Database (Picaso SQL Server)
SOURCE_DB_HOST=your_sql_server_host
SOURCE_DB_PORT=1433
SOURCE_DB_NAME=LastMileCareDB
SOURCE_DB_USER=your_username
SOURCE_DB_PASSWORD=your_password

# Migration Configuration
MIGRATION_BATCH_SIZE=100
MIGRATION_RETRY_ATTEMPTS=3
MIGRATION_TIMEOUT=300000
MIGRATION_ENABLE_BACKUP=true
MIGRATION_ENABLE_LOGGING=true
MIGRATION_MAX_CONCURRENT=1
MIGRATION_PROGRESS_INTERVAL=5000

# Backup Configuration
BACKUP_DIR=./backups
```

### Step 3: Database Setup
The migration system will automatically create the required tables:
- `migration_logs`: Tracks all migration operations
- `backup_logs`: Tracks database backups

### Step 4: Verify Installation
```bash
# Start the application
npm run start:dev

# Test connectivity
curl http://localhost:3000/migration/admin/test
```

## Usage Instructions

### 1. Test Connectivity
Before running any migration, test the database connections:

```bash
GET /migration/admin/test
```

Expected response:
```json
{
  "success": true,
  "message": "Migration system is operational",
  "connections": {
    "source": "Connected",
    "target": "Connected"
  }
}
```

### 2. Copy Driver Data
To copy driver master data:

```bash
POST /migration/copy/driver-data
Content-Type: application/json

{
  "dataType": "DRIVER_MASTER",
  "batchSize": 100,
  "enableBackup": true,
  "validateOnly": false
}
```

### 3. Copy Health Checkup Data
To copy health checkup data:

```bash
POST /migration/copy/health-checkup
Content-Type: application/json

{
  "dataType": "HEALTH_CHECKUP",
  "batchSize": 50,
  "enableBackup": true,
  "validateOnly": false
}
```

### 4. Monitor Progress
Check the status of a migration operation:

```bash
GET /migration/status/{operationId}
```

### 5. Rollback if Needed
If something goes wrong, rollback the operation:

```bash
POST /migration/rollback/{operationId}
```

## Configuration Options

### Batch Size
Controls how many records are processed in each batch:
- **Small batches (10-50)**: Slower but safer, less memory usage
- **Large batches (100-500)**: Faster but more memory usage
- **Default**: 100 records per batch

### Backup Settings
- **enableBackup**: Creates database backup before migration
- **backupDir**: Directory to store backup files
- **Recommended**: Always enable backups for production

### Validation Settings
- **validateOnly**: Run validation without copying data
- **skipValidation**: Skip data validation (not recommended)
- **Recommended**: Always validate data before copying

## Safety Features

### 1. Automatic Backups
- Creates backup before each operation
- Stores backup metadata in database
- Enables complete rollback capability

### 2. Duplicate Prevention
- Checks for existing records before copying
- Skips records that already exist
- Prevents data duplication

### 3. Data Validation
- Validates required fields
- Checks data types and formats
- Handles invalid dates (like 1752)
- Validates business rules

### 4. Progress Tracking
- Real-time progress monitoring
- Estimated completion times
- Detailed error reporting
- Batch-level tracking

### 5. Error Handling
- Comprehensive error logging
- Graceful failure recovery
- Detailed error messages
- Retry mechanisms

## Monitoring & Maintenance

### Health Monitoring
Check system health regularly:

```bash
GET /migration/admin/health
```

### Performance Monitoring
Monitor migration statistics:

```bash
GET /migration/admin/stats
```

### Log Monitoring
Monitor application logs for:
- Migration progress
- Error messages
- Performance metrics
- Security events

### Backup Management
- Regular backup cleanup
- Monitor backup storage
- Verify backup integrity
- Test restore procedures

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed
**Symptoms**: Connection timeout or authentication errors
**Solutions**:
- Verify database credentials
- Check network connectivity
- Ensure firewall rules allow connections
- Verify SQL Server is running

#### 2. Validation Errors
**Symptoms**: Migration fails during validation
**Solutions**:
- Review validation error messages
- Check source data quality
- Fix data format issues
- Update validation rules if needed

#### 3. Memory Issues
**Symptoms**: Application crashes or slow performance
**Solutions**:
- Reduce batch size
- Increase server memory
- Monitor memory usage
- Optimize queries

#### 4. Backup Failures
**Symptoms**: Backup creation fails
**Solutions**:
- Check disk space
- Verify backup directory permissions
- Ensure PostgreSQL is running
- Check backup configuration

### Debug Mode
Enable debug logging by setting:
```bash
MIGRATION_ENABLE_LOGGING=true
```

### Performance Optimization
1. **Batch Size**: Adjust based on server capacity
2. **Concurrent Operations**: Limit to prevent overload
3. **Database Indexes**: Ensure proper indexing
4. **Network**: Optimize network connectivity

## Security Considerations

### 1. Database Security
- Use encrypted connections
- Implement proper authentication
- Restrict database access
- Monitor access logs

### 2. API Security
- Implement authentication
- Use HTTPS in production
- Rate limit API calls
- Validate all inputs

### 3. Data Security
- Encrypt sensitive data
- Secure backup files
- Implement audit logging
- Regular security updates

## Production Deployment

### 1. Environment Setup
- Configure production database connections
- Set up monitoring and alerting
- Implement logging aggregation
- Configure backup storage

### 2. Performance Tuning
- Optimize database queries
- Configure connection pooling
- Set appropriate timeouts
- Monitor resource usage

### 3. Monitoring Setup
- Set up health checks
- Configure error alerting
- Monitor performance metrics
- Track migration statistics

### 4. Backup Strategy
- Regular automated backups
- Test restore procedures
- Monitor backup storage
- Implement backup rotation

## Support & Maintenance

### Regular Tasks
1. **Daily**: Check migration logs and health status
2. **Weekly**: Review performance metrics and clean old backups
3. **Monthly**: Update documentation and test procedures
4. **Quarterly**: Review security settings and update dependencies

### Emergency Procedures
1. **Data Corruption**: Use rollback functionality
2. **System Failure**: Restart services and check logs
3. **Performance Issues**: Reduce batch size and monitor resources
4. **Security Breach**: Review logs and update security settings

## Best Practices

### 1. Testing
- Always test in development environment first
- Use small datasets for initial testing
- Validate data integrity after migration
- Test rollback procedures

### 2. Monitoring
- Monitor all migration operations
- Set up alerts for failures
- Track performance metrics
- Review logs regularly

### 3. Documentation
- Document all configuration changes
- Keep migration logs for audit
- Update procedures as needed
- Maintain troubleshooting guides

### 4. Security
- Use strong authentication
- Encrypt sensitive data
- Monitor access logs
- Regular security updates

This implementation guide provides comprehensive instructions for setting up, using, and maintaining the migration system. Follow these guidelines to ensure safe and efficient data migration operations. 