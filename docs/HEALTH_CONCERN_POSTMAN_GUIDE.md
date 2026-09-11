# 🏥 HEALTH CONCERN ALERT SYSTEM - POSTMAN TESTING GUIDE

## 🎯 OVERVIEW
This guide provides a complete step-by-step workflow to test the Health Concern Alert System using Postman. This system automatically analyzes health checkups, creates concerns, and allows manual email sending to SPOCs.

**Base URL**: `http://localhost:3000`

## 📋 PREREQUISITES
- ✅ NestJS application running on `http://localhost:3000`
- ✅ Database setup completed (health_concerns table created)
- ✅ Environment variables configured (AWS SES, etc.)
- ✅ Postman installed and configured

## 🔧 POSTMAN ENVIRONMENT SETUP

Create a new environment in Postman with these variables:
```
baseUrl = http://localhost:3000
testHealthCheckupId = 1
testConcernId = 1
testCETId = 1
testCenterId = 1
testSpocEmail = spoc@example.com
testDriverName = John Doe
testSpocName = Safety Officer
testSpocPhone = +1234567890
```

---

## 🚀 COMPLETE WORKFLOW TESTING

### **PHASE 1: HEALTH ANALYSIS TESTING**

#### **Step 1.1: Test Individual Health Analysis**
```http
POST {{baseUrl}}/api/health-analysis/analyze
Content-Type: application/json

{
  "healthCheckupId": {{testHealthCheckupId}}
}
```

**Expected Response:**
```json
{
  "success": true,
  "concerns": [
    {
      "id": "blood_sugar_1",
      "type": "BLOOD_SUGAR",
      "level": "HIGH",
      "parameter": "Random Blood Sugar",
      "value": 450,
      "threshold": 350,
      "recommendation": "Immediate medical attention required"
    }
  ],
  "summary": {
    "totalConcerns": 1,
    "moderateCount": 0,
    "highCount": 1
  }
}
```

**What this does:** Analyzes a health checkup for abnormal values and returns detected concerns.

#### **Step 1.2: Test Complete Workflow Execution**
```http
POST {{baseUrl}}/api/health-analysis/workflow/execute
Content-Type: application/json

{
  "healthCheckupId": {{testHealthCheckupId}}
}
```

**Expected Response:**
```json
{
  "success": true,
  "healthCheckupId": 1,
  "analysisResult": {
    "success": true,
    "concerns": [...],
    "summary": {...}
  },
  "concernsCreated": 1,
  "spocDetailsRetrieved": true,
  "communicationSent": false,
  "errors": []
}
```

**What this does:** Executes the complete workflow - analyzes health checkup, creates concerns in database, retrieves SPOC details, and prepares for communication.

#### **Step 1.3: Check Workflow Status**
```http
GET {{baseUrl}}/api/health-analysis/workflow/status/{{testHealthCheckupId}}
```

**Expected Response:**
```json
{
  "hasConcerns": true,
  "concernsCount": 1,
  "pendingCount": 1,
  "approvedCount": 0,
  "completedCount": 0,
  "lastAnalysisAt": "2024-01-15T10:30:00.000Z"
}
```

**What this does:** Shows the current status of concerns for a specific health checkup.

---

### **PHASE 2: HEALTH CONCERNS MANAGEMENT**

#### **Step 2.1: Get All Concerns (with filters)**
```http
GET {{baseUrl}}/api/health-concerns?status=PENDING&level=HIGH&page=1&limit=10
```

**Expected Response:**
```json
{
  "concerns": [
    {
      "id": 1,
      "health_checkup_id": 1,
      "driver_id": 1,
      "cet_id": 1,
      "center_id": 1,
      "concern_type": "BLOOD_SUGAR",
      "concern_level": "HIGH",
      "parameter_value": {
        "parameter": "Random Blood Sugar",
        "value": 450,
        "unit": "mg/dL"
      },
      "threshold_value": {
        "threshold": 350,
        "recommendation": "Immediate medical attention required"
      },
      "status": "PENDING",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "driver": {
        "id": 1,
        "name": "John Doe",
        "contactNumber": "+1234567890"
      },
      "cet": {
        "id": 1,
        "name": "CET Company",
        "spocName": "CET SPOC",
        "spocEmail": "cet@example.com"
      },
      "center": {
        "id": 1,
        "project_name": "Project Alpha",
        "client_spoc_name": "Client SPOC",
        "client_spoc_email": "client@example.com"
      }
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

**What this does:** Retrieves all health concerns with filtering and pagination options.

#### **Step 2.2: Get Specific Concern**
```http
GET {{baseUrl}}/api/health-concerns/{{testConcernId}}
```

**What this does:** Gets detailed information about a specific concern.

#### **Step 2.3: Update Concern Status**
```http
PUT {{baseUrl}}/api/health-concerns/{{testConcernId}}
Content-Type: application/json

{
  "status": "APPROVED",
  "custom_notes": "Reviewed and approved for email sending"
}
```

**Expected Response:**
```json
{
  "id": 1,
  "status": "APPROVED",
  "custom_notes": "Reviewed and approved for email sending",
  "reviewed_at": "2024-01-15T10:35:00.000Z",
  "updatedAt": "2024-01-15T10:35:00.000Z"
}
```

**What this does:** Updates the status of a concern (PENDING → APPROVED → COMPLETED).

#### **Step 2.4: Get Concerns by Health Checkup ID**
```http
GET {{baseUrl}}/api/health-concerns/health-checkup/{{testHealthCheckupId}}
```

**What this does:** Gets all concerns for a specific health checkup.

#### **Step 2.5: Get Pending Concerns**
```http
GET {{baseUrl}}/api/health-concerns/pending
```

**What this does:** Gets all concerns that are still pending review.

---

### **PHASE 3: SPOC MANAGEMENT**

#### **Step 3.1: Get SPOC Details (CET + Client)**
```http
GET {{baseUrl}}/api/spoc-management/{{testCETId}}/{{testCenterId}}
```

**Expected Response:**
```json
{
  "cetSpoc": {
    "name": "CET SPOC",
    "email": "cet@example.com",
    "whatsapp": "+1234567890"
  },
  "clientSpoc": {
    "name": "Client SPOC",
    "email": "client@example.com",
    "whatsapp": "+0987654321"
  }
}
```

**What this does:** Retrieves SPOC (Single Point of Contact) details for both CET and Client.

#### **Step 3.2: Get CET SPOC Only**
```http
GET {{baseUrl}}/api/spoc-management/cet/{{testCETId}}
```

**What this does:** Gets only the CET SPOC details.

#### **Step 3.3: Get Client SPOC Only**
```http
GET {{baseUrl}}/api/spoc-management/client/{{testCenterId}}
```

**What this does:** Gets only the Client SPOC details.

---

### **PHASE 4: COMMUNICATION TESTING**

#### **Step 4.1: Test Basic Email Service**
```http
POST {{baseUrl}}/api/communication/test-email
Content-Type: application/json

{
  "to": "{{testSpocEmail}}",
  "subject": "Health Concern Alert Test",
  "content": "<h1>Test Email</h1><p>This is a test email from the health concern system.</p>"
}
```

**Expected Response:**
```json
{
  "success": true,
  "messageId": "abc123-def456-ghi789",
  "message": "Email sent successfully"
}
```

**What this does:** Tests if the email service is working correctly.

#### **Step 4.2: Generate Email Content (Preview)**
```http
POST {{baseUrl}}/api/communication/generate-email-content
Content-Type: application/json

{
  "template": "CET_HIGH",
  "driverName": "{{testDriverName}}",
  "concernType": "Blood Sugar",
  "concernLevel": "HIGH",
  "parameterValue": "450 mg/dL",
  "thresholdValue": "350 mg/dL",
  "customNotes": "Immediate attention required"
}
```

**Expected Response:**
```json
{
  "subject": "URGENT: High Blood Sugar Alert - Driver John Doe",
  "content": "<html><body><h1>Health Concern Alert</h1>...</body></html>"
}
```

**What this does:** Generates email content using templates for preview.

#### **Step 4.3: Send Manual Health Concern Email (with file attachment)**
```http
POST {{baseUrl}}/api/communication/send-manual-health-email
Content-Type: multipart/form-data

Form Data:
- concernId: {{testConcernId}}
- spocName: {{testSpocName}}
- spocPhone: {{testSpocPhone}}
- receiverEmails: ["{{testSpocEmail}}", "spoc2@example.com"]
- customSubject: Health Concern Alert - Immediate Action Required
- customMessage: Please review the attached health concern details and take necessary action.
- prescriptionFile: [Upload PDF file]
```

**Expected Response:**
```json
{
  "success": true,
  "messageId": "abc123-def456-ghi789",
  "concernId": 1,
  "recipients": ["spoc@example.com", "spoc2@example.com"],
  "attachments": ["prescription.pdf"],
  "message": "Manual health concern email sent successfully"
}
```

**What this does:** Sends a manual email with file attachments to specified recipients.

#### **Step 4.4: Send Custom Email**
```http
POST {{baseUrl}}/api/communication/send-email
Content-Type: application/json

