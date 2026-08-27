-- V58: Add new fashion and accessories categories and subcategories
INSERT INTO categories (name, is_active) VALUES ('Men Fashion', true) ON CONFLICT (name) DO NOTHING;
INSERT INTO categories (name, is_active) VALUES ('Women Fashion', true) ON CONFLICT (name) DO NOTHING;
INSERT INTO categories (name, is_active) VALUES ('Accessories', true) ON CONFLICT (name) DO NOTHING;
INSERT INTO categories (name, is_active) VALUES ('Jewellery', true) ON CONFLICT (name) DO NOTHING;
INSERT INTO categories (name, is_active) VALUES ('Bangles', true) ON CONFLICT (name) DO NOTHING;

-- Clean up any existing subcategories for these to prevent duplicates
DELETE FROM subcategory_names WHERE category_id IN (SELECT id FROM categories WHERE name IN ('Men Fashion', 'Women Fashion', 'Accessories', 'Jewellery', 'Bangles'));

-- Insert Subcategories for Accessories
INSERT INTO subcategory_names (category_id, subcategory_name)
SELECT id, 'Handbags' FROM categories WHERE name = 'Accessories'
UNION ALL SELECT id, 'Wallets' FROM categories WHERE name = 'Accessories'
UNION ALL SELECT id, 'Belts' FROM categories WHERE name = 'Accessories'
UNION ALL SELECT id, 'Sunglasses' FROM categories WHERE name = 'Accessories'
UNION ALL SELECT id, 'Watches' FROM categories WHERE name = 'Accessories'
UNION ALL SELECT id, 'Hair Accessories' FROM categories WHERE name = 'Accessories'
UNION ALL SELECT id, 'kids hair accessories' FROM categories WHERE name = 'Accessories'
UNION ALL SELECT id, 'Scarves & Stoles' FROM categories WHERE name = 'Accessories'
UNION ALL SELECT id, 'Caps & Hats' FROM categories WHERE name = 'Accessories'
UNION ALL SELECT id, 'Brooches & Pins' FROM categories WHERE name = 'Accessories'
UNION ALL SELECT id, 'Makeup Pouches' FROM categories WHERE name = 'Accessories'
UNION ALL SELECT id, 'Travel Accessories' FROM categories WHERE name = 'Accessories'
UNION ALL SELECT id, 'Fashion Accessories' FROM categories WHERE name = 'Accessories';

-- Insert Subcategories for Jewellery
INSERT INTO subcategory_names (category_id, subcategory_name)
SELECT id, 'Fashion Necklaces' FROM categories WHERE name = 'Jewellery'
UNION ALL SELECT id, 'Chains' FROM categories WHERE name = 'Jewellery'
UNION ALL SELECT id, 'Pendant Necklaces' FROM categories WHERE name = 'Jewellery'
UNION ALL SELECT id, 'Chokers' FROM categories WHERE name = 'Jewellery'
UNION ALL SELECT id, 'Layered Necklaces' FROM categories WHERE name = 'Jewellery'
UNION ALL SELECT id, 'Traditional Necklaces' FROM categories WHERE name = 'Jewellery'
UNION ALL SELECT id, 'Mangalsutra' FROM categories WHERE name = 'Jewellery'
UNION ALL SELECT id, 'Necklace Sets' FROM categories WHERE name = 'Jewellery'
UNION ALL SELECT id, 'Bangles' FROM categories WHERE name = 'Jewellery'
UNION ALL SELECT id, 'Studs' FROM categories WHERE name = 'Jewellery'
UNION ALL SELECT id, 'Jhumkas' FROM categories WHERE name = 'Jewellery'
UNION ALL SELECT id, 'Hoops' FROM categories WHERE name = 'Jewellery'
UNION ALL SELECT id, 'Drops' FROM categories WHERE name = 'Jewellery'
UNION ALL SELECT id, 'Dangles' FROM categories WHERE name = 'Jewellery'
UNION ALL SELECT id, 'Chandbali' FROM categories WHERE name = 'Jewellery'
UNION ALL SELECT id, 'Huggies' FROM categories WHERE name = 'Jewellery'
UNION ALL SELECT id, 'Ear Cuffs' FROM categories WHERE name = 'Jewellery'
UNION ALL SELECT id, 'Traditional' FROM categories WHERE name = 'Jewellery'
UNION ALL SELECT id, 'Fashion' FROM categories WHERE name = 'Jewellery'
UNION ALL SELECT id, 'Oxidised' FROM categories WHERE name = 'Jewellery'
UNION ALL SELECT id, 'Gold' FROM categories WHERE name = 'Jewellery'
UNION ALL SELECT id, 'Silver' FROM categories WHERE name = 'Jewellery'
UNION ALL SELECT id, 'Bridal' FROM categories WHERE name = 'Jewellery'
UNION ALL SELECT id, 'Earring Sets' FROM categories WHERE name = 'Jewellery';

-- Insert Subcategories for Bangles
INSERT INTO subcategory_names (category_id, subcategory_name)
SELECT id, 'Stones' FROM categories WHERE name = 'Bangles'
UNION ALL SELECT id, 'Oxidised' FROM categories WHERE name = 'Bangles'
UNION ALL SELECT id, 'Bridal' FROM categories WHERE name = 'Bangles'
UNION ALL SELECT id, 'Glass Bangles' FROM categories WHERE name = 'Bangles'
UNION ALL SELECT id, 'Side Bangles' FROM categories WHERE name = 'Bangles'
UNION ALL SELECT id, 'Kada' FROM categories WHERE name = 'Bangles';
