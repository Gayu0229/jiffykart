CREATE TABLE shop_reviews (
    id BIGSERIAL PRIMARY KEY,
    shop_id BIGINT NOT NULL,
    user_name VARCHAR(255),
    rating INT NOT NULL,
    title VARCHAR(255),
    comment TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
