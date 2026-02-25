-- =========================================
-- TAX & GST MANAGEMENT SYSTEM
-- =========================================
-- This script adds comprehensive tax and GST management functionality
-- including GST rate configuration, tax calculations, and reporting

-- =========================================
-- 1. GST RATES CONFIGURATION TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS gst_rates (
    id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    gst_percentage DECIMAL(5,2) NOT NULL,
    cgst_percentage DECIMAL(5,2) NOT NULL,
    sgst_percentage DECIMAL(5,2) NOT NULL,
    igst_percentage DECIMAL(5,2) NOT NULL,
    cess_percentage DECIMAL(5,2) DEFAULT 0.00,
    hsn_code VARCHAR(20),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_category_name UNIQUE(category_name)
);

-- =========================================
-- 2. TAX CONFIGURATION TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS tax_configuration (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    description TEXT,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- 3. ALTER BILLS TABLE FOR GST BREAKDOWN
-- =========================================
-- Add GST breakdown columns to bills table if they don't exist
DO $$ 
BEGIN
    -- Add CGST column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bills' AND column_name='cgst_amount') THEN
        ALTER TABLE bills ADD COLUMN cgst_amount DECIMAL(10,2) DEFAULT 0.00;
    END IF;
    
    -- Add SGST column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bills' AND column_name='sgst_amount') THEN
        ALTER TABLE bills ADD COLUMN sgst_amount DECIMAL(10,2) DEFAULT 0.00;
    END IF;
    
    -- Add IGST column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bills' AND column_name='igst_amount') THEN
        ALTER TABLE bills ADD COLUMN igst_amount DECIMAL(10,2) DEFAULT 0.00;
    END IF;
    
    -- Add CESS column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bills' AND column_name='cess_amount') THEN
        ALTER TABLE bills ADD COLUMN cess_amount DECIMAL(10,2) DEFAULT 0.00;
    END IF;
    
    -- Add tax type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bills' AND column_name='tax_type') THEN
        ALTER TABLE bills ADD COLUMN tax_type VARCHAR(20) DEFAULT 'CGST_SGST' 
            CHECK (tax_type IN ('CGST_SGST', 'IGST', 'EXEMPT'));
    END IF;
    
    -- Add GST rate column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bills' AND column_name='gst_rate') THEN
        ALTER TABLE bills ADD COLUMN gst_rate DECIMAL(5,2) DEFAULT 18.00;
    END IF;
    
    -- Add place of supply column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bills' AND column_name='place_of_supply') THEN
        ALTER TABLE bills ADD COLUMN place_of_supply VARCHAR(100);
    END IF;
END $$;

-- =========================================
-- 4. ALTER BILL_ITEMS TABLE FOR HSN/SAC
-- =========================================
DO $$ 
BEGIN
    -- Add HSN/SAC code column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bill_items' AND column_name='hsn_sac_code') THEN
        ALTER TABLE bill_items ADD COLUMN hsn_sac_code VARCHAR(20);
    END IF;
    
    -- Add GST rate column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bill_items' AND column_name='gst_rate') THEN
        ALTER TABLE bill_items ADD COLUMN gst_rate DECIMAL(5,2) DEFAULT 18.00;
    END IF;
    
    -- Add taxable amount column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bill_items' AND column_name='taxable_amount') THEN
        ALTER TABLE bill_items ADD COLUMN taxable_amount DECIMAL(10,2);
    END IF;
    
    -- Add tax amount column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bill_items' AND column_name='tax_amount') THEN
        ALTER TABLE bill_items ADD COLUMN tax_amount DECIMAL(10,2);
    END IF;
END $$;

-- =========================================
-- 5. ALTER INVENTORY TABLE FOR HSN
-- =========================================
DO $$ 
BEGIN
    -- Add HSN code column to inventory
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='inventory' AND column_name='hsn_code') THEN
        ALTER TABLE inventory ADD COLUMN hsn_code VARCHAR(20);
    END IF;
    
    -- Add GST rate column to inventory
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='inventory' AND column_name='gst_rate') THEN
        ALTER TABLE inventory ADD COLUMN gst_rate DECIMAL(5,2) DEFAULT 18.00;
    END IF;
    
    -- Add tax category column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='inventory' AND column_name='tax_category') THEN
        ALTER TABLE inventory ADD COLUMN tax_category VARCHAR(100);
    END IF;
END $$;

