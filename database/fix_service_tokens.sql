-- =========================================
-- FIX SERVICE TOKENS TABLE - PRESERVE DATA
-- =========================================

-- First, backup any existing data (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_tokens_backup') THEN
        DROP TABLE service_tokens_backup;
    END IF;
END $$;

-- Create backup of current structure (even if empty)
CREATE TABLE service_tokens_backup AS SELECT * FROM service_tokens;

-- Drop the current table
DROP TABLE IF EXISTS service_tokens CASCADE;

-- Recreate service_tokens table with correct structure
CREATE TABLE service_tokens (
    id SERIAL PRIMARY KEY,
    token_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    vehicle_number VARCHAR(50) NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL CHECK (vehicle_type IN ('Bike', 'Car', 'Other')),
    vehicle_brand VARCHAR(100),
    vehicle_model VARCHAR(100),
    service_type VARCHAR(100) NOT NULL,
    estimated_time VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Delivered', 'Cancelled')),
    priority VARCHAR(20) DEFAULT 'Normal' CHECK (priority IN ('Low', 'Normal', 'High', 'Urgent')),
    service_price DECIMAL(10,2) DEFAULT 0.00,
    payment_method VARCHAR(50),
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    completed_at TIMESTAMP,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Restore any backed up data (map old columns to new)
INSERT INTO service_tokens (
    id, token_number, customer_name, customer_phone, vehicle_number, 
    vehicle_type, service_type, service_price, status, notes, 
    created_by, completed_at, created_at
)
SELECT 
    id,
    token_number,
    customer_name,
    COALESCE(customer_phone, '0000000000'),
    COALESCE(bike_number, vehicle_number, 'UNKNOWN'),
    'Bike' as vehicle_type,
    service_type,
    COALESCE(amount, service_price, 0),
    CASE 
        WHEN LOWER(status) = 'pending' THEN 'Pending'
        WHEN LOWER(status) = 'completed' THEN 'Completed'
        WHEN LOWER(status) = 'cancelled' THEN 'Cancelled'
        WHEN LOWER(status) = 'in progress' THEN 'In Progress'
        WHEN LOWER(status) = 'delivered' THEN 'Delivered'
        ELSE 'Pending'
    END,
    notes,
    created_by,
    completed_at,
    created_at
FROM service_tokens_backup
WHERE EXISTS (SELECT 1 FROM service_tokens_backup);

-- Link to customers if they exist
UPDATE service_tokens st
SET customer_id = c.id
FROM customers c
WHERE st.customer_phone = c.phone
  AND st.customer_id IS NULL;

-- Reset sequence to max id + 1
SELECT setval('service_tokens_id_seq', COALESCE((SELECT MAX(id) FROM service_tokens), 0) + 1, false);

-- Create sequence for token numbers if not exists
CREATE SEQUENCE IF NOT EXISTS service_token_seq START 1;

-- Set sequence to current max token number
DO $$
DECLARE
    max_token_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(token_number FROM 'TOK-(\d+)') AS INTEGER)), 0)
    INTO max_token_num
    FROM service_tokens
    WHERE token_number ~ 'TOK-\d+';
    
    IF max_token_num > 0 THEN
        PERFORM setval('service_token_seq', max_token_num);
    END IF;
END $$;

-- Create trigger function to auto-generate token number
CREATE OR REPLACE FUNCTION generate_token_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.token_number IS NULL OR NEW.token_number = '' THEN
        NEW.token_number := 'TOK-' || LPAD(nextval('service_token_seq')::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS set_token_number ON service_tokens;
CREATE TRIGGER set_token_number
    BEFORE INSERT ON service_tokens
    FOR EACH ROW
    EXECUTE FUNCTION generate_token_number();

-- Create update timestamp trigger
CREATE OR REPLACE FUNCTION update_service_token_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS service_tokens_update_timestamp ON service_tokens;
CREATE TRIGGER service_tokens_update_timestamp
    BEFORE UPDATE ON service_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_service_token_timestamp();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_service_tokens_customer ON service_tokens(customer_phone);
CREATE INDEX IF NOT EXISTS idx_service_tokens_vehicle ON service_tokens(vehicle_number);
CREATE INDEX IF NOT EXISTS idx_service_tokens_status ON service_tokens(status);
CREATE INDEX IF NOT EXISTS idx_service_tokens_created_at ON service_tokens(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_tokens_token_number ON service_tokens(token_number);
CREATE INDEX IF NOT EXISTS idx_service_tokens_customer_id ON service_tokens(customer_id);

-- Insert sample data if table is empty
INSERT INTO service_tokens (
    customer_name, customer_phone, vehicle_number, vehicle_type,
    vehicle_brand, vehicle_model, service_type, service_price,
    status, priority, notes, created_by
)
SELECT 
    'Rajesh Kumar', '9876543210', 'MH12AB1234', 'Bike',
    'Honda', 'Activa 6G', 'Bike Washing', 100.00,
    'Completed', 'Normal', 'Regular washing service', 1
WHERE NOT EXISTS (SELECT 1 FROM service_tokens LIMIT 1)

UNION ALL

SELECT 
    'Priya Sharma', '9876543211', 'MH12CD5678', 'Bike',
    'Hero', 'Splendor Plus', 'Chain Cleaning & Lubing', 150.00,
    'Completed', 'Normal', 'Chain maintenance', 1
WHERE NOT EXISTS (SELECT 1 FROM service_tokens LIMIT 1)

UNION ALL

SELECT 
    'Amit Patel', '9876543212', 'MH14EF9101', 'Bike',
    'TVS', 'Apache RTR 160', 'Engine Oil Change', 450.00,
    'Pending', 'Normal', 'Synthetic oil', 1
WHERE NOT EXISTS (SELECT 1 FROM service_tokens LIMIT 1)

UNION ALL

SELECT 
    'Sneha Desai', '9876543213', 'MH12GH1121', 'Car',
    'Maruti', 'Swift', 'Car Washing', 300.00,
    'In Progress', 'High', 'Premium wash with wax', 1
WHERE NOT EXISTS (SELECT 1 FROM service_tokens LIMIT 1)

UNION ALL

SELECT 
    'Vikram Singh', '9876543214', 'MH14IJ3141', 'Bike',
    'Royal Enfield', 'Classic 350', 'General Servicing', 800.00,
    'Pending', 'Urgent', 'Pre-trip service check', 1
WHERE NOT EXISTS (SELECT 1 FROM service_tokens LIMIT 1);

-- Link sample tokens to customers
UPDATE service_tokens st
SET customer_id = c.id
FROM customers c
WHERE st.customer_phone = c.phone
  AND st.customer_id IS NULL;

-- Drop backup table
DROP TABLE IF EXISTS service_tokens_backup;

-- Display summary
DO $$
DECLARE
    token_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO token_count FROM service_tokens;
    RAISE NOTICE '✅ Service tokens table restored with % records', token_count;
END $$;

COMMENT ON TABLE service_tokens IS 'Service tokens for quick services like washing, chain cleaning, oil change, etc.';

SELECT 'Service Tokens Table Fixed Successfully! Total Records: ' || COUNT(*)::TEXT as result
FROM service_tokens;
