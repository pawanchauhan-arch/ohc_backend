# 🏥 **HEALTH RECORDS MIGRATION IMPLEMENTATION GUIDE**

## 📋 **OVERVIEW**

This guide provides complete documentation for the Health Records Migration System that transforms `selected_test` JSON data from the `driverhealthcheckups` table into individual normalized test tables.

## 🎯 **SYSTEM ARCHITECTURE**

### **Database Schema**
- **14 Individual Test Tables**: Each test type (SPO2, Blood Pressure, Temperature, etc.) has its own dedicated table
- **Foreign Key Relationships**: All test tables reference `driverhealthcheckups.id`
- **Normalized Structure**: Clean separation of test data without redundant standard values

### **Backend Components**
- **NestJS Module**: `HealthRecordsMigrationModule`
- **Service Layer**: `HealthRecordsMigrationService` for business logic
- **Controller Layer**: REST API endpoints for migration management
- **Utility Services**: Data parsing, validation, and logging utilities

---

## 🚀 **GETTING STARTED**

### **Step 1: Database Setup**

Run the SQL script to create all test tables:

```bash
# Execute the SQL script on your PostgreSQL database
psql -h your_host -U your_username -d your_database -f scripts/sql/create-health-test-tables.sql
```

### **Step 2: Application Setup**

The migration module is already integrated into your NestJS application. Ensure your application is running:

```bash
npm run start:dev
```

### **Step 3: Verify Setup**

Check if the migration service is healthy:

```bash
curl http://localhost:3000/api/health-records-migration/health
```

---

## 📊 **API ENDPOINTS**

### **Base URL**: `http://localhost:3000/api/health-records-migration`

### **1. Start Migration**
```http
POST /start
Content-Type: application/json

{
  "batchSize": 100,
  "dryRun": false,
  "startFromId": 1,
  "endAtId": 1000
}
```

**Response:**
```json
{
  "success": true,
  "operationId": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
  "message": "Migration started successfully",
  "initialStats": {
    "totalRecords": 500,
    "processedRecords": 0,
    "successfulRecords": 0,
    "failedRecords": 0,
    "skippedRecords": 0,
    "testTypeStats": {}
  }
}
```

### **2. Check Migration Status**
```http
GET /status/{operationId}
```

**Response:**
```json
{
  "operationId": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
  "status": "RUNNING",
  "progress": 75,
  "stats": {
    "totalRecords": 500,
    "processedRecords": 375,
    "successfulRecords": 370,
    "failedRecords": 5,
    "skippedRecords": 0,
    "testTypeStats": {
      "spo2": 350,
      "bloodPressure": 340,
      "temperature": 360,
      "pulse": 355
    }
  },
  "estimatedCompletion": "2024-01-15T14:30:00.000Z",
  "currentMessage": "Processing records... 375/500 completed"
}
```

### **3. Validate Migration Data**
```http
POST /validate
Content-Type: application/json

{
  "sampleSize": 10
}
```

### **4. Preview Migration**
```http
GET /preview/{healthCheckupId}
```

### **5. Rollback Migration**
```http
POST /rollback
Content-Type: application/json

{
  "operationId": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
}
```

### **6. Get Migration Report**
```http
GET /report/{operationId}
```

### **7. Health Check**
```http
GET /health
```

---

## 🗄️ **DATABASE TABLES**

### **Created Tables:**

1. **`spo2_tests`** - SPO2 (Oxygen Saturation) results
2. **`blood_pressure_tests`** - Blood pressure with systolic/diastolic values
3. **`temperature_tests`** - Body temperature results
4. **`pulse_tests`** - Pulse rate results
5. **`bmi_tests`** - BMI with height and weight data
6. **`random_blood_sugar_tests`** - Blood sugar level results
7. **`haemoglobin_tests`** - Haemoglobin level results
8. **`alcohol_tests`** - Alcohol test results
9. **`ecg_tests`** - ECG test results with document URLs
10. **`vision_tests`** - Vision test results
11. **`romberg_tests`** - Romberg balance test results
12. **`pulmonary_function_tests`** - Pulmonary function test results
13. **`hiv_tests`** - HIV test results
14. **`eye_tests`** - Eye examination with spherical/cylindrical measurements

