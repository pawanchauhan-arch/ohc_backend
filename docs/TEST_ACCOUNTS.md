# Test Account System

This document explains the test account system implemented for Google Play Store review process.

## Overview

The test account system allows us to bypass the normal OTP authentication flow for specific phone numbers, using hardcoded OTPs instead of sending real ones. This is particularly useful for Google Play Store reviewers who need access to test the app without requiring a real phone number or waiting for OTP delivery.

## How It Works

1. A special `TestAccount` model stores phone numbers and their associated hardcoded OTPs.
2. When a user tries to authenticate, the system checks if the phone number belongs to a test account.
3. If it's a test account, it returns the hardcoded OTP without actually sending an SMS.
4. When verifying the OTP, the system checks against the hardcoded value for test accounts.

## Configuration

Test accounts can be configured through environment variables:

- `TEST_ACCOUNT_ENABLED`: Set to 'true' to enable the test account system.
- `TEST_ACCOUNT_PHONE`: The default phone number for the test account.
- `TEST_ACCOUNT_OTP`: The default OTP code for the test account.

Example configuration in `.env` file:

```
TEST_ACCOUNT_ENABLED=true
TEST_ACCOUNT_PHONE=9999999999
TEST_ACCOUNT_OTP=1234
```

## Managing Test Accounts

The system provides an API to manage test accounts. These endpoints should be protected and only accessible to administrators.

### API Endpoints

- `POST /api/admin/test-accounts`: Create or update a test account
  - Request body: `{ "phoneNumber": "9999999999", "otp": "1234", "description": "Google Play review account" }`

- `GET /api/admin/test-accounts/:phoneNumber`: Get a test account by phone number

- `DELETE /api/admin/test-accounts/:phoneNumber`: Delete a test account

- `GET /api/admin/test-accounts/check/:phoneNumber`: Check if a phone number belongs to a test account

## Implementation Details

The test account system is implemented in the following files:

- `src/models/TestAccount.ts`: The database model for test accounts
- `src/modules/test-account/test-account.module.ts`: Module configuration
- `src/modules/test-account/test-account.service.ts`: Service for test account operations
- `src/modules/test-account/test-account.controller.ts`: API controller for managing test accounts
- `config/envConfig.ts`: Configuration settings (in the testAccountConfig section)
- `src/modules/otp/otp.service.ts`: Integration with the OTP system

## Important Notes

1. This system should only be enabled in specific environments like staging or production instances intended for review.
2. Be careful with the test account credentials and don't expose them publicly.
3. Test accounts should be clearly marked as such in the database to avoid confusion.
4. Consider disabling test accounts after the review process is complete.

## For Google Play Store Reviewers

When reviewing our app, please use the following credentials:

- Phone Number: `9999999999` (or the value set in the environment)
- OTP: `1234` (or the value set in the environment)

These credentials will allow you to log in without requiring a real SMS to be delivered. 