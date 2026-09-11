# AMAZON SES SETUP GUIDE

## Overview
This guide provides step-by-step instructions for setting up Amazon SES (Simple Email Service) for the Health Concern Alert System.

## Prerequisites
- AWS Account
- AWS CLI installed (optional but recommended)
- Node.js application with the health concern alert system

## Step 1: AWS Account Setup

### 1.1 Create AWS Account
1. Go to [AWS Console](https://aws.amazon.com/)
2. Create a new AWS account if you don't have one
3. Complete the account verification process

### 1.2 Access Amazon SES
1. Log in to AWS Console
2. Navigate to Amazon SES service
3. Select your preferred region (e.g., us-east-1)

## Step 2: SES Configuration

### 2.1 Verify Sender Email
1. In SES Console, go to "Verified identities"
2. Click "Create identity"
3. Choose "Email address"
4. Enter your sender email address (e.g., noreply@yourdomain.com)
5. Click "Create identity"
6. Check your email and click the verification link

### 2.2 Verify Domain (Optional but Recommended)
1. In SES Console, go to "Verified identities"
2. Click "Create identity"
3. Choose "Domain"
4. Enter your domain name
5. Follow the DNS configuration instructions
6. Add the required DNS records to your domain

### 2.3 Request Production Access
1. In SES Console, go to "Account dashboard"
2. Click "Request production access"
3. Fill out the form with your use case details
4. Submit the request
5. Wait for AWS approval (usually 24-48 hours)

## Step 3: IAM User Setup

### 3.1 Create IAM User
1. Go to IAM Console
2. Click "Users" → "Create user"
3. Enter username (e.g., ses-email-user)
4. Select "Programmatic access"
5. Click "Next"

### 3.2 Attach Permissions
1. Click "Attach existing policies directly"
2. Search for "AmazonSESFullAccess"
3. Select the policy
4. Click "Next" → "Create user"

### 3.3 Get Access Keys
1. Click on the created user
2. Go to "Security credentials" tab
3. Click "Create access key"
4. Choose "Application running outside AWS"
5. Copy the Access Key ID and Secret Access Key
6. Store them securely

## Step 4: Environment Configuration

### 4.1 Update .env File
```env
# Amazon SES Configuration
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-east-1
EMAIL_FROM=your_verified_email@domain.com

# Health Concern Alert System
HEALTH_CONCERN_ENABLED=true
HEALTH_CONCERN_AUTO_ANALYSIS=true
EMAIL_SERVICE_ENABLED=true
```

### 4.2 Install AWS SDK
```bash
npm install @aws-sdk/client-ses
```

## Step 5: Testing

### 5.1 Test Basic Email
```bash
curl -X POST http://localhost:3000/api/communication/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "SES Test Email",
    "content": "<h1>Test Email</h1><p>This is a test email from Amazon SES.</p>"
  }'
```

### 5.2 Test Manual Health Concern Email
```bash
curl -X POST http://localhost:3000/api/communication/send-manual-health-email \
  -H "Content-Type: multipart/form-data" \
  -F "concernId=1" \
  -F "spocName=John Doe" \
  -F "spocPhone=+1234567890" \
  -F "receiverEmails=test@example.com" \
  -F "customSubject=Health Concern Alert" \
  -F "customMessage=Please review this health concern" \
  -F "prescriptionFile=@/path/to/prescription.pdf"
```

## Step 6: Monitoring and Troubleshooting

### 6.1 SES Dashboard
- Monitor sending statistics in SES Console
- Check bounce and complaint rates
- View sending quotas and limits

### 6.2 Common Issues

#### Issue: Email Not Sending
**Solution:**
1. Check AWS credentials are correct
2. Verify sender email is verified in SES
3. Check SES sending limits
4. Ensure you're in the correct AWS region

#### Issue: "Email address not verified" Error
**Solution:**
1. Verify the sender email address in SES Console
2. Check the verification email and click the link
3. Wait for verification to complete

#### Issue: "Sending quota exceeded" Error
**Solution:**
1. Check your current sending limits in SES Console
2. Request production access if in sandbox mode
3. Monitor sending rates and stay within limits

#### Issue: "Invalid destination" Error
**Solution:**
1. Verify recipient email addresses are valid
2. Check if recipient domain accepts emails
3. Test with a verified email address first

### 6.3 SES Limits
- **Sandbox Mode:** 200 emails per day, 1 email per second
- **Production Mode:** Higher limits based on your request
- **Bounce Rate:** Keep below 5%
- **Complaint Rate:** Keep below 0.1%

## Step 7: Best Practices

### 7.1 Email Content
- Use proper HTML formatting
- Include unsubscribe links
- Follow email best practices
- Test emails before sending

### 7.2 Monitoring
- Set up CloudWatch alarms for bounce rates
- Monitor sending statistics regularly
- Track delivery success rates
- Set up notifications for failures

### 7.3 Security
- Use IAM roles instead of access keys when possible
- Rotate access keys regularly
- Use least privilege principle
- Monitor IAM user activity

## Step 8: Production Deployment

### 8.1 Environment Variables
Ensure all environment variables are set in production:
```env
AWS_ACCESS_KEY_ID=production_access_key
AWS_SECRET_ACCESS_KEY=production_secret_key
AWS_REGION=us-east-1
EMAIL_FROM=production@yourdomain.com
```

### 8.2 Monitoring Setup
1. Set up CloudWatch alarms
2. Configure error logging
3. Set up email notifications for failures
4. Monitor SES metrics

### 8.3 Testing in Production
1. Test with verified email addresses
2. Verify all email templates work
3. Test file attachment functionality
4. Monitor sending success rates

## Support Resources

- [Amazon SES Documentation](https://docs.aws.amazon.com/ses/)
- [SES API Reference](https://docs.aws.amazon.com/ses/latest/APIReference/)
- [SES Best Practices](https://docs.aws.amazon.com/ses/latest/DeveloperGuide/best-practices.html)
- [AWS Support](https://aws.amazon.com/support/)

## Troubleshooting Commands

### Check SES Configuration
```bash
# Test AWS credentials
aws sts get-caller-identity

# Check SES sending statistics
aws ses get-send-statistics

# List verified identities
aws ses list-identities
```

### Application Logs
```bash
# Check application logs for SES errors
tail -f logs/application.log | grep SES

# Monitor email sending
tail -f logs/application.log | grep "Email sent"
```