### **Common Table Structure:**
```sql
CREATE TABLE example_tests (
    id SERIAL PRIMARY KEY,
    health_checkup_id INTEGER NOT NULL REFERENCES driverhealthcheckups(id) ON DELETE CASCADE,
    value [DATA_TYPE],
    units VARCHAR(10),
    status VARCHAR(20),
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(health_checkup_id)
);
```

---

## 🔄 **MIGRATION PROCESS**

### **Data Flow:**
1. **Source**: `driverhealthcheckups.selected_test` (JSON column)
2. **Parsing**: JSON is parsed and individual test data is extracted
3. **Validation**: Data is validated for consistency and ranges
4. **Transformation**: Data is mapped to appropriate table structures
5. **Insertion**: Data is inserted into respective test tables
6. **Logging**: Progress and errors are tracked

### **Batch Processing:**
- Records are processed in configurable batches (default: 100)
- Each batch is processed within a database transaction
- Failed records don't stop the entire migration
- Progress is tracked in real-time

### **Error Handling:**
- **Validation Errors**: Invalid data is logged but doesn't stop migration
- **Parsing Errors**: Malformed JSON is logged and skipped
- **Database Errors**: Transaction rollbacks prevent partial insertions
- **System Errors**: Migration status is updated to FAILED

---

## 📈 **MONITORING & LOGGING**

### **Operation Tracking:**
- Each migration gets a unique operation ID (UUID)
- Real-time status updates (PENDING → RUNNING → COMPLETED/FAILED)
- Progress percentage calculation
- Estimated completion time

### **Statistics Tracking:**
- Total records processed
- Success/failure counts
- Test type distribution
- Processing speed metrics

### **Error Logging:**
- Detailed error messages
- Health checkup ID references
- Warning notifications
- Comprehensive migration reports

---

## 🔧 **CONFIGURATION OPTIONS**

### **Migration Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `batchSize` | number | 100 | Records processed per batch |
| `dryRun` | boolean | false | Validate without inserting data |
| `startFromId` | number | null | Starting health checkup ID |
| `endAtId` | number | null | Ending health checkup ID |

### **Performance Tuning:**
- **Batch Size**: Adjust based on system performance (50-500)
- **Connection Pooling**: Configured in NestJS Sequelize settings
- **Indexing**: All tables have performance indexes
- **Memory Management**: Batch processing prevents memory overflow

---

## 🛠️ **TESTING PROCEDURES**

### **Pre-Migration Testing:**

1. **Validation Test:**
```bash
curl -X POST http://localhost:3000/api/health-records-migration/validate \
  -H "Content-Type: application/json" \
  -d '{"sampleSize": 10}'
```

2. **Preview Test:**
```bash
curl http://localhost:3000/api/health-records-migration/preview/1
```

3. **Dry Run:**
```bash
curl -X POST http://localhost:3000/api/health-records-migration/start \
  -H "Content-Type: application/json" \
  -d '{"batchSize": 50, "dryRun": true}'
```

### **Production Migration:**

1. **Backup Database:**
```bash
pg_dump -h your_host -U your_username your_database > backup_before_migration.sql
```

2. **Start Migration:**
```bash
curl -X POST http://localhost:3000/api/health-records-migration/start \
  -H "Content-Type: application/json" \
  -d '{"batchSize": 100, "dryRun": false}'
```

3. **Monitor Progress:**
```bash
curl http://localhost:3000/api/health-records-migration/status/{operationId}
```

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues:**

1. **Migration Stuck in RUNNING:**
   - Check application logs for errors
   - Verify database connectivity
   - Restart application if necessary

2. **High Failure Rate:**
   - Run validation to identify data issues
   - Check JSON format in selected_test column
   - Review error logs for specific problems

3. **Performance Issues:**
   - Reduce batch size
   - Check database performance
   - Monitor system resources

4. **Rollback Issues:**
   - Ensure migration is in COMPLETED status
   - Check database permissions
   - Verify foreign key constraints

### **Error Recovery:**
```bash
# Get detailed error report
curl http://localhost:3000/api/health-records-migration/report/{operationId}

# Rollback if necessary
curl -X POST http://localhost:3000/api/health-records-migration/rollback \
  -H "Content-Type: application/json" \
  -d '{"operationId": "your-operation-id"}'
```

