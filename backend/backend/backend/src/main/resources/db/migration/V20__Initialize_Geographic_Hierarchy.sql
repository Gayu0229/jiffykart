-- Migration to create Geographic Hierarchy and Field Manager Area Assignments

CREATE TABLE cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(city_id, name)
);

CREATE TABLE pincodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    pincode VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE field_manager_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_manager_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
    zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
    pincode_id UUID REFERENCES pincodes(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Ensure at least one area type is assigned
    CONSTRAINT at_least_one_area CHECK (
        (city_id IS NOT NULL) OR 
        (zone_id IS NOT NULL) OR 
        (pincode_id IS NOT NULL)
    )
);

-- Add indices for fast geo-filtering
CREATE INDEX idx_pincodes_zone ON pincodes(zone_id);
CREATE INDEX idx_fm_areas_user ON field_manager_areas(field_manager_id);
