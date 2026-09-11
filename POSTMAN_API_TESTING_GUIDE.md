# 🚀 LastMileCare Backend API - Postman Testing Guide

## 📋 Overview
This document provides a comprehensive guide for testing the LastMileCare Backend APIs using Postman. The backend is built with NestJS and provides healthcare management functionality for drivers, doctors, consultations, prescriptions, and more.

**Base URL**: `http://localhost:3001`

## 🔧 Postman Environment Setup

Create a new environment in Postman with these variables:
```
baseUrl = http://localhost:3001
phoneNumber = 9876543210
testDriverId = 123
testDoctorId = 456
testConsultationId = cons-123
testPrescriptionId = pres-123
testRequestId = req-123
```

## 📱 1. Authentication & OTP APIs

### Generate OTP
- **Method**: POST
- **URL**: `{{baseUrl}}/api/otp/generate-otp`
- **Body** (JSON):
```json
{
  "phoneNumber": "{{phoneNumber}}"
}
```

### Verify OTP
- **Method**: POST
- **URL**: `{{baseUrl}}/api/otp/verify-otp`
- **Body** (JSON):
```json
{
  "phoneNumber": "{{phoneNumber}}",
  "otp": "123456"
}
```

## 👨‍⚕️ 2. Doctor Management APIs

### Get Doctor by Phone Number
- **Method**: GET
- **URL**: `{{baseUrl}}/api/doctors/getDoctorData?phoneNumber={{phoneNumber}}`

## 🚛 3. Driver Management APIs

### Get Driver by Phone Number
- **Method**: GET
- **URL**: `{{baseUrl}}/api/drivers/getUserData?phoneNumber={{phoneNumber}}`

### Get Driver by ID
- **Method**: GET
- **URL**: `{{baseUrl}}/api/drivers/getUserDataByID?driverID={{testDriverId}}`

### Register New Driver
- **Method**: POST
- **URL**: `{{baseUrl}}/api/drivers/register-driver`
- **Body** (JSON):
```json
{
  "name": "John Doe",
  "contactNumber": "9876543210",
  "gender": "Male",
  "age": 35
}
```

### Get Emergency Contacts
- **Method**: GET
- **URL**: `{{baseUrl}}/api/drivers/emergencyContacts?phoneNumber={{phoneNumber}}`

### Update ABHA Details
- **Method**: POST
- **URL**: `{{baseUrl}}/api/drivers/update-abha-details`
- **Body** (JSON):
```json
{
  "driverId": 123,
  "abhaNumber": "12345678901234",
  "abhaDetails": {}
}
```

### Ban Driver
- **Method**: PUT
- **URL**: `{{baseUrl}}/api/drivers/ban/{{testDriverId}}`

## 📋 4. Consultation Management APIs

### Create Consultation
- **Method**: POST
- **URL**: `{{baseUrl}}/api/consultations`
- **Body** (JSON):
```json
{
  "driverId": 123,
  "doctorId": 456,
  "requestId": "req-123",
  "status": "in-progress"
}
```

### Get All Consultations
- **Method**: GET
- **URL**: `{{baseUrl}}/api/consultations/list?centerID=1&limit=10&offset=0`

### Get Consultation by ID
- **Method**: GET
- **URL**: `{{baseUrl}}/api/consultations/{{testConsultationId}}`

### Get Consultations by Driver ID
- **Method**: GET
- **URL**: `{{baseUrl}}/api/consultations/driver/{{testDriverId}}`

### Get Consultations by Doctor ID
- **Method**: GET
- **URL**: `{{baseUrl}}/api/consultations/doctor/{{testDoctorId}}`

### Mark Consultation Complete
- **Method**: PUT
- **URL**: `{{baseUrl}}/api/consultations/mark-complete/{{testConsultationId}}`

### Update Consultation
- **Method**: PUT
- **URL**: `{{baseUrl}}/api/consultations/{{testConsultationId}}`
- **Body** (JSON):
```json
{
  "status": "completed",
  "notes": "Patient is doing well"
}
```

## 💊 5. Prescription Management APIs

### Create Prescription
- **Method**: POST
- **URL**: `{{baseUrl}}/api/prescriptions`
- **Body** (JSON):
```json
{
  "consultationId": "cons-123",
  "medicines": "Paracetamol 500mg",
  "dosage": "2 times daily",
  "instructions": "Take after meals"
}
```

### Get All Prescriptions
- **Method**: GET
- **URL**: `{{baseUrl}}/api/prescriptions`