-- =========================================
-- 6. INSERT DEFAULT GST RATES
-- =========================================
INSERT INTO gst_rates (category_name, gst_percentage, cgst_percentage, sgst_percentage, igst_percentage, hsn_code, description)
VALUES 
    ('Automobile Parts - 28%', 28.00, 14.00, 14.00, 28.00, '8708', 'Parts and accessories of motor vehicles'),
    ('Automobile Parts - 18%', 18.00, 9.00, 9.00, 18.00, '8708', 'Certain automobile parts'),
    ('Motor Spirit (Petrol)', 28.00, 14.00, 14.00, 28.00, '2710', 'Petroleum products'),
    ('Lubricating Oils', 28.00, 14.00, 14.00, 28.00, '2710', 'Lubricating oils and greases'),
    ('Service - General', 18.00, 9.00, 9.00, 18.00, '9987', 'Motor vehicle maintenance and repair services'),
    ('Service - Labor', 18.00, 9.00, 9.00, 18.00, '9987', 'Labor charges for repairs'),
    ('Battery', 28.00, 14.00, 14.00, 28.00, '8507', 'Electric accumulators'),
    ('Tyres and Tubes', 28.00, 14.00, 14.00, 28.00, '4011', 'Rubber tyres'),
    ('Engine Oil', 28.00, 14.00, 14.00, 28.00, '2710', 'Motor vehicle engine oils'),
    ('Air Filter', 28.00, 14.00, 14.00, 28.00, '8421', 'Filtering or purifying machinery')
ON CONFLICT (category_name) DO NOTHING;

-- =========================================
-- 7. INSERT DEFAULT TAX CONFIGURATION
-- =========================================
INSERT INTO tax_configuration (config_key, config_value, description)
VALUES 
    ('business_gstin', '', 'Business GSTIN number'),
    ('business_state', '', 'State of business registration'),
    ('business_state_code', '', 'State code for GST'),
    ('default_tax_type', 'CGST_SGST', 'Default tax type (CGST_SGST or IGST)'),
    ('default_gst_rate', '18.00', 'Default GST percentage'),
    ('enable_reverse_charge', 'false', 'Enable reverse charge mechanism'),
    ('composition_scheme', 'false', 'Whether business is under composition scheme'),
    ('gst_filing_frequency', 'MONTHLY', 'GST filing frequency (MONTHLY/QUARTERLY)'),
    ('financial_year_start', '04', 'Financial year start month (04 for April)')
ON CONFLICT (config_key) DO NOTHING;

-- =========================================
-- 8. CREATE GST SALES VIEW (GSTR-1 Format)
-- =========================================
CREATE OR REPLACE VIEW vw_gst_sales_register AS
SELECT 
    b.id,
    b.bill_number,
    b.created_at::date as invoice_date,
    c.name as customer_name,
    c.gst_number as customer_gstin,
    c.state as customer_state,
    b.place_of_supply,
    b.subtotal as taxable_value,
    b.gst_rate,
    b.tax_type,
    b.cgst_amount,
    b.sgst_amount,
    b.igst_amount,
    b.cess_amount,
    b.total_amount as invoice_value,
    b.payment_status,
    CASE 
        WHEN c.gst_number IS NOT NULL AND c.gst_number != '' THEN 'B2B'
        WHEN b.total_amount >= 250000 THEN 'B2CL'
        ELSE 'B2CS'
    END as transaction_type
FROM bills b
LEFT JOIN customers c ON b.customer_name = c.name
WHERE b.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '12 months')
ORDER BY b.created_at DESC;

-- =========================================
-- 9. CREATE GST MONTHLY SUMMARY VIEW
-- =========================================
CREATE OR REPLACE VIEW vw_gst_monthly_summary AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    TO_CHAR(created_at, 'Month YYYY') as month_name,
    COUNT(*) as total_invoices,
    SUM(subtotal) as total_taxable_value,
    SUM(cgst_amount) as total_cgst,
    SUM(sgst_amount) as total_sgst,
    SUM(igst_amount) as total_igst,
    SUM(cess_amount) as total_cess,
    SUM(tax_amount) as total_tax,
    SUM(total_amount) as total_invoice_value,
    SUM(CASE WHEN payment_status = 'Paid' THEN total_amount ELSE 0 END) as paid_amount,
    SUM(CASE WHEN payment_status = 'Pending' THEN total_amount ELSE 0 END) as pending_amount
FROM bills
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '24 months')
GROUP BY DATE_TRUNC('month', created_at), TO_CHAR(created_at, 'Month YYYY')
ORDER BY month DESC;

-- =========================================
-- 10. CREATE HSN-WISE SUMMARY VIEW
-- =========================================
CREATE OR REPLACE VIEW vw_hsn_wise_summary AS
SELECT 
    bi.hsn_sac_code,
    gr.description as hsn_description,
    bi.gst_rate,
    COUNT(DISTINCT bi.bill_id) as no_of_invoices,
    SUM(bi.quantity) as total_quantity,
    SUM(bi.taxable_amount) as total_taxable_value,
    SUM(bi.tax_amount) as total_tax_amount,
    DATE_TRUNC('month', b.created_at) as month