---

## 📚 **DATA MAPPING REFERENCE**

### **JSON to Table Mapping:**

| JSON Key | Target Table | Notes |
|----------|--------------|-------|
| `spo2_unit` | `spo2_tests` | Oxygen saturation percentage |
| `blood_pressure_unit` | `blood_pressure_tests` | Systolic and diastolic values |
| `temperature_unit` | `temperature_tests` | Body temperature in Fahrenheit |
| `pulse_unit` | `pulse_tests` | Heart rate in BPM |
| `bmi_unit` | `bmi_tests` | Includes height and weight |
| `random_blood_sugar_unit` | `random_blood_sugar_tests` | Blood glucose level |
| `haemoglobin_unit` | `haemoglobin_tests` | Hemoglobin concentration |
| `alchol_test_unit` | `alcohol_tests` | Note: typo in original JSON |
| `ecg_unit` | `ecg_tests` | Includes document URL |
| `vision_unit` | `vision_tests` | Visual acuity results |
| `romberg_unit` | `romberg_tests` | Balance test results |
| `pulmonary_function_test_unit` | `pulmonary_function_tests` | Lung function metrics |
| `hiv_unit` | `hiv_tests` | HIV test results |
| `eye_unit` | `eye_tests` | Detailed eye examination |

---

## ✅ **POST-MIGRATION VERIFICATION**

### **Data Integrity Checks:**

1. **Record Count Verification:**
```sql
-- Compare total records
SELECT COUNT(*) FROM driverhealthcheckups WHERE selected_test IS NOT NULL;

-- Check individual test tables
SELECT 'spo2_tests' as table_name, COUNT(*) as count FROM spo2_tests
UNION ALL
SELECT 'blood_pressure_tests', COUNT(*) FROM blood_pressure_tests
UNION ALL
SELECT 'temperature_tests', COUNT(*) FROM temperature_tests;
-- ... continue for all tables
```

2. **Sample Data Verification:**
```sql
-- Compare original JSON with migrated data
SELECT 
    dhc.id,
    dhc.selected_test,
    st.value as spo2_value,
    st.status as spo2_status
FROM driverhealthcheckups dhc
LEFT JOIN spo2_tests st ON dhc.id = st.health_checkup_id
WHERE dhc.id = 1;
```

3. **Referential Integrity:**
```sql
-- Check for orphaned records
SELECT COUNT(*) FROM spo2_tests st
LEFT JOIN driverhealthcheckups dhc ON st.health_checkup_id = dhc.id
WHERE dhc.id IS NULL;
```

---

## 🔮 **FUTURE ENHANCEMENTS**

### **Planned Features:**
- **Incremental Migration**: Process only new/updated records
- **Data Synchronization**: Keep JSON and tables in sync
- **Advanced Analytics**: Built-in reporting on migrated data
- **Performance Dashboards**: Real-time migration metrics
- **Automated Testing**: Comprehensive test suites

### **Integration Opportunities:**
- **Health Analysis Module**: Enhanced analytics with normalized data
- **Reporting System**: Detailed health reports by test type
- **API Extensions**: REST endpoints for individual test data
- **Data Export**: CSV/Excel export functionality

---

## 📞 **SUPPORT**

For technical support or questions about the Health Records Migration System:

1. **Check Logs**: Application logs contain detailed error information
2. **Review Documentation**: This guide covers most common scenarios
3. **API Testing**: Use the provided curl examples for troubleshooting
4. **Database Queries**: SQL examples help verify data integrity

---

## 🎉 **CONCLUSION**

The Health Records Migration System provides a robust, scalable solution for transforming your health data from JSON format to normalized database tables. With comprehensive error handling, real-time monitoring, and rollback capabilities, you can confidently migrate your data while maintaining system integrity.

**Key Benefits:**
- ✅ **Data Normalization**: Clean, structured data storage
- ✅ **Performance Optimization**: Faster queries on individual test types
- ✅ **Scalability**: Easy to add new test types in the future
- ✅ **Data Integrity**: Foreign key constraints and validation
- ✅ **Monitoring**: Real-time progress tracking and reporting
- ✅ **Safety**: Rollback capabilities and comprehensive logging
