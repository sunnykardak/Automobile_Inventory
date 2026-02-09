-- Create service tokens table for quick services like washing, chain cleaning, etc.
CREATE TABLE IF NOT EXISTS service_tokens (
    id SERIAL PRIMARY KEY,
    token_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    bike_number VARCHAR(50),
    service_type VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    completed_at TIMESTAMP,
    notes TEXT
);

-- Create sequence for token numbers
CREATE SEQUENCE IF NOT EXISTS service_token_seq START 1;

-- Create trigger function to auto-generate token number
CREATE OR REPLACE FUNCTION generate_token_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.token_number := 'TOK-' || LPAD(nextval('service_token_seq')::TEXT, 5, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS set_token_number ON service_tokens;
CREATE TRIGGER set_token_number
    BEFORE INSERT ON service_tokens
    FOR EACH ROW
    WHEN (NEW.token_number IS NULL OR NEW.token_number = '')
    EXECUTE FUNCTION generate_token_number();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_service_tokens_status ON service_tokens(status);
CREATE INDEX IF NOT EXISTS idx_service_tokens_created_at ON service_tokens(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_tokens_token_number ON service_tokens(token_number);

-- Insert sample service types (optional)
COMMENT ON TABLE service_tokens IS 'Stores quick service tokens for washing, chain cleaning, lubing, etc.';
