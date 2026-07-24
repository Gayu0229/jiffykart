-- Rename 'email' column to 'identifier' for generic OTP support
ALTER TABLE verification_tokens RENAME COLUMN email TO identifier;

-- Add 'type' column to distinguish EMAIL vs MOBILE OTP
ALTER TABLE verification_tokens ADD COLUMN type VARCHAR(10) NOT NULL DEFAULT 'EMAIL';

-- Add 'used' flag for single-use OTP tracking
ALTER TABLE verification_tokens ADD COLUMN used BOOLEAN NOT NULL DEFAULT FALSE;

-- Composite index for fast lookups by (identifier, type)
CREATE INDEX idx_vt_identifier_type ON verification_tokens (identifier, type);
