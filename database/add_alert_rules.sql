-- ============================================
-- SMART INVENTORY ALERT RULES SYSTEM
-- Allows users to create custom alert rules
-- ============================================

-- Drop existing objects if they exist
DROP TABLE IF EXISTS inventory_alert_history CASCADE;
DROP TABLE IF EXISTS inventory_alert_rules CASCADE;
DROP TYPE IF EXISTS alert_condition_type CASCADE;
DROP TYPE IF EXISTS alert_priority CASCADE;
DROP TYPE IF EXISTS alert_status CASCADE;

-- Create enum types
CREATE TYPE alert_condition_type AS ENUM (
    'low_stock',           -- Stock below threshold
    'out_of_stock',        -- Stock is zero
    'overstock',           -- Stock above threshold
    'reorder_point',       -- Stock at reorder level
    'fast_moving_low',     -- Fast moving with low stock
    'no_movement',         -- No sales in X days
    'custom'               -- Custom condition
);

CREATE TYPE alert_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE alert_status AS ENUM ('active', 'acknowledged', 'resolved', 'disabled');

-- ============================================
-- Table: inventory_alert_rules
-- Stores configurable alert rules
-- ============================================
CREATE TABLE inventory_alert_rules (
    rule_id SERIAL PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL,
    description TEXT,
    condition_type alert_condition_type NOT NULL,
    priority alert_priority NOT NULL DEFAULT 'medium',
    
    -- Condition parameters
    threshold_value NUMERIC(10, 2),           -- For numeric thresholds
    threshold_percentage NUMERIC(5, 2),       -- For percentage-based alerts
    days_threshold INTEGER,                   -- For time-based conditions
    
    -- Filters
    category_filter INTEGER,                  -- Category ID filter
    manufacturer_filter INTEGER,              -- Manufacturer ID filter
    specific_product_filter INTEGER,          -- Specific product ID
    
    -- Alert behavior
    is_active BOOLEAN DEFAULT TRUE,
    send_email BOOLEAN DEFAULT FALSE,
    send_notification BOOLEAN DEFAULT TRUE,
    
    -- Audit fields
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_checked_at TIMESTAMP,
    
    CONSTRAINT valid_threshold CHECK (
        threshold_value IS NOT NULL OR 
        threshold_percentage IS NOT NULL OR 
        days_threshold IS NOT NULL
    )
);

