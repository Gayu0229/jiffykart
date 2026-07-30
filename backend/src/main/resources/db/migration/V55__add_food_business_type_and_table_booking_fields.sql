-- V55__add_food_business_type_and_table_booking_fields.sql

-- Add columns to seller_applications
ALTER TABLE seller_applications ADD COLUMN food_business_type VARCHAR(50);
ALTER TABLE seller_applications ADD COLUMN restaurant_name VARCHAR(100);
ALTER TABLE seller_applications ADD COLUMN delivery_radius DOUBLE PRECISION;
ALTER TABLE seller_applications ADD COLUMN restaurant_capacity INT;
ALTER TABLE seller_applications ADD COLUMN indoor_seats INT;
ALTER TABLE seller_applications ADD COLUMN outdoor_seats INT;
ALTER TABLE seller_applications ADD COLUMN reservation_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE seller_applications ADD COLUMN kitchen_type VARCHAR(50);
ALTER TABLE seller_applications ADD COLUMN veg_non_veg VARCHAR(20);
ALTER TABLE seller_applications ADD COLUMN restaurant_category VARCHAR(50);
ALTER TABLE seller_applications ADD COLUMN dining_type VARCHAR(50);
ALTER TABLE seller_applications ADD COLUMN parking_available BOOLEAN DEFAULT FALSE;

-- Add columns to shops
ALTER TABLE shops ADD COLUMN food_business_type VARCHAR(50);
ALTER TABLE shops ADD COLUMN restaurant_name VARCHAR(100);
ALTER TABLE shops ADD COLUMN delivery_radius DOUBLE PRECISION;
ALTER TABLE shops ADD COLUMN restaurant_capacity INT;
ALTER TABLE shops ADD COLUMN indoor_seats INT;
ALTER TABLE shops ADD COLUMN outdoor_seats INT;
ALTER TABLE shops ADD COLUMN reservation_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE shops ADD COLUMN kitchen_type VARCHAR(50);
ALTER TABLE shops ADD COLUMN veg_non_veg VARCHAR(20);
ALTER TABLE shops ADD COLUMN restaurant_category VARCHAR(50);
ALTER TABLE shops ADD COLUMN dining_type VARCHAR(50);
ALTER TABLE shops ADD COLUMN parking_available BOOLEAN DEFAULT FALSE;