{
  "to": ["{{testSpocEmail}}", "spoc2@example.com"],
  "subject": "Custom Health Alert",
  "content": "<h1>Custom Alert</h1><p>This is a custom health alert message.</p>"
}
```

**What this does:** Sends a custom email without using templates.

---

## 🧪 TESTING SCENARIOS

### **Scenario 1: No Health Concerns**
**Objective:** Test when a health checkup has normal values.

**Steps:**
1. Use a health checkup with normal values
2. Run analysis workflow
3. Verify no concerns are created
4. Check workflow status shows `hasConcerns: false`

**Expected Result:** No concerns should be created, and the system should indicate no health issues.

### **Scenario 2: Multiple Health Concerns**
**Objective:** Test when a health checkup has multiple abnormal values.

**Steps:**
1. Use a health checkup with multiple abnormal values
2. Run analysis workflow
3. Verify multiple concerns are created
4. Test filtering and pagination

**Expected Result:** Multiple concerns should be created for different health parameters.

### **Scenario 3: Email Sending**
**Objective:** Test the complete email sending workflow.

**Steps:**
1. Create a concern
2. Update status to APPROVED
3. Send manual email with attachment
4. Verify email is sent successfully
5. Check concern status is updated

**Expected Result:** Email should be sent successfully with attachments.

### **Scenario 4: Error Handling**
**Objective:** Test system behavior with invalid inputs.

**Steps:**
1. Test with invalid health checkup ID
2. Test with missing SPOC details
3. Test with invalid email addresses
4. Verify proper error responses

**Expected Result:** System should return appropriate error messages.

---

## 📊 EXPECTED RESPONSES

### **Success Responses:**
- ✅ HTTP 200 for successful operations
- ✅ Proper JSON structure
- ✅ Meaningful success messages
- ✅ Correct data types

### **Error Responses:**
- ✅ HTTP 400 for validation errors
- ✅ HTTP 404 for not found
- ✅ HTTP 500 for server errors
- ✅ Descriptive error messages

---

## 🔧 TROUBLESHOOTING

### **Common Issues:**

1. **Database Connection Error:**
   - Check database is running
   - Verify connection string
   - Check table exists

2. **AWS SES Error:**
   - Verify AWS credentials
   - Check SES account status
   - Verify sender email is verified

3. **File Upload Error:**
   - Check file size (max 10MB)
   - Verify file type (PDF, DOC, DOCX, JPG, PNG)
   - Check multipart/form-data format

4. **Health Analysis Error:**
   - Verify health checkup exists
   - Check selected_test JSON structure
   - Verify parameter values are numeric

---

## 📝 TESTING CHECKLIST

- [ ] Health analysis endpoints working
- [ ] Health concerns CRUD operations working
- [ ] SPOC management endpoints working
- [ ] Email service working (basic and manual)
- [ ] File upload working
- [ ] Workflow integration working
- [ ] Error handling working
- [ ] Pagination and filtering working
- [ ] Status updates working
- [ ] Email templates generating correctly

---

## 🎯 UNDERSTANDING THE WORKFLOW

### **Complete Process Flow:**

1. **Health Checkup Creation** (via existing health checkup API)
2. **Automatic Analysis** (triggered after health checkup creation)
3. **Concern Detection** (system analyzes values against thresholds)
4. **Concern Creation** (creates database entries for detected concerns)
5. **SPOC Retrieval** (gets CET and Client SPOC details)
6. **Manual Review** (user reviews and approves concerns)
7. **Email Composition** (user fills SPOC details and customizes content)
8. **Email Preview** (user sees complete email before sending)
9. **Email Sending** (user sends email with attachments)
10. **Status Update** (concern status updated to completed)

### **Key Components:**

- **Health Analysis Service:** Analyzes health checkup data
- **Health Concerns Service:** Manages concern lifecycle
- **SPOC Management Service:** Retrieves contact details
- **Communication Service:** Handles email sending
- **Template Service:** Generates email content

### **Data Flow:**

```
Health Checkup → Analysis → Concerns → SPOC Details → Email Template → Manual Review → Email Sending
```

---

## 🚀 QUICK START FOR NEW DEVELOPERS

1. **Setup Environment:** Create Postman environment with variables
2. **Health Check:** Test basic endpoints first
3. **Create Test Data:** Ensure you have a health checkup with abnormal values
4. **Run Analysis:** Execute health analysis workflow
5. **Review Concerns:** Check created concerns
6. **Test Email:** Send test emails
7. **Complete Workflow:** Test end-to-end process

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Server Port**: 3000
