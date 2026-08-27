-- V59: Create shop_followers table for follow feature
CREATE TABLE IF NOT EXISTS shop_followers (
    shop_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    PRIMARY KEY (shop_id, user_id),
    CONSTRAINT fk_shop FOREIGN KEY (shop_id) REFERENCES shops (id) ON DELETE CASCADE,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
