-- Add emailVerified and phoneVerified columns to users table
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;

-- Set existing enabled users as verified (backfill)
UPDATE users SET email_verified = TRUE, phone_verified = TRUE WHERE enabled = TRUE;
