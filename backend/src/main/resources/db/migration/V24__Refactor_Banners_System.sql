-- V24: Refactor banners table to support desktop/mobile separation and better ordering
ALTER TABLE banners RENAME COLUMN image_url TO image_desktop_url;
ALTER TABLE banners RENAME COLUMN link TO cta_url;

ALTER TABLE banners ADD COLUMN IF NOT EXISTS image_mobile_url VARCHAR(255);
ALTER TABLE banners ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS start_date TIMESTAMP;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS end_date TIMESTAMP;

-- Ensure existing banners have a default display order
UPDATE banners SET display_order = 0 WHERE display_order IS NULL;
