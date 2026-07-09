-- Migration to ensure all Chennai & Bengaluru areas are seeded correctly
-- This uses a more efficient VALUES structure to avoid repetitive SELECT statements.

-- 1. Ensure Cities exist
INSERT INTO cities (name) VALUES ('Chennai'), ('Bengaluru')
ON CONFLICT (name) DO NOTHING;

-- 2. Seed Chennai Areas
INSERT INTO zones (city_id, name, tier)
SELECT c.id, v.name, v.tier
FROM (VALUES 
    ('Adyar', 1), ('Besant Nagar', 1), ('Anna Nagar', 1), ('Nungambakkam', 1), ('T. Nagar', 1), 
    ('Alwarpet', 1), ('Mylapore', 1), ('Boat Club Road', 1), ('RA Puram (Raja Annamalaipuram)', 1), 
    ('ECR (East Coast Road – premium zones)', 1), ('OMR (IT corridor prime zones)', 1), 
    ('Thiruvanmiyur', 1), ('Velachery (prime residential parts)', 1), ('Kilpauk', 1), ('Egmore', 1),
    ('Tambaram', 2), ('Chromepet', 2), ('Porur', 2), ('Medavakkam', 2), ('Perungudi', 2), 
    ('Pallikaranai', 2), ('Madipakkam', 2), ('Kolathur', 2), ('Ambattur', 2), ('Mogappair', 2), 
    ('Sholinganallur', 2), ('Guduvanchery', 2), ('Navalur', 2), ('Thoraipakkam', 2), ('Valasaravakkam', 2),
    ('Perambur', 3), ('Red Hills', 3), ('Avadi', 3), ('Manali', 3), ('Tondiarpet', 3), 
    ('Washermanpet', 3), ('Ennore', 3), ('Madhavaram', 3), ('Minjur', 3), ('Poonamallee', 3), 
    ('Gummidipoondi', 3), ('Pattabiram', 3), ('Villivakkam', 3), ('Vyasarpadi', 3)
) AS v(name, tier)
CROSS JOIN cities c
WHERE c.name = 'Chennai'
ON CONFLICT (city_id, name) DO UPDATE SET tier = EXCLUDED.tier;

-- 3. Seed Bengaluru Areas
INSERT INTO zones (city_id, name, tier)
SELECT c.id, v.name, v.tier
FROM (VALUES 
    ('Indiranagar', 1), ('Koramangala', 1), ('Whitefield', 1), ('HSR Layout', 1), ('Jayanagar', 1), 
    ('Malleshwaram', 1), ('Rajajinagar', 1), ('Sadashivanagar', 1), ('Hebbal', 1), ('Richmond Town', 1), 
    ('Lavelle Road', 1), ('Ulsoor', 1), ('Frazer Town', 1), ('Cunningham Road', 1), ('MG Road', 1),
    ('BTM Layout', 2), ('Yelahanka', 2), ('Electronic City', 2), ('Marathahalli', 2), ('Bannerghatta Road', 2), 
    ('Kengeri', 2), ('KR Puram', 2), ('Hoodi', 2), ('Hennur', 2), ('Kalyan Nagar', 2), 
    ('Ramamurthy Nagar', 2), ('Nagarbhavi', 2), ('Basaveshwar Nagar', 2), ('Banashankari', 2), ('Vijayanagar', 2),
    ('Peenya', 3), ('Yeshwanthpur', 3), ('Nelamangala', 3), ('Devanahalli', 3), ('Doddaballapur', 3), 
    ('Anekal', 3), ('Magadi Road outskirts', 3), ('Attibele', 3), ('Jigani', 3), ('Chikkaballapur', 3), 
    ('Bagalur', 3), ('Chintamani outskirts', 3)
) AS v(name, tier)
CROSS JOIN cities c
WHERE c.name = 'Bengaluru'
ON CONFLICT (city_id, name) DO UPDATE SET tier = EXCLUDED.tier;
