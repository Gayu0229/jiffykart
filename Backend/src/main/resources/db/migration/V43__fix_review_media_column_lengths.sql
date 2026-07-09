-- V43: Fix Review Media Column Lengths
-- The collection table for images uses VARCHAR(255) by default, which is too small for Base64 strings.
-- Also updating video_url, comment, and title in the reviews table.

-- 1. Update the images collection table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'review_images') THEN
        ALTER TABLE review_images ALTER COLUMN images TYPE TEXT;
    END IF;
END $$;

-- 2. Update the main reviews table
ALTER TABLE reviews
ALTER COLUMN video_url TYPE TEXT,
ALTER COLUMN comment TYPE TEXT,
ALTER COLUMN title TYPE TEXT;
