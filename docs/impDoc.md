# HEALTH CONCERN ALERT SYSTEM - IMPLEMENTATION DOCUMENT

## OVERVIEW
This document provides a step-by-step implementation guide for the Health Concern Alert System, including database scripts, API endpoints, and integration points.

## SYSTEM ARCHITECTURE
- **Backend**: NestJS with Sequelize ORM (PostgreSQL)
- **Communication**: Email only (Amazon SES)
- **Integration**: Automatic analysis after health checkup creation
- **User Control**: Manual email sending with user-provided details

---

## PHASE 1: DATABASE SETUP

### Step 1.1: Update Center Table (Add Client Fields)

**SQL Script:**
```sql
-- Add client/transporter fields to center table
ALTER TABLE "Centers" ADD COLUMN IF NOT EXISTS client_spoc_name VARCHAR(255);
ALTER TABLE "Centers" ADD COLUMN IF NOT EXISTS client_spoc_email VARCHAR(255);
ALTER TABLE "Centers" ADD COLUMN IF NOT EXISTS client_spoc_whatsapp VARCHAR(20);
ALTER TABLE "Centers" ADD COLUMN IF NOT EXISTS client_name VARCHAR(255);
ALTER TABLE "Centers" ADD COLUMN IF NOT EXISTS client_address TEXT;
ALTER TABLE "Centers" ADD COLUMN IF NOT EXISTS client_contact VARCHAR(20);
ALTER TABLE "Centers" ADD COLUMN IF NOT EXISTS is_client BOOLEAN DEFAULT FALSE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_centers_is_client ON "Centers"(is_client);
CREATE INDEX IF NOT EXISTS idx_centers_client_spoc_email ON "Centers"(client_spoc_email);

-- Add comments for documentation
COMMENT ON COLUMN "Centers".client_spoc_name IS 'Name of the client SPOC (Single Point of Contact)';
COMMENT ON COLUMN "Centers".client_spoc_email IS 'Email address of the client SPOC';
COMMENT ON COLUMN "Centers".client_spoc_whatsapp IS 'WhatsApp number of the client SPOC';
COMMENT ON COLUMN "Centers".client_name IS 'Name of the client organization';
COMMENT ON COLUMN "Centers".client_address IS 'Address of the client organization';
COMMENT ON COLUMN "Centers".client_contact IS 'Contact number of the client organization';
COMMENT ON COLUMN "Centers".is_client IS 'Flag to distinguish centers from clients/transporters';
```

### Step 1.2: Create Health Concerns Table

