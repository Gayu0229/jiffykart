-- Create support_tickets table
CREATE TABLE support_tickets (
    id BIGSERIAL PRIMARY KEY,
    ticket_id VARCHAR(255) NOT NULL UNIQUE,
    created_by_role VARCHAR(50),
    created_by_id BIGINT,
    subject VARCHAR(255) NOT NULL,
    category VARCHAR(255),
    description TEXT,
    status VARCHAR(50),
    priority VARCHAR(50),
    order_id BIGINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Create support_ticket_messages table
CREATE TABLE support_ticket_messages (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL,
    sender_role VARCHAR(50),
    sender_id BIGINT,
    message TEXT NOT NULL,
    attachment_url VARCHAR(255),
    created_at TIMESTAMP,
    CONSTRAINT fk_ticket FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
);
