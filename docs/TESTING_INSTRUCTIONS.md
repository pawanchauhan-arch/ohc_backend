# Testing Instructions for Test Account System

This document provides step-by-step instructions for testing the test account system for Google Play Store review.

## Prerequisites

Before testing, ensure you have:

1. Set up the database table using the SQL script:
   ```bash
   psql -U your_username -d your_database -f scripts/sql/create-test-accounts-table.sql
   ```

2. Added the test account configuration to your `.env` file:
   ```
   TEST_ACCOUNT_ENABLED=true
   TEST_ACCOUNT_PHONE=9999999999
   TEST_ACCOUNT_OTP=1234
   ```

3. Restarted your server to apply the changes:
   ```bash
   npm run start:dev
   ```

## Test Cases

### Test Case 1: Generate OTP for Test Account

**Objective**: Verify that requesting an OTP for a test account doesn't send a real SMS and returns the hardcoded OTP.

**Steps**:
1. Send a POST request to the OTP generation endpoint:
   ```bash
   curl -X POST http://localhost:3001/api/otp/generate-otp \
     -H "Content-Type: application/json" \
     -d '{"phoneNumber": "9999999999"}'
   ```

**Expected Result**:
```json
{
  "message": "OTP sent successfully (Test Account)",
  "otp": "1234"
}
```

### Test Case 2: Verify OTP for Test Account

**Objective**: Verify that the hardcoded OTP works for test accounts.

**Steps**:
1. Send a POST request to verify the OTP:
   ```bash
   curl -X POST http://localhost:3001/api/otp/verify-otp \
     -H "Content-Type: application/json" \
     -d '{"phoneNumber": "9999999999", "otp": "1234"}'
   ```

**Expected Result**:
```json
{
  "message": "OTP verified successfully (Test Account)"
}
```

### Test Case 3: Invalid OTP for Test Account

**Objective**: Verify that an invalid OTP doesn't work for test accounts.

**Steps**:
1. Send a POST request with an incorrect OTP:
   ```bash
   curl -X POST http://localhost:3001/api/otp/verify-otp \
     -H "Content-Type: application/json" \
     -d '{"phoneNumber": "9999999999", "otp": "9999"}'
   ```

**Expected Result**: Error response indicating invalid OTP.

### Test Case 4: Regular Account Works Normally

**Objective**: Verify that regular (non-test) accounts still use the normal OTP flow.

**Steps**:
1. Send a POST request to generate an OTP for a non-test number:
   ```bash
   curl -X POST http://localhost:3001/api/otp/generate-otp \
     -H "Content-Type: application/json" \
     -d '{"phoneNumber": "8888888888"}'
   ```

**Expected Result**: The system should send a real OTP via SMS to the regular account.

### Test Case 5: Admin API - Check Test Account

**Objective**: Verify that the admin API can check if a phone number is a test account.

**Steps**:
1. Send a GET request to check a test account:
   ```bash
   curl http://localhost:3001/api/admin/test-accounts/check/9999999999
   ```

**Expected Result**:
```json
{
  "isTestAccount": true
}
```

### Test Case 6: Admin API - Create New Test Account

**Objective**: Verify that the admin API can create a new test account.

**Steps**:
1. Send a POST request to create a new test account:
   ```bash
   curl -X POST http://localhost:3001/api/admin/test-accounts \
     -H "Content-Type: application/json" \
     -d '{"phoneNumber": "7777777777", "otp": "5678", "description": "Another test account"}'
   ```

**Expected Result**: Confirmation that the test account was created.

2. Verify the new test account works by generating an OTP:
   ```bash
   curl -X POST http://localhost:3001/api/otp/generate-otp \
     -H "Content-Type: application/json" \
     -d '{"phoneNumber": "7777777777"}'
   ```

**Expected Result**:
```json
{
  "message": "OTP sent successfully (Test Account)",
  "otp": "5678"
}
```

## Full Integration Testing

To fully test the integration in the mobile app:

1. Update the mobile app to use the test server with test accounts enabled.

2. On the login screen, enter the phone number: `9999999999`.

3. Request the OTP (no actual SMS will be sent).

4. On the OTP verification screen, enter: `1234`.

5. Verify that you are successfully logged in and can access all features.

## Troubleshooting Tips

If the tests are failing:

1. Verify the database has the test account:
   ```sql
   SELECT * FROM test_accounts WHERE phone = '9999999999';
   ```

2. Check server logs for any errors related to test accounts.

3. Verify environment variables are correctly set by looking at the server startup logs.

4. Ensure the OTP module is correctly importing the TestAccountService. 