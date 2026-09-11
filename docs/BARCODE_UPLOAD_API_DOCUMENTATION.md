# 📋 Barcode Upload API Documentation

## 📖 Table of Contents
- [Overview](#overview)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [S3 Storage Structure](#s3-storage-structure)
- [Implementation Details](#implementation-details)
- [Postman Testing Guide](#postman-testing-guide)
- [Error Handling](#error-handling)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The Barcode Upload API allows users to upload barcode images for camp list items in the mobile backend system. This implementation supports multiple barcodes per camp list item and organizes files in a structured S3 bucket with proper folder hierarchy.

### Key Features
- ✅ Multiple barcodes per camp list item
- ✅ Organized S3 folder structure
- ✅ Comprehensive validation and error handling
- ✅ Database integration with proper relationships
- ✅ Type-safe DTOs with enum validation
- ✅ Structured API responses

---

## 🚀 API Endpoints

### 1. Upload Barcode for Camp List Item

**Endpoint:** `POST /api/camp-list-items/upload-barcode`

**Description:** Uploads a barcode image for a specific camp list item and creates a database record.

#### Request Format
- **Content-Type:** `multipart/form-data`
- **Method:** `POST`

#### Request Parameters

| Parameter | Type | Required | Description | Validation |
|-----------|------|----------|-------------|------------|
| `camp_list_item_id` | string | Yes | ID of the camp list item | Must be valid integer > 0 |
| `barcode_number` | string | Yes | The barcode number/code | Non-empty string |
| `barcode_name` | string | Yes | Test name enum value | Must be one of: `Complete Blood Count(CBC)`, `Kidney Function Test(KFT)`, `Liver Function Test(LFT)`, `Cholestrol-Total` |
| `comment` | string | No | Optional comment | Any string |
| `barcode_image` | File | Yes | Image file | Must be image file (JPEG, PNG, GIF, WebP) |

#### Request Example
```bash
curl -X POST "http://localhost:3000/api/camp-list-items/upload-barcode" \
  -F "camp_list_item_id=1" \
  -F "barcode_number=CBC001234567" \
  -F "barcode_name=Complete Blood Count(CBC)" \
  -F "comment=Test barcode upload" \
  -F "barcode_image=@/path/to/image.jpg"
```

#### Response Format
```json
{
  "success": true,
  "message": "Barcode uploaded and saved successfully",
  "data": {
    "camp_list_item_id": 1,
    "barcode_id": 15,
    "barcode_number": "CBC001234567",
    "barcode_name": "Complete Blood Count(CBC)",
    "image_url": "https://your-bucket.s3.amazonaws.com/user123/barcode/uuid-filename.jpg",
    "comment": "Test barcode upload"
  }
}
```

### 2. Upload ID Proof for Camp List Item (Enhanced)

**Endpoint:** `POST /api/camp-list-items/upload-id-proof`

**Description:** Uploads an ID proof image for a specific driver and camp combination. Enhanced to use organized folder structure.

#### Request Format
- **Content-Type:** `multipart/form-data`
- **Method:** `POST`

#### Request Parameters

| Parameter | Type | Required | Description | Validation |
|-----------|------|----------|-------------|------------|
| `driver_id` | string | Yes | ID of the driver | Must be valid integer > 0 |
| `camp_id` | string | Yes | ID of the camp | Must be valid integer > 0 |
| `image` | File | Yes | ID proof image file | Must be image file (JPEG, PNG, GIF, WebP) |

#### Request Example
```bash
curl -X POST "http://localhost:3000/api/camp-list-items/upload-id-proof" \
  -F "driver_id=123" \
  -F "camp_id=456" \
  -F "image=@/path/to/id-proof.jpg"
```

#### Response Format
```json
{
  "success": true,
  "message": "ID proof image uploaded and updated successfully",
  "data": {
    "driver_id": 123,
    "camp_id": 456,
    "image_url": "https://your-bucket.s3.amazonaws.com/user123/idproof/uuid-filename.jpg",
    "updated_items": 1
  }
}
```

---

## 🗄️ Database Schema

### CampItemBarcode Table
```sql
CREATE TABLE camp_item_barcodes (
  id SERIAL PRIMARY KEY,
  camp_list_item_id INTEGER NOT NULL REFERENCES camp_list_items(id),
  code VARCHAR(120) NOT NULL,
  image_url TEXT,
  comment TEXT,
  test_name ENUM('Complete Blood Count(CBC)', 'Kidney Function Test(KFT)', 'Liver Function Test(LFT)', 'Cholestrol-Total'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Related Tables
- **camp_list_items**: Contains the camp list item records
- **driver_masters**: Contains driver information
- **camp_lists**: Contains camp information

### Relationships
- `CampItemBarcode` belongs to `CampListItem` (many-to-one)
- `CampListItem` belongs to `DRIVERMASTER` (many-to-one)
- `CampListItem` belongs to `CampList` (many-to-one)

---

## 📁 S3 Storage Structure

### Folder Organization
```
S3 Bucket (BUCKET_NAME_PATIENT_ID_PROOF)
├── user{driver_id}/
│   ├── idproof/          # ID proof images
│   │   └── {uuid}.{ext}  # Generated unique filenames
│   └── barcode/          # Barcode images
│       └── {uuid}.{ext}  # Generated unique filenames
```

### File Naming Convention
- **Format:** `{uuid}.{original_extension}`
- **Example:** `a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg`
- **Purpose:** Prevents filename conflicts and ensures uniqueness

### Supported File Types
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

---

## 🔧 Implementation Details

### File Structure
```
src/
├── modules/camplistitem/
│   ├── dto/
│   │   └── barcode-upload.dto.ts      # DTOs for validation
│   ├── camplistitem.controller.ts     # API endpoints
│   ├── camplistitem.service.ts        # Business logic
│   └── camplistitem.module.ts         # Module configuration
├── utils/
│   └── s3-image-upload.ts             # S3 upload utilities
└── models/
    └── CampItemBarcode.ts             # Database model
```

### Key Components

#### 1. DTOs (Data Transfer Objects)
```typescript
// Input validation
export class BarcodeUploadDto {
  @IsString()
  @IsNotEmpty()
  camp_list_item_id: string;

  @IsString()
  @IsNotEmpty()
  barcode_number: string;

  @IsEnum(['Complete Blood Count(CBC)', 'Kidney Function Test(KFT)', 'Liver Function Test(LFT)', 'Cholestrol-Total'])
  @IsNotEmpty()
  barcode_name: string;

  @IsString()
  @IsOptional()
  comment?: string;
}

// Response structure
export class BarcodeUploadResponseDto {
  success: boolean;
  message: string;
  data: {
    camp_list_item_id: number;
    barcode_id: number;
    barcode_number: string;
    barcode_name: string;
    image_url: string;
    comment?: string;
  };
}
```

#### 2. S3 Upload Utility
```typescript
export async function uploadToS3WithFolder(
  file: Express.Multer.File, 
  bucketName: string, 
  folderPath: string
): Promise<string>
```

#### 3. Service Layer
- **uploadBarcode()**: Handles barcode upload logic
- **uploadDriverIdProof()**: Enhanced ID proof upload with folder structure

#### 4. Controller Layer
- **POST /upload-barcode**: Barcode upload endpoint
- **POST /upload-id-proof**: Enhanced ID proof upload endpoint

---

## 🧪 Postman Testing Guide

### Environment Setup
Create a Postman environment with:
```
base_url: http://localhost:3000
```

### Test Collection Structure
```
📁 Barcode Upload APIs
├── 📄 Upload Barcode - CBC Test
├── 📄 Upload Barcode - KFT Test
├── 📄 Upload Barcode - LFT Test
├── 📄 Upload Barcode - Cholesterol Test
├── 📄 Upload Barcode - Error Cases
├── 📄 Upload ID Proof - Success Test
└── 📄 Upload ID Proof - Error Cases
```

### Sample Test Data

#### Valid Test Cases
```json
{
  "camp_list_item_id": "1",
  "barcode_number": "CBC001234567",
  "barcode_name": "Complete Blood Count(CBC)",
  "comment": "Test barcode upload for CBC"
}
```

#### Test Scripts
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has success field", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
    pm.expect(jsonData.success).to.be.true;
});

pm.test("Image URL is valid", function () {
    const jsonData = pm.response.json();
    if (jsonData.data && jsonData.data.image_url) {
        pm.expect(jsonData.data.image_url).to.include('https://');
    }
});
```

### Comprehensive Test Scenarios

#### Success Cases
1. **Valid CBC Barcode Upload**
2. **Valid KFT Barcode Upload**
3. **Valid LFT Barcode Upload**
4. **Valid Cholesterol Barcode  Upload**
5. **Valid ID Proof Upload**

#### Error Cases
1. **Missing Required Fields**
2. **Invalid Camp List Item ID**
3. **Non-existent Camp List Item**
4. **Invalid Barcode Name (Enum)**
5. **Missing Image File**
6. **Invalid File Type**
7. **Invalid Driver ID**
8. **Non-existent Driver**

---

## ⚠️ Error Handling

### HTTP Status Codes
- **200 OK**: Successful upload
- **400 Bad Request**: Validation errors, invalid input
- **404 Not Found**: Resource not found (camp list item, driver, etc.)
- **500 Internal Server Error**: Server-side errors (S3, database)

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Camp list item ID is required",
  "error": "Bad Request"
}
```

### Common Error Messages
- `"Camp list item ID is required"`
- `"Valid camp list item ID is required"`
- `"Camp list item with ID {id} not found"`
- `"Barcode image file is required"`
- `"Invalid file type. Only image files (JPEG, PNG, GIF, WebP) are allowed"`
- `"Failed to upload barcode image to S3: {error}"`
- `"Failed to create barcode record: {error}"`

---

## 🔍 Troubleshooting

### Common Issues

#### 1. 404 Not Found
**Cause:** Invalid `camp_list_item_id`, `driver_id`, or `camp_id`
**Solution:** 
- Verify IDs exist in database
- Check foreign key relationships
- Ensure proper data setup

#### 2. 400 Bad Request - File Type
**Cause:** Uploading non-image file
**Solution:** 
- Use only supported image formats
- Check file extension and MIME type
- Verify file is not corrupted

#### 3. 500 Internal Server Error
**Cause:** S3 configuration issues
**Solution:** 
- Check AWS credentials
- Verify bucket permissions
- Ensure bucket exists and is accessible
- Check network connectivity

#### 4. Validation Errors
**Cause:** Invalid enum values or missing required fields
**Solution:** 
- Use exact enum values from documentation
- Ensure all required fields are provided
- Check field types and formats

### Debugging Steps
1. **Check Server Logs**: Look for detailed error messages
2. **Verify Database**: Ensure related records exist
3. **Test S3 Access**: Verify bucket and permissions
4. **Validate Input**: Check request format and data
5. **Check Dependencies**: Ensure all services are running

---

## 📊 Performance Considerations

### File Size Limits
- **Recommended:** < 5MB per image
- **Maximum:** Depends on S3 and server configuration
- **Optimization:** Consider image compression for large files

### Concurrent Uploads
- **Supported:** Multiple simultaneous uploads
- **Limitation:** Depends on server resources and S3 rate limits
- **Best Practice:** Implement queuing for high-volume scenarios

### Database Performance
- **Indexing:** Ensure proper indexes on foreign keys
- **Queries:** Optimized with proper includes and attributes
- **Transactions:** Used for data consistency

---

## 🔒 Security Considerations

### File Upload Security
- **File Type Validation**: Only image files allowed
- **File Size Limits**: Prevents abuse
- **Unique Filenames**: Prevents conflicts and guessing
- **S3 Access Control**: Proper bucket permissions

### Data Validation
- **Input Sanitization**: All inputs validated
- **SQL Injection Prevention**: Using ORM with parameterized queries
- **XSS Prevention**: Proper data handling

### Access Control
- **Authentication**: Inherits from existing module setup
- **Authorization**: Based on user permissions
- **Audit Trail**: Database timestamps for tracking

---

## 📈 Future Enhancements

### Potential Improvements
1. **Image Processing**: Automatic resizing and optimization
2. **Batch Upload**: Support for multiple files at once
3. **Progress Tracking**: Real-time upload progress
4. **File Management**: Delete and update operations
5. **Analytics**: Upload statistics and monitoring
6. **Caching**: CDN integration for faster access

### Scalability Considerations
1. **Load Balancing**: Multiple server instances
2. **Database Sharding**: For large datasets
3. **S3 Optimization**: Lifecycle policies and compression
4. **Monitoring**: Health checks and alerting

---

## 📞 Support

### Documentation
- **API Reference**: This document
- **Code Comments**: Inline documentation in source code
- **Database Schema**: SQL scripts and model definitions

### Contact
For technical support or questions about this implementation, please refer to the development team or create an issue in the project repository.

---

**Last Updated:** [Current Date]
**Version:** 1.0.0
**Author:** Development Team
