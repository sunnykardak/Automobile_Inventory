-- =========================================
-- ADD CUSTOMERS TABLE
-- Run this migration to add customer management
-- =========================================

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    gst_number VARCHAR(20),
    customer_type VARCHAR(50) DEFAULT 'Individual' CHECK (customer_type IN ('Individual', 'Business')),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(phone)
);

-- Create customer_vehicles table (one customer can have multiple vehicles)
CREATE TABLE IF NOT EXISTS customer_vehicles (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    vehicle_number VARCHAR(20) NOT NULL UNIQUE,
    vehicle_type VARCHAR(50) NOT NULL,
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(customer_name);
CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(is_active);

CREATE INDEX IF NOT EXISTS idx_customer_vehicles_customer_id ON customer_vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_vehicles_number ON customer_vehicles(vehicle_number);
CREATE INDEX IF NOT EXISTS idx_customer_vehicles_active ON customer_vehicles(is_active);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customers_timestamp 
    BEFORE UPDATE ON customers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_vehicles_timestamp 
    BEFORE UPDATE ON customer_vehicles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for customer summary
CREATE OR REPLACE VIEW vw_customer_summary AS
SELECT 
    c.id,
    c.customer_name,
    c.phone,
    c.email,
    c.address,
    c.city,
    c.customer_type,
    c.is_active,
    c.created_at,
    COUNT(DISTINCT cv.id) as total_vehicles,
    COUNT(DISTINCT jc.id) as total_jobs,
    COALESCE(SUM(b.total_amount), 0) as total_spent,
    MAX(jc.created_at) as last_service_date
FROM customers c
LEFT JOIN customer_vehicles cv ON c.id = cv.customer_id
LEFT JOIN job_cards jc ON c.phone = jc.customer_phone
LEFT JOIN bills b ON jc.id = b.job_card_id
GROUP BY c.id, c.customer_name, c.phone, c.email, c.address, c.city, c.customer_type, c.is_active, c.created_at;

-- Insert sample customers
INSERT INTO customers (customer_name, phone, email, address, city, state, pincode, customer_type) VALUES
('Rajesh Kumar', '+91-9876543210', 'rajesh.kumar@example.com', '123 MG Road', 'Bangalore', 'Karnataka', '560001', 'Individual'),
('Priya Sharma', '+91-9876543211', 'priya.sharma@example.com', '456 Park Street', 'Mumbai', 'Maharashtra', '400001', 'Individual'),
('ABC Motors Pvt Ltd', '+91-9876543212', 'contact@abcmotors.com', '789 Industrial Area', 'Delhi', 'Delhi', '110001', 'Business'),
('Suresh Patel', '+91-9876543213', 'suresh.patel@example.com', '321 Gandhi Nagar', 'Ahmedabad', 'Gujarat', '380001', 'Individual'),
('Lakshmi Reddy', '+91-9876543214', 'lakshmi.reddy@example.com', '654 Beach Road', 'Chennai', 'Tamil Nadu', '600001', 'Individual')
ON CONFLICT (phone) DO NOTHING;

-- Insert sample vehicles
INSERT INTO customer_vehicles (customer_id, vehicle_number, vehicle_type, vehicle_brand, vehicle_model, vehicle_year) VALUES
(1, 'KA01AB1234', 'Car', 'Maruti', 'Swift', 2020),
(1, 'KA01CD5678', 'Bike', 'Honda', 'Activa', 2021),
(2, 'MH02EF9012', 'Car', 'Hyundai', 'i20', 2019),
(3, 'DL03GH3456', 'Car', 'Toyota', 'Innova', 2022),
(3, 'DL03IJ7890', 'Car', 'Honda', 'City', 2021),
(4, 'GJ04KL1234', 'Bike', 'Royal Enfield', 'Classic 350', 2020),
(5, 'TN05MN5678', 'Car', 'Tata', 'Nexon', 2022)
ON CONFLICT (vehicle_number) DO NOTHING;

COMMENT ON TABLE customers IS 'Stores customer/client information';
COMMENT ON TABLE customer_vehicles IS 'Stores vehicles owned by customers';
COMMENT ON VIEW vw_customer_summary IS 'Summary view of customers with their statistics';