**SQL Script:**
```sql
-- Create health_concerns table
CREATE TABLE IF NOT EXISTS health_concerns (
    id SERIAL PRIMARY KEY,
    health_checkup_id INTEGER NOT NULL,
    driver_id INTEGER NOT NULL,
    cet_id INTEGER NOT NULL,
    center_id INTEGER NOT NULL,
    concern_type VARCHAR(50) NOT NULL,
    concern_level VARCHAR(20) NOT NULL,
    parameter_value JSONB NOT NULL,
    threshold_value JSONB NOT NULL,
    spoc_details JSONB,
    status VARCHAR(30) DEFAULT 'PENDING',
    email_template TEXT,
    final_email_content TEXT,
    custom_notes TEXT,
    reviewed_by INTEGER,
    reviewed_at TIMESTAMP,
    email_sent_at TIMESTAMP,
    whatsapp_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add foreign key constraints
ALTER TABLE health_concerns 
ADD CONSTRAINT fk_health_concerns_health_checkup 
FOREIGN KEY (health_checkup_id) REFERENCES "driverhealthcheckups"(id) ON DELETE CASCADE;

ALTER TABLE health_concerns 
ADD CONSTRAINT fk_health_concerns_driver 
FOREIGN KEY (driver_id) REFERENCES "DRIVERMASTERs"(id) ON DELETE CASCADE;

ALTER TABLE health_concerns 
ADD CONSTRAINT fk_health_concerns_cet 
FOREIGN KEY (cet_id) REFERENCES "CETMANAGEMENTs"(id) ON DELETE CASCADE;

ALTER TABLE health_concerns 
ADD CONSTRAINT fk_health_concerns_center 
FOREIGN KEY (center_id) REFERENCES "Centers"(id) ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_health_concerns_health_checkup_id ON health_concerns(health_checkup_id);
CREATE INDEX IF NOT EXISTS idx_health_concerns_driver_id ON health_concerns(driver_id);
CREATE INDEX IF NOT EXISTS idx_health_concerns_cet_id ON health_concerns(cet_id);
CREATE INDEX IF NOT EXISTS idx_health_concerns_center_id ON health_concerns(center_id);
CREATE INDEX IF NOT EXISTS idx_health_concerns_status ON health_concerns(status);
CREATE INDEX IF NOT EXISTS idx_health_concerns_concern_type ON health_concerns(concern_type);
CREATE INDEX IF NOT EXISTS idx_health_concerns_concern_level ON health_concerns(concern_level);
CREATE INDEX IF NOT EXISTS idx_health_concerns_created_at ON health_concerns(created_at);

-- Add check constraints for data validation
ALTER TABLE health_concerns 
ADD CONSTRAINT chk_concern_type 
CHECK (concern_type IN ('BLOOD_SUGAR', 'BLOOD_PRESSURE', 'PULSE', 'HEMOGLOBIN', 'EYE_VISION'));

ALTER TABLE health_concerns 
ADD CONSTRAINT chk_concern_level 
CHECK (concern_level IN ('MODERATE', 'HIGH'));

ALTER TABLE health_concerns 
ADD CONSTRAINT chk_status 
CHECK (status IN ('PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'));

-- Add comments for documentation
COMMENT ON TABLE health_concerns IS 'Stores health concerns detected during health checkups';
COMMENT ON COLUMN health_concerns.health_checkup_id IS 'Reference to the health checkup record';
COMMENT ON COLUMN health_concerns.driver_id IS 'Reference to the driver';
COMMENT ON COLUMN health_concerns.cet_id IS 'Reference to the CET management';
COMMENT ON COLUMN health_concerns.center_id IS 'Reference to the center/client';
COMMENT ON COLUMN health_concerns.concern_type IS 'Type of health concern detected';
COMMENT ON COLUMN health_concerns.concern_level IS 'Level of concern (MODERATE/HIGH)';
COMMENT ON COLUMN health_concerns.parameter_value IS 'JSON object containing actual test values';
COMMENT ON COLUMN health_concerns.threshold_value IS 'JSON object containing threshold values that were exceeded';
COMMENT ON COLUMN health_concerns.spoc_details IS 'JSON object containing SPOC contact information';
COMMENT ON COLUMN health_concerns.status IS 'Current status of the concern';
COMMENT ON COLUMN health_concerns.email_template IS 'Email template used for the alert';
COMMENT ON COLUMN health_concerns.final_email_content IS 'Final email content sent to SPOCs';
COMMENT ON COLUMN health_concerns.custom_notes IS 'Custom notes added by the reviewer';
COMMENT ON COLUMN health_concerns.reviewed_by IS 'User ID who reviewed the concern';
COMMENT ON COLUMN health_concerns.reviewed_at IS 'Timestamp when concern was reviewed';
COMMENT ON COLUMN health_concerns.email_sent_at IS 'Timestamp when email was sent';
COMMENT ON COLUMN health_concerns.whatsapp_sent_at IS 'Timestamp when WhatsApp message was sent';
```

### Step 1.3: Create Communication Logs Table (Optional - for audit trail)

