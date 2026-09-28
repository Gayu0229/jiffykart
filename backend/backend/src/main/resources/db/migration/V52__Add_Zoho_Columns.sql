-- Add Zoho integration columns to store external IDs
ALTER TABLE users ADD COLUMN IF NOT EXISTS zoho_contact_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS zoho_invoice_id VARCHAR(255);
