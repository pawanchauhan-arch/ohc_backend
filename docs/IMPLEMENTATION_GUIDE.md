# Test Account Implementation Guide

This document provides a step-by-step guide for implementing and managing test accounts for Google Play Store review.

## Setting Up Test Accounts

### 1. Create the Database Table

Run the SQL script to create the test accounts table:

```bash
psql -U your_username -d your_database -f scripts/sql/create-test-accounts-table.sql
```

This script will:
- Create the `test_accounts` table if it doesn't exist
- Add necessary indexes
- Insert a default test account with phone `9999999999` and OTP `1234`

### 2. Enable Test Accounts in Environment

Add the following environment variables to your `.env` file:

```
TEST_ACCOUNT_ENABLED=true
TEST_ACCOUNT_PHONE=9999999999
TEST_ACCOUNT_OTP=1234
```

### 3. Restart your Application

Make sure to restart your application to apply the changes:

```bash
npm run start:dev
```

## Verifying Test Account Setup

To verify that the test account is working:

1. Send a POST request to the OTP generation endpoint:
   ```
   POST /api/otp/generate-otp
   Content-Type: application/json
   
   {
     "phoneNumber": "9999999999"
   }
   ```
2. The response should indicate it's a test account and show the hardcoded OTP:
   ```json
   {
     "message": "OTP sent successfully (Test Account)",
     "otp": "1234"
   }
   ```
3. Try verifying the OTP:
   ```
   POST /api/otp/verify-otp
   Content-Type: application/json
   
   {
     "phoneNumber": "9999999999",
     "otp": "1234"
   }
   ```
4. The verification should succeed without an actual SMS being sent:
   ```json
   {
     "message": "OTP verified successfully (Test Account)"
   }
   ```

## Managing Test Accounts

### Using SQL Scripts

Use the provided SQL script to manage test accounts:

```bash
# Edit the file first to uncomment the operation you want to perform
psql -U your_username -d your_database -f scripts/sql/manage-test-accounts.sql
```

The script includes operations for:
- Listing all test accounts
- Creating new test accounts
- Updating existing test accounts
- Deleting test accounts

### Using the Admin API

If you prefer using the API, the following endpoints are available:

```
# List test accounts
GET /api/admin/test-accounts/check/9999999999

# Create or update a test account
POST /api/admin/test-accounts
Content-Type: application/json
{
  "phoneNumber": "9999999999",
  "otp": "1234",
  "description": "Google Play Review Account"
}

# Delete a test account
DELETE /api/admin/test-accounts/9999999999
```

## Security Considerations

1. **Admin API Protection**: The admin endpoints should be properly secured with authentication and authorization.

2. **Environment-Based Enabling**: Test accounts should only be enabled in specific environments, not in general production.

3. **Documentation**: Keep the test account credentials in a secure place and communicate them only to Google Play reviewers.

4. **Cleanup After Review**: After the review process is complete, disable test accounts in production environments by setting `TEST_ACCOUNT_ENABLED=false` in your environment.

## Implementation Details

The test account system is implemented in the following files:

- `src/models/TestAccount.ts`: The database model for test accounts
- `src/modules/test-account/test-account.module.ts`: Module configuration
- `src/modules/test-account/test-account.service.ts`: Service for test account operations
- `src/modules/test-account/test-account.controller.ts`: API controller for managing test accounts
- `config/envConfig.ts`: Configuration settings (in the testAccountConfig section)
- `src/modules/otp/otp.service.ts`: Integration with the OTP system

## Troubleshooting

### Test Account Not Working

1. Verify that `TEST_ACCOUNT_ENABLED=true` is set in your environment.
2. Check the database to ensure the test account exists:
   ```sql
   SELECT * FROM test_accounts WHERE phone = '9999999999';
   ```
3. Verify the phone number format matches exactly.
4. Check server logs for any errors related to test accounts.

### Database Issues

If you need to recreate the `test_accounts` table, you can run:

```sql
DROP TABLE IF EXISTS test_accounts;
```

Then run the `create-test-accounts-table.sql` script again. 