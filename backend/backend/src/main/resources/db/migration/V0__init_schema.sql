-- V0: Initialize Schema

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    role VARCHAR(50),
    gender VARCHAR(50),
    avatar VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS verification_tokens (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255),
    otp VARCHAR(10) NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    attempts INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shops (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    owner_id BIGINT,
    rating DOUBLE PRECISION,
    rating_count VARCHAR(50),
    delivery_time VARCHAR(50),
    cost_for_two VARCHAR(50),
    image VARCHAR(255),
    distance VARCHAR(50),
    location VARCHAR(255),
    city VARCHAR(255),
    shop_type VARCHAR(50),
    gst_number VARCHAR(50),
    pan_number VARCHAR(50),
    account_holder_name VARCHAR(255),
    bank_account_number VARCHAR(50),
    ifsc_code VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS shop_tags (
    shop_id BIGINT,
    tag VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS seller_applications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    shop_name VARCHAR(255) NOT NULL,
    business_description TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    rejection_reason VARCHAR(255),
    business_type VARCHAR(50),
    category VARCHAR(50),
    has_gst BOOLEAN,
    gst_number VARCHAR(50),
    address VARCHAR(255),
    city VARCHAR(50),
    state VARCHAR(50),
    pincode VARCHAR(20),
    pan_number VARCHAR(50),
    id_proof_url VARCHAR(255),
    business_proof_url VARCHAR(255),
    address_proof_url VARCHAR(255),
    account_holder_name VARCHAR(255),
    bank_account_number VARCHAR(50),
    ifsc_code VARCHAR(50),
    cancelled_cheque_url VARCHAR(255),
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    price DOUBLE PRECISION,
    status VARCHAR(50),
    shop_id BIGINT,
    category VARCHAR(255),
    image_url VARCHAR(255),
    stock INT,
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    total DOUBLE PRECISION,
    status VARCHAR(50),
    user_id BIGINT,
    shop_id BIGINT,
    created_at TIMESTAMP
);
