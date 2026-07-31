-- V39: Add location fields to banners and blog_posts for granular filtering
ALTER TABLE banners ADD COLUMN IF NOT EXISTS city_id UUID;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS zone_id UUID;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_banners_city') THEN
        ALTER TABLE banners ADD CONSTRAINT fk_banners_city FOREIGN KEY (city_id) REFERENCES cities(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_banners_zone') THEN
        ALTER TABLE banners ADD CONSTRAINT fk_banners_zone FOREIGN KEY (zone_id) REFERENCES zones(id);
    END IF;
END $$;

-- Add zone_id to blog_posts (city_id already exists)
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS zone_id UUID;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_blog_posts_zone') THEN
        ALTER TABLE blog_posts ADD CONSTRAINT fk_blog_posts_zone FOREIGN KEY (zone_id) REFERENCES zones(id);
    END IF;
END $$;
