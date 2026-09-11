-- SQL script to create the test_accounts table

-- Check if table exists and create if it doesn't
CREATE TABLE IF NOT EXISTS test_accounts (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(255) NOT NULL UNIQUE,
  otp VARCHAR(255) NOT NULL,
  "isTestAccount" BOOLEAN NOT NULL DEFAULT TRUE,
  description TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for fast lookup
CREATE INDEX IF NOT EXISTS test_accounts_phone_idx ON test_accounts (phone);
CREATE INDEX IF NOT EXISTS test_accounts_is_test_account_idx ON test_accounts ("isTestAccount");

-- Create test account for Google Play review (only if it doesn't exist)
INSERT INTO test_accounts (phone, otp, "isTestAccount", description)
SELECT '9999999999', '1234', TRUE, 'Default test account for Google Play Store review'
WHERE NOT EXISTS (
  SELECT 1 FROM test_accounts WHERE phone = '9999999999'
);

-- Print confirmation 
DO $$
BEGIN
  RAISE NOTICE 'Test accounts table created or updated successfully';
END $$; 