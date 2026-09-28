-- V42: Modern Review System Schema Updates
-- Add missing columns to reviews table for media and user association
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS video_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS user_id BIGINT;

-- Create table for criteria-based ratings (Map<String, Integer>)
-- This table stores ratings for specific criteria like "Quality", "Freshness", etc.
CREATE TABLE IF NOT EXISTS review_criteria_ratings (
    review_id BIGINT NOT NULL,
    criteria_name VARCHAR(255) NOT NULL,
    rating INTEGER,
    PRIMARY KEY (review_id, criteria_name),
    CONSTRAINT fk_review_criteria_review FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
);
