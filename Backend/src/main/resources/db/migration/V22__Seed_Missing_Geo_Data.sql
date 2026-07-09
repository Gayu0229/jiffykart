-- Migration to ensure Geographic Data is present (Fix for potentially skipped V21 edits)

-- 1. Ensure Cities
INSERT INTO cities (name) VALUES 
('Chennai'), 
('Bengaluru')
ON CONFLICT (name) DO NOTHING;

-- 2. Ensure Zones for Chennai
INSERT INTO zones (city_id, name) 
SELECT id, 'Adyar' FROM cities WHERE name = 'Chennai'
ON CONFLICT (city_id, name) DO NOTHING;

INSERT INTO zones (city_id, name) 
SELECT id, 'T. Nagar' FROM cities WHERE name = 'Chennai'
ON CONFLICT (city_id, name) DO NOTHING;

INSERT INTO zones (city_id, name) 
SELECT id, 'Anna Nagar' FROM cities WHERE name = 'Chennai'
ON CONFLICT (city_id, name) DO NOTHING;

-- 3. Ensure Pincodes for Chennai Zones
INSERT INTO pincodes (zone_id, pincode)
SELECT id, '600020' FROM zones WHERE name = 'Adyar'
ON CONFLICT (pincode) DO NOTHING;

INSERT INTO pincodes (zone_id, pincode)
SELECT id, '600017' FROM zones WHERE name = 'T. Nagar'
ON CONFLICT (pincode) DO NOTHING;

INSERT INTO pincodes (zone_id, pincode)
SELECT id, '600040' FROM zones WHERE name = 'Anna Nagar'
ON CONFLICT (pincode) DO NOTHING;

-- 4. Ensure Zones for Bengaluru
INSERT INTO zones (city_id, name) 
SELECT id, 'Indiranagar' FROM cities WHERE name = 'Bengaluru'
ON CONFLICT (city_id, name) DO NOTHING;

INSERT INTO zones (city_id, name) 
SELECT id, 'Koramangala' FROM cities WHERE name = 'Bengaluru'
ON CONFLICT (city_id, name) DO NOTHING;

INSERT INTO zones (city_id, name) 
SELECT id, 'Whitefield' FROM cities WHERE name = 'Bengaluru'
ON CONFLICT (city_id, name) DO NOTHING;

-- 5. Ensure Pincodes for Bengaluru Zones
INSERT INTO pincodes (zone_id, pincode)
SELECT id, '560038' FROM zones WHERE name = 'Indiranagar'
ON CONFLICT (pincode) DO NOTHING;

INSERT INTO pincodes (zone_id, pincode)
SELECT id, '560034' FROM zones WHERE name = 'Koramangala'
ON CONFLICT (pincode) DO NOTHING;

INSERT INTO pincodes (zone_id, pincode)
SELECT id, '560066' FROM zones WHERE name = 'Whitefield'
ON CONFLICT (pincode) DO NOTHING;