**SQL Script:**
```sql
-- Create communication_logs table for audit trail
CREATE TABLE IF NOT EXISTS communication_logs (
    id SERIAL PRIMARY KEY,
    concern_id INTEGER NOT NULL,
    communication_type VARCHAR(20) NOT NULL,
    recipient_type VARCHAR(20) NOT NULL,
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(20),
    message_content TEXT,
    delivery_status VARCHAR(20) DEFAULT 'PENDING',
    error_message TEXT,
    sent_at TIMESTAMP DEFAULT NOW(),
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add foreign key constraint
ALTER TABLE communication_logs 
ADD CONSTRAINT fk_communication_logs_concern 
FOREIGN KEY (concern_id) REFERENCES health_concerns(id) ON DELETE CASCADE;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_communication_logs_concern_id ON communication_logs(concern_id);
CREATE INDEX IF NOT EXISTS idx_communication_logs_type ON communication_logs(communication_type);
CREATE INDEX IF NOT EXISTS idx_communication_logs_status ON communication_logs(delivery_status);
CREATE INDEX IF NOT EXISTS idx_communication_logs_sent_at ON communication_logs(sent_at);

-- Add check constraints
ALTER TABLE communication_logs 
ADD CONSTRAINT chk_communication_type 
CHECK (communication_type IN ('EMAIL', 'WHATSAPP'));

ALTER TABLE communication_logs 
ADD CONSTRAINT chk_recipient_type 
CHECK (recipient_type IN ('CET', 'CLIENT'));

ALTER TABLE communication_logs 
ADD CONSTRAINT chk_delivery_status 
CHECK (delivery_status IN ('PENDING', 'SENT', 'DELIVERED', 'FAILED'));

-- Add comments
COMMENT ON TABLE communication_logs IS 'Audit trail for all communication attempts';
COMMENT ON COLUMN communication_logs.concern_id IS 'Reference to the health concern';
COMMENT ON COLUMN communication_logs.communication_type IS 'Type of communication (EMAIL/WHATSAPP)';
COMMENT ON COLUMN communication_logs.recipient_type IS 'Type of recipient (CET/CLIENT)';
COMMENT ON COLUMN communication_logs.delivery_status IS 'Status of message delivery';
```

---

## PHASE 2: BACKEND IMPLEMENTATION

### Step 2.1: Create Health Analysis Module ✅

**Files to create:**
- [x] `src/modules/health-analysis/health-analysis.module.ts`
- [x] `src/modules/health-analysis/health-analysis.service.ts`
- [x] `src/modules/health-analysis/health-analysis.controller.ts`
- [x] `src/modules/health-analysis/dto/analyze-health.dto.ts`
- [x] `src/modules/health-analysis/dto/analysis-result.dto.ts`

**Health Parameter Thresholds:**
```typescript
// Constants for health parameter thresholds
export const HEALTH_THRESHOLDS = {
  BLOOD_SUGAR: {
    MODERATE: { min: 141, max: 349 },
    HIGH: { min: 350, max: Infinity }
  },
  BLOOD_PRESSURE: {
    MODERATE: { systolic: { min: 130, max: 179 }, diastolic: { min: 81, max: 119 } },
    HIGH: { systolic: { min: 180, max: Infinity }, diastolic: { min: 120, max: Infinity } }
  },
  PULSE: {
    MODERATE: { low: { min: 51, max: 59 }, high: { min: 101, max: 119 } },
    HIGH: { low: { min: 0, max: 50 }, high: { min: 120, max: Infinity } }
  },
  HEMOGLOBIN: {
    HIGH: { min: 0, max: 7.9 }
  },
  EYE_VISION: {
    HIGH: { value: '6/60' }
  }
};
```

### Step 2.2: Create Health Concerns Module ✅

**Files to create:**
- [x] `src/modules/health-concerns/health-concerns.module.ts`
- [x] `src/modules/health-concerns/health-concerns.service.ts`
- [x] `src/modules/health-concerns/health-concerns.controller.ts`
- [x] `src/modules/health-concerns/dto/create-concern.dto.ts`
- [x] `src/modules/health-concerns/dto/update-concern.dto.ts`
- [x] `src/modules/health-concerns/dto/concern-filters.dto.ts`

### Step 2.3: Create SPOC Management Module ✅

