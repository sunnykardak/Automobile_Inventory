-- =========================================
-- AUTOMOBILE INVENTORY DATABASE SCHEMA
-- Database: automotive_inventory
-- =========================================

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS salary_payments CASCADE;
DROP TABLE IF EXISTS employee_commissions CASCADE;
DROP TABLE IF EXISTS bill_items CASCADE;
DROP TABLE IF EXISTS bills CASCADE;
DROP TABLE IF EXISTS job_products CASCADE;
DROP TABLE IF EXISTS job_cards CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS product_master CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS manufacturers CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- =========================================
-- 1. ROLES TABLE
-- =========================================
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- 2. USERS TABLE
-- =========================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- 3. EMPLOYEES TABLE
-- =========================================
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    date_of_birth DATE,
    date_of_joining DATE NOT NULL,
    designation VARCHAR(100),
    commission_percentage DECIMAL(5,2) DEFAULT 0.00,
    base_salary DECIMAL(10,2) DEFAULT 0.00,
    id_proof_type VARCHAR(50),
    id_proof_number VARCHAR(100),
    pf_number VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- 4. MANUFACTURERS TABLE
-- =========================================
CREATE TABLE manufacturers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    country VARCHAR(100),
    website VARCHAR(255),
    contact_info JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- 5. CATEGORIES TABLE
-- =========================================
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- 6. PRODUCT MASTER TABLE
-- =========================================
CREATE TABLE product_master (
    id SERIAL PRIMARY KEY,
    manufacturer_id INTEGER REFERENCES manufacturers(id) ON DELETE SET NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    part_number VARCHAR(100),
    description TEXT,
    specifications JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(manufacturer_id, part_number)
);

-- =========================================
-- 7. INVENTORY TABLE
-- =========================================
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    product_master_id INTEGER REFERENCES product_master(id) ON DELETE SET NULL,
    barcode VARCHAR(100) UNIQUE,
    brand VARCHAR(100),
    current_quantity INTEGER DEFAULT 0,
    minimum_stock_level INTEGER DEFAULT 10,
    unit_price DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    storage_location VARCHAR(100),
    supplier_name VARCHAR(255),
    supplier_contact JSONB,
    last_restocked_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- 8. JOB CARDS TABLE
