-- =========================================
-- SMART INVENTORY ALERTS SYSTEM
-- =========================================

-- =========================================
-- 1. FAST-MOVING ITEMS VIEW
-- Items with high sales frequency (>5 sales in last 30 days or avg >2/week)
-- =========================================
CREATE OR REPLACE VIEW vw_fast_moving_items AS
SELECT 
    i.id,
    i.barcode,
    pm.name AS product_name,
    i.brand,
    m.name AS manufacturer,
    c.name AS category,
    i.current_quantity,
    i.minimum_stock_level,
    i.unit_price,
    i.selling_price,
    i.storage_location,
    i.supplier_name,
    COUNT(jp.id) AS sales_count_30days,
    COALESCE(SUM(jp.quantity), 0) AS total_quantity_sold_30days,
    ROUND(COALESCE(SUM(jp.quantity), 0) / 4.0, 2) AS avg_weekly_sales,
    ROUND(i.current_quantity / NULLIF(COALESCE(SUM(jp.quantity), 0) / 4.0, 0), 1) AS weeks_of_stock_remaining,
    CASE 
        WHEN i.current_quantity <= i.minimum_stock_level THEN 'CRITICAL'
        WHEN i.current_quantity / NULLIF(COALESCE(SUM(jp.quantity), 0) / 4.0, 0) < 2 THEN 'LOW'
        ELSE 'ADEQUATE'
    END AS stock_status,
    i.last_restocked_date
FROM inventory i
LEFT JOIN product_master pm ON i.product_master_id = pm.id
LEFT JOIN manufacturers m ON pm.manufacturer_id = m.id
LEFT JOIN categories c ON pm.category_id = c.id
LEFT JOIN job_products jp ON i.id = jp.inventory_id 
    AND jp.added_at >= CURRENT_DATE - INTERVAL '30 days'
WHERE i.is_active = true
GROUP BY i.id, pm.name, i.brand, m.name, c.name
HAVING COUNT(jp.id) >= 5 OR COALESCE(SUM(jp.quantity), 0) / 4.0 >= 2
ORDER BY total_quantity_sold_30days DESC;

-- =========================================
-- 2. DEAD STOCK VIEW
-- Items with no sales in last 90 days
-- =========================================
CREATE OR REPLACE VIEW vw_dead_stock_items AS
SELECT 
    i.id,
    i.barcode,
    pm.name AS product_name,
    i.brand,
    m.name AS manufacturer,
    c.name AS category,
    i.current_quantity,
    i.minimum_stock_level,
    i.unit_price,
    i.selling_price,
    i.storage_location,
    i.current_quantity * i.unit_price AS inventory_value,
    i.last_restocked_date,
    CURRENT_DATE - i.last_restocked_date AS days_since_restock,
    (SELECT MAX(jp.added_at) 
     FROM job_products jp 
     WHERE jp.inventory_id = i.id) AS last_sale_date,
    CASE 
        WHEN (SELECT MAX(jp.added_at) FROM job_products jp WHERE jp.inventory_id = i.id) IS NULL 
        THEN CURRENT_DATE - i.created_at::DATE
        ELSE CURRENT_DATE - (SELECT MAX(jp.added_at) FROM job_products jp WHERE jp.inventory_id = i.id)::DATE
    END AS days_since_last_sale
FROM inventory i
LEFT JOIN product_master pm ON i.product_master_id = pm.id
LEFT JOIN manufacturers m ON pm.manufacturer_id = m.id
LEFT JOIN categories c ON pm.category_id = c.id
WHERE i.is_active = true
    AND i.current_quantity > 0
    AND NOT EXISTS (
        SELECT 1 
        FROM job_products jp 
        WHERE jp.inventory_id = i.id 
        AND jp.added_at >= CURRENT_DATE - INTERVAL '90 days'
    )
ORDER BY days_since_last_sale DESC, inventory_value DESC;

