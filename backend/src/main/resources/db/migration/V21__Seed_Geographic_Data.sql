-- Migration to seed initial Geographic Data (ONLY Chennai & Bengaluru)

-- 1. Insert Cities
INSERT INTO cities (name) VALUES 
('Chennai'), 
('Bengaluru');

-- 2. Insert Zones for Chennai
INSERT INTO zones (city_id, name) 
SELECT id, 'Adyar' FROM cities WHERE name = 'Chennai';
INSERT INTO zones (city_id, name) 
SELECT id, 'T. Nagar' FROM cities WHERE name = 'Chennai';
INSERT INTO zones (city_id, name) 
SELECT id, 'Anna Nagar' FROM cities WHERE name = 'Chennai';

-- 3. Insert Pincodes for Chennai Zones
INSERT INTO pincodes (zone_id, pincode)
SELECT id, '600020' FROM zones WHERE name = 'Adyar';
INSERT INTO pincodes (zone_id, pincode)
SELECT id, '600017' FROM zones WHERE name = 'T. Nagar';
INSERT INTO pincodes (zone_id, pincode)
SELECT id, '600040' FROM zones WHERE name = 'Anna Nagar';

-- 4. Insert Zones for Bengaluru
INSERT INTO zones (city_id, name) 
SELECT id, 'Indiranagar' FROM cities WHERE name = 'Bengaluru';
INSERT INTO zones (city_id, name) 
SELECT id, 'Koramangala' FROM cities WHERE name = 'Bengaluru';
INSERT INTO zones (city_id, name) 
SELECT id, 'Whitefield' FROM cities WHERE name = 'Bengaluru';

-- 5. Insert Pincodes for Bengaluru Zones
INSERT INTO pincodes (zone_id, pincode)
SELECT id, '560038' FROM zones WHERE name = 'Indiranagar';
INSERT INTO pincodes (zone_id, pincode)
SELECT id, '560034' FROM zones WHERE name = 'Koramangala';
INSERT INTO pincodes (zone_id, pincode)
SELECT id, '560066' FROM zones WHERE name = 'Whitefield';
