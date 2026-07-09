-- V38: Add area column and seed additional zones
ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS area VARCHAR(255);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS area VARCHAR(255);

-- Seed additional zones for Chennai
INSERT INTO zones (city_id, name) 
SELECT id, 'Velachery' FROM cities WHERE name = 'Chennai' ON CONFLICT DO NOTHING;
INSERT INTO zones (city_id, name) 
SELECT id, 'Porur' FROM cities WHERE name = 'Chennai' ON CONFLICT DO NOTHING;
INSERT INTO zones (city_id, name) 
SELECT id, 'Tambaram' FROM cities WHERE name = 'Chennai' ON CONFLICT DO NOTHING;
INSERT INTO zones (city_id, name) 
SELECT id, 'Kodambakkam' FROM cities WHERE name = 'Chennai' ON CONFLICT DO NOTHING;
INSERT INTO zones (city_id, name) 
SELECT id, 'Perambur' FROM cities WHERE name = 'Chennai' ON CONFLICT DO NOTHING;
INSERT INTO zones (city_id, name) 
SELECT id, 'Guindy' FROM cities WHERE name = 'Chennai' ON CONFLICT DO NOTHING;
INSERT INTO zones (city_id, name) 
SELECT id, 'Triplicane' FROM cities WHERE name = 'Chennai' ON CONFLICT DO NOTHING;
INSERT INTO zones (city_id, name) 
SELECT id, 'Medavakkam' FROM cities WHERE name = 'Chennai' ON CONFLICT DO NOTHING;
INSERT INTO zones (city_id, name) 
SELECT id, 'Egmore' FROM cities WHERE name = 'Chennai' ON CONFLICT DO NOTHING;
INSERT INTO zones (city_id, name) 
SELECT id, 'Nungambakkam' FROM cities WHERE name = 'Chennai' ON CONFLICT DO NOTHING;
INSERT INTO zones (city_id, name) 
SELECT id, 'Saidapet' FROM cities WHERE name = 'Chennai' ON CONFLICT DO NOTHING;
INSERT INTO zones (city_id, name) 
SELECT id, 'Royapuram' FROM cities WHERE name = 'Chennai' ON CONFLICT DO NOTHING;
INSERT INTO zones (city_id, name) 
SELECT id, 'Chrompet' FROM cities WHERE name = 'Chennai' ON CONFLICT DO NOTHING;

-- Seed additional zones for Bengaluru
INSERT INTO zones (city_id, name) 
SELECT id, 'Jayanagar' FROM cities WHERE name = 'Bengaluru' ON CONFLICT DO NOTHING;
INSERT INTO zones (city_id, name) 
SELECT id, 'Malleshwaram' FROM cities WHERE name = 'Bengaluru' ON CONFLICT DO NOTHING;
INSERT INTO zones (city_id, name) 
SELECT id, 'HSR Layout' FROM cities WHERE name = 'Bengaluru' ON CONFLICT DO NOTHING;
INSERT INTO zones (city_id, name) 
SELECT id, 'Electronic City' FROM cities WHERE name = 'Bengaluru' ON CONFLICT DO NOTHING;
INSERT INTO zones (city_id, name) 
SELECT id, 'Marathahalli' FROM cities WHERE name = 'Bengaluru' ON CONFLICT DO NOTHING;
INSERT INTO zones (city_id, name) 
SELECT id, 'Bannerghatta' FROM cities WHERE name = 'Bengaluru' ON CONFLICT DO NOTHING;
INSERT INTO zones (city_id, name) 
SELECT id, 'Hebbal' FROM cities WHERE name = 'Bengaluru' ON CONFLICT DO NOTHING;
INSERT INTO zones (city_id, name) 
SELECT id, 'JP Nagar' FROM cities WHERE name = 'Bengaluru' ON CONFLICT DO NOTHING;
INSERT INTO zones (city_id, name) 
SELECT id, 'Rajajinagar' FROM cities WHERE name = 'Bengaluru' ON CONFLICT DO NOTHING;

