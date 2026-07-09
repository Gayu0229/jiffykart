-- Migration to add PhonePe payment fields to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_status VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS merchant_transaction_id VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

-- Create index for faster lookups during callbacks
CREATE INDEX IF NOT EXISTS idx_orders_merchant_txn_id ON orders(merchant_transaction_id);
