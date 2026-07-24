-- Add vendor_type and food-specific fields to seller_applications
ALTER TABLE seller_applications ADD COLUMN vendor_type VARCHAR(20) DEFAULT 'ECOMMERCE';
ALTER TABLE seller_applications ADD COLUMN cuisine_type VARCHAR(100);
ALTER TABLE seller_applications ADD COLUMN fssai_number VARCHAR(50);
ALTER TABLE seller_applications ADD COLUMN opening_time VARCHAR(20);
ALTER TABLE seller_applications ADD COLUMN closing_time VARCHAR(20);

-- Add vendor_type and food-specific fields to shops
ALTER TABLE shops ADD COLUMN vendor_type VARCHAR(20) DEFAULT 'ECOMMERCE';
ALTER TABLE shops ADD COLUMN cuisine_type VARCHAR(100);
ALTER TABLE shops ADD COLUMN fssai_number VARCHAR(50);
ALTER TABLE shops ADD COLUMN opening_time VARCHAR(20);
ALTER TABLE shops ADD COLUMN closing_time VARCHAR(20);