### Get Prescription by ID
- **Method**: GET
- **URL**: `{{baseUrl}}/api/prescriptions/{{testPrescriptionId}}`

### Get Prescriptions by Driver ID
- **Method**: GET
- **URL**: `{{baseUrl}}/api/prescriptions/driver/{{testDriverId}}`

### Generate Prescription PDF
- **Method**: GET
- **URL**: `{{baseUrl}}/api/prescriptions/pdf/{{testPrescriptionId}}`
- **Headers**: `Accept: application/pdf`

### Upload Prescription Image
- **Method**: POST
- **URL**: `{{baseUrl}}/api/prescriptions/upload/{{testPrescriptionId}}`
- **Body**: Form-data with key `file` (select image file)

## 📝 6. Request Management APIs

### Create Request
- **Method**: POST
- **URL**: `{{baseUrl}}/api/requests/createRequest`
- **Body** (JSON):
```json
{
  "driverId": 123,
  "centerID": 1,
  "requestType": "consultation",
  "priority": "medium"
}
```

### Get All Requests
- **Method**: GET
- **URL**: `{{baseUrl}}/api/requests?status=pending&centerID=1`

### Get Request by ID
- **Method**: GET
- **URL**: `{{baseUrl}}/api/requests/{{testRequestId}}`

### Get Requests by Driver ID
- **Method**: GET
- **URL**: `{{baseUrl}}/api/requests/driver/{{testDriverId}}`

### Get Latest Pending Request
- **Method**: GET
- **URL**: `{{baseUrl}}/api/requests/driver/{{testDriverId}}/latest-pending`

### Reject Request
- **Method**: PUT
- **URL**: `{{baseUrl}}/api/requests/{{testRequestId}}/reject`

### Restore Request
- **Method**: PUT
- **URL**: `{{baseUrl}}/api/requests/{{testRequestId}}/restore`

## 🏥 7. Banner Management APIs

### Create Banner
- **Method**: POST
- **URL**: `{{baseUrl}}/api/banners/create`
- **Body**: Form-data
  - `image`: Select image file
  - `title`: "Health Tips"
  - `description`: "Important health information"

### Get All Banners
- **Method**: GET
- **URL**: `{{baseUrl}}/api/banners`

### Get Banner by ID
- **Method**: GET
- **URL**: `{{baseUrl}}/api/banners/1`

### Filter Banners
- **Method**: POST
- **URL**: `{{baseUrl}}/api/banners/filterBanners`
- **Body** (JSON):
```json
{
  "isActive": true,
  "category": "health"
}
```

### Upload Banner to S3
- **Method**: POST
- **URL**: `{{baseUrl}}/api/banners/upload-to-s3`
- **Body**: Form-data with key `file` (select image file)

## 📊 8. Dropdown Data APIs

### Get All Dropdowns
- **Method**: GET
- **URL**: `{{baseUrl}}/api/dropdowns`

### Test Dropdowns
- **Method**: GET
- **URL**: `{{baseUrl}}/api/dropdowns/test`

## 🔔 9. Notification APIs

### Create Notification
- **Method**: POST
- **URL**: `{{baseUrl}}/notifications/create`
- **Body** (JSON):
```json
{
  "userId": 123,
  "title": "New Message",
  "message": "You have a new consultation",
  "type": "consultation"
}
```

### Get Notifications
- **Method**: GET
- **URL**: `{{baseUrl}}/notifications?userId=123&limit=10`

### Mark Notification as Read
- **Method**: PATCH
- **URL**: `{{baseUrl}}/notifications/mark-read/1`

## 📱 10. FCM Push Notification APIs

### Register FCM Token
- **Method**: POST
- **URL**: `{{baseUrl}}/fcm/register`
- **Body** (JSON):
```json
{
  "userId": 123,
  "token": "fcm-token-here",
  "deviceType": "android"
}
```

### Send FCM Notification
- **Method**: POST
- **URL**: `{{baseUrl}}/fcm/send`
- **Body** (JSON):
```json
{
  "userId": 123,
  "title": "Test Notification",
  "body": "This is a test message",
  "data": {}
}
```

## 🏥 11. ABDM Health Records APIs

### Send ABDM OTP
- **Method**: POST
- **URL**: `{{baseUrl}}/abdm/send-otp`
- **Body** (JSON):
```json
{
  "aadhaar": "123456789012",
  "phoneNumber": "9876543210"
}
```

