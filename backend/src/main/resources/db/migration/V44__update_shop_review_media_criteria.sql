-- V44: Update ShopReview for media and criteria
-- Adding support for Base64 images, Videos, and Criteria ratings for stores.

-- 1. Create table for shop review images (collection table)
CREATE TABLE IF NOT EXISTS shop_review_images (
    shop_review_id BIGINT NOT NULL,
    images TEXT,
    CONSTRAINT fk_shop_review_images FOREIGN KEY (shop_review_id) REFERENCES shop_reviews(id) ON DELETE CASCADE
);

-- 2. Create table for shop review criteria ratings
CREATE TABLE IF NOT EXISTS shop_review_criteria_ratings (
    shop_review_id BIGINT NOT NULL,
    criteria_name VARCHAR(255) NOT NULL,
    rating INTEGER,
    PRIMARY KEY (shop_review_id, criteria_name),
    CONSTRAINT fk_shop_review_criteria FOREIGN KEY (shop_review_id) REFERENCES shop_reviews(id) ON DELETE CASCADE
);

-- 3. Update main shop_reviews table
ALTER TABLE shop_reviews
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Already have comment as TEXT in V40 hopefully, but ensuring it is TEXT
ALTER TABLE shop_reviews ALTER COLUMN comment TYPE TEXT;
