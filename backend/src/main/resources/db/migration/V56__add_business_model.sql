-- V56__add_business_model.sql

-- Add columns to seller_applications
ALTER TABLE seller_applications ADD COLUMN business_model VARCHAR(50);

-- Add columns to shops
ALTER TABLE shops ADD COLUMN business_model VARCHAR(50);