### Verify ABDM OTP
- **Method**: POST
- **URL**: `{{baseUrl}}/abdm/verify-otp`
- **Body** (JSON):
```json
{
  "otp": "123456",
  "phoneNumber": "9876543210"
}
```

### Download ABHA Card
- **Method**: GET
- **URL**: `{{baseUrl}}/abdm/download-card?phoneNumber={{phoneNumber}}`
- **Headers**: `Accept: application/pdf`

## 🧪 12. Test Account Management APIs

### Create Test Account
- **Method**: POST
- **URL**: `{{baseUrl}}/api/admin/test-accounts`
- **Body** (JSON):
```json
{
  "phoneNumber": "9999999999",
  "otp": "000000",
  "description": "Test account for development"
}
```

### Get Test Account
- **Method**: GET
- **URL**: `{{baseUrl}}/api/admin/test-accounts/9999999999`

### Check if Test Account
- **Method**: GET
- **URL**: `{{baseUrl}}/api/admin/test-accounts/check/9999999999`

### Delete Test Account
- **Method**: DELETE
- **URL**: `{{baseUrl}}/api/admin/test-accounts/9999999999`

## ℹ️ 13. System Information APIs

### Get App Version
- **Method**: GET
- **URL**: `{{baseUrl}}/api/version`

### Health Check
- **Method**: GET
- **URL**: `{{baseUrl}}/`

## 🧪 Testing Strategies

### 1. Basic Health Checks
Start testing with these endpoints:
1. `GET /` - Basic health check
2. `GET /api/version` - Version check
3. `GET /api/dropdowns/test` - Service health check

### 2. Authentication Flow
1. Generate OTP using `/api/otp/generate-otp`
2. Verify OTP using `/api/otp/verify-otp`
3. For testing, use phone: `9999999999` and OTP: `000000`

### 3. Complete Workflow Testing
1. Register a driver
2. Create a medical request
3. Create a consultation
4. Create a prescription
5. Generate prescription PDF

### 4. File Upload Testing
1. Test banner image uploads
2. Test prescription document uploads
3. Verify S3 integration

### 5. Notification Testing
1. Register FCM tokens
2. Send test notifications
3. Create and manage notifications

## 🚨 Troubleshooting

### Common Issues:

1. **Server Not Responding**
   - Ensure NestJS server is running on port 3001
   - Check if `npm start` or `npm run start:dev` is running

2. **File Upload Errors**
   - Use `multipart/form-data` for file uploads
   - Check file size and format restrictions

3. **Database Errors**
   - Verify database connection
   - Check if test data exists

4. **CORS Issues**
   - Server has CORS enabled for all origins
   - Check browser console for specific errors

### Important Notes:
- Set `Content-Type: application/json` for JSON requests
- Use `multipart/form-data` for file uploads
- PDF endpoints return binary data
- Some endpoints may require authentication tokens

## 🏥 14. Health Concern Alert System APIs

### Health Analysis APIs

#### Analyze Health Checkup
- **Method**: POST
- **URL**: `{{baseUrl}}/api/health-analysis/analyze`
- **Body** (JSON):
```json
{
  "healthCheckupId": 1
}
```

#### Execute Complete Workflow
- **Method**: POST
- **URL**: `{{baseUrl}}/api/health-analysis/workflow/execute`
- **Body** (JSON):
```json
{
  "healthCheckupId": 1
}
```

#### Get Workflow Status
- **Method**: GET
- **URL**: `{{baseUrl}}/api/health-analysis/workflow/status/1`

### Health Concerns Management APIs

#### Get All Concerns (with filters)
- **Method**: GET
- **URL**: `{{baseUrl}}/api/health-concerns?status=PENDING&level=HIGH&page=1&limit=10`

#### Get Specific Concern
- **Method**: GET
- **URL**: `{{baseUrl}}/api/health-concerns/1`

#### Update Concern Status
- **Method**: PUT
- **URL**: `{{baseUrl}}/api/health-concerns/1`
- **Body** (JSON):
```json
{
  "status": "APPROVED",
  "custom_notes": "Reviewed and approved for email sending"
}
```

#### Get Concerns by Health Checkup ID
- **Method**: GET
- **URL**: `{{baseUrl}}/api/health-concerns/health-checkup/1`

#### Get Pending Concerns
- **Method**: GET
- **URL**: `{{baseUrl}}/api/health-concerns/pending`

### SPOC Management APIs

