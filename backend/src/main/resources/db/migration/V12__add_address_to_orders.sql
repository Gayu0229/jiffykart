-- Migration to add address column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS address TEXT;
