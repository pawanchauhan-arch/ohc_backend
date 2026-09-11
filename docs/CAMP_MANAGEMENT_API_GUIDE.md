# Health Checkup Camp Management System - API Documentation

## Overview
This document provides comprehensive API documentation for the Health Checkup Camp Management System. The system allows operators to manage patients, create health checkup camps, and track the complete workflow from patient registration to camp completion.

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Authentication & Authorization](#authentication--authorization)
3. [Patient Management APIs](#patient-management-apis)
4. [Camp Management APIs](#camp-management-apis)
5. [Camp Item Management APIs](#camp-item-management-apis)
6. [Barcode Management APIs](#barcode-management-apis)
7. [Error Handling](#error-handling)
8. [Testing Guide](#testing-guide)
9. [Database Schema](#database-schema)

---

## System Architecture

### Core Entities
- **DRIVERMASTERs**: Patient/driver master data with global `employee_id`, `client_id`, and CET linkage
- **camp_lists**: Health checkup camps with date, location, and completion status
- **camp_list_items**: Individual patient enrollments in camps
- **camp_item_barcodes**: Barcode data associated with camp items (multiple per item)

### Data Flow
1. **Patient Upload** → Create/update driver master records via CSV
2. **Camp Creation** → Set date and location for health checkup
3. **Camp Enrollment** → Enroll existing patients in camp via CSV
4. **Camp Execution** → Capture barcodes, ID proofs, link health records
5. **Camp Completion** → Mark items and camp as completed

---

## Authentication & Authorization

### Current Implementation
- All endpoints require `center_id` parameter for data isolation
- Operations are scoped to the provided `center_id`
- Center ID validation ensures only valid numeric values are accepted

### Required Parameters
- `center_id`: Must be provided in request body (POST/PATCH) or query parameters (GET/DELETE)
- Must be a valid positive integer

### Error Handling
- **400 Bad Request**: When `center_id` is missing, invalid, or not a positive number
- **404 Not Found**: When camp or related resources are not found
- **500 Internal Server Error**: For unexpected server errors

### Required Headers
```
Content-Type: application/json
```

---

## Patient Management APIs

### 1. Upload Patients CSV

**Endpoint**: `POST /api/drivers/import-csv`

**Description**: Upload CSV file to create or update patient records in the system.

**Query Parameters**:
- `cetId` (required): Valid CET ID from CETMANAGEMENTs table
- `center_id` (required): Valid center ID for data isolation

**Request**:
- **Content-Type**: `multipart/form-data`
- **Body**: 
  - `file`: CSV file with patient data

**CSV Format** (required columns):
```csv
employee_id,client_id,name,contactNumber,gender
EMP001,1001,John Doe,9876543210,Male
EMP002,1002,Jane Smith,9876543211,Female
EMP003,1003,Bob Johnson,9876543212,Male
```

**Response**:
```json
{
  "total": 3,
  "created": 3,
  "updated": 0,
  "skipped": 0,
  "errors": []
}
```

**Error Response**:
```json
{
  "total": 3,
  "created": 1,
  "updated": 0,
  "skipped": 2,
  "errors": [
    {
      "row": 3,
      "reason": "missing_employee_id"
    },
    {
      "row": 4,
      "employee_id": "EMP999",
      "reason": "create_failed"
    }
  ]
}
```

**Business Rules**:
- `employee_id` must be globally unique
- `client_id` is stored as plain integer (no FK constraint)
- `driver_cetid` is set from the provided `cetId`
- `createdBy` is set to the operator's `center_id`

---

## Camp Management APIs

### 2. Create Camp

**Endpoint**: `POST /api/camps`

**Description**: Create a new health checkup camp.

**Request**:
```json
{
  "center_id": 123,
  "scheduledOn": "2024-02-15",
  "locationText": "Health Center, Mumbai"
}
```

**Required Parameters**:
- `center_id` (number): The center ID for the camp
- `scheduledOn` (string): Date in YYYY-MM-DD format

**Optional Parameters**:
- `locationText` (string): Location description

**Response**:
```json
{
  "id": 1,
  "center_id": 1,
  "scheduled_on": "2024-02-15",
  "location_text": "Health Center, Mumbai",
  "is_completed": false,
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

### 3. List All Camps

**Endpoint**: `GET /api/camps`

**Description**: Retrieve all camps for the specified center.

**Query Parameters**:
- `center_id` (required): The center ID to filter camps

**Example**: `GET /api/camps?center_id=123`

**Response**:
```json
[
  {
    "id": 1,
    "center_id": 1,
    "scheduled_on": "2024-02-15",
    "location_text": "Health Center, Mumbai",
    "is_completed": false,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
]
```

### 4. Get Camp Details

**Endpoint**: `GET /api/camps/{campId}`

**Description**: Retrieve detailed information about a specific camp including enrolled patients.

**Query Parameters**:
- `center_id` (required): The center ID to filter camps

**Example**: `GET /api/camps/1?center_id=123`

**Response**:
```json
{
  "id": 1,
  "center_id": 1,
  "scheduled_on": "2024-02-15",
  "location_text": "Health Center, Mumbai",
  "is_completed": false,
  "items": [
    {
      "id": 1,
      "camp_id": 1,
      "driver_id": 1,
      "is_completed": false,
      "driver_health_checkup_id": null,
      "id_proof_image": null,
      "remarks": null
    }
  ]
}
```

### 5. Update Camp

**Endpoint**: `PATCH /api/camps/{campId}`

**Description**: Update camp details.

**Query Parameters**:
- `center_id` (required): The center ID for data isolation

**Request**:
```json
{
  "scheduledOn": "2024-02-20",
  "locationText": "Updated Health Center, Delhi",
  "isCompleted": true
}
```

**Example**: `PATCH /api/camps/1?center_id=123`

**Optional Parameters**:
- `scheduledOn` (string): New date in YYYY-MM-DD format
- `locationText` (string): Updated location description
- `isCompleted` (boolean): Mark camp as completed

**Response**:
```json
{
  "id": 1,
  "center_id": 1,
  "scheduled_on": "2024-02-20",
  "location_text": "Updated Health Center, Delhi",
  "is_completed": true,
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T11:00:00Z"
}
```

---

## Camp Item Management APIs

### 6. Upload Camp Items CSV

**Endpoint**: `POST /api/camps/{campId}/items/import-csv`

**Description**: Upload CSV file to enroll existing patients in a camp.

**Query Parameters**:
- `center_id` (required): Valid center ID for data isolation

**Request**:
- **Content-Type**: `multipart/form-data`
- **Body**: 
  - `file`: CSV file with employee IDs

**CSV Format** (required columns):
```csv
employee_id
EMP001
EMP002
EMP003
```

**Response**:
```json
{
  "total": 3,
  "inserted": 3,
  "skipped": 0,
  "errors": []
}
```

**Error Response**:
```json
{
  "total": 3,
  "inserted": 2,
  "skipped": 1,
  "errors": [
    {
      "row": 3,
      "employee_id": "EMP999",
      "reason": "driver_not_found"
    }
  ]
}
```

**Business Rules**:
- Only existing patients (from step 1) can be enrolled
- Patients must belong to the same center as the camp
- Duplicate enrollments are skipped
- Global `employee_id` is used for patient resolution

### 7. Add Single Patient to Camp

**Endpoint**: `POST /api/camps/{campId}/items`

**Description**: Manually add a single patient to a camp.

**Request**:
```json
{
  "center_id": 123,
  "driverId": 1,
  "remarks": "Added manually"
}
```

**Required Parameters**:
- `center_id` (number): The center ID for data isolation
- `driverId` (number): The driver/patient ID to add to the camp

**Optional Parameters**:
- `remarks` (string): Additional remarks for the camp item

**Response**:
```json
{
  "id": 1,
  "camp_id": 1,
  "driver_id": 1,
  "is_completed": false,
  "driver_health_checkup_id": null,
  "id_proof_image": null,
  "remarks": "Added manually"
}
```

### 8. Update Camp Item

**Endpoint**: `PATCH /api/camps/items/{itemId}`

**Description**: Update camp item details including health record linkage and completion status.

**Request**:
```json
{
  "center_id": 123,
  "idProofImage": "https://example.com/id-proof.jpg",
  "driverHealthCheckupId": 123,
  "isCompleted": true
}
```

**Required Parameters**:
- `center_id` (number): The center ID for data isolation

**Optional Parameters**:
- `idProofImage` (string): URL to the ID proof image
- `driverHealthCheckupId` (number): Link to health checkup record
- `isCompleted` (boolean): Mark item as completed

**Response**:
```json
{
  "id": 1,
  "camp_id": 1,
  "driver_id": 1,
  "is_completed": true,
  "driver_health_checkup_id": 123,
  "id_proof_image": "https://example.com/id-proof.jpg",
  "remarks": "Added manually"
}
```

### 9. Remove Patient from Camp

**Endpoint**: `DELETE /api/camps/items/{itemId}`

**Description**: Remove a patient from a camp.

**Query Parameters**:
- `center_id` (required): The center ID for data isolation

**Example**: `DELETE /api/camps/items/1?center_id=123`

**Business Rules**:
- Cannot remove if `driver_health_checkup_id` exists (health record linked)
- Requires explicit override for safety

**Response**:
```json
{
  "success": true
}
```

---

## Barcode Management APIs

### 10. Add Barcode to Camp Item

**Endpoint**: `POST /api/camps/items/{itemId}/barcodes`

**Description**: Add a barcode (with optional image and comment) to a camp item.

**Request**:
```json
{
  "center_id": 123,
  "code": "BC001",
  "comment": "Primary barcode",
  "imageUrl": "https://example.com/barcode1.jpg"
}
```

**Required Parameters**:
- `center_id` (number): The center ID for data isolation
- `code` (string): The barcode value

**Optional Parameters**:
- `comment` (string): Description or notes about the barcode
- `imageUrl` (string): URL to barcode image

**Response**:
```json
{
  "id": 1,
  "camp_list_item_id": 1,
  "code": "BC001",
  "image_url": "https://example.com/barcode1.jpg",
  "comment": "Primary barcode",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### 11. List Barcodes for Camp Item

**Endpoint**: `GET /api/camps/items/{itemId}/barcodes`

**Description**: Retrieve all barcodes associated with a camp item.

**Query Parameters**:
- `center_id` (required): The center ID for data isolation

**Example**: `GET /api/camps/items/1/barcodes?center_id=123`

**Response**:
```json
[
  {
    "id": 2,
    "camp_list_item_id": 1,
    "code": "BC002",
    "image_url": null,
    "comment": "Secondary barcode",
    "createdAt": "2024-01-15T10:35:00Z",
    "updatedAt": "2024-01-15T10:35:00Z"
  },
  {
    "id": 1,
    "camp_list_item_id": 1,
    "code": "BC001",
    "image_url": "https://example.com/barcode1.jpg",
    "comment": "Primary barcode",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

### 12. Delete Barcode

**Endpoint**: `DELETE /api/camps/items/{itemId}/barcodes/{barcodeId}`

**Description**: Remove a specific barcode from a camp item.

**Query Parameters**:
- `center_id` (required): The center ID for data isolation

**Example**: `DELETE /api/camps/items/1/barcodes/2?center_id=123`

**Response**:
```json
{
  "success": true
}
```

---

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "CSV file is required",
  "error": "Bad Request"
}
```

#### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Camp not found",
  "error": "Not Found"
}
```

#### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Center scope mismatch",
  "error": "Forbidden"
}
```

### CSV Import Error Types
- `missing_employee_id`: Required employee_id column is empty
- `driver_not_found`: Employee ID not found in system
- `cross_center`: Patient belongs to different center
- `already_in_camp`: Patient already enrolled in this camp
- `create_failed`: Database error during creation
- `update_failed`: Database error during update

---

## Testing Guide

### Postman Collection Setup

1. **Environment Variables**:
   ```
   baseUrl: http://localhost:3000
   centerId: 1
   cetId: 123
   ```

2. **Test Sequence**:
   1. Upload patients CSV
   2. Create camp
   3. Upload camp items CSV
   4. View camp details
   5. Add barcodes
   6. Update camp item
   7. Complete camp

### Sample Test Data

#### Patients CSV (`patients.csv`):
```csv
employee_id,client_id,name,contactNumber,gender
EMP001,1001,John Doe,9876543210,Male
EMP002,1002,Jane Smith,9876543211,Female
EMP003,1003,Bob Johnson,9876543212,Male
```

#### Camp Items CSV (`camp_items.csv`):
```csv
employee_id
EMP001
EMP002
EMP003
```

### Validation Tests

1. **Missing Required Fields**:
   - Test CSV without `employee_id`
   - Test camp creation without `scheduledOn`

2. **Invalid Data**:
   - Test with non-existent `cetId`
   - Test with invalid `campId`

3. **Duplicate Data**:
   - Test adding same patient twice to camp
   - Test creating duplicate `employee_id`

---

## Database Schema

### Key Tables

#### DRIVERMASTERs
```sql
CREATE TABLE "DRIVERMASTERs" (
  id SERIAL PRIMARY KEY,
  employee_id VARCHAR UNIQUE,  -- Global unique identifier
  client_id INTEGER,           -- Plain integer, no FK
  driver_cetid INTEGER,        -- FK to CETMANAGEMENTs
  createdBy INTEGER,           -- FK to Centers (operator)
  name VARCHAR,
  contactNumber VARCHAR,
  gender VARCHAR,
  -- ... other fields
);
```

#### camp_lists
```sql
CREATE TABLE camp_lists (
  id SERIAL PRIMARY KEY,
  center_id INTEGER NOT NULL,  -- FK to Centers
  scheduled_on DATE NOT NULL,
  location_text TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);
```

#### camp_list_items
```sql
CREATE TABLE camp_list_items (
  id SERIAL PRIMARY KEY,
  camp_id INTEGER NOT NULL,    -- FK to camp_lists
  driver_id INTEGER NOT NULL,  -- FK to DRIVERMASTERs
  driver_health_checkup_id INTEGER, -- FK to driverhealthcheckups (nullable)
  is_completed BOOLEAN DEFAULT FALSE,
  id_proof_image TEXT,
  remarks TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(camp_id, driver_id)
);
```

#### camp_item_barcodes
```sql
CREATE TABLE camp_item_barcodes (
  id SERIAL PRIMARY KEY,
  camp_list_item_id INTEGER NOT NULL, -- FK to camp_list_items
  code VARCHAR(120) NOT NULL,
  image_url TEXT,
  comment TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);
```

### Constraints and Indexes

1. **Unique Constraints**:
   - `employee_id` globally unique
   - `(camp_id, driver_id)` unique per camp

2. **Foreign Key Constraints**:
   - All FK relationships maintained with CASCADE/SET NULL as appropriate

3. **Indexes**:
   - `employee_id` for fast lookups
   - `center_id` for operator scoping
   - `camp_id` for camp item queries

---

## Implementation Notes

### Current Limitations
1. **Authentication**: Center ID validation implemented - requires frontend to provide valid center_id
2. **File Upload**: CSV parsing is basic - consider using a robust CSV library for production
3. **Image Storage**: Barcode images use URL strings - consider S3 integration for file uploads

### Future Enhancements
1. **Soft Delete**: Add paranoid deletes for data recovery
2. **Audit Trail**: Track all changes with user and timestamp
3. **Bulk Operations**: Optimize for large CSV files
4. **Real-time Updates**: WebSocket support for live camp status
5. **Reporting**: Analytics and reporting endpoints

### Security Considerations
1. **Input Validation**: Validate all CSV data before processing
2. **File Size Limits**: Implement limits on CSV file sizes
3. **Rate Limiting**: Prevent abuse of upload endpoints
4. **Data Sanitization**: Clean and validate all input data

---

## Support and Maintenance

### Monitoring
- Monitor CSV import success rates
- Track camp completion metrics
- Alert on failed operations

### Backup Strategy
- Regular database backups
- CSV file archival for audit purposes
- Health record data protection

### Performance Optimization
- Index optimization for large datasets
- Batch processing for CSV imports
- Caching for frequently accessed data

---

## Center ID Parameter Implementation

### Overview
All APIs now require `center_id` parameter for proper data isolation and multi-tenant support. This ensures that each center can only access and modify their own data.

### Implementation Details

#### **Request Body Parameters (POST/PATCH)**
For endpoints that accept request bodies, include `center_id` in the JSON payload:
```json
{
  "center_id": 123,
  // ... other parameters
}
```

#### **Query Parameters (GET/DELETE)**
For endpoints that don't accept request bodies, include `center_id` as a query parameter:
```
GET /api/camps?center_id=123
DELETE /api/camps/items/1?center_id=123
```

#### **Validation Rules**
- `center_id` must be a positive integer
- Invalid or missing `center_id` returns `400 Bad Request`
- All operations are scoped to the provided `center_id`

### Updated Endpoints Summary

| Endpoint | Method | center_id Location | Required |
|----------|--------|-------------------|----------|
| `/api/camps` | POST | Request Body | ✅ |
| `/api/camps` | GET | Query Parameter | ✅ |
| `/api/camps/{id}` | GET | Query Parameter | ✅ |
| `/api/camps/{id}` | PATCH | Query Parameter | ✅ |
| `/api/camps/{id}/items` | POST | Request Body | ✅ |
| `/api/camps/items/{id}` | PATCH | Request Body | ✅ |
| `/api/camps/items/{id}` | DELETE | Query Parameter | ✅ |
| `/api/camps/{id}/items/import-csv` | POST | Query Parameter | ✅ |
| `/api/camps/items/{id}/barcodes` | POST | Request Body | ✅ |
| `/api/camps/items/{id}/barcodes` | GET | Query Parameter | ✅ |
| `/api/camps/items/{id}/barcodes/{barcodeId}` | DELETE | Query Parameter | ✅ |
| `/api/drivers/import-csv` | POST | Query Parameter | ✅ |

### Error Handling
```json
{
  "statusCode": 400,
  "message": "Valid center_id is required",
  "error": "Bad Request"
}
```

---

*This documentation is maintained alongside the codebase. Please update this document when making API changes.*
