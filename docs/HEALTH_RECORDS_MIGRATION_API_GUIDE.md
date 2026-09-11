# 🏥 **HEALTH RECORDS MIGRATION API - POSTMAN TESTING GUIDE**

## 📋 **OVERVIEW**

This document provides comprehensive Postman API testing examples for the Health Records Migration System. The system migrates health test data from the `selected_test` JSON column in `driverhealthcheckups` table to individual dedicated tables for each test type.

---

## 🚀 **GETTING STARTED**

### **Prerequisites**
1. **Database Setup**: Run the SQL script to create health test tables
2. **Application Running**: Start your NestJS application
3. **Postman Installed**: Download from [postman.com](https://www.postman.com/)

### **Base URL**
```
http://localhost:3000/api/health-records-migration
```

---

## 🔧 **API ENDPOINTS REFERENCE**

### **1. HEALTH CHECK** 
**Purpose**: Verify the migration API is running and accessible.

```http
GET {{baseUrl}}/health
```

**Response Example**:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### **2. TEST ENDPOINT**
**Purpose**: Basic connectivity test for development/debugging.

```http
GET {{baseUrl}}/test
```

**Response Example**:
```json
{
  "message": "Health Records Migration API is working",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### **3. VALIDATE MIGRATION (DRY RUN)**
**Purpose**: Test data parsing and validation without actually migrating data. Helps identify potential issues before running the actual migration.

```http
POST {{baseUrl}}/validate
Content-Type: application/json

{
  "sampleSize": 10
}
```

**Request Parameters**:
- `sampleSize` (optional): Number of records to validate (default: 10, max: 100)

**Response Example**:
```json
{
  "success": true,
  "recordsValidated": 10,
  "testResults": [
    {
      "testType": "all",
      "success": true,
      "data": {
        "spo2": {
          "health_checkup_id": 123,
          "value": 99,
          "units": "%",
          "status": "success",
          "remark": "PASS"
        },
        "bloodPressure": {
          "health_checkup_id": 123,
          "systolic_value": 121,
          "diastolic_value": 83,
          "units": "mm Hg",
          "systolic_status": "warning",
          "diastolic_status": "warning"
        }
      }
    }
  ],
  "errors": [],
  "warnings": []
}
```

---

### **4. PREVIEW MIGRATION FOR SPECIFIC RECORD**
**Purpose**: Preview how a specific health checkup record will be parsed and migrated.

```http
GET {{baseUrl}}/preview/123
```

**URL Parameters**:
- `healthCheckupId`: ID of the health checkup record to preview

**Response Example**:
```json
{
  "healthCheckupId": 123,
  "originalData": {
    "spo2_unit": {
      "label": "SPO2",
      "value": "99",
      "units": "%",
      "status": "success",
      "remark": "PASS"
    },
    "blood_pressure_unit": {
      "systolic_bp_unit": {
        "value": "121",
        "status": "warning"
      },
      "diastolic_bp_unit": {
        "value": "83",
        "status": "warning"
      }
    }
  },
  "parsedData": {
    "spo2": {
      "health_checkup_id": 123,
      "value": 99,
      "units": "%",
      "status": "success",
      "remark": "PASS"
    },
    "bloodPressure": {
      "health_checkup_id": 123,
      "systolic_value": 121,
      "diastolic_value": 83,
      "units": "mm Hg",
      "systolic_status": "warning",
      "diastolic_status": "warning"
    }
  },
  "parsingSuccess": true,
  "errors": []
}
```

---

### **5. START MIGRATION**
**Purpose**: Begin the actual migration process. Can be run as a dry run or live migration.

```http
POST {{baseUrl}}/start
Content-Type: application/json

{
  "batchSize": 50,
  "dryRun": false,
  "startFromId": 1,
  "endAtId": 1000
}
```

**Request Parameters**:
- `batchSize` (optional): Records to process per batch (default: 100, max: 1000)
- `dryRun` (optional): Test run without actual data insertion (default: false)
- `startFromId` (optional): Start migration from specific health checkup ID
- `endAtId` (optional): End migration at specific health checkup ID

**Response Example**:
```json
{
  "success": true,
  "operationId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Migration started successfully",
  "initialStats": {
    "totalRecords": 1000,
    "processedRecords": 0,
    "successfulRecords": 0,
    "failedRecords": 0,
    "skippedRecords": 0,
    "testTypeStats": {}
  }
}
```

---

### **6. CHECK MIGRATION STATUS**
**Purpose**: Monitor the progress of an ongoing migration operation.

```http
GET {{baseUrl}}/status/550e8400-e29b-41d4-a716-446655440000
```

**URL Parameters**:
- `operationId`: UUID returned from start migration

**Response Example**:
```json
{
  "operationId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "RUNNING",
  "progress": 45.5,
  "stats": {
    "totalRecords": 1000,
    "processedRecords": 455,
    "successfulRecords": 450,
    "failedRecords": 5,
    "skippedRecords": 0,
    "testTypeStats": {
      "spo2": 455,
      "bloodPressure": 455,
      "temperature": 300,
      "pulse": 455
    }
  },
  "estimatedCompletion": "2024-01-15T11:15:00.000Z",
  "currentMessage": "Processing records... 455/1000 completed"
}
```

**Status Values**:
- `PENDING`: Migration queued for processing
- `RUNNING`: Migration in progress
- `COMPLETED`: Migration finished successfully
- `FAILED`: Migration encountered errors
- `ROLLED_BACK`: Migration has been rolled back

---

### **7. STOP MIGRATION**
**Purpose**: Stop a running migration operation.

```http
POST {{baseUrl}}/stop/550e8400-e29b-41d4-a716-446655440000
```

**Response Example**:
```json
{
  "success": true,
  "message": "Migration operation 550e8400-e29b-41d4-a716-446655440000 has been stopped"
}
```

---

### **8. GET MIGRATION REPORT**
**Purpose**: Get detailed report of a completed migration operation.

```http
GET {{baseUrl}}/report/550e8400-e29b-41d4-a716-446655440000
```

**Response Example**:
```json
{
  "operationId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "COMPLETED",
  "startTime": "2024-01-15T10:00:00.000Z",
  "endTime": "2024-01-15T10:45:00.000Z",
  "duration": 2700000,
  "config": {
    "batchSize": 50,
    "dryRun": false,
    "startFromId": 1,
    "endAtId": 1000
  },
  "stats": {
    "totalRecords": 1000,
    "processedRecords": 1000,
    "successfulRecords": 995,
    "failedRecords": 5,
    "skippedRecords": 0,
    "testTypeStats": {
      "spo2": 1000,
      "bloodPressure": 1000,
      "temperature": 800,
      "pulse": 1000,
      "bmi": 900,
      "randomBloodSugar": 700
    }
  },
  "errors": [
    "Health checkup 567: Invalid JSON in selected_test",
    "Health checkup 890: Missing required field"
  ],
  "warnings": [
    "Health checkup 234: Missing optional field 'remark'",
    "Health checkup 456: Unusual value for SPO2"
  ]
}
```

---

### **9. ROLLBACK MIGRATION**
**Purpose**: Rollback a completed migration operation (removes migrated data from new tables).

```http
POST {{baseUrl}}/rollback
Content-Type: application/json

{
  "operationId": 550e8400-e29b-41d4-a716-446655440000
}
```

**Response Example**:
```json
{
  "success": true,
  "message": "Migration operation successfully rolled back. 995 records removed from health test tables."
}
```

---

### **10. GET ALL OPERATIONS**
**Purpose**: List all migration operations with optional filtering.

```http
GET {{baseUrl}}/operations?status=COMPLETED&limit=10
```

**Query Parameters**:
- `status` (optional): Filter by status (PENDING, RUNNING, COMPLETED, FAILED, ROLLED_BACK)
- `limit` (optional): Limit number of results

**Response Example**:
```json
[
  {
    "operationId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "COMPLETED",
    "startTime": "2024-01-15T10:00:00.000Z",
    "endTime": "2024-01-15T10:45:00.000Z",
    "stats": {
      "totalRecords": 1000,
      "processedRecords": 1000,
      "successfulRecords": 995,
      "failedRecords": 5
    },
    "config": {
      "batchSize": 50,
      "dryRun": false
    }
  },
  {
    "operationId": "660f9500-f39c-52e5-b827-557766551111",
    "status": "FAILED",
    "startTime": "2024-01-15T09:00:00.000Z",
    "endTime": "2024-01-15T09:15:00.000Z",
    "stats": {
      "totalRecords": 500,
      "processedRecords": 150,
      "successfulRecords": 100,
      "failedRecords": 50
    },
    "config": {
      "batchSize": 100,
      "dryRun": false
    }
  }
]
```

---

## 📖 **STEP-BY-STEP TESTING WORKFLOW**

### **Phase 1: Setup and Verification**
1. **Test Connectivity**
   ```http
   GET {{baseUrl}}/health
   GET {{baseUrl}}/test
   ```

2. **Validate Sample Data**
   ```http
   POST {{baseUrl}}/validate
   {
     "sampleSize": 5
   }
   ```

3. **Preview Specific Records**
   ```http
   GET {{baseUrl}}/preview/123
   GET {{baseUrl}}/preview/456
   ```

### **Phase 2: Dry Run Testing**
1. **Run Dry Migration**
   ```http
   POST {{baseUrl}}/start
   {
     "batchSize": 10,
     "dryRun": true,
     "startFromId": 1,
     "endAtId": 50
   }
   ```

2. **Monitor Progress**
   ```http
   GET {{baseUrl}}/status/{operationId}
   ```

3. **Check Results**
   ```http
   GET {{baseUrl}}/report/{operationId}
   ```

### **Phase 3: Production Migration**
1. **Start Live Migration**
   ```http
   POST {{baseUrl}}/start
   {
     "batchSize": 100,
     "dryRun": false
   }
   ```

2. **Monitor Progress** (repeat as needed)
   ```http
   GET {{baseUrl}}/status/{operationId}
   ```

3. **Review Final Report**
   ```http
   GET {{baseUrl}}/report/{operationId}
   ```

---

## 🛠 **POSTMAN ENVIRONMENT SETUP**

### **Create Environment Variables**
Create a Postman environment with these variables:

```json
{
  "baseUrl": "http://localhost:3000/api/health-records-migration",
  "operationId": "",
  "healthCheckupId": "123"
}
```

### **Pre-request Scripts**
For operations that need an operation ID, use this pre-request script:

```javascript
// Store operation ID from previous response
if (pm.response && pm.response.json()) {
    const responseJson = pm.response.json();
    if (responseJson.operationId) {
        pm.environment.set("operationId", responseJson.operationId);
    }
}
```

---

## ⚠️ **ERROR HANDLING**

### **Common Error Responses**

**404 - Not Found**
```json
{
  "statusCode": 404,
  "message": "Migration operation 123 not found",
  "error": "Not Found"
}
```

**500 - Internal Server Error**
```json
{
  "statusCode": 500,
  "message": "Failed to start migration: Database connection error",
  "error": "Internal Server Error"
}
```

**400 - Bad Request**
```json
{
  "statusCode": 400,
  "message": [
    "batchSize must not be greater than 1000",
    "sampleSize must be a positive number"
  ],
  "error": "Bad Request"
}
```

---

## 🏃 **HOW TO RUN THE SYSTEM**

### **1. Start Your Application**
```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

### **2. Verify Application is Running**
```bash
# Check if server is running
curl http://localhost:3000/api/health-records-migration/health
```

### **3. Import Postman Collection**
1. Open Postman
2. Click "Import"
3. Create requests using the examples above
4. Set up environment variables

### **4. Test Migration Workflow**
1. Run health check
2. Validate sample data
3. Preview specific records
4. Run dry migration
5. Execute live migration
6. Monitor and review results

---

## 📊 **MONITORING AND TROUBLESHOOTING**

### **Key Metrics to Monitor**
- **Progress Percentage**: Overall completion status
- **Batch Processing**: Records processed per batch
- **Error Rate**: Failed vs successful records
- **Test Type Coverage**: Which tests are being migrated
- **Performance**: Processing speed and time estimates

### **Common Issues**
1. **Invalid JSON**: Check `selected_test` column data format
2. **Missing Data**: Some health checkups may not have test data
3. **Performance**: Adjust batch size based on system capacity
4. **Memory**: Monitor for large dataset migrations

---

## 🎯 **BEST PRACTICES**

1. **Always start with validation** before live migration
2. **Use preview** to understand data structure
3. **Run dry runs** on production-like data
4. **Monitor progress** during long migrations
5. **Keep operation IDs** for tracking and rollback
6. **Test rollback** functionality in non-production environment
7. **Backup data** before running live migrations

---