-- =========================================
-- 3. INVENTORY MOVEMENT ANALYSIS VIEW
-- Track inventory turnover and reorder points
-- =========================================
CREATE OR REPLACE VIEW vw_inventory_movement_analysis AS
SELECT 
    i.id,
    i.barcode,
    pm.name AS product_name,
    i.brand,
    m.name AS manufacturer,
    c.name AS category,
    i.current_quantity,
    i.minimum_stock_level,
    i.unit_price,
    i.selling_price,
    i.storage_location,
    i.supplier_name,
    -- Sales metrics (last 30 days)
    COUNT(DISTINCT jp.job_card_id) AS transactions_30days,
    COALESCE(SUM(CASE WHEN jp.added_at >= CURRENT_DATE - INTERVAL '30 days' THEN jp.quantity ELSE 0 END), 0) AS qty_sold_30days,
    -- Sales metrics (last 7 days)
    COALESCE(SUM(CASE WHEN jp.added_at >= CURRENT_DATE - INTERVAL '7 days' THEN jp.quantity ELSE 0 END), 0) AS qty_sold_7days,
    -- Turnover calculation
    ROUND(COALESCE(SUM(CASE WHEN jp.added_at >= CURRENT_DATE - INTERVAL '30 days' THEN jp.quantity ELSE 0 END), 0) / 30.0, 2) AS avg_daily_sales,
    CASE 
        WHEN COALESCE(SUM(CASE WHEN jp.added_at >= CURRENT_DATE - INTERVAL '30 days' THEN jp.quantity ELSE 0 END), 0) / 30.0 > 0
        THEN ROUND(i.current_quantity / (COALESCE(SUM(CASE WHEN jp.added_at >= CURRENT_DATE - INTERVAL '30 days' THEN jp.quantity ELSE 0 END), 0) / 30.0))
        ELSE NULL
    END AS days_of_stock_remaining,
    -- Recommended reorder quantity (for 30 days of stock)
    GREATEST(
        i.minimum_stock_level,
        ROUND(COALESCE(SUM(CASE WHEN jp.added_at >= CURRENT_DATE - INTERVAL '30 days' THEN jp.quantity ELSE 0 END), 0) / 30.0 * 30)
    ) - i.current_quantity AS suggested_reorder_quantity,
    i.last_restocked_date,
    (SELECT MAX(jp.added_at) FROM job_products jp WHERE jp.inventory_id = i.id) AS last_sale_date
FROM inventory i
LEFT JOIN product_master pm ON i.product_master_id = pm.id
LEFT JOIN manufacturers m ON pm.manufacturer_id = m.id
LEFT JOIN categories c ON pm.category_id = c.id
LEFT JOIN job_products jp ON i.id = jp.inventory_id
WHERE i.is_active = true
GROUP BY i.id, pm.name, i.brand, m.name, c.name
ORDER BY i.id;

-- =========================================
-- 4. COMPREHENSIVE ALERTS VIEW
-- All alerts in one place with priority
-- =========================================
CREATE OR REPLACE VIEW vw_inventory_alerts AS
-- Low stock alerts
SELECT 
    i.id,
    i.barcode,
    pm.name AS product_name,
    i.brand,
    m.name AS manufacturer,
    c.name AS category,
    'LOW_STOCK' AS alert_type,
    CASE 
        WHEN i.current_quantity = 0 THEN 'CRITICAL'
        WHEN i.current_quantity <= i.minimum_stock_level / 2 THEN 'HIGH'
        ELSE 'MEDIUM'
    END AS severity,
    i.current_quantity,
    i.minimum_stock_level,
    i.unit_price,
    i.selling_price,
    i.supplier_name,
    'Current stock (' || i.current_quantity || ') is below minimum level (' || i.minimum_stock_level || ')' AS alert_message,
    NULL::INTEGER AS days_indicator,
    i.last_restocked_date
FROM inventory i
LEFT JOIN product_master pm ON i.product_master_id = pm.id
LEFT JOIN manufacturers m ON pm.manufacturer_id = m.id
LEFT JOIN categories c ON pm.category_id = c.id
WHERE i.is_active = true 
    AND i.current_quantity <= i.minimum_stock_level

UNION ALL

