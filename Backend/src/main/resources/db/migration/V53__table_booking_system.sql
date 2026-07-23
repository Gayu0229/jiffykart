-- V53__table_booking_system.sql

-- Tables
CREATE TABLE restaurant_tables (
    id BIGSERIAL PRIMARY KEY,
    shop_id BIGINT NOT NULL,
    table_number VARCHAR(50) NOT NULL,
    capacity INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
    seating_area VARCHAR(50) NOT NULL DEFAULT 'INDOOR',
    x_position DOUBLE PRECISION,
    y_position DOUBLE PRECISION,
    shape VARCHAR(50) DEFAULT 'SQUARE',
    locked_until TIMESTAMP,
    locked_by_user_id BIGINT,
    CONSTRAINT fk_table_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
);

-- Bookings
CREATE TABLE restaurant_bookings (
    id BIGSERIAL PRIMARY KEY,
    booking_id VARCHAR(50) NOT NULL UNIQUE,
    shop_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    table_id BIGINT,
    booking_date DATE NOT NULL,
    time_slot VARCHAR(20) NOT NULL,
    guest_count INT NOT NULL,
    seating_area VARCHAR(50) NOT NULL DEFAULT 'INDOOR',
    special_requests TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    eta_minutes INT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    qr_code VARCHAR(255),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_booking_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    CONSTRAINT fk_booking_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_booking_table FOREIGN KEY (table_id) REFERENCES restaurant_tables(id) ON DELETE SET NULL
);

-- Waitlist
CREATE TABLE restaurant_waitlists (
    id BIGSERIAL PRIMARY KEY,
    shop_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    guest_count INT NOT NULL,
    seating_area VARCHAR(50) NOT NULL DEFAULT 'INDOOR',
    queue_position INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'WAITING',
    notified_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_waitlist_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    CONSTRAINT fk_waitlist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Staff Management
CREATE TABLE restaurant_staff (
    id BIGSERIAL PRIMARY KEY,
    shop_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role VARCHAR(50) NOT NULL, -- OWNER, MANAGER, RECEPTIONIST, WAITER
    CONSTRAINT fk_staff_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    CONSTRAINT fk_staff_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT unique_shop_user UNIQUE (shop_id, user_id)
);
