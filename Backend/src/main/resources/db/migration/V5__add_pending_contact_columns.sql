-- Add pending contact change columns to users table
ALTER TABLE users ADD COLUMN pending_email VARCHAR(255);
ALTER TABLE users ADD COLUMN pending_phone VARCHAR(255);