-- Out of stock alerts
SELECT 
    i.id,
    i.barcode,
    pm.name AS product_name,
    i.brand,
    m.name AS manufacturer,
    c.name AS category,
    'OUT_OF_STOCK' AS alert_type,
    'CRITICAL' AS severity,
    i.current_quantity,
    i.minimum_stock_level,
    i.unit_price,
    i.selling_price,
    i.supplier_name,
    'Product is completely out of stock!' AS alert_message,
    NULL::INTEGER AS days_indicator,
    i.last_restocked_date
FROM inventory i
LEFT JOIN product_master pm ON i.product_master_id = pm.id
LEFT JOIN manufacturers m ON pm.manufacturer_id = m.id
LEFT JOIN categories c ON pm.category_id = c.id
WHERE i.is_active = true 
    AND i.current_quantity = 0

UNION ALL

-- Fast-moving items running low
SELECT 
    fm.id,
    fm.barcode,
    fm.product_name,
    fm.brand,
    fm.manufacturer,
    fm.category,
    'FAST_MOVING_LOW' AS alert_type,
    CASE 
        WHEN fm.weeks_of_stock_remaining < 1 THEN 'CRITICAL'
        WHEN fm.weeks_of_stock_remaining < 2 THEN 'HIGH'
        ELSE 'MEDIUM'
    END AS severity,
    fm.current_quantity,
    fm.minimum_stock_level,
    fm.unit_price,
    fm.selling_price,
    fm.supplier_name,
    'Fast-moving item! Only ' || COALESCE(fm.weeks_of_stock_remaining::TEXT, '0') || ' weeks of stock remaining (Avg: ' || fm.avg_weekly_sales || ' units/week)' AS alert_message,
    ROUND(fm.weeks_of_stock_remaining * 7)::INTEGER AS days_indicator,
    fm.last_restocked_date
FROM vw_fast_moving_items fm
WHERE fm.stock_status IN ('CRITICAL', 'LOW')

UNION ALL

-- Dead stock alerts
SELECT 
    ds.id,
    ds.barcode,
    ds.product_name,
    ds.brand,
    ds.manufacturer,
    ds.category,
    'DEAD_STOCK' AS alert_type,
    CASE 
        WHEN ds.days_since_last_sale > 180 THEN 'HIGH'
        WHEN ds.days_since_last_sale > 120 THEN 'MEDIUM'
        ELSE 'LOW'
    END AS severity,
    ds.current_quantity,
    ds.minimum_stock_level,
    ds.unit_price,
    ds.selling_price,
    NULL AS supplier_name,
    'No sales in ' || ds.days_since_last_sale || ' days. Inventory value: ₹' || ds.inventory_value AS alert_message,
    ds.days_since_last_sale AS days_indicator,
    ds.last_restocked_date
FROM vw_dead_stock_items ds;

-- =========================================
-- 5. PURCHASE ORDER SUGGESTIONS VIEW
-- Auto-generate purchase order recommendations
-- =========================================
CREATE OR REPLACE VIEW vw_purchase_order_suggestions AS
SELECT 
    i.id AS inventory_id,
    i.barcode,
    pm.name AS product_name,
    i.brand,
    m.name AS manufacturer,
    c.name AS category,
    i.current_quantity,
    i.minimum_stock_level,
    i.unit_price,
    i.supplier_name,
    COALESCE(vima.avg_daily_sales, 0) AS avg_daily_sales,
    COALESCE(vima.qty_sold_30days, 0) AS qty_sold_last_30days,
    -- Recommended order quantity (maintain 30-day stock + safety buffer)
    GREATEST(
        i.minimum_stock_level * 2,
        ROUND((COALESCE(vima.avg_daily_sales, 0) * 30) + i.minimum_stock_level)
    ) AS recommended_order_quantity,
    GREATEST(
        i.minimum_stock_level * 2,
        ROUND((COALESCE(vima.avg_daily_sales, 0) * 30) + i.minimum_stock_level)
    ) - i.current_quantity AS quantity_to_order,
    ROUND((GREATEST(
        i.minimum_stock_level * 2,
        ROUND((COALESCE(vima.avg_daily_sales, 0) * 30) + i.minimum_stock_level)
    ) - i.current_quantity) * i.unit_price, 2) AS estimated_cost,
    CASE 
        WHEN i.current_quantity = 0 THEN 'URGENT - Out of Stock'
        WHEN i.current_quantity <= i.minimum_stock_level THEN 'HIGH - Below Minimum'
        WHEN COALESCE(vima.days_of_stock_remaining, 999) <= 14 THEN 'MEDIUM - Fast Moving'
        ELSE 'LOW'
    END AS priority,
    COALESCE(vima.days_of_stock_remaining, 999) AS days_of_stock_remaining,
    i.last_restocked_date