**Files to create:**
- [x] `src/modules/spoc-management/spoc-management.module.ts`
- [x] `src/modules/spoc-management/spoc-management.service.ts`
- [x] `src/modules/spoc-management/spoc-management.controller.ts`
- [x] `src/modules/spoc-management/dto/spoc-details.dto.ts`

### Step 2.4: Create Communication Module ✅

**Files to create:**
- [x] `src/modules/communication/communication.module.ts`
- [x] `src/modules/communication/communication.service.ts`
- [x] `src/modules/communication/email.service.ts`
- [x] `src/modules/communication/whatsapp.service.ts`
- [x] `src/modules/communication/communication.controller.ts`
- [x] `src/modules/communication/dto/send-email.dto.ts`
- [x] `src/modules/communication/dto/send-whatsapp.dto.ts`

---

## PHASE 3: API ENDPOINTS

### Step 3.1: Health Analysis Endpoints

**POST /api/health-analysis/analyze**
```typescript
// Request
{
  "healthCheckupId": number
}

// Response
{
  "success": boolean,
  "concerns": [{
    "id": string,
    "type": string,
    "level": "MODERATE" | "HIGH",
    "parameter": string,
    "value": number,
    "threshold": number,
    "recommendation": string
  }],
  "summary": {
    "totalConcerns": number,
    "moderateCount": number,
    "highCount": number
  }
}
```

### Step 3.2: Health Concerns Endpoints

**GET /api/health-concerns**
```typescript
// Query Parameters
{
  "status": "PENDING" | "APPROVED" | "COMPLETED" | "REJECTED",
  "level": "MODERATE" | "HIGH",
  "type": "BLOOD_SUGAR" | "BLOOD_PRESSURE" | "PULSE" | "HEMOGLOBIN" | "EYE_VISION",
  "driverId": number,
  "cetId": number,
  "centerId": number,
  "dateFrom": string,
  "dateTo": string,
  "page": number,
  "limit": number
}

// Response
{
  "concerns": [{
    "id": number,
    "healthCheckupId": number,
    "driverName": string,
    "concernType": string,
    "concernLevel": string,
    "parameterValue": object,
    "status": string,
    "createdAt": string,
    "reviewedAt": string,
    "emailSentAt": string
  }],
  "pagination": {
    "total": number,
    "page": number,
    "limit": number,
    "totalPages": number
  }
}
```

**GET /api/health-concerns/:id**
**POST /api/health-concerns**
**PUT /api/health-concerns/:id**
**DELETE /api/health-concerns/:id**

### Step 3.3: SPOC Management Endpoints

**GET /api/spoc/cet/:cetId**
**GET /api/spoc/client/:centerId**
**GET /api/spoc/validate/:type/:id**

### Step 3.4: Communication Endpoints

**POST /api/communication/send-email**
```typescript
// Request
{
  "concernId": number,
  "recipients": [{
    "type": "CET" | "CLIENT",
    "email": string,
    "name": string
  }],
  "subject": string,
  "content": string
}

// Response
{
  "success": boolean,
  "emailId": string,
  "deliveryStatus": object
}
```

**POST /api/communication/send-whatsapp**

---

## PHASE 4: INTEGRATION ✅

### Step 4.1: Create Integration Service ✅

**Files created:**
- [x] `src/modules/health-analysis/health-analysis-integration.service.ts`

**Features implemented:**
- Complete health concern workflow orchestration
- Automatic concern creation from analysis results
- SPOC details retrieval and validation
- Communication alerts for both CET and Client SPOCs
- Workflow status tracking and monitoring

### Step 4.2: Update Health Analysis Module ✅

**Updated files:**
- [x] `src/modules/health-analysis/health-analysis.module.ts` - Added integration service and module dependencies
- [x] `src/modules/health-analysis/health-analysis.controller.ts` - Added workflow endpoints

**New endpoints:**
- `POST /api/health-analysis/workflow/execute` - Execute complete workflow
- `POST /api/health-analysis/workflow/trigger` - Manual workflow trigger
- `GET /api/health-analysis/workflow/status/:healthCheckupId` - Get workflow status

### Step 4.3: Update Environment Configuration ✅

