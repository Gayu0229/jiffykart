-- Migration to convert empty string phone numbers to NULL to prevent unique constraint violations
UPDATE users SET phone = NULL WHERE phone = '' OR phone ~ '^[[:space:]]*$';
