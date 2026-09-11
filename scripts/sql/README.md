# SQL Scripts for Test Accounts

This directory contains SQL scripts for setting up and managing test accounts for Google Play Store review.

## Scripts

### create-test-accounts-table.sql

Creates the `test_accounts` table and sets up a default test account for Google Play Store review.

Usage:
```bash
psql -U your_username -d your_database -f create-test-accounts-table.sql
```

### manage-test-accounts.sql

Provides various statements for managing test accounts (listing, creating, updating, deleting).

Usage:
1. Edit the file to uncomment the statements you want to run
2. Run the script:
```bash
psql -U your_username -d your_database -f manage-test-accounts.sql
```

## Environment Configuration

Remember to update your environment variables to enable test accounts:

```
TEST_ACCOUNT_ENABLED=true
TEST_ACCOUNT_PHONE=9999999999
TEST_ACCOUNT_OTP=1234
```

These values should match the ones in your test_accounts table. 