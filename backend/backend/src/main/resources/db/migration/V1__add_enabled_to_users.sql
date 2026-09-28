-- Migration to add 'enabled' column to 'users' table safely
ALTER TABLE users ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT false;

-- Ensure existing users are activated if that's the desired initial state, 
-- or keep them inactive (default false). 
-- For this specific feature, we usually want existing users to be activated 
-- so they aren't locked out, but the implementation plan says default false.
-- If you want to activate all current users:
-- UPDATE users SET enabled = true;

-- Finalize the column to be NOT NULL
ALTER TABLE users ALTER COLUMN enabled SET NOT NULL;
