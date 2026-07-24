-- Safely handle the missing identifier column

-- 1. If 'email' column still exists and 'identifier' does not, rename it.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='verification_tokens' AND column_name='email') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='verification_tokens' AND column_name='identifier') THEN
            ALTER TABLE verification_tokens RENAME COLUMN email TO identifier;
        END IF;
    END IF;
END $$;

-- 2. If 'identifier' column still does not exist (e.g. table was created without email), add it.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='verification_tokens' AND column_name='identifier') THEN
        ALTER TABLE verification_tokens ADD COLUMN identifier VARCHAR(255);
    END IF;
END $$;

-- 2.1. Clean up stale data: If identifier is NULL, those tokens are invalid/unusable.
DELETE FROM verification_tokens WHERE identifier IS NULL;

-- 3. Ensure validation constraints on identifier
ALTER TABLE verification_tokens ALTER COLUMN identifier SET NOT NULL;

-- 4. Ensure other columns from V2 exist (idempotent checks)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='verification_tokens' AND column_name='type') THEN
        ALTER TABLE verification_tokens ADD COLUMN type VARCHAR(10) DEFAULT 'EMAIL';
    END IF;
END $$;

-- 4.1 Update existing null types and set Not Null
UPDATE verification_tokens SET type = 'EMAIL' WHERE type IS NULL;
ALTER TABLE verification_tokens ALTER COLUMN type SET NOT NULL;


DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='verification_tokens' AND column_name='used') THEN
        ALTER TABLE verification_tokens ADD COLUMN used BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 4.2 Update existing null used and set Not Null
UPDATE verification_tokens SET used = FALSE WHERE used IS NULL;
ALTER TABLE verification_tokens ALTER COLUMN used SET NOT NULL;

-- 5. Drop the index if it exists to avoid errors on recreate, then create it
DROP INDEX IF EXISTS idx_vt_identifier_type;
CREATE INDEX idx_vt_identifier_type ON verification_tokens (identifier, type);