FROM inventory i
LEFT JOIN product_master pm ON i.product_master_id = pm.id
LEFT JOIN manufacturers m ON pm.manufacturer_id = m.id
LEFT JOIN categories c ON pm.category_id = c.id
LEFT JOIN vw_inventory_movement_analysis vima ON i.id = vima.id
WHERE i.is_active = true
    AND (
        i.current_quantity <= i.minimum_stock_level 
        OR COALESCE(vima.days_of_stock_remaining, 999) <= 14
    )
    AND i.supplier_name IS NOT NULL;

-- =========================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- =========================================
CREATE INDEX IF NOT EXISTS idx_job_products_inventory_date 
    ON job_products(inventory_id, added_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_quantity_level 
    ON inventory(current_quantity, minimum_stock_level) 
    WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_inventory_last_restock 
    ON inventory(last_restocked_date DESC) 
    WHERE is_active = true;

-- =========================================
-- 7. ALERT STATISTICS FUNCTION
-- =========================================
CREATE OR REPLACE FUNCTION get_inventory_alert_stats()
RETURNS TABLE (
    total_alerts BIGINT,
    critical_alerts BIGINT,
    out_of_stock_count BIGINT,
    low_stock_count BIGINT,
    fast_moving_low_count BIGINT,
    dead_stock_count BIGINT,
    dead_stock_value NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM vw_inventory_alerts)::BIGINT AS total_alerts,
        (SELECT COUNT(*) FROM vw_inventory_alerts WHERE severity = 'CRITICAL')::BIGINT AS critical_alerts,
        (SELECT COUNT(*) FROM vw_inventory_alerts WHERE alert_type = 'OUT_OF_STOCK')::BIGINT AS out_of_stock_count,
        (SELECT COUNT(*) FROM vw_inventory_alerts WHERE alert_type = 'LOW_STOCK')::BIGINT AS low_stock_count,
        (SELECT COUNT(*) FROM vw_inventory_alerts WHERE alert_type = 'FAST_MOVING_LOW')::BIGINT AS fast_moving_low_count,
        (SELECT COUNT(*) FROM vw_inventory_alerts WHERE alert_type = 'DEAD_STOCK')::BIGINT AS dead_stock_count,
        COALESCE((SELECT SUM(inventory_value) FROM vw_dead_stock_items), 0) AS dead_stock_value;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- SUCCESS MESSAGE
-- =========================================
DO $$
BEGIN
    RAISE NOTICE '✅ Smart Inventory Alerts System Created Successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Views Created:';
    RAISE NOTICE '  • vw_fast_moving_items - Items with high sales velocity';
    RAISE NOTICE '  • vw_dead_stock_items - Items with no sales in 90+ days';
    RAISE NOTICE '  • vw_inventory_movement_analysis - Detailed turnover analysis';
    RAISE NOTICE '  • vw_inventory_alerts - Comprehensive alerts dashboard';
    RAISE NOTICE '  • vw_purchase_order_suggestions - Auto purchase recommendations';
    RAISE NOTICE '';
    RAISE NOTICE 'Functions Created:';
    RAISE NOTICE '  • get_inventory_alert_stats() - Alert statistics summary';
    RAISE NOTICE '';
    RAISE NOTICE 'Test the alerts:';
    RAISE NOTICE '  SELECT * FROM vw_inventory_alerts;';
    RAISE NOTICE '  SELECT * FROM get_inventory_alert_stats();';
END $$;
