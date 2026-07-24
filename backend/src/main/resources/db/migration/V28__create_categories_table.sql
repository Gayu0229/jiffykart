-- V28: Create categories and subcategory_names tables
CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    image_url TEXT
);

CREATE TABLE IF NOT EXISTS subcategory_names (
    category_id BIGINT NOT NULL,
    subcategory_name VARCHAR(255),
    CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
);