#### Get SPOC Details (CET + Client)
- **Method**: GET
- **URL**: `{{baseUrl}}/api/spoc-management/1/1`

#### Get CET SPOC Only
- **Method**: GET
- **URL**: `{{baseUrl}}/api/spoc-management/cet/1`

#### Get Client SPOC Only
- **Method**: GET
- **URL**: `{{baseUrl}}/api/spoc-management/client/1`

### Communication APIs

#### Test Basic Email Service
- **Method**: POST
- **URL**: `{{baseUrl}}/api/communication/test-email`
- **Body** (JSON):
```json
{
  "to": "test@example.com",
  "subject": "Health Concern Alert Test",
  "content": "<h1>Test Email</h1><p>This is a test email from the health concern system.</p>"
}
```

#### Generate Email Content (Preview)
- **Method**: POST
- **URL**: `{{baseUrl}}/api/communication/generate-email-content`
- **Body** (JSON):
```json
{
  "template": "CET_HIGH",
  "driverName": "John Doe",
  "concernType": "Blood Sugar",
  "concernLevel": "HIGH",
  "parameterValue": "450 mg/dL",
  "thresholdValue": "350 mg/dL",
  "customNotes": "Immediate attention required"
}
```

#### Send Manual Health Concern Email (with file attachment)
- **Method**: POST
- **URL**: `{{baseUrl}}/api/communication/send-manual-health-email`
- **Body**: Form-data
  - `concernId`: 1
  - `spocName`: "John Doe"
  - `spocPhone`: "+1234567890"
  - `receiverEmails`: ["spoc1@example.com", "spoc2@example.com"]
  - `customSubject`: "Health Concern Alert - Immediate Action Required"
  - `customMessage`: "Please review the attached health concern details and take necessary action."
  - `prescriptionFile`: [Upload PDF file]

#### Send Custom Email
- **Method**: POST
- **URL**: `{{baseUrl}}/api/communication/send-email`
- **Body** (JSON):
```json
{
  "to": ["spoc1@example.com", "spoc2@example.com"],
  "subject": "Custom Health Alert",
  "content": "<h1>Custom Alert</h1><p>This is a custom health alert message.</p>"
}
```

## 📝 Quick Start Guide

1. **Setup Environment**: Create Postman environment with variables
2. **Health Check**: Test basic endpoints first
3. **Authentication**: Generate and verify OTP
4. **Test Core Features**: Driver registration, consultations, prescriptions
5. **Health Concern System**: Test health analysis, concerns, and email alerts
6. **File Operations**: Test uploads and downloads
7. **Notifications**: Test FCM and notification systems

## 🧪 Health Concern System Testing Workflow

### Complete End-to-End Testing

#### Step 1: Health Analysis
1. **Analyze Health Checkup**: Use a health checkup with abnormal values
2. **Execute Workflow**: Run complete analysis workflow
3. **Check Status**: Verify workflow status and created concerns

#### Step 2: Health Concerns Management
1. **Get Concerns**: Retrieve created concerns with filters
2. **Update Status**: Change concern status to APPROVED
3. **Get Pending**: Check pending concerns list

#### Step 3: SPOC Management
1. **Get SPOC Details**: Retrieve CET and Client SPOC information
2. **Verify Data**: Ensure SPOC details are correctly populated

#### Step 4: Communication Testing
1. **Test Basic Email**: Verify email service is working
2. **Generate Content**: Preview email templates
3. **Send Manual Email**: Send email with file attachments
4. **Verify Delivery**: Check email delivery status

### Testing Scenarios

#### Scenario 1: No Health Concerns
- Use health checkup with normal values
- Verify no concerns are created
- Check workflow status shows `hasConcerns: false`

#### Scenario 2: Multiple Health Concerns
- Use health checkup with multiple abnormal values
- Verify multiple concerns are created
- Test filtering and pagination

#### Scenario 3: Email Sending
- Create a concern
- Update status to APPROVED
- Send manual email with attachment
- Verify email is sent successfully

#### Scenario 4: Error Handling
- Test with invalid health checkup ID
- Test with missing SPOC details
- Test with invalid email addresses
- Verify proper error responses

### Environment Variables for Health Concern Testing

Add these variables to your Postman environment:
```
testHealthCheckupId = 1
testConcernId = 1
testCETId = 1
testCenterId = 1
testSpocEmail = spoc@example.com
testDriverName = John Doe
```

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Server Port**: 3001 