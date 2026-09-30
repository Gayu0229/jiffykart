-- V6: Allow EMAIL_CHANGE and PHONE_CHANGE in verification_tokens.type

-- 1. Widen the column to fit longer enum names (EMAIL_CHANGE = 12 chars)
ALTER TABLE verification_tokens ALTER COLUMN type TYPE VARCHAR(20);

-- 2. Drop the old check constraint that only allows EMAIL/MOBILE
ALTER TABLE verification_tokens DROP CONSTRAINT IF EXISTS verification_tokens_type_check;

-- 3. Re-create with all four allowed values
ALTER TABLE verification_tokens
    ADD CONSTRAINT verification_tokens_type_check
    CHECK (type IN ('EMAIL', 'MOBILE', 'EMAIL_CHANGE', 'PHONE_CHANGE'));