FROM bill_items bi
JOIN bills b ON bi.bill_id = b.id
LEFT JOIN gst_rates gr ON bi.hsn_sac_code = gr.hsn_code
WHERE b.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '12 months')
GROUP BY bi.hsn_sac_code, gr.description, bi.gst_rate, DATE_TRUNC('month', b.created_at)
ORDER BY month DESC, total_taxable_value DESC;

-- =========================================
-- 11. CREATE GST LIABILITY VIEW
-- =========================================
CREATE OR REPLACE VIEW vw_gst_liability AS
WITH monthly_data AS (
    SELECT 
        DATE_TRUNC('month', created_at) as month,
        SUM(cgst_amount) as cgst_liability,
        SUM(sgst_amount) as sgst_liability,
        SUM(igst_amount) as igst_liability,
        SUM(cess_amount) as cess_liability,
        SUM(tax_amount) as total_tax_liability
    FROM bills
    GROUP BY DATE_TRUNC('month', created_at)
)
SELECT 
    month,
    TO_CHAR(month, 'Month YYYY') as month_name,
    cgst_liability,
    sgst_liability,
    igst_liability,
    cess_liability,
    total_tax_liability,
    0.00 as cgst_paid,  -- To be updated with payment records
    0.00 as sgst_paid,
    0.00 as igst_paid,
    (cgst_liability + sgst_liability + igst_liability + cess_liability - 0.00) as balance_payable
FROM monthly_data
WHERE month >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '24 months')
ORDER BY month DESC;

-- =========================================
-- 12. CREATE FUNCTION TO CALCULATE GST
-- =========================================
CREATE OR REPLACE FUNCTION calculate_gst_breakdown(
    p_subtotal DECIMAL,
    p_gst_rate DECIMAL,
    p_tax_type VARCHAR DEFAULT 'CGST_SGST'
)
RETURNS TABLE (
    cgst_amount DECIMAL,
    sgst_amount DECIMAL,
    igst_amount DECIMAL,
    total_tax DECIMAL,
    total_amount DECIMAL
) AS $$
DECLARE
    v_tax_amount DECIMAL;
BEGIN
    v_tax_amount := ROUND(p_subtotal * (p_gst_rate / 100), 2);
    
    IF p_tax_type = 'IGST' THEN
        RETURN QUERY SELECT 
            0.00::DECIMAL as cgst_amount,
            0.00::DECIMAL as sgst_amount,
            v_tax_amount as igst_amount,
            v_tax_amount as total_tax,
            (p_subtotal + v_tax_amount) as total_amount;
    ELSE
        -- CGST_SGST (split equally)
        RETURN QUERY SELECT 
            ROUND(v_tax_amount / 2, 2) as cgst_amount,
            ROUND(v_tax_amount / 2, 2) as sgst_amount,
            0.00::DECIMAL as igst_amount,
            v_tax_amount as total_tax,
            (p_subtotal + v_tax_amount) as total_amount;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- 13. CREATE INDEXES FOR PERFORMANCE
-- =========================================
CREATE INDEX IF NOT EXISTS idx_bills_created_month ON bills(DATE_TRUNC('month', created_at));
CREATE INDEX IF NOT EXISTS idx_bills_gst_rate ON bills(gst_rate);
CREATE INDEX IF NOT EXISTS idx_bills_tax_type ON bills(tax_type);
CREATE INDEX IF NOT EXISTS idx_bill_items_hsn_code ON bill_items(hsn_sac_code);
CREATE INDEX IF NOT EXISTS idx_inventory_hsn_code ON inventory(hsn_code);
CREATE INDEX IF NOT EXISTS idx_gst_rates_category ON gst_rates(category_name) WHERE is_active = true;

-- =========================================
-- 14. CREATE TRIGGER TO UPDATE TIMESTAMPS
-- =========================================
CREATE OR REPLACE FUNCTION update_tax_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_gst_rates_timestamp
    BEFORE UPDATE ON gst_rates
    FOR EACH ROW
    EXECUTE FUNCTION update_tax_config_timestamp();

CREATE TRIGGER trigger_update_tax_config_timestamp
    BEFORE UPDATE ON tax_configuration
    FOR EACH ROW
    EXECUTE FUNCTION update_tax_config_timestamp();

-- =========================================
-- GRANT PERMISSIONS (if needed)
-- =========================================
-- GRANT ALL ON gst_rates TO your_app_user;
-- GRANT ALL ON tax_configuration TO your_app_user;

-- =========================================
-- VERIFICATION QUERIES
-- =========================================
-- SELECT * FROM gst_rates ORDER BY gst_percentage DESC;
-- SELECT * FROM tax_configuration;
-- SELECT * FROM vw_gst_monthly_summary LIMIT 12;
-- SELECT * FROM vw_gst_sales_register LIMIT 10;
-- SELECT * FROM calculate_gst_breakdown(10000, 18, 'CGST_SGST');

COMMIT;
