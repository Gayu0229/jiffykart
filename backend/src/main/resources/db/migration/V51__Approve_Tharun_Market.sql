-- Standardize and Approve Tharun Market to make its products visible
UPDATE shops 
SET approval_status = 'APPROVED', 
    is_active = true, 
    city = 'Chennai'
WHERE name ILIKE '%Tharun%';

-- Ensure all products for this shop are published and active
UPDATE products 
SET status = 'PUBLISHED', 
    is_active = true,
    stock_quantity = GREATEST(stock_quantity, 10) -- Ensure they aren't hidden due to 0 stock
WHERE shop_id IN (SELECT id FROM shops WHERE name ILIKE '%Tharun%');
