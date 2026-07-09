-- V27: Add wallet_balance column to users table
ALTER TABLE users ADD COLUMN wallet_balance DOUBLE PRECISION DEFAULT 0.0;
