-- Migration to update support_tickets table with resolution fields and persistent email
ALTER TABLE support_tickets ADD COLUMN email VARCHAR(255);
ALTER TABLE support_tickets ADD COLUMN admin_response TEXT;
ALTER TABLE support_tickets ADD COLUMN resolution_reason VARCHAR(255);

-- Populate email from users table for existing tickets if possible
UPDATE support_tickets t
SET email = u.email
FROM users u
WHERE t.created_by_id = u.id AND t.email IS NULL;
