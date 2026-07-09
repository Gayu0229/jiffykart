-- V36: Hyperlocal and Location-Based Features

-- Add is_featured to cities
ALTER TABLE cities ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Location-wise Product Details
CREATE TABLE IF NOT EXISTS location_product_details (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    price DOUBLE PRECISION,
    mrp DOUBLE PRECISION,
    stock_quantity INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, city_id)
);

-- Blog Posts
CREATE TABLE IF NOT EXISTS blog_posts (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_url VARCHAR(255),
    city_id UUID REFERENCES cities(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indices for performance
CREATE INDEX idx_lpd_product ON location_product_details(product_id);
CREATE INDEX idx_lpd_city ON location_product_details(city_id);
CREATE INDEX idx_blogs_city ON blog_posts(city_id);
