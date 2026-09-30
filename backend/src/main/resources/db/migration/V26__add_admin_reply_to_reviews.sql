-- V26: Add admin_reply column to reviews and shop_reviews tables
ALTER TABLE reviews ADD COLUMN admin_reply TEXT;
ALTER TABLE shop_reviews ADD COLUMN admin_reply TEXT;
