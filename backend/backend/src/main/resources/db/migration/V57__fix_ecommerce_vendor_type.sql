-- V57__fix_ecommerce_vendor_type.sql

-- 1. Update any leftover 'ECOMMERCE' values to 'VENDOR'
UPDATE shops SET vendor_type = 'VENDOR' WHERE vendor_type = 'ECOMMERCE';
UPDATE seller_applications SET vendor_type = 'VENDOR' WHERE vendor_type = 'ECOMMERCE';

-- 2. Change the default value of vendor_type column to 'VENDOR'
ALTER TABLE shops ALTER COLUMN vendor_type SET DEFAULT 'VENDOR';
ALTER TABLE seller_applications ALTER COLUMN vendor_type SET DEFAULT 'VENDOR';
