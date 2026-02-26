-- =========================================
-- DIGITAL PAYMENT INTEGRATION SYSTEM
-- =========================================
-- This schema adds comprehensive digital payment tracking and integration
-- Supports: UPI, Cards, Wallets, Net Banking, Cash, Cheque

-- =========================================
-- 1. PAYMENT METHODS CONFIGURATION
-- =========================================
-- Stores available payment methods and their configuration
CREATE TABLE IF NOT EXISTS payment_methods (
    id SERIAL PRIMARY KEY,
    method_code VARCHAR(50) UNIQUE NOT NULL,
    method_name VARCHAR(100) NOT NULL,
    method_type VARCHAR(50) NOT NULL CHECK (method_type IN ('CASH', 'UPI', 'CARD', 'WALLET', 'NET_BANKING', 'CHEQUE', 'OTHER')),
    is_digital BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    gateway_name VARCHAR(100), -- e.g., 'Razorpay', 'Paytm', 'PhonePe'
    gateway_config JSONB, -- Store API keys, merchant IDs, etc.
    transaction_fee_percentage DECIMAL(5,2) DEFAULT 0.00,
    transaction_fee_fixed DECIMAL(10,2) DEFAULT 0.00,
    icon_url VARCHAR(255),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- 2. PAYMENT TRANSACTIONS TABLE
-- =========================================
-- Records all payment transactions with complete details
CREATE TABLE IF NOT EXISTS payment_transactions (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(100) UNIQUE NOT NULL, -- Internal transaction ID
    bill_id INTEGER REFERENCES bills(id) ON DELETE SET NULL,
    job_card_id INTEGER REFERENCES job_cards(id) ON DELETE SET NULL,
    
    -- Transaction Details
    transaction_type VARCHAR(50) NOT NULL DEFAULT 'BILL_PAYMENT' 
        CHECK (transaction_type IN ('BILL_PAYMENT', 'ADVANCE_PAYMENT', 'REFUND', 'DEPOSIT', 'OTHER')),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    
    -- Payment Method
    payment_method_id INTEGER REFERENCES payment_methods(id),
    payment_mode VARCHAR(50) NOT NULL CHECK (payment_mode IN ('CASH', 'UPI', 'CARD', 'WALLET', 'NET_BANKING', 'CHEQUE', 'OTHER')),
    
    -- Gateway Information (for digital payments)
    gateway_name VARCHAR(100), -- Razorpay, Stripe, Paytm, PhonePe, etc.
    gateway_transaction_id VARCHAR(255), -- Gateway's transaction reference
    gateway_order_id VARCHAR(255), -- Gateway's order ID
    gateway_payment_id VARCHAR(255), -- Gateway's payment ID
    gateway_response JSONB, -- Complete gateway response
    
    -- UPI Specific
    upi_id VARCHAR(100), -- Customer's UPI ID
    upi_transaction_ref VARCHAR(255), -- UPI transaction reference number
    
    -- Card Specific
    card_last4 VARCHAR(4), -- Last 4 digits of card
    card_brand VARCHAR(50), -- Visa, Mastercard, RuPay, etc.
    card_type VARCHAR(50), -- Credit, Debit
    
    -- Cheque Specific
    cheque_number VARCHAR(50),
    cheque_date DATE,
    bank_name VARCHAR(100),
    cheque_status VARCHAR(50) CHECK (cheque_status IN ('PENDING', 'CLEARED', 'BOUNCED', 'CANCELLED')),
    
    -- Wallet Specific
    wallet_name VARCHAR(100), -- Paytm, PhonePe, Google Pay, etc.
    wallet_transaction_id VARCHAR(255),
    
    -- Transaction Status
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' 
        CHECK (status IN ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REFUNDED', 'CANCELLED')),
    failure_reason TEXT,
    
    -- Fees and Charges
    transaction_fee DECIMAL(10,2) DEFAULT 0.00,
    net_amount DECIMAL(10,2), -- Amount after deducting fees
    
    -- Customer Information
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    
    -- Reconciliation
    is_reconciled BOOLEAN DEFAULT false,
    reconciled_at TIMESTAMP,
    reconciled_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reconciliation_notes TEXT,
    
    -- Settlement
    settlement_status VARCHAR(50) DEFAULT 'PENDING' 
        CHECK (settlement_status IN ('PENDING', 'SETTLED', 'FAILED')),
    settlement_date DATE,
    settlement_amount DECIMAL(10,2),
    settlement_reference VARCHAR(255),
    
    -- Refund Information
    is_refundable BOOLEAN DEFAULT true,
    refund_initiated_at TIMESTAMP,
    refund_processed_at TIMESTAMP,
    refund_amount DECIMAL(10,2),
    refund_reference VARCHAR(255),
    refund_reason TEXT,
    
    -- Metadata
    payment_link_id VARCHAR(255), -- If payment was made via payment link
    ip_address VARCHAR(50),
    device_info JSONB,
    notes TEXT,
    
    -- Audit
    processed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- 3. PAYMENT LINKS TABLE
-- =========================================
-- Generate and track payment links sent to customers
CREATE TABLE IF NOT EXISTS payment_links (
    id SERIAL PRIMARY KEY,
    link_id VARCHAR(100) UNIQUE NOT NULL,
    bill_id INTEGER REFERENCES bills(id) ON DELETE CASCADE,
    job_card_id INTEGER REFERENCES job_cards(id) ON DELETE CASCADE,
    
    -- Link Details
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    description TEXT,
    
    -- Customer Details
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    
    -- Link Configuration
    link_url VARCHAR(500) NOT NULL,
    short_url VARCHAR(255),
    gateway_link_id VARCHAR(255), -- Payment gateway's link ID
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' 
        CHECK (status IN ('ACTIVE', 'PAID', 'EXPIRED', 'CANCELLED')),
    
    -- Validity
    expires_at TIMESTAMP,
    
    -- Payment Information
    paid_at TIMESTAMP,
    payment_transaction_id INTEGER REFERENCES payment_transactions(id) ON DELETE SET NULL,
    
    -- Sending Information
    sent_via VARCHAR(50), -- 'SMS', 'EMAIL', 'WHATSAPP', 'MANUAL'
    sent_at TIMESTAMP,
    send_count INTEGER DEFAULT 0,
    last_sent_at TIMESTAMP,
    
    -- Tracking
    view_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMP,
    
    -- Audit
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- 4. PAYMENT RECONCILIATION TABLE
-- =========================================
-- Track reconciliation of payments with bank statements
CREATE TABLE IF NOT EXISTS payment_reconciliation (
    id SERIAL PRIMARY KEY,
    reconciliation_date DATE NOT NULL,
    payment_mode VARCHAR(50) NOT NULL,
    
    -- Bank Statement Details
    bank_statement_date DATE,
    bank_reference VARCHAR(255),
    bank_amount DECIMAL(10,2),
    
    -- System Details
    transaction_id INTEGER REFERENCES payment_transactions(id) ON DELETE SET NULL,
    system_amount DECIMAL(10,2),
    
    -- Reconciliation Status
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' 
        CHECK (status IN ('PENDING', 'MATCHED', 'UNMATCHED', 'DISPUTED', 'RESOLVED')),
    difference_amount DECIMAL(10,2) DEFAULT 0.00,
    
    -- Resolution
    resolution_notes TEXT,
    resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP,
    
    -- Audit
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- 5. PAYMENT REMINDERS TABLE
-- =========================================
-- Track payment reminders sent to customers
CREATE TABLE IF NOT EXISTS payment_reminders (
    id SERIAL PRIMARY KEY,
    bill_id INTEGER REFERENCES bills(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    
    pending_amount DECIMAL(10,2) NOT NULL,
    due_date DATE,
    
    -- Reminder Details
    reminder_type VARCHAR(50) NOT NULL CHECK (reminder_type IN ('SMS', 'EMAIL', 'WHATSAPP', 'CALL')),
    reminder_count INTEGER DEFAULT 0,
    last_reminder_date TIMESTAMP,
    
    -- Status
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAID', 'FOLLOWUP_REQUIRED', 'WRITTEN_OFF')),
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- INDEXES FOR PERFORMANCE
-- =========================================

-- Payment Methods indexes
CREATE INDEX IF NOT EXISTS idx_payment_methods_type ON payment_methods(method_type);
CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON payment_methods(is_active);

-- Payment Transactions indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_bill ON payment_transactions(bill_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_job_card ON payment_transactions(job_card_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_mode ON payment_transactions(payment_mode);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_date ON payment_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_gateway_id ON payment_transactions(gateway_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_reconciled ON payment_transactions(is_reconciled);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_settlement ON payment_transactions(settlement_status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_customer_phone ON payment_transactions(customer_phone);

-- Payment Links indexes
CREATE INDEX IF NOT EXISTS idx_payment_links_bill ON payment_links(bill_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_status ON payment_links(status);
CREATE INDEX IF NOT EXISTS idx_payment_links_customer_phone ON payment_links(customer_phone);
CREATE INDEX IF NOT EXISTS idx_payment_links_expires ON payment_links(expires_at);

-- Payment Reconciliation indexes
CREATE INDEX IF NOT EXISTS idx_payment_reconciliation_date ON payment_reconciliation(reconciliation_date);
CREATE INDEX IF NOT EXISTS idx_payment_reconciliation_status ON payment_reconciliation(status);
CREATE INDEX IF NOT EXISTS idx_payment_reconciliation_transaction ON payment_reconciliation(transaction_id);

-- Payment Reminders indexes
CREATE INDEX IF NOT EXISTS idx_payment_reminders_bill ON payment_reminders(bill_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_status ON payment_reminders(status);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_phone ON payment_reminders(customer_phone);

-- =========================================
-- VIEWS FOR ANALYTICS
-- =========================================

-- View: Daily Payment Summary
CREATE OR REPLACE VIEW vw_daily_payment_summary AS
SELECT 
    DATE(pt.created_at) as payment_date,
    pt.payment_mode,
    COUNT(*) as transaction_count,
    SUM(pt.amount) as total_amount,
    SUM(CASE WHEN pt.status = 'SUCCESS' THEN pt.amount ELSE 0 END) as successful_amount,
    SUM(CASE WHEN pt.status = 'FAILED' THEN pt.amount ELSE 0 END) as failed_amount,
    SUM(pt.transaction_fee) as total_fees,
    SUM(pt.net_amount) as net_amount
FROM payment_transactions pt
GROUP BY DATE(pt.created_at), pt.payment_mode
ORDER BY payment_date DESC, payment_mode;

-- View: Payment Method Performance
CREATE OR REPLACE VIEW vw_payment_method_performance AS
SELECT 
    pt.payment_mode,
    pm.method_name,
    COUNT(*) as transaction_count,
    SUM(pt.amount) as total_amount,
    AVG(pt.amount) as average_amount,
    SUM(CASE WHEN pt.status = 'SUCCESS' THEN 1 ELSE 0 END) as successful_count,
    SUM(CASE WHEN pt.status = 'FAILED' THEN 1 ELSE 0 END) as failed_count,
    ROUND(SUM(CASE WHEN pt.status = 'SUCCESS' THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)::NUMERIC * 100, 2) as success_rate,
    SUM(pt.transaction_fee) as total_fees
FROM payment_transactions pt
LEFT JOIN payment_methods pm ON pt.payment_method_id = pm.id
WHERE pt.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY pt.payment_mode, pm.method_name
ORDER BY total_amount DESC;

-- View: Pending Payments Dashboard
CREATE OR REPLACE VIEW vw_pending_payments AS
SELECT 
    b.id as bill_id,
    b.bill_number,
    b.job_card_id,
    b.customer_name,
    b.customer_phone,
    b.total_amount,
    b.paid_amount,
    (b.total_amount - b.paid_amount) as pending_amount,
    b.payment_status,
    b.created_at as bill_date,
    COALESCE(
        (SELECT SUM(amount) FROM payment_transactions pt 
         WHERE pt.bill_id = b.id AND pt.status = 'SUCCESS'),
        0
    ) as total_paid_via_transactions,
    EXTRACT(DAY FROM CURRENT_TIMESTAMP - b.created_at) as days_pending
FROM bills b
WHERE b.payment_status IN ('Pending', 'Partial')
ORDER BY b.created_at DESC;

-- View: Payment Reconciliation Dashboard
CREATE OR REPLACE VIEW vw_reconciliation_dashboard AS
SELECT 
    DATE(pt.created_at) as transaction_date,
    pt.payment_mode,
    COUNT(*) as total_transactions,
    SUM(pt.amount) as total_amount,
    SUM(CASE WHEN pt.is_reconciled THEN 1 ELSE 0 END) as reconciled_count,
    SUM(CASE WHEN pt.is_reconciled THEN pt.amount ELSE 0 END) as reconciled_amount,
    SUM(CASE WHEN NOT pt.is_reconciled THEN 1 ELSE 0 END) as unreconciled_count,
    SUM(CASE WHEN NOT pt.is_reconciled THEN pt.amount ELSE 0 END) as unreconciled_amount
FROM payment_transactions pt
WHERE pt.status = 'SUCCESS'
    AND pt.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(pt.created_at), pt.payment_mode
ORDER BY transaction_date DESC;

-- =========================================
-- FUNCTIONS
-- =========================================

-- Function: Generate unique transaction ID
CREATE OR REPLACE FUNCTION generate_transaction_id()
RETURNS VARCHAR(100) AS $$
DECLARE
    new_id VARCHAR(100);
    id_exists BOOLEAN;
BEGIN
    LOOP
        new_id := 'TXN' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || LPAD(floor(random() * 999999)::TEXT, 6, '0');
        
        SELECT EXISTS(SELECT 1 FROM payment_transactions WHERE transaction_id = new_id) INTO id_exists;
        
        EXIT WHEN NOT id_exists;
    END LOOP;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Generate payment link ID
CREATE OR REPLACE FUNCTION generate_payment_link_id()
RETURNS VARCHAR(100) AS $$
DECLARE
    new_id VARCHAR(100);
    id_exists BOOLEAN;
BEGIN
    LOOP
        new_id := 'LINK' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || LPAD(floor(random() * 999999)::TEXT, 6, '0');
        
        SELECT EXISTS(SELECT 1 FROM payment_links WHERE link_id = new_id) INTO id_exists;
        
        EXIT WHEN NOT id_exists;
    END LOOP;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Update bill payment status based on transactions
CREATE OR REPLACE FUNCTION update_bill_payment_status()
RETURNS TRIGGER AS $$
DECLARE
    v_total_paid DECIMAL(10,2);
    v_bill_amount DECIMAL(10,2);
    v_new_status VARCHAR(50);
BEGIN
    -- Only process for successful transactions
    IF NEW.status = 'SUCCESS' AND NEW.bill_id IS NOT NULL THEN
        -- Calculate total paid amount for this bill
        SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
        FROM payment_transactions
        WHERE bill_id = NEW.bill_id AND status = 'SUCCESS';
        
        -- Get bill total amount
        SELECT total_amount INTO v_bill_amount
        FROM bills
        WHERE id = NEW.bill_id;
        
        -- Determine payment status
        IF v_total_paid >= v_bill_amount THEN
            v_new_status := 'Paid';
        ELSIF v_total_paid > 0 THEN
            v_new_status := 'Partial';
        ELSE
            v_new_status := 'Pending';
        END IF;
        
        -- Update bill
        UPDATE bills
        SET 
            paid_amount = v_total_paid,
            payment_status = v_new_status,
            payment_method = CASE 
                WHEN v_new_status = 'Paid' THEN NEW.payment_mode 
                ELSE payment_method 
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.bill_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update bill payment status
DROP TRIGGER IF EXISTS trg_update_bill_payment_status ON payment_transactions;
CREATE TRIGGER trg_update_bill_payment_status
    AFTER INSERT OR UPDATE ON payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_bill_payment_status();

-- =========================================
-- INSERT DEFAULT PAYMENT METHODS
-- =========================================

INSERT INTO payment_methods (method_code, method_name, method_type, is_digital, transaction_fee_percentage, display_order) VALUES
('CASH', 'Cash', 'CASH', false, 0.00, 1),
('UPI_GPAY', 'Google Pay', 'UPI', true, 0.00, 2),
('UPI_PHONEPE', 'PhonePe', 'UPI', true, 0.00, 3),
('UPI_PAYTM', 'Paytm', 'UPI', true, 0.00, 4),
('UPI_OTHER', 'Other UPI', 'UPI', true, 0.00, 5),
('CARD_DEBIT', 'Debit Card', 'CARD', true, 1.00, 6),
('CARD_CREDIT', 'Credit Card', 'CARD', true, 2.00, 7),
('NET_BANKING', 'Net Banking', 'NET_BANKING', true, 0.50, 8),
('WALLET_PAYTM', 'Paytm Wallet', 'WALLET', true, 1.00, 9),
('WALLET_PHONEPE', 'PhonePe Wallet', 'WALLET', true, 1.00, 10),
('CHEQUE', 'Cheque', 'CHEQUE', false, 0.00, 11)
ON CONFLICT (method_code) DO NOTHING;

-- =========================================
-- NOTIFICATIONS
-- =========================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'DIGITAL PAYMENT INTEGRATION - SCHEMA CREATED';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables Created:';
    RAISE NOTICE '  • payment_methods - Available payment methods';
    RAISE NOTICE '  • payment_transactions - All payment records';
    RAISE NOTICE '  • payment_links - Customer payment links';
    RAISE NOTICE '  • payment_reconciliation - Bank reconciliation';
    RAISE NOTICE '  • payment_reminders - Payment follow-ups';
    RAISE NOTICE '';
    RAISE NOTICE 'Views Created:';
    RAISE NOTICE '  • vw_daily_payment_summary';
    RAISE NOTICE '  • vw_payment_method_performance';
    RAISE NOTICE '  • vw_pending_payments';
    RAISE NOTICE '  • vw_reconciliation_dashboard';
    RAISE NOTICE '';
    RAISE NOTICE 'Functions Created:';
    RAISE NOTICE '  • generate_transaction_id()';
    RAISE NOTICE '  • generate_payment_link_id()';
    RAISE NOTICE '  • update_bill_payment_status()';
    RAISE NOTICE '';
    RAISE NOTICE 'Default Payment Methods: 11 added';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  1. Configure payment gateway credentials';
    RAISE NOTICE '  2. Set up backend payment APIs';
    RAISE NOTICE '  3. Create payment processing UI';
    RAISE NOTICE '==============================================';
END $$;
