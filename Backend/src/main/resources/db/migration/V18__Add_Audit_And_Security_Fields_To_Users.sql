-- Migration to add auditing and security fields to the users table
ALTER TABLE users ADD COLUMN force_password_change BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN created_by BIGINT;
ALTER TABLE users ADD COLUMN created_at TIMESTAMP;
ALTER TABLE users ADD COLUMN updated_at TIMESTAMP;