**Updated files:**
- [x] `config/envConfig.ts` - Added health concern alert system configuration

**Configuration includes:**
- Health concern system enable/disable flags
- Email service configuration (SMTP settings)
- WhatsApp service configuration (Twilio settings)
- Health parameter thresholds (configurable via environment variables)
- Auto-analysis settings

### Step 4.4: Integration Workflow ✅

**Complete workflow implemented:**
1. **Health Analysis** → Analyzes health checkup for concerns
2. **Concern Creation** → Creates database entries for detected concerns
3. **SPOC Retrieval** → Gets CET and Client SPOC details
4. **Communication** → Sends email and WhatsApp alerts
5. **Status Tracking** → Updates concern status and timestamps

**Integration points:**
- All modules are now connected and working together
- Automatic workflow execution after health checkup creation
- Manual workflow triggering capabilities
- Comprehensive error handling and logging
- Status monitoring and reporting

---

## PHASE 5: ENVIRONMENT CONFIGURATION ✅

### Step 5.1: Add Environment Variables

**Update `.env` file:**
```env
# Health Concern Alert System
HEALTH_CONCERN_ENABLED=true
HEALTH_CONCERN_AUTO_ANALYSIS=true

# Email Configuration (Amazon SES)
EMAIL_SERVICE_ENABLED=true
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
EMAIL_FROM=your_verified_ses_email@domain.com

# Health Parameter Thresholds (Optional - uses defaults if not set)
BLOOD_SUGAR_MODERATE_MIN=141
BLOOD_SUGAR_MODERATE_MAX=349
BLOOD_SUGAR_HIGH_MIN=350
BLOOD_PRESSURE_MODERATE_SYSTOLIC_MIN=130
BLOOD_PRESSURE_MODERATE_SYSTOLIC_MAX=179
BLOOD_PRESSURE_MODERATE_DIASTOLIC_MIN=81
BLOOD_PRESSURE_MODERATE_DIASTOLIC_MAX=119
BLOOD_PRESSURE_HIGH_SYSTOLIC_MIN=180
BLOOD_PRESSURE_HIGH_DIASTOLIC_MIN=120
PULSE_MODERATE_LOW_MIN=51
PULSE_MODERATE_LOW_MAX=59
PULSE_MODERATE_HIGH_MIN=101
PULSE_MODERATE_HIGH_MAX=119
PULSE_HIGH_LOW_MAX=50
PULSE_HIGH_HIGH_MIN=120
HEMOGLOBIN_HIGH_MAX=7.9
```

**Note:** The system uses your existing configuration:
- `WP_TWILIO_ACCOUNT_SID` - Your Twilio Account SID
- `WP_TWILIO_AUTH_TOKEN` - Your Twilio Auth Token  
- `WP_TWILIO_PHONE_NUMBER` - Your WhatsApp phone number
- `AWS_ACCESS_KEY_ID` - Your AWS access key for SES
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret key for SES
- `AWS_REGION` - Your AWS region for SES
- `EMAIL_FROM` - Your existing from email address (must be verified in SES)

### Step 5.2: Update Config File ✅

**Update `config/envConfig.ts`:**
```typescript
// Health Concern Alert System Configuration
const healthConcernConfig = {
  enabled: process.env.HEALTH_CONCERN_ENABLED === 'true',
  autoAnalysis: process.env.HEALTH_CONCERN_AUTO_ANALYSIS === 'true',
  emailService: {
    enabled: process.env.EMAIL_SERVICE_ENABLED === 'true',
    ses: {
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    from: process.env.EMAIL_FROM || 'noreply@healthmonitoring.com',
  },
  thresholds: {
    bloodSugar: {
      moderate: {
        min: parseInt(process.env.BLOOD_SUGAR_MODERATE_MIN || '141', 10),
        max: parseInt(process.env.BLOOD_SUGAR_MODERATE_MAX || '349', 10),
      },
      high: {
        min: parseInt(process.env.BLOOD_SUGAR_HIGH_MIN || '350', 10),
      },
    },
    // ... other thresholds
  },
};

export {
  healthConcernConfig,
  // ... other exports
};
```

**Note:** The configuration now uses AWS SES instead of SendGrid for email sending.

### Step 5.3: Manual Email Service Integration ✅

**The system has been updated to support manual email sending with file attachments using Amazon SES. Here's what you need to do:**

#### **Manual Email Setup (Fully Implemented)**

1. **✅ AWS SES Package Installed:**
   ```bash
   npm install @aws-sdk/client-ses
   ```

2. **Configure Amazon SES:**
   - Follow the detailed setup guide: [AMAZON_SES_SETUP_GUIDE.md](./AMAZON_SES_SETUP_GUIDE.md)
   - Your `AWS_ACCESS_KEY_ID` should be your AWS access key
   - Your `AWS_SECRET_ACCESS_KEY` should be your AWS secret key
   - Your `AWS_REGION` should be your SES region (e.g., 'us-east-1')
   - Your `EMAIL_FROM` should be a verified sender in SES
   - Make sure your SES account is active and has sending permissions

3. **Test Manual Email Sending:**
   ```bash
   # Test manual email with file attachment
   curl -X POST http://localhost:3000/api/communication/send-manual-health-email \
     -H "Content-Type: multipart/form-data" \
     -F "concernId=1" \
     -F "spocName=John Doe" \
     -F "spocPhone=+1234567890" \
     -F "receiverEmails=spoc1@example.com,spoc2@example.com" \
     -F "customSubject=Health Concern Alert" \
     -F "customMessage=Please review this health concern" \
     -F "prescriptionFile=@/path/to/prescription.pdf"
   ```

#### **Available Email Endpoints:**

1. **Send Manual Health Concern Email:**
   ```bash
   curl -X POST http://localhost:3000/api/communication/send-manual-health-email \
     -H "Content-Type: multipart/form-data" \
     -F "concernId=1" \
     -F "spocName=John Doe" \
     -F "spocPhone=+1234567890" \
     -F "receiverEmails=spoc1@example.com,spoc2@example.com" \
     -F "customSubject=Health Concern Alert" \
     -F "customMessage=Please review this health concern" \
     -F "prescriptionFile=@/path/to/prescription.pdf"
   ```

2. **Test Basic Email:**
   ```bash
   curl -X POST http://localhost:3000/api/communication/test-email \
     -H "Content-Type: application/json" \
     -d '{
       "to": "spoc@example.com",
       "subject": "Custom Test Subject",
       "content": "<h1>Custom Test Content</h1>"
     }'
   ```

3. **Send Custom Email:**
   ```bash
   curl -X POST http://localhost:3000/api/communication/send-email \
     -H "Content-Type: application/json" \
     -d '{
       "to": "spoc@example.com",
       "subject": "Health Concern Alert",
       "content": "<h1>Test Alert</h1><p>This is a test email.</p>"
     }'
   ```

4. **Generate Email Content (Preview):**
   ```bash
   curl -X POST http://localhost:3000/api/communication/generate-email-content \
     -H "Content-Type: application/json" \
     -d '{
       "template": "CET_HIGH",
       "driverName": "John Doe",
       "concernType": "Blood Sugar",
       "concernLevel": "HIGH",
       "parameterValue": "450 mg/dL",
       "thresholdValue": "350 mg/dL",
       "customNotes": "Immediate attention required"
     }'
   ```

#### **Manual Email Features:**

✅ **Complete Manual Email Integration**
- File attachment support (PDF, DOC, DOCX, JPG, JPEG, PNG)
- Multiple recipient emails
- User-provided SPOC details
- Custom subject and message
- Professional HTML templates
- Concern details auto-population
- File size validation (10MB max)

✅ **File Upload Support**
- Prescription file attachments
- Multiple file types supported
- File size validation
- Secure file handling

✅ **User Input Fields**
- SPOC Name (required)
- SPOC Phone Number (required)
- Receiver Emails (multiple, required)
- Custom Subject (optional)
- Custom Message (optional)
- Prescription File (optional)

