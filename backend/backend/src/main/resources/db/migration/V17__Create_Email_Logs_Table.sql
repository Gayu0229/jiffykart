CREATE TABLE email_logs (
    id BIGSERIAL PRIMARY KEY,
    recipient VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- USER, VENDOR, ADMIN
    status VARCHAR(20) NOT NULL, -- SENT, FAILED
    retry_count INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL,
    order_id BIGINT,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);
