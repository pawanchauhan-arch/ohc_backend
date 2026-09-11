-- SQL script to manage test accounts
-- Usage:
-- 1. Create test account: Uncomment the INSERT statement
-- 2. List test accounts: Uncomment the SELECT statement
-- 3. Delete test accounts: Uncomment the DELETE statement

-- List all test accounts
SELECT id, phone, otp, "isTestAccount", description, "createdAt", "updatedAt"
FROM test_accounts 
WHERE "isTestAccount" = TRUE;

-- Create a new test account (modify the values as needed)
-- INSERT INTO test_accounts (phone, otp, "isTestAccount", description)
-- VALUES ('9999999999', '1234', TRUE, 'Default test account for Google Play Store review');

-- Update an existing test account
-- UPDATE test_accounts
-- SET otp = '5678', description = 'Updated test account'
-- WHERE phone = '9999999999';

-- Delete a test account
-- DELETE FROM test_accounts
-- WHERE phone = '9999999999';

-- Delete all test accounts
-- DELETE FROM test_accounts 
-- WHERE "isTestAccount" = TRUE; 