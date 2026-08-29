-- V45: Add show_on_jiffy_cafe column to products table
ALTER TABLE products ADD COLUMN show_on_jiffy_cafe BOOLEAN DEFAULT FALSE;
