-- Migration: V47__add_return_requests_table.sql
-- Description: Create tables for Returns & Replacements Management System

CREATE TABLE IF NOT EXISTS public.return_requests (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    vendor_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    reason VARCHAR(255),
    details TEXT,
    type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.return_request_images (
    return_request_id BIGINT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    CONSTRAINT fk_return_request FOREIGN KEY (return_request_id) REFERENCES public.return_requests (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rr_order ON public.return_requests (order_id);
CREATE INDEX IF NOT EXISTS idx_rr_vendor ON public.return_requests (vendor_id);
CREATE INDEX IF NOT EXISTS idx_rr_user ON public.return_requests (user_id);