✅ **Error Handling**
- SendGrid API error detection
- File validation errors
- Detailed error logging
- Graceful failure handling

---

## PHASE 6: TESTING

### Step 6.1: Unit Tests

**Create test files:**
- [ ] `src/modules/health-analysis/health-analysis.service.spec.ts`
- [ ] `src/modules/health-concerns/health-concerns.service.spec.ts`
- [ ] `src/modules/spoc-management/spoc-management.service.spec.ts`
- [ ] `src/modules/communication/communication.service.spec.ts`

### Step 6.2: Integration Tests

**Create test files:**
- [ ] `src/modules/health-analysis/health-analysis.controller.spec.ts`
- [ ] `src/modules/health-concerns/health-concerns.controller.spec.ts`
- [ ] `test/health-concern-alert.e2e-spec.ts`

### Step 6.3: Manual Testing Checklist

- [ ] Test health checkup creation triggers analysis
- [ ] Test concern detection for all parameter types
- [ ] Test SPOC details retrieval
- [ ] Test email sending functionality via SES
- [ ] Test file attachment functionality
- [ ] Test concern status updates
- [ ] Test error handling scenarios

---

## PHASE 7: DEPLOYMENT

### Step 7.1: Database Migration

**Run SQL scripts in order:**
1. Update Center table (Step 1.1)
2. Create Health Concerns table (Step 1.2)
3. Create Communication Logs table (Step 1.3 - Optional)

### Step 7.2: Application Deployment

**Deployment checklist:**
- [ ] Update environment variables
- [ ] Deploy new modules
- [ ] Test all endpoints
- [ ] Monitor logs for errors
- [ ] Verify database connections
- [ ] Test communication services

### Step 7.3: Post-Deployment Verification

**Verification checklist:**
- [ ] Health analysis triggers correctly
- [ ] Concerns are created in database
- [ ] SPOC details are retrieved correctly
- [ ] Email templates render properly
- [ ] Email messages are sent via SES
- [ ] Status updates work correctly
- [ ] Error handling works as expected

---

## IMPLEMENTATION TIMELINE

**Week 1:**
- Day 1-2: Database setup and SQL scripts
- Day 3-4: Core services implementation
- Day 5: Basic API endpoints

**Week 2:**
- Day 1-2: Communication services
- Day 3-4: Integration and testing
- Day 5: Documentation and deployment

**Total Estimated Time: 10-12 days**

---

## TROUBLESHOOTING GUIDE

### Common Issues:

1. **Database Connection Errors**
   - Verify PostgreSQL connection settings
   - Check if tables exist after running SQL scripts
   - Verify foreign key constraints

2. **Email Sending Failures**
   - Check AWS SES configuration
   - Verify AWS credentials
   - Check SES sending limits and quotas
   - Verify sender email is verified in SES

3. **WhatsApp Sending Failures**
   - Verify Twilio credentials
   - Check WhatsApp Business API setup
   - Verify phone number format

4. **Health Analysis Not Triggering**
   - Check if auto-analysis is enabled
   - Verify health checkup creation flow
   - Check error logs

### Debug Commands:

```bash
# Check database tables
\dt health_concerns
\dt communication_logs

# Check table structure
\d health_concerns
\d "Centers"

# Check recent concerns
SELECT * FROM health_concerns ORDER BY created_at DESC LIMIT 10;

# Check communication logs
SELECT * FROM communication_logs ORDER BY sent_at DESC LIMIT 10;
```

---

## SUPPORT & MAINTENANCE

### Monitoring:
- Monitor concern creation rates
- Track email delivery success rates
- Monitor system performance
- Check error logs regularly

### Maintenance:
- Regular database cleanup of old records
- Update health parameter thresholds as needed
- Monitor SES sending quotas and limits
- Backup concern data regularly

### Updates:
- Keep health parameter thresholds updated
- Monitor new health guidelines
- Update email templates as needed
- Maintain SPOC contact information accuracy