-- =========================================
CREATE TABLE job_cards (
    id SERIAL PRIMARY KEY,
    job_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    vehicle_number VARCHAR(50) NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL CHECK (vehicle_type IN ('Bike', 'Car', 'Other')),
    vehicle_brand VARCHAR(100),
    vehicle_model VARCHAR(100),
    reported_issues TEXT NOT NULL,
    assigned_mechanic_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    labor_charges DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Created' CHECK (status IN ('Created', 'In Progress', 'Washing', 'Completed', 'Cancelled')),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- 9. JOB PRODUCTS TABLE (Junction Table)
-- =========================================
CREATE TABLE job_products (
    id SERIAL PRIMARY KEY,
    job_card_id INTEGER REFERENCES job_cards(id) ON DELETE CASCADE,
    inventory_id INTEGER REFERENCES inventory(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- 10. BILLS TABLE
-- =========================================
CREATE TABLE bills (
    id SERIAL PRIMARY KEY,
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    job_card_id INTEGER REFERENCES job_cards(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid', 'Partial')),
    paid_amount DECIMAL(10,2) DEFAULT 0.00,
    generated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- 11. BILL ITEMS TABLE
-- =========================================
CREATE TABLE bill_items (
    id SERIAL PRIMARY KEY,
    bill_id INTEGER REFERENCES bills(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('Product', 'Labor', 'Other')),
    description VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- 12. EMPLOYEE COMMISSIONS TABLE
-- =========================================
CREATE TABLE employee_commissions (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    bill_id INTEGER REFERENCES bills(id) ON DELETE SET NULL,
    job_card_id INTEGER REFERENCES job_cards(id) ON DELETE SET NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    commission_percentage DECIMAL(5,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid')),
    paid_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- 13. SALARY PAYMENTS TABLE
-- =========================================
CREATE TABLE salary_payments (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    payment_month DATE NOT NULL,
    base_salary DECIMAL(10,2) NOT NULL,
    total_commission DECIMAL(10,2) DEFAULT 0.00,
    deductions DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_date DATE,
    payment_method VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid')),
    paid_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- 14. ATTENDANCE TABLE
-- =========================================
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status VARCHAR(50) DEFAULT 'Present' CHECK (status IN ('Present', 'Absent', 'Half Day', 'Leave', 'Holiday')),
    leave_type VARCHAR(50),
    notes TEXT,
    marked_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, date)
);

-- =========================================
-- 15. AUDIT LOGS TABLE
-- =========================================
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- CREATE INDEXES FOR PERFORMANCE
-- =========================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);

-- Employees indexes
CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_employees_is_active ON employees(is_active);

-- Inventory indexes
CREATE INDEX idx_inventory_barcode ON inventory(barcode);
CREATE INDEX idx_inventory_product_master ON inventory(product_master_id);
CREATE INDEX idx_inventory_low_stock ON inventory(current_quantity) WHERE current_quantity <= minimum_stock_level;

-- Job cards indexes
CREATE INDEX idx_job_cards_job_number ON job_cards(job_number);
CREATE INDEX idx_job_cards_status ON job_cards(status);
CREATE INDEX idx_job_cards_assigned_mechanic ON job_cards(assigned_mechanic_id);
CREATE INDEX idx_job_cards_created_at ON job_cards(created_at);
CREATE INDEX idx_job_cards_vehicle_number ON job_cards(vehicle_number);

-- Bills indexes
CREATE INDEX idx_bills_bill_number ON bills(bill_number);
CREATE INDEX idx_bills_job_card ON bills(job_card_id);
CREATE INDEX idx_bills_created_at ON bills(created_at);
CREATE INDEX idx_bills_payment_status ON bills(payment_status);

-- Attendance indexes
CREATE INDEX idx_attendance_employee_date ON attendance(employee_id, date);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- =========================================
-- CREATE VIEWS FOR COMMON QUERIES
-- =========================================

-- View: Low Stock Items
CREATE VIEW vw_low_stock_items AS
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
    i.storage_location
FROM inventory i
LEFT JOIN product_master pm ON i.product_master_id = pm.id
LEFT JOIN manufacturers m ON pm.manufacturer_id = m.id
LEFT JOIN categories c ON pm.category_id = c.id
WHERE i.current_quantity <= i.minimum_stock_level
  AND i.is_active = true;

-- View: Active Jobs
CREATE VIEW vw_active_jobs AS
SELECT 
    jc.id,
    jc.job_number,
    jc.customer_name,
    jc.customer_phone,
    jc.vehicle_number,
    jc.vehicle_type,
    jc.vehicle_brand,
    jc.vehicle_model,
    jc.status,
    jc.estimated_cost,
    jc.labor_charges,
    e.first_name || ' ' || e.last_name AS mechanic_name,
    jc.created_at
FROM job_cards jc
LEFT JOIN employees e ON jc.assigned_mechanic_id = e.id
WHERE jc.status IN ('Created', 'In Progress', 'Washing');

-- View: Employee Performance
CREATE VIEW vw_employee_performance AS
SELECT 
    e.id AS employee_id,
    e.first_name || ' ' || e.last_name AS employee_name,
    e.designation,
    COUNT(DISTINCT jc.id) AS total_jobs_completed,
    COALESCE(SUM(ec.commission_amount), 0) AS total_commission_earned,
    COALESCE(SUM(CASE WHEN ec.status = 'Pending' THEN ec.commission_amount ELSE 0 END), 0) AS pending_commission
FROM employees e
LEFT JOIN job_cards jc ON e.id = jc.assigned_mechanic_id AND jc.status = 'Completed'
LEFT JOIN employee_commissions ec ON e.id = ec.employee_id
WHERE e.is_active = true
GROUP BY e.id, e.first_name, e.last_name, e.designation;

-- View: Daily Revenue Summary
CREATE VIEW vw_daily_revenue AS
SELECT 
    DATE(b.created_at) AS date,
    COUNT(DISTINCT b.id) AS total_bills,
    SUM(b.total_amount) AS total_revenue,
    SUM(b.paid_amount) AS collected_amount,
    SUM(b.total_amount - b.paid_amount) AS pending_amount
FROM bills b
GROUP BY DATE(b.created_at)
ORDER BY DATE(b.created_at) DESC;

-- =========================================
-- TRIGGERS AND FUNCTIONS
-- =========================================

-- Function: Update timestamp on record update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at column
CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_timestamp BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_manufacturers_timestamp BEFORE UPDATE ON manufacturers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_timestamp BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_master_timestamp BEFORE UPDATE ON product_master FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_timestamp BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_cards_timestamp BEFORE UPDATE ON job_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bills_timestamp BEFORE UPDATE ON bills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_salary_payments_timestamp BEFORE UPDATE ON salary_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_timestamp BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_timestamp BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Generate unique job number
CREATE OR REPLACE FUNCTION generate_job_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.job_number IS NULL THEN
        NEW.job_number = 'JOB' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || LPAD(nextval('job_cards_id_seq')::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_job_number BEFORE INSERT ON job_cards FOR EACH ROW EXECUTE FUNCTION generate_job_number();

-- Function: Generate unique bill number
CREATE OR REPLACE FUNCTION generate_bill_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.bill_number IS NULL THEN
        NEW.bill_number = 'BILL' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || LPAD(nextval('bills_id_seq')::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_bill_number BEFORE INSERT ON bills FOR EACH ROW EXECUTE FUNCTION generate_bill_number();

-- Function: Generate barcode for inventory
CREATE OR REPLACE FUNCTION generate_barcode()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.barcode IS NULL THEN
        NEW.barcode = 'BAR' || LPAD(nextval('inventory_id_seq')::TEXT, 10, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_barcode BEFORE INSERT ON inventory FOR EACH ROW EXECUTE FUNCTION generate_barcode();

-- =========================================
-- SEED DATA
-- =========================================

-- Insert default roles
INSERT INTO roles (name, description, permissions) VALUES
('Admin', 'Full system access', '{"all": true}'::jsonb),
('Owner', 'Garage owner with full access', '{"all": true}'::jsonb),
('Manager', 'Manager with access to jobs, inventory, and reports', '{"jobs": true, "inventory": true, "reports": true, "employees": true}'::jsonb),
('Mechanic', 'Mechanic with access to assigned jobs only', '{"jobs": "assigned_only"}'::jsonb);

-- Insert default admin user (password: admin123)
-- Note: In production, use proper password hashing
INSERT INTO users (username, email, password_hash, role_id) VALUES
('admin', 'admin@garage.com', '$2b$10$rKvqZJhQXm5jvP8Y7qG7yOqK7iB5kqVR8jGKqP3JqK7kQP8qG7yOq', 1);

-- Insert sample manufacturers
INSERT INTO manufacturers (name, country) VALUES
('Honda', 'Japan'),
('Yamaha', 'Japan'),
('Hero', 'India'),
('Bajaj', 'India'),
('TVS', 'India'),
('Maruti Suzuki', 'India'),
('Hyundai', 'South Korea'),
('Tata Motors', 'India'),
('Mahindra', 'India'),
('Toyota', 'Japan'),
('Castrol', 'UK'),
('Mobil', 'USA'),
('Shell', 'Netherlands'),
('Bosch', 'Germany'),
('MRF', 'India'),
('CEAT', 'India'),
('Michelin', 'France');

-- Insert sample categories
INSERT INTO categories (name, description, parent_id) VALUES
('Engine Oil', 'Engine lubricants and oils', NULL),
('Brake Parts', 'Brake pads, discs, and fluids', NULL),
('Tyres', 'Vehicle tyres and tubes', NULL),
('Batteries', 'Vehicle batteries', NULL),
('Filters', 'Oil, air, and fuel filters', NULL),
('Spark Plugs', 'Spark plugs and ignition parts', NULL),
('Chains & Sprockets', 'Chain and sprocket sets', NULL),
('Clutch Parts', 'Clutch plates and assemblies', NULL),
('Lights & Electricals', 'Headlights, indicators, bulbs', NULL),
('Body Parts', 'Panels, mirrors, handles', NULL),
('Suspension', 'Shock absorbers and suspension parts', NULL),
('Coolants & Fluids', 'Coolants, brake fluids, etc.', NULL);

-- Insert sample product master data
INSERT INTO product_master (manufacturer_id, category_id, name, part_number, description) VALUES
(11, 1, 'Castrol ACTIV 4T 20W-40', 'ACTIV-20W40-1L', '1 Liter engine oil for 4-stroke motorcycles'),
(11, 1, 'Castrol POWER1 4T 10W-40', 'POWER1-10W40-1L', '1 Liter synthetic engine oil'),
(12, 1, 'Mobil Super Moto 4T 10W-30', 'MOTO-10W30-1L', '1 Liter motorcycle engine oil'),
(14, 2, 'Bosch Brake Pad Set - Front', 'BP-FRONT-001', 'Front brake pad set for cars'),
(14, 2, 'Bosch Brake Disc', 'BD-001', 'Brake disc rotor'),
(15, 3, 'MRF ZVTV 100/90-17', 'ZVTV-100-90-17', 'Tubeless tyre for motorcycles'),
(16, 3, 'CEAT Secura Zoom 90/100-10', 'SECURA-90-100-10', 'Scooter tyre'),
(14, 4, 'Bosch Car Battery 12V 45Ah', 'BAT-12V-45AH', 'Maintenance-free car battery'),
(14, 5, 'Bosch Oil Filter', 'OF-001', 'Engine oil filter'),
(14, 5, 'Bosch Air Filter', 'AF-001', 'Engine air filter'),
(14, 6, 'Bosch Spark Plug Set', 'SP-001', 'Set of 4 spark plugs');

-- Insert sample inventory (linked to product master)
INSERT INTO inventory (product_master_id, brand, current_quantity, minimum_stock_level, unit_price, selling_price, storage_location, supplier_name) VALUES
(1, 'Castrol', 50, 20, 300.00, 400.00, 'Shelf A1', 'ABC Auto Parts'),
(2, 'Castrol', 30, 15, 450.00, 600.00, 'Shelf A1', 'ABC Auto Parts'),
(3, 'Mobil', 25, 15, 350.00, 480.00, 'Shelf A2', 'XYZ Suppliers'),
(4, 'Bosch', 20, 10, 800.00, 1100.00, 'Shelf B1', 'Auto Parts India'),
(5, 'Bosch', 10, 8, 1500.00, 2000.00, 'Shelf B1', 'Auto Parts India'),
(6, 'MRF', 15, 8, 1800.00, 2500.00, 'Shelf C1', 'Tyre World'),
(7, 'CEAT', 12, 6, 1200.00, 1600.00, 'Shelf C1', 'Tyre World'),
(8, 'Bosch', 8, 5, 3500.00, 4500.00, 'Shelf D1', 'Battery Depot'),
(9, 'Bosch', 40, 20, 150.00, 250.00, 'Shelf E1', 'Filter House'),
(10, 'Bosch', 35, 20, 200.00, 300.00, 'Shelf E1', 'Filter House'),
(11, 'Bosch', 25, 15, 180.00, 280.00, 'Shelf E2', 'Spark Solutions');

-- Success message
SELECT 'Database schema created successfully!' AS status;
