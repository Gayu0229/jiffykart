-- V9: Split status into approval_status + is_active for Swiggy-style shop visibility

-- 1. Add new columns
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS logo_url VARCHAR(255);

-- 2. Migrate existing data from old status column
UPDATE shops SET approval_status = 'APPROVED', is_active = true WHERE status = 'ACTIVE';
UPDATE shops SET approval_status = 'PENDING', is_active = false WHERE status = 'PENDING' OR status IS NULL;
UPDATE shops SET approval_status = 'REJECTED', is_active = false WHERE status = 'BLOCKED' OR status = 'INACTIVE';

-- 3. Drop old status column
ALTER TABLE shops DROP COLUMN IF EXISTS status;
