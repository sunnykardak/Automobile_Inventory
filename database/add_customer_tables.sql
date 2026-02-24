-- =========================================
-- CUSTOMER AND VEHICLE MANAGEMENT TABLES
-- =========================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS customer_vehicles CASCADE;
DROP TABLE IF EXISTS service_tokens CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- =========================================
-- CUSTOMERS TABLE
-- =========================================
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    gst_number VARCHAR(50),
    customer_type VARCHAR(50) DEFAULT 'Individual' CHECK (customer_type IN ('Individual', 'Business')),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- CUSTOMER VEHICLES TABLE
-- =========================================
CREATE TABLE customer_vehicles (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    vehicle_number VARCHAR(50) UNIQUE NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL CHECK (vehicle_type IN ('Bike', 'Car', 'Other')),
    vehicle_brand VARCHAR(100),
    vehicle_model VARCHAR(100),
    vehicle_year INTEGER,
    vin_number VARCHAR(50),
    registration_date DATE,
    insurance_expiry DATE,
    last_service_date DATE,
    next_service_due DATE,
    odometer_reading INTEGER,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- INDEXES
-- =========================================
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_name ON customers(customer_name);
CREATE INDEX idx_customer_vehicles_customer_id ON customer_vehicles(customer_id);
CREATE INDEX idx_customer_vehicles_number ON customer_vehicles(vehicle_number);
CREATE INDEX idx_customer_vehicles_service_due ON customer_vehicles(next_service_due) WHERE is_active = true;

-- =========================================
-- TRIGGER TO AUTO-UPDATE TIMESTAMPS
-- =========================================
CREATE OR REPLACE FUNCTION update_customer_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customers_update_timestamp
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_timestamp();

CREATE TRIGGER customer_vehicles_update_timestamp
    BEFORE UPDATE ON customer_vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_timestamp();

-- =========================================
-- SERVICE TOKENS TABLE (Recreate with FK)
-- =========================================
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

CREATE INDEX idx_service_tokens_customer ON service_tokens(customer_phone);
CREATE INDEX idx_service_tokens_vehicle ON service_tokens(vehicle_number);
CREATE INDEX idx_service_tokens_status ON service_tokens(status);

CREATE TRIGGER service_tokens_update_timestamp
    BEFORE UPDATE ON service_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_timestamp();

-- =========================================
-- POPULATE CUSTOMERS FROM EXISTING DATA
-- =========================================
-- Insert unique customers from job_cards
INSERT INTO customers (customer_name, phone, email)
SELECT DISTINCT ON (customer_phone)
    customer_name,
    customer_phone,
    customer_email
FROM job_cards
WHERE customer_phone IS NOT NULL
ON CONFLICT (phone) DO NOTHING;

-- Insert unique customers from service_tokens (if table exists with data)
INSERT INTO customers (customer_name, phone)
SELECT DISTINCT ON (customer_phone)
    customer_name,
    customer_phone
FROM service_tokens
WHERE customer_phone IS NOT NULL 
  AND customer_phone NOT IN (SELECT phone FROM customers)
ON CONFLICT (phone) DO NOTHING;

-- =========================================
-- POPULATE CUSTOMER VEHICLES
-- =========================================
-- Insert vehicles from job_cards
INSERT INTO customer_vehicles (customer_id, vehicle_number, vehicle_type, vehicle_brand, vehicle_model)
SELECT DISTINCT ON (jc.vehicle_number)
    c.id,
    jc.vehicle_number,
    jc.vehicle_type,
    jc.vehicle_brand,
    jc.vehicle_model
FROM job_cards jc
JOIN customers c ON jc.customer_phone = c.phone
WHERE jc.vehicle_number IS NOT NULL
ON CONFLICT (vehicle_number) DO NOTHING;

-- Update customer_id in service_tokens
UPDATE service_tokens st
SET customer_id = c.id
FROM customers c
WHERE st.customer_phone = c.phone;

-- =========================================
-- VIEW: CUSTOMER SUMMARY
-- =========================================
CREATE OR REPLACE VIEW customer_summary AS
SELECT 
    c.id,
    c.customer_name,
    c.phone,
    c.email,
    c.city,
    c.customer_type,
    c.is_active,
    c.created_at,
    COUNT(DISTINCT cv.id) as vehicle_count,
    COUNT(DISTINCT jc.id) as total_jobs,
    COUNT(DISTINCT CASE WHEN jc.status = 'Completed' THEN jc.id END) as completed_jobs,
    COALESCE(SUM(b.total_amount), 0) as total_spent,
    COALESCE(SUM(b.paid_amount), 0) as total_paid,
    MAX(jc.created_at) as last_visit_date,
    CASE 
        WHEN MAX(jc.created_at) IS NULL THEN NULL
        WHEN MAX(jc.created_at) < CURRENT_DATE - INTERVAL '90 days' THEN 'Inactive'
        WHEN MAX(jc.created_at) < CURRENT_DATE - INTERVAL '30 days' THEN 'At Risk'
        ELSE 'Active'
    END as customer_status
FROM customers c
LEFT JOIN customer_vehicles cv ON c.id = cv.customer_id
LEFT JOIN job_cards jc ON c.phone = jc.customer_phone
LEFT JOIN bills b ON jc.id = b.job_card_id AND b.payment_status IN ('Paid', 'Partial')
GROUP BY c.id, c.customer_name, c.phone, c.email, c.city, c.customer_type, c.is_active, c.created_at;

-- =========================================
-- VIEW: VEHICLE HISTORY
-- =========================================
CREATE OR REPLACE VIEW vehicle_history AS
SELECT 
    cv.id as vehicle_id,
    cv.vehicle_number,
    cv.vehicle_type,
    cv.vehicle_brand,
    cv.vehicle_model,
    cv.vehicle_year,
    c.id as customer_id,
    c.customer_name,
    c.phone as customer_phone,
    COUNT(jc.id) as total_services,
    MAX(jc.created_at) as last_service_date,
    COALESCE(SUM(b.total_amount), 0) as total_spent_on_vehicle,
    COALESCE(SUM(CASE WHEN jc.status = 'Completed' THEN 1 ELSE 0 END), 0) as completed_services,
    cv.odometer_reading,
    cv.next_service_due,
    cv.insurance_expiry
FROM customer_vehicles cv
JOIN customers c ON cv.customer_id = c.id
LEFT JOIN job_cards jc ON cv.vehicle_number = jc.vehicle_number
LEFT JOIN bills b ON jc.id = b.job_card_id
GROUP BY cv.id, cv.vehicle_number, cv.vehicle_type, cv.vehicle_brand, cv.vehicle_model, 
         cv.vehicle_year, c.id, c.customer_name, c.phone, cv.odometer_reading, 
         cv.next_service_due, cv.insurance_expiry;

COMMENT ON TABLE customers IS 'Customer master data with contact information';
COMMENT ON TABLE customer_vehicles IS 'Vehicles owned by customers';
COMMENT ON VIEW customer_summary IS 'Aggregated customer metrics including spend and visit history';
COMMENT ON VIEW vehicle_history IS 'Complete service history for each vehicle';
