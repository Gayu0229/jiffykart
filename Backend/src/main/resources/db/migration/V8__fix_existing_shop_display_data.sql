-- V8: Fix existing approved shops with incorrect shopType and missing tags
-- Shops created before the fix had shopType set to business type instead of 'Official'
-- and had no tags populated.

-- 1. Fix shopType for all ACTIVE shops that don't already have 'Official' or 'Reseller'
UPDATE shops
SET shop_type = 'Official',
    updated_at = CURRENT_TIMESTAMP
WHERE status = 'ACTIVE'
  AND (shop_type IS NULL OR shop_type NOT IN ('Official', 'Reseller'));

-- 2. Insert default tags for ACTIVE shops that have no tags yet
-- Tags are stored in the shop_tags element collection table
INSERT INTO shop_tags (shop_id, tag)
SELECT s.id, s.category
FROM shops s
LEFT JOIN shop_tags st ON st.shop_id = s.id
WHERE s.status = 'ACTIVE'
  AND s.category IS NOT NULL
  AND st.shop_id IS NULL
GROUP BY s.id, s.category;

INSERT INTO shop_tags (shop_id, tag)
SELECT s.id, s.business_type
FROM shops s
WHERE s.status = 'ACTIVE'
  AND s.business_type IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM shop_tags st WHERE st.shop_id = s.id AND st.tag = s.business_type
  );

INSERT INTO shop_tags (shop_id, tag)
SELECT s.id, s.city
FROM shops s
WHERE s.status = 'ACTIVE'
  AND s.city IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM shop_tags st WHERE st.shop_id = s.id AND st.tag = s.city
  );

-- 3. Set sensible defaults for any ACTIVE shops missing display fields
UPDATE shops
SET delivery_time = COALESCE(delivery_time, '30-45 min'),
    cost_for_two = COALESCE(cost_for_two, '₹200'),
    rating = COALESCE(rating, 0.0),
    rating_count = COALESCE(rating_count, '0'),
    distance = COALESCE(distance, '2.5 km'),
    image = COALESCE(image, 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800'),
    updated_at = CURRENT_TIMESTAMP
WHERE status = 'ACTIVE'
  AND (delivery_time IS NULL OR rating IS NULL OR image IS NULL);