-- ============================================
-- Table: inventory_alert_history
-- Logs all triggered alerts
-- ============================================
CREATE TABLE inventory_alert_history (
    alert_id SERIAL PRIMARY KEY,
    rule_id INTEGER REFERENCES inventory_alert_rules(rule_id) ON DELETE CASCADE,
    product_id INTEGER,                        -- Inventory ID
    
    alert_status alert_status DEFAULT 'active',
    priority alert_priority NOT NULL,
    
    -- Alert details
    alert_message TEXT NOT NULL,
    current_stock NUMERIC(10, 2),
    threshold_value NUMERIC(10, 2),
    difference NUMERIC(10, 2),
    
    -- Action taken
    acknowledged_by INTEGER,
    acknowledged_at TIMESTAMP,
    acknowledgement_note TEXT,
    
    resolved_by INTEGER,
    resolved_at TIMESTAMP,
    resolution_note TEXT,
    
    -- Timestamps
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Metadata
    additional_data JSONB
);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX idx_alert_rules_active ON inventory_alert_rules(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_alert_rules_condition ON inventory_alert_rules(condition_type);
CREATE INDEX idx_alert_rules_priority ON inventory_alert_rules(priority);

CREATE INDEX idx_alert_history_status ON inventory_alert_history(alert_status);
CREATE INDEX idx_alert_history_product ON inventory_alert_history(product_id);
CREATE INDEX idx_alert_history_rule ON inventory_alert_history(rule_id);
CREATE INDEX idx_alert_history_triggered ON inventory_alert_history(triggered_at DESC);
CREATE INDEX idx_alert_history_active ON inventory_alert_history(alert_status) WHERE alert_status IN ('active', 'acknowledged');

-- ============================================
-- View: vw_active_alert_rules
-- Shows all configured alert rules with their details
-- ============================================
CREATE OR REPLACE VIEW vw_active_alert_rules AS
SELECT 
    ar.rule_id,
    ar.rule_name,
    ar.description,
    ar.condition_type,
    ar.priority,
    ar.threshold_value,
    ar.threshold_percentage,
    ar.days_threshold,
    ar.category_filter,
    ar.manufacturer_filter,
    ar.specific_product_filter,
    ar.is_active,
    ar.send_email,
    ar.send_notification,
    ar.created_at,
    ar.updated_at,
    ar.last_checked_at,
    COUNT(ah.alert_id) FILTER (WHERE ah.alert_status = 'active') AS active_alerts_count,
    COUNT(ah.alert_id) FILTER (WHERE ah.triggered_at >= CURRENT_DATE) AS alerts_today
FROM inventory_alert_rules ar
LEFT JOIN inventory_alert_history ah ON ar.rule_id = ah.rule_id
GROUP BY ar.rule_id
ORDER BY ar.is_active DESC, ar.priority ASC, ar.created_at DESC;

-- ============================================
-- View: vw_alert_dashboard
-- Combined view of alerts from rules with product details
-- ============================================
CREATE OR REPLACE VIEW vw_alert_dashboard AS
SELECT 
    ah.alert_id,
    ah.rule_id,
    ar.rule_name,
    ah.product_id,
    i.barcode,
    pm.name AS product_name,
    i.brand,
    ah.priority,
    ah.alert_status,
    ah.alert_message,
    ah.current_stock,
    ah.threshold_value,
    ah.difference,
    ah.triggered_at,
    EXTRACT(EPOCH FROM (NOW() - ah.triggered_at))/3600 AS hours_since_triggered,
    ah.acknowledged_by,
    ah.acknowledged_at,
    ah.acknowledgement_note,
    ah.resolved_by,
    ah.resolved_at
FROM inventory_alert_history ah
INNER JOIN inventory_alert_rules ar ON ah.rule_id = ar.rule_id
LEFT JOIN inventory i ON ah.product_id = i.id
LEFT JOIN product_master pm ON i.product_master_id = pm.id
WHERE ah.alert_status IN ('active', 'acknowledged')
ORDER BY 
    CASE ah.priority 
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
    END,
    ah.triggered_at DESC;

-- ============================================
-- Function: check_alert_rules()
-- Evaluates all active rules and creates alerts
-- ============================================
CREATE OR REPLACE FUNCTION check_alert_rules()
RETURNS TABLE (
    alerts_created INTEGER,
    rules_checked INTEGER
) AS $$
DECLARE
    v_rule RECORD;
    v_product RECORD;
    v_alerts_created INTEGER := 0;
    v_rules_checked INTEGER := 0;
    v_alert_message TEXT;
    v_threshold NUMERIC;
    v_difference NUMERIC;
BEGIN
    -- Loop through all active rules
    FOR v_rule IN 
        SELECT * FROM inventory_alert_rules 
        WHERE is_active = TRUE
    LOOP
        v_rules_checked := v_rules_checked + 1;
        
        -- LOW STOCK alerts
        IF v_rule.condition_type = 'low_stock' THEN
            FOR v_product IN
                SELECT i.id, i.barcode, pm.name AS product_name, i.current_quantity,
                    i.minimum_stock_level,
                    CASE 
                        WHEN v_rule.threshold_value IS NOT NULL THEN v_rule.threshold_value
                        WHEN v_rule.threshold_percentage IS NOT NULL THEN (i.minimum_stock_level * 3) * (v_rule.threshold_percentage / 100)
                        ELSE i.minimum_stock_level
                    END AS threshold
                FROM inventory i
                LEFT JOIN product_master pm ON i.product_master_id = pm.id
                WHERE i.is_active = TRUE
                  AND (v_rule.category_filter IS NULL OR pm.category_id = v_rule.category_filter)
                  AND (v_rule.manufacturer_filter IS NULL OR pm.manufacturer_id = v_rule.manufacturer_filter)
                  AND (v_rule.specific_product_filter IS NULL OR i.id = v_rule.specific_product_filter)
            LOOP
                IF v_product.current_quantity <= v_product.threshold AND v_product.current_quantity > 0 THEN
                    v_threshold := v_product.threshold;
                    v_difference := v_product.threshold - v_product.current_quantity;
                    v_alert_message := format(
                        'Low stock: %s - Current: %s, Threshold: %s',
                        v_product.product_name,
                        v_product.current_quantity,
                        v_threshold
                    );
                    
                    -- Check if alert already exists
                    IF NOT EXISTS (
                        SELECT 1 FROM inventory_alert_history
                        WHERE product_id = v_product.id
                          AND rule_id = v_rule.rule_id
                          AND alert_status IN ('active', 'acknowledged')
                    ) THEN
                        INSERT INTO inventory_alert_history (
                            rule_id, product_id, priority, alert_message,
                            current_stock, threshold_value, difference
                        ) VALUES (
                            v_rule.rule_id, v_product.id, v_rule.priority,
                            v_alert_message, v_product.current_quantity, v_threshold, v_difference
                        );
                        v_alerts_created := v_alerts_created + 1;
                    END IF;
                END IF;
            END LOOP;
        
        -- OUT OF STOCK alerts
        ELSIF v_rule.condition_type = 'out_of_stock' THEN
            FOR v_product IN
                SELECT i.id, i.barcode, pm.name AS product_name, i.current_quantity
                FROM inventory i
                LEFT JOIN product_master pm ON i.product_master_id = pm.id
                WHERE i.is_active = TRUE
                  AND i.current_quantity <= 0
                  AND (v_rule.category_filter IS NULL OR pm.category_id = v_rule.category_filter)
                  AND (v_rule.manufacturer_filter IS NULL OR pm.manufacturer_id = v_rule.manufacturer_filter)
                  AND (v_rule.specific_product_filter IS NULL OR i.id = v_rule.specific_product_filter)
            LOOP
                v_alert_message := format('OUT OF STOCK: %s - Immediate action required!', v_product.product_name);
                
                IF NOT EXISTS (
                    SELECT 1 FROM inventory_alert_history
                    WHERE product_id = v_product.id AND rule_id = v_rule.rule_id AND alert_status IN ('active', 'acknowledged')
                ) THEN
                    INSERT INTO inventory_alert_history (
                        rule_id, product_id, priority, alert_message, current_stock, threshold_value, difference
                    ) VALUES (
                        v_rule.rule_id, v_product.id, 'critical', v_alert_message, v_product.current_quantity, 0, v_product.current_quantity
                    );
                    v_alerts_created := v_alerts_created + 1;
                END IF;
            END LOOP;
        
        -- REORDER POINT alerts
        ELSIF v_rule.condition_type = 'reorder_point' THEN
            FOR v_product IN
                SELECT i.id, i.barcode, pm.name AS product_name, i.current_quantity, i.minimum_stock_level
                FROM inventory i
                LEFT JOIN product_master pm ON i.product_master_id = pm.id
                WHERE i.is_active = TRUE
                  AND i.current_quantity <= i.minimum_stock_level
                  AND i.current_quantity > 0
                  AND (v_rule.category_filter IS NULL OR pm.category_id = v_rule.category_filter)
                  AND (v_rule.manufacturer_filter IS NULL OR pm.manufacturer_id = v_rule.manufacturer_filter)
                  AND (v_rule.specific_product_filter IS NULL OR i.id = v_rule.specific_product_filter)
            LOOP
                v_alert_message := format(
                    'Reorder point: %s - Current: %s, Min Level: %s',
                    v_product.product_name, v_product.current_quantity, v_product.minimum_stock_level
                );
                
                IF NOT EXISTS (
                    SELECT 1 FROM inventory_alert_history
                    WHERE product_id = v_product.id AND rule_id = v_rule.rule_id AND alert_status IN ('active', 'acknowledged')
                ) THEN
                    INSERT INTO inventory_alert_history (
                        rule_id, product_id, priority, alert_message,
                        current_stock, threshold_value, difference
                    ) VALUES (
                        v_rule.rule_id, v_product.id, v_rule.priority,
                        v_alert_message, v_product.current_quantity, v_product.minimum_stock_level,
                        v_product.minimum_stock_level - v_product.current_quantity
                    );
                    v_alerts_created := v_alerts_created + 1;
                END IF;
            END LOOP;
        
        -- OVERSTOCK alerts
        ELSIF v_rule.condition_type = 'overstock' THEN
            FOR v_product IN
                SELECT i.id, i.barcode, pm.name AS product_name, i.current_quantity,
                    i.minimum_stock_level,
                    CASE 
                        WHEN v_rule.threshold_value IS NOT NULL THEN v_rule.threshold_value
                        WHEN v_rule.threshold_percentage IS NOT NULL THEN (i.minimum_stock_level * 3) * (1 + v_rule.threshold_percentage / 100)
                        ELSE (i.minimum_stock_level * 3) * 1.5
                    END AS threshold
                FROM inventory i
                LEFT JOIN product_master pm ON i.product_master_id = pm.id
                WHERE i.is_active = TRUE
                  AND (v_rule.category_filter IS NULL OR pm.category_id = v_rule.category_filter)
                  AND (v_rule.manufacturer_filter IS NULL OR pm.manufacturer_id = v_rule.manufacturer_filter)
                  AND (v_rule.specific_product_filter IS NULL OR i.id = v_rule.specific_product_filter)
            LOOP
                IF v_product.current_quantity >= v_product.threshold THEN
                    v_threshold := v_product.threshold;
                    v_difference := v_product.current_quantity - v_product.threshold;
                    v_alert_message := format(
                        'Overstock: %s exceeds threshold. Current: %s, Threshold: %s',
                        v_product.product_name, v_product.current_quantity, v_threshold
                    );
                    
                    IF NOT EXISTS (
                        SELECT 1 FROM inventory_alert_history
                        WHERE product_id = v_product.id AND rule_id = v_rule.rule_id AND alert_status IN ('active', 'acknowledged')
                    ) THEN
                        INSERT INTO inventory_alert_history (
                            rule_id, product_id, priority, alert_message,
                            current_stock, threshold_value, difference
                        ) VALUES (
                            v_rule.rule_id, v_product.id, v_rule.priority,
                            v_alert_message, v_product.current_quantity, v_threshold, v_difference
                        );
                        v_alerts_created := v_alerts_created + 1;
                    END IF;
                END IF;
            END LOOP;
        
        END IF;
        
        -- Update last checked timestamp
        UPDATE inventory_alert_rules 
        SET last_checked_at = CURRENT_TIMESTAMP 
        WHERE rule_id = v_rule.rule_id;
    END LOOP;
    
    RETURN QUERY SELECT v_alerts_created, v_rules_checked;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- Function: acknowledge_alert()
-- ============================================
CREATE OR REPLACE FUNCTION acknowledge_alert(
    p_alert_id INTEGER,
    p_user_id INTEGER,
    p_note TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE inventory_alert_history
    SET 
        alert_status = 'acknowledged',
        acknowledged_by = p_user_id,
        acknowledged_at = CURRENT_TIMESTAMP,
        acknowledgement_note = p_note
    WHERE alert_id = p_alert_id AND alert_status = 'active';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Function: resolve_alert()
-- ============================================
CREATE OR REPLACE FUNCTION resolve_alert(
    p_alert_id INTEGER,
    p_user_id INTEGER,
    p_resolution_note TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE inventory_alert_history
    SET 
        alert_status = 'resolved',
        resolved_by = p_user_id,
        resolved_at = CURRENT_TIMESTAMP,
        resolution_note = p_resolution_note
    WHERE alert_id = p_alert_id AND alert_status IN ('active', 'acknowledged');
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Insert default alert rules
-- ============================================
INSERT INTO inventory_alert_rules (
    rule_name, description, condition_type, priority, threshold_value, is_active, send_notification
) VALUES
('Critical - Out of Stock', 'Alert when any product is completely out of stock', 'out_of_stock', 'critical', 0, TRUE, TRUE),
('High Priority - Reorder Point', 'Alert when stock reaches minimum level', 'reorder_point', 'high', 0, TRUE, TRUE),
('Medium - Low Stock (20%)', 'Alert when stock falls below 20% of maximum', 'low_stock', 'medium', 1, TRUE, TRUE);

-- Set threshold percentage
UPDATE inventory_alert_rules SET threshold_percentage = 20, threshold_value = NULL WHERE rule_name = 'Medium - Low Stock (20%)';

-- ============================================
-- Trigger to update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_alert_rule_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_alert_rule_updated
BEFORE UPDATE ON inventory_alert_rules
FOR EACH ROW
EXECUTE FUNCTION update_alert_rule_timestamp();

-- ============================================
-- Success message for alert rules
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Smart Inventory Alert RULES System Created!';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables Created:';
    RAISE NOTICE '  • inventory_alert_rules - Customizable alert rules';
    RAISE NOTICE '  • inventory_alert_history - Alert logs and tracking';
    RAISE NOTICE '';
    RAISE NOTICE 'Views Created:';
    RAISE NOTICE '  • vw_active_alert_rules - Active rules dashboard';
    RAISE NOTICE '  • vw_alert_dashboard - Combined alerts view';
    RAISE NOTICE '';
    RAISE NOTICE 'Functions Created:';
    RAISE NOTICE '  • check_alert_rules() - Evaluate all rules and create alerts';
    RAISE NOTICE '  • acknowledge_alert(alert_id, user_id, note) - Mark alert as acknowledged';
    RAISE NOTICE '  • resolve_alert(alert_id, user_id, note) - Mark alert as resolved';
    RAISE NOTICE '';
    RAISE NOTICE 'Default Rules Added: 3';
    RAISE NOTICE '';
    RAISE NOTICE 'Test the system:';
    RAISE NOTICE '  SELECT * FROM vw_active_alert_rules;';
    RAISE NOTICE '  SELECT * FROM check_alert_rules();';
    RAISE NOTICE '  SELECT * FROM vw_alert_dashboard;';
END $$;
