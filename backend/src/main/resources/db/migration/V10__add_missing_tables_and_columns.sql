-- V10: Create missing tables and add missing columns to match JPA Entities

CREATE TABLE IF NOT EXISTS addresses (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    type VARCHAR(50),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    is_default BOOLEAN
);

CREATE TABLE IF NOT EXISTS banners (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255),
    subtitle VARCHAR(255),
    image_url VARCHAR(255),
    link VARCHAR(255),
    position VARCHAR(50),
    is_active BOOLEAN,
    cta_text VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS cart_items (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    product_id BIGINT,
    quantity INT
);

CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT,
    product_id BIGINT,
    quantity INT,
    price_at_order DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS payment_methods (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    type VARCHAR(50),
    provider VARCHAR(50),
    last4 VARCHAR(20),
    upi_id VARCHAR(100),
    expiry VARCHAR(20),
    is_default BOOLEAN
);

CREATE TABLE IF NOT EXISTS reviews (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT,
    shop_id BIGINT,
    user_name VARCHAR(255),
    rating DOUBLE PRECISION,
    comment TEXT,
    date TIMESTAMP,
    title VARCHAR(255),
    is_verified BOOLEAN,
    helpful_count INT
);

CREATE TABLE IF NOT EXISTS review_images (
    review_id BIGINT,
    images VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS wallets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    balance DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    wallet_id BIGINT,
    amount DOUBLE PRECISION,
    type VARCHAR(50),
    description VARCHAR(255),
    date TIMESTAMP,
    status VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS product_images (
    product_id BIGINT,
    image_url VARCHAR(255)
);

-- Missing Product Columns
ALTER TABLE products
ADD COLUMN IF NOT EXISTS original_price DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS mrp DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS image VARCHAR(255),
ADD COLUMN IF NOT EXISTS sub_category VARCHAR(255),
ADD COLUMN IF NOT EXISTS rating DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS votes INT,
ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN,
ADD COLUMN IF NOT EXISTS warranty_period VARCHAR(255),
ADD COLUMN IF NOT EXISTS warranty_type VARCHAR(255),
ADD COLUMN IF NOT EXISTS stock_quantity INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_on_home BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_on_jiffy_street BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS weight VARCHAR(255),
ADD COLUMN IF NOT EXISTS dimensions VARCHAR(255),
ADD COLUMN IF NOT EXISTS material VARCHAR(255),
ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(255),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

-- Missing Order Columns
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS date TIMESTAMP;
