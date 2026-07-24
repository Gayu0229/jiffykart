-- Subscription Plans table
CREATE TABLE subscription_plans (
    id BIGSERIAL PRIMARY KEY,
    plan_name VARCHAR(100) NOT NULL,
    price DOUBLE PRECISION NOT NULL DEFAULT 0,
    duration_days INTEGER NOT NULL DEFAULT 30,
    free_delivery_above DOUBLE PRECISION,
    free_delivery_all BOOLEAN NOT NULL DEFAULT FALSE,
    priority_delivery BOOLEAN NOT NULL DEFAULT FALSE,
    cashback_percent DOUBLE PRECISION NOT NULL DEFAULT 0,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Subscriptions table
CREATE TABLE user_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    plan_id BIGINT NOT NULL REFERENCES subscription_plans(id),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    payment_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);

-- Seed default plans
INSERT INTO subscription_plans (plan_name, price, duration_days, free_delivery_above, free_delivery_all, priority_delivery, cashback_percent, description) VALUES
('Free', 0, 36500, NULL, FALSE, FALSE, 0, 'Standard delivery and access to basic offers'),
('JiffyKart Plus', 99, 30, 99, FALSE, FALSE, 5, 'Free delivery above ₹99, priority delivery, exclusive deals, 5% cashback'),
('JiffyKart Pro', 199, 30, 0, TRUE, TRUE, 10, 'Free delivery on all orders, fast delivery, 10% cashback, premium support'),
('JiffyKart Elite', 499, 30, 0, TRUE, TRUE, 15, 'Unlimited free delivery, VIP support, early access to deals, 15% cashback');
