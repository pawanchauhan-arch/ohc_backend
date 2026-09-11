# Phlebotomist Management API Documentation

## Overview

The Phlebotomist Management System provides comprehensive APIs for managing phlebotomists and their assignments to health camps. This system allows centers to create, manage, and assign phlebotomists to specific camps while maintaining proper security and data integrity.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Request/Response Examples](#requestresponse-examples)
5. [Error Handling](#error-handling)
6. [Security & Validation](#security--validation)
7. [Testing Guide](#testing-guide)
8. [Deployment Notes](#deployment-notes)

## System Architecture

### Core Components

- **PhlebotomistController**: Handles phlebotomist CRUD operations
- **CampPhlebotomistController**: Manages camp-phlebotomist assignments
- **PhlebotomistService**: Business logic and data operations
- **DTOs**: Data validation and transfer objects

### Key Features

- ✅ Center-scoped operations for security
- ✅ Role-based access control (role_id = 2)
- ✅ Multiple phlebotomist assignment per camp
- ✅ Flexible camp assignment (0 or more phlebotomists)
- ✅ Phone number validation (Indian format)
- ✅ Email uniqueness validation
- ✅ Automatic employee code generation
- ✅ Comprehensive error handling
- ✅ **NEW**: Search phlebotomists by phone number or employee code
- ✅ **NEW**: Assign phlebotomists to camps using employee codes
- ✅ **NEW**: Phone number and employee code uniqueness validation

### Employee Code Generation

Employee codes are automatically generated using the format: `{CENTER_SHORTCODE}_PHLEBO_{SEQUENCE}`

**Examples:**
- `CEN001_PHLEBO_001` (First phlebotomist in center CEN001)
- `CEN001_PHLEBO_002` (Second phlebotomist in center CEN001)
- `MUM001_PHLEBO_001` (First phlebotomist in center MUM001)

**Custom Employee Codes:**
- Can be provided manually via `employee_code` field
- Must be unique within the center
- Will override auto-generation
- Can be used for searching and camp assignments

## Database Schema

### CenterUser Table Changes

```sql
-- Add user_type column (nullable)
ALTER TABLE "Centerusers" 
ADD COLUMN "user_type" VARCHAR(20);

-- Add constraint for valid user types
ALTER TABLE "Centerusers" 
ADD CONSTRAINT "chk_user_type" 
CHECK ("user_type" IS NULL OR "user_type" IN ('PHLEBO', 'STAFF', 'ADMIN'));

-- Create index for performance
CREATE INDEX "idx_centerusers_user_type" ON "Centerusers" ("user_type");
```

### CampList Table Changes

```sql
-- Add phlebotomist assignment field
ALTER TABLE "camp_lists" 
ADD COLUMN "assigned_phlebotomist_ids" JSONB DEFAULT '[]'::jsonb;

-- Create index for JSON queries
CREATE INDEX "idx_camp_lists_phlebotomist_ids" ON "camp_lists" USING GIN ("assigned_phlebotomist_ids");
```

### Data Migration

```sql
-- Update existing camps with empty phlebotomist array
UPDATE "camp_lists" 
SET "assigned_phlebotomist_ids" = '[]'::jsonb 
WHERE "assigned_phlebotomist_ids" IS NULL;
```

## API Endpoints

### Base URL
```
http://localhost:3000
```

### Authentication
All endpoints require center-scoped access via `center_id` parameter.

---

## 1. Phlebotomist Management APIs

### 1.1 Create Phlebotomist

**Endpoint:** `POST /api/phlebotomists`

**Description:** Creates a new phlebotomist for a specific center.

**Request Body:**
```json
{
  "center_id": 1,
  "username": "phlebo_john",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "phone": "+919876543210",
  "signature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "employee_code": "CEN001_PHLEBO_001"
}
```

**Validation Rules:**
- `center_id`: Optional, must be positive integer
- `username`: Optional, must be unique if provided
- `name`: Optional, non-empty string
- `email`: Optional, valid email format, must be unique if provided
- `password`: Optional, non-empty string
- `phone`: Optional, valid Indian phone number format
- `signature`: Optional, base64 encoded image
- `employee_code`: Optional, unique employee identifier

**Response:**
```json
{
  "id": 5,
  "user_id": 15,
  "center_id": "1",
  "user_type": "PHLEBO",
  "signature": "data:image/png;base64,...",
  "short_code": "CEN001_PHLEBO_001",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "user": {
    "id": 15,
    "username": "phlebo_john",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+919876543210",
    "role_id": "2",
    "status": true
  },
  "center": {
    "id": 1,
    "project_name": "Health Camp Project"
  }
}
```

### 1.2 List Phlebotomists

**Endpoint:** `GET /api/phlebotomists?center_id={center_id}`

**Description:** Retrieves all phlebotomists for a specific center.

**Query Parameters:**
- `center_id`: Required, positive integer

**Response:**
```json
[
  {
    "id": 5,
    "user_type": "PHLEBO",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "user": {
      "id": 15,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+919876543210",
      "status": true
    },
    "center": {
      "id": 1,
      "project_name": "Health Camp Project"
    }
  }
]
```

### 1.3 Get Phlebotomist Details

**Endpoint:** `GET /api/phlebotomists/{id}?center_id={center_id}`

**Description:** Retrieves detailed information for a specific phlebotomist.

**Path Parameters:**
- `id`: Phlebotomist ID

**Query Parameters:**
- `center_id`: Required, positive integer

**Response:** Same as Create Phlebotomist response

### 1.4 Update Phlebotomist

**Endpoint:** `PATCH /api/phlebotomists/{id}?center_id={center_id}`

**Description:** Updates phlebotomist information.

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "john.smith@example.com",
  "phone": "+919876543211",
  "signature": "data:image/png;base64,new_signature_data",
  "status": true
}
```

**Validation Rules:**
- All fields are optional
- `email`: Must be unique if provided
- `phone`: Must be valid Indian format if provided
- `status`: Boolean value

**Response:** Updated phlebotomist object

### 1.5 Search Phlebotomists

**Endpoint:** `GET /api/phlebotomists/search?center_id={center_id}&phone={phone}&employee_code={employee_code}`

**Description:** Searches for phlebotomists by phone number or employee code within a specific center.

**Query Parameters:**
- `center_id`: Required, positive integer
- `phone`: Optional, phone number to search for
- `employee_code`: Optional, employee code to search for
- **Note**: At least one of `phone` or `employee_code` must be provided

**Example Requests:**
```bash
# Search by phone number
GET /api/phlebotomists/search?center_id=1&phone=+919876543210

# Search by employee code
GET /api/phlebotomists/search?center_id=1&employee_code=CEN001_PHLEBO_001

# Search by both (OR condition)
GET /api/phlebotomists/search?center_id=1&phone=+919876543210&employee_code=CEN001_PHLEBO_001
```

**Response:**
```json
[
  {
    "id": 5,
    "user_id": "15",
    "center_id": "1",
    "user_type": "PHLEBO",
    "signature": null,
    "short_code": "CEN001_PHLEBO_001",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "user": {
      "id": 15,
      "username": "phlebo_john",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+919876543210",
      "role_id": 2,
      "status": true
    }
  }
]
```

**Error Conditions:**
- Neither phone nor employee_code provided
- Invalid center_id
- No phlebotomists found matching criteria

### 1.6 Delete Phlebotomist

**Endpoint:** `DELETE /api/phlebotomists/{id}?center_id={center_id}`

**Description:** Deletes a phlebotomist (only if not assigned to active camps).

**Response:**
```json
{
  "success": true
}
```

**Error Conditions:**
- Phlebotomist assigned to active camps
- Phlebotomist not found
- Unauthorized access

---

## 2. Camp-Phlebotomist Assignment APIs

### 2.1 Assign Phlebotomists to Camp

**Endpoint:** `POST /api/camps/{campId}/phlebotomists?center_id={center_id}`

**Description:** Assigns multiple phlebotomists to a specific camp.

**Request Body:**
```json
{
  "phlebotomist_ids": [5, 6, 7]
}
```

**Validation Rules:**
- `phlebotomist_ids`: Required array of positive integers
- All phlebotomists must belong to the same center
- All phlebotomists must have user_type = 'PHLEBO'

**Response:**
```json
{
  "id": 123,
  "center_id": 1,
  "scheduled_on": "2024-01-20",
  "location_text": "Community Center, Mumbai",
  "is_completed": false,
  "assigned_phlebotomist_ids": [5, 6, 7],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### 2.2 Assign Phlebotomists to Camp by Employee Code

**Endpoint:** `POST /api/camps/{campId}/phlebotomists/by-code?center_id={center_id}`

**Description:** Assigns multiple phlebotomists to a specific camp using their employee codes.

**Request Body:**
```json
{
  "employee_codes": ["CEN001_PHLEBO_001", "CEN001_PHLEBO_002", "emp001"]
}
```

**Validation Rules:**
- `employee_codes`: Required array of strings
- All employee codes must exist and belong to the same center
- All phlebotomists must have user_type = 'PHLEBO'

**Response:**
```json
{
  "id": 123,
  "center_id": 1,
  "scheduled_on": "2024-01-20",
  "location_text": "Community Center, Mumbai",
  "is_completed": false,
  "assigned_phlebotomist_ids": [5, 6, 7],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Conditions:**
- Invalid employee codes provided
- Employee codes don't belong to the center
- Camp not found or doesn't belong to center

### 2.3 Get Assigned Phlebotomists for Camp

**Endpoint:** `GET /api/camps/{campId}/phlebotomists?center_id={center_id}`

**Description:** Retrieves all phlebotomists assigned to a specific camp.

**Response:**
```json
[
  {
    "id": 5,
    "user_type": "PHLEBO",
    "user": {
      "id": 15,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+919876543210"
    }
  },
  {
    "id": 6,
    "user_type": "PHLEBO",
    "user": {
      "id": 16,
      "name": "Jane Smith",
      "email": "jane.smith@example.com",
      "phone": "+919876543211"
    }
  }
]
```

### 2.3 Unassign Phlebotomist from Camp

**Endpoint:** `DELETE /api/camps/{campId}/phlebotomists/{phlebotomistId}?center_id={center_id}`

**Description:** Removes a phlebotomist from a specific camp.

**Response:**
```json
{
  "success": true
}
```

---

## 3. Phlebotomist-Specific Camp Views

### 3.1 Get Camps Assigned to Phlebotomist

**Endpoint:** `GET /api/phlebotomists/{id}/camps?center_id={center_id}`

**Description:** Retrieves all camps assigned to a specific phlebotomist.

**Response:**
```json
[
  {
    "id": 123,
    "center_id": 1,
    "scheduled_on": "2024-01-20",
    "location_text": "Community Center, Mumbai",
    "is_completed": false,
    "assigned_phlebotomist_ids": [5, 6]
  },
  {
    "id": 124,
    "center_id": 1,
    "scheduled_on": "2024-01-25",
    "location_text": "School Ground, Delhi",
    "is_completed": false,
    "assigned_phlebotomist_ids": [5]
  }
]
```

### 3.2 Get Specific Camp Details for Phlebotomist

**Endpoint:** `GET /api/phlebotomists/{id}/camps/{campId}?center_id={center_id}`

**Description:** Retrieves detailed camp information for a phlebotomist (only if assigned).

**Response:**
```json
{
  "id": 123,
  "center_id": 1,
  "scheduled_on": "2024-01-20",
  "location_text": "Community Center, Mumbai",
  "is_completed": false,
  "assigned_phlebotomist_ids": [5, 6],
  "items": [
    {
      "id": 1,
      "camp_id": 123,
      "driver_id": 10,
      "is_completed": false,
      "driver": {
        "id": 10,
        "name": "Driver Name",
        "employeeId": "EMP001"
      }
    }
  ]
}
```

---

## Error Handling

### HTTP Status Codes

- `200 OK`: Successful operation
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Access denied
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### Common Error Scenarios

1. **Invalid center_id**
   ```json
   {
     "statusCode": 400,
     "message": "Valid center_id is required",
     "error": "Bad Request"
   }
   ```

2. **Username already exists**
   ```json
   {
     "statusCode": 400,
     "message": "Username already exists",
     "error": "Bad Request"
   }
   ```

3. **Phlebotomist not found**
   ```json
   {
     "statusCode": 404,
     "message": "Phlebotomist not found",
     "error": "Not Found"
   }
   ```

4. **Cannot delete assigned phlebotomist**
   ```json
   {
     "statusCode": 400,
     "message": "Cannot delete phlebotomist assigned to active camps",
     "error": "Bad Request"
   }
   ```

5. **Phone number already exists**
   ```json
   {
     "statusCode": 400,
     "message": "Phone number already exists",
     "error": "Bad Request"
   }
   ```

6. **Employee code already exists**
   ```json
   {
     "statusCode": 400,
     "message": "Employee code already exists",
     "error": "Bad Request"
   }
   ```

7. **Search parameters missing**
   ```json
   {
     "statusCode": 400,
     "message": "Either phone or employee_code must be provided",
     "error": "Bad Request"
   }
   ```

8. **Invalid employee codes for assignment**
   ```json
   {
     "statusCode": 400,
     "message": "Phlebotomists with employee codes not found: emp999, emp888",
     "error": "Bad Request"
   }
   ```

---

## Security & Validation

### Center Scoping
- All operations are restricted to the specified center
- Cross-center access is prevented
- Phlebotomists can only be assigned to camps within their center

### Data Validation
- **Email**: Must be unique across the system
- **Phone**: Must follow Indian format (+91XXXXXXXXXX) and be unique across all users
- **Username**: Must be unique across the system
- **Employee Code**: Must be unique across all phlebotomists (1-100 characters)
- **User Type**: Automatically set to 'PHLEBO' for new phlebotomists
- **Role ID**: Automatically set to 2 (phlebotomist role)

### Enhanced Validation Features

#### Phone Number Uniqueness
- Phone numbers must be unique across all users in the system
- Validation occurs during both creation and updates
- Prevents duplicate phone numbers across different centers

#### Employee Code Uniqueness
- Employee codes must be unique across all phlebotomists
- Flexible format - users can input any format they prefer
- Length validation: 1-100 characters
- Validation occurs during both creation and updates

### Input Sanitization
- All string inputs are validated and sanitized
- SQL injection prevention through parameterized queries
- XSS protection through proper encoding

---

## Testing Guide

### Prerequisites
1. Database migrations applied
2. Application running on localhost:3000
3. Valid center_id available

### Test Scenarios

#### 1. Phlebotomist Lifecycle
```bash
# 1. Create phlebotomist
curl -X POST http://localhost:3000/api/phlebotomists \
  -H "Content-Type: application/json" \
  -d '{
    "center_id": 1,
    "username": "test_phlebo",
    "name": "Test Phlebotomist",
    "email": "test@example.com",
    "password": "password123",
    "phone": "+919876543210"
  }'

# 2. List phlebotomists
curl "http://localhost:3000/api/phlebotomists?center_id=1"

# 3. Update phlebotomist
curl -X PATCH "http://localhost:3000/api/phlebotomists/5?center_id=1" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name"}'

# 4. Delete phlebotomist
curl -X DELETE "http://localhost:3000/api/phlebotomists/5?center_id=1"
```

#### 2. Search Phlebotomists
```bash
# Search by phone number
curl "http://localhost:3000/api/phlebotomists/search?center_id=1&phone=+919876543210"

# Search by employee code
curl "http://localhost:3000/api/phlebotomists/search?center_id=1&employee_code=CEN001_PHLEBO_001"

# Search by both (OR condition)
curl "http://localhost:3000/api/phlebotomists/search?center_id=1&phone=+919876543210&employee_code=CEN001_PHLEBO_001"
```

#### 3. Camp Assignment Workflow
```bash
# 1. Create camp (using existing camp APIs)
# 2. Assign phlebotomists by ID (original method)
curl -X POST "http://localhost:3000/api/camps/123/phlebotomists?center_id=1" \
  -H "Content-Type: application/json" \
  -d '{"phlebotomist_ids": [5, 6]}'

# 2. Assign phlebotomists by employee code (NEW method)
curl -X POST "http://localhost:3000/api/camps/123/phlebotomists/by-code?center_id=1" \
  -H "Content-Type: application/json" \
  -d '{"employee_codes": ["CEN001_PHLEBO_001", "CEN001_PHLEBO_002"]}'

# 3. View assigned phlebotomists
curl "http://localhost:3000/api/camps/123/phlebotomists?center_id=1"

# 4. Unassign phlebotomist
curl -X DELETE "http://localhost:3000/api/camps/123/phlebotomists/5?center_id=1"
```

### Postman Collection

Import the following collection for comprehensive testing:

```json
{
  "info": {
    "name": "Phlebotomist Management APIs",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000"
    },
    {
      "key": "center_id",
      "value": "1"
    }
  ],
  "item": [
    {
      "name": "Create Phlebotomist",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"center_id\": {{center_id}},\n  \"username\": \"phlebo_test\",\n  \"name\": \"Test Phlebotomist\",\n  \"email\": \"test@example.com\",\n  \"password\": \"password123\",\n  \"phone\": \"+919876543210\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/phlebotomists",
          "host": ["{{base_url}}"],
          "path": ["api", "phlebotomists"]
        }
      }
    }
  ]
}
```

---

## Deployment Notes

### Environment Variables
```bash
DB_HOST=your_db_host
DB_PORT=5432
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
```

### Database Migration
1. Run the SQL scripts provided in the Database Schema section
2. Verify constraints and indexes are created
3. Test with sample data

### Production Considerations
1. **Rate Limiting**: Implement rate limiting for API endpoints
2. **Authentication**: Add JWT-based authentication
3. **Logging**: Enable comprehensive request/response logging
4. **Monitoring**: Set up health checks and monitoring
5. **Backup**: Regular database backups
6. **SSL**: Use HTTPS in production

### Performance Optimization
1. Database indexes are created for optimal query performance
2. JSONB indexing for phlebotomist assignments
3. Proper foreign key relationships for data integrity

---

## Support & Maintenance

### Common Issues
1. **Type Mismatch Errors**: Ensure center_id is properly converted between bigint and number
2. **Constraint Violations**: Check user_type constraints and unique constraints
3. **Permission Issues**: Verify role_id and user_type assignments

### Monitoring
- Monitor API response times
- Track error rates and types
- Monitor database performance
- Set up alerts for critical failures

### Updates
- Version control all changes
- Test thoroughly before deployment
- Maintain backward compatibility
- Document all changes

---

*Last Updated: January 2025*
*Version: 1.1.0*

## Changelog

### Version 1.1.0 (January 2025)
- ✅ **NEW**: Added search API for phlebotomists by phone number or employee code
- ✅ **NEW**: Added camp assignment using employee codes instead of IDs
- ✅ **ENHANCED**: Phone number uniqueness validation across all users
- ✅ **ENHANCED**: Employee code uniqueness validation across all phlebotomists
- ✅ **ENHANCED**: Flexible employee code format (any format allowed)
- ✅ **IMPROVED**: Better error messages for validation failures
- ✅ **IMPROVED**: Enhanced documentation with comprehensive examples

### Version 1.0.0 (January 2024)
- ✅ Initial release with basic phlebotomist management
- ✅ CRUD operations for phlebotomists
- ✅ Camp assignment functionality
- ✅ Center-scoped operations
- ✅ Basic validation and error handling
