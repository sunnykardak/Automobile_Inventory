-- =========================================
-- ADD VEHICLE MODELS TABLE AND FIX DATA
-- =========================================

-- 1. Create vehicle_models table
CREATE TABLE IF NOT EXISTS vehicle_models (
    id SERIAL PRIMARY KEY,
    manufacturer_id INTEGER NOT NULL REFERENCES manufacturers(id) ON DELETE CASCADE,
    model_name VARCHAR(100) NOT NULL,
    model_year_start INTEGER,
    model_year_end INTEGER,
    vehicle_type VARCHAR(50) CHECK (vehicle_type IN ('Motorcycle', 'Scooter', 'Electric', 'Moped')),
    engine_capacity VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(manufacturer_id, model_name)
);

-- 2. Add model_id to product_master (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_master' AND column_name = 'model_id'
    ) THEN
        ALTER TABLE product_master 
        ADD COLUMN model_id INTEGER REFERENCES vehicle_models(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Insert popular bike models for each manufacturer

-- Honda Models
INSERT INTO vehicle_models (manufacturer_id, model_name, model_year_start, vehicle_type, engine_capacity) VALUES
((SELECT id FROM manufacturers WHERE name = 'Honda'), 'Activa 6G', 2020, 'Scooter', '110cc'),
((SELECT id FROM manufacturers WHERE name = 'Honda'), 'Shine 100', 2023, 'Motorcycle', '100cc'),
((SELECT id FROM manufacturers WHERE name = 'Honda'), 'SP 125', 2019, 'Motorcycle', '125cc'),
((SELECT id FROM manufacturers WHERE name = 'Honda'), 'Unicorn', 2004, 'Motorcycle', '150cc'),
((SELECT id FROM manufacturers WHERE name = 'Honda'), 'Hornet 2.0', 2020, 'Motorcycle', '184cc'),
((SELECT id FROM manufacturers WHERE name = 'Honda'), 'CB350', 2020, 'Motorcycle', '350cc'),
((SELECT id FROM manufacturers WHERE name = 'Honda'), 'Dio', 2001, 'Scooter', '110cc'),
((SELECT id FROM manufacturers WHERE name = 'Honda'), 'Grazia', 2017, 'Scooter', '125cc')
ON CONFLICT (manufacturer_id, model_name) DO NOTHING;

-- Hero Models
INSERT INTO vehicle_models (manufacturer_id, model_name, model_year_start, vehicle_type, engine_capacity) VALUES
((SELECT id FROM manufacturers WHERE name = 'Hero'), 'Splendor Plus', 1994, 'Motorcycle', '100cc'),
((SELECT id FROM manufacturers WHERE name = 'Hero'), 'HF Deluxe', 2006, 'Motorcycle', '100cc'),
((SELECT id FROM manufacturers WHERE name = 'Hero'), 'Passion Pro', 2006, 'Motorcycle', '110cc'),
((SELECT id FROM manufacturers WHERE name = 'Hero'), 'Glamour', 2005, 'Motorcycle', '125cc'),
((SELECT id FROM manufacturers WHERE name = 'Hero'), 'Xtreme 160R', 2020, 'Motorcycle', '160cc'),
((SELECT id FROM manufacturers WHERE name = 'Hero'), 'Xpulse 200', 2019, 'Motorcycle', '200cc'),
((SELECT id FROM manufacturers WHERE name = 'Hero'), 'Maestro Edge', 2016, 'Scooter', '110cc'),
((SELECT id FROM manufacturers WHERE name = 'Hero'), 'Pleasure Plus', 2018, 'Scooter', '110cc')
ON CONFLICT (manufacturer_id, model_name) DO NOTHING;

-- Bajaj Models
INSERT INTO vehicle_models (manufacturer_id, model_name, model_year_start, vehicle_type, engine_capacity) VALUES
((SELECT id FROM manufacturers WHERE name = 'Bajaj'), 'Pulsar 150', 2001, 'Motorcycle', '150cc'),
((SELECT id FROM manufacturers WHERE name = 'Bajaj'), 'Pulsar NS200', 2012, 'Motorcycle', '200cc'),
((SELECT id FROM manufacturers WHERE name = 'Bajaj'), 'Pulsar RS200', 2015, 'Motorcycle', '200cc'),
((SELECT id FROM manufacturers WHERE name = 'Bajaj'), 'Dominar 400', 2016, 'Motorcycle', '373cc'),
((SELECT id FROM manufacturers WHERE name = 'Bajaj'), 'Avenger 220', 2005, 'Motorcycle', '220cc'),
((SELECT id FROM manufacturers WHERE name = 'Bajaj'), 'CT 100', 2000, 'Motorcycle', '100cc'),
((SELECT id FROM manufacturers WHERE name = 'Bajaj'), 'Platina 110', 2006, 'Motorcycle', '110cc'),
((SELECT id FROM manufacturers WHERE name = 'Bajaj'), 'Chetak Electric', 2020, 'Electric', 'Electric')
ON CONFLICT (manufacturer_id, model_name) DO NOTHING;

-- TVS Models
INSERT INTO vehicle_models (manufacturer_id, model_name, model_year_start, vehicle_type, engine_capacity) VALUES
((SELECT id FROM manufacturers WHERE name = 'TVS'), 'Apache RTR 160', 2006, 'Motorcycle', '160cc'),
((SELECT id FROM manufacturers WHERE name = 'TVS'), 'Apache RTR 200 4V', 2016, 'Motorcycle', '200cc'),
((SELECT id FROM manufacturers WHERE name = 'TVS'), 'Apache RR 310', 2017, 'Motorcycle', '310cc'),
((SELECT id FROM manufacturers WHERE name = 'TVS'), 'Jupiter', 2013, 'Scooter', '110cc'),
((SELECT id FROM manufacturers WHERE name = 'TVS'), 'Ntorq 125', 2018, 'Scooter', '125cc'),
((SELECT id FROM manufacturers WHERE name = 'TVS'), 'Raider 125', 2021, 'Motorcycle', '125cc'),
((SELECT id FROM manufacturers WHERE name = 'TVS'), 'Sport', 2006, 'Motorcycle', '100cc'),
((SELECT id FROM manufacturers WHERE name = 'TVS'), 'iQube Electric', 2020, 'Electric', 'Electric')
ON CONFLICT (manufacturer_id, model_name) DO NOTHING;

-- Royal Enfield Models
INSERT INTO vehicle_models (manufacturer_id, model_name, model_year_start, vehicle_type, engine_capacity) VALUES
((SELECT id FROM manufacturers WHERE name = 'Royal Enfield'), 'Classic 350', 2008, 'Motorcycle', '350cc'),
((SELECT id FROM manufacturers WHERE name = 'Royal Enfield'), 'Meteor 350', 2020, 'Motorcycle', '350cc'),
((SELECT id FROM manufacturers WHERE name = 'Royal Enfield'), 'Hunter 350', 2022, 'Motorcycle', '350cc'),
((SELECT id FROM manufacturers WHERE name = 'Royal Enfield'), 'Bullet 350', 1948, 'Motorcycle', '350cc'),
((SELECT id FROM manufacturers WHERE name = 'Royal Enfield'), 'Himalayan', 2016, 'Motorcycle', '411cc'),
((SELECT id FROM manufacturers WHERE name = 'Royal Enfield'), 'Continental GT 650', 2018, 'Motorcycle', '650cc'),
((SELECT id FROM manufacturers WHERE name = 'Royal Enfield'), 'Interceptor 650', 2018, 'Motorcycle', '650cc')
ON CONFLICT (manufacturer_id, model_name) DO NOTHING;

-- Yamaha Models
INSERT INTO vehicle_models (manufacturer_id, model_name, model_year_start, vehicle_type, engine_capacity) VALUES
((SELECT id FROM manufacturers WHERE name = 'Yamaha'), 'FZ-S FI', 2008, 'Motorcycle', '150cc'),
((SELECT id FROM manufacturers WHERE name = 'Yamaha'), 'FZS 25', 2019, 'Motorcycle', '250cc'),
((SELECT id FROM manufacturers WHERE name = 'Yamaha'), 'MT-15', 2019, 'Motorcycle', '155cc'),
((SELECT id FROM manufacturers WHERE name = 'Yamaha'), 'R15 V4', 2008, 'Motorcycle', '155cc'),
((SELECT id FROM manufacturers WHERE name = 'Yamaha'), 'Fascino 125', 2012, 'Scooter', '125cc'),
((SELECT id FROM manufacturers WHERE name = 'Yamaha'), 'Ray ZR 125', 2017, 'Scooter', '125cc'),
((SELECT id FROM manufacturers WHERE name = 'Yamaha'), 'Aerox 155', 2021, 'Scooter', '155cc')
ON CONFLICT (manufacturer_id, model_name) DO NOTHING;

-- Suzuki Models
INSERT INTO vehicle_models (manufacturer_id, model_name, model_year_start, vehicle_type, engine_capacity) VALUES
((SELECT id FROM manufacturers WHERE name = 'Suzuki'), 'Access 125', 2007, 'Scooter', '125cc'),
((SELECT id FROM manufacturers WHERE name = 'Suzuki'), 'Burgman Street', 2018, 'Scooter', '125cc'),
((SELECT id FROM manufacturers WHERE name = 'Suzuki'), 'Gixxer SF', 2014, 'Motorcycle', '155cc'),
((SELECT id FROM manufacturers WHERE name = 'Suzuki'), 'Gixxer 250', 2019, 'Motorcycle', '250cc'),
((SELECT id FROM manufacturers WHERE name = 'Suzuki'), 'Avenis', 2021, 'Scooter', '125cc'),
((SELECT id FROM manufacturers WHERE name = 'Suzuki'), 'Intruder', 2017, 'Motorcycle', '155cc')
ON CONFLICT (manufacturer_id, model_name) DO NOTHING;

-- Ather Models
INSERT INTO vehicle_models (manufacturer_id, model_name, model_year_start, vehicle_type, engine_capacity) VALUES
((SELECT id FROM manufacturers WHERE name = 'Ather'), '450X', 2020, 'Electric', 'Electric'),
((SELECT id FROM manufacturers WHERE name = 'Ather'), '450S', 2022, 'Electric', 'Electric'),
((SELECT id FROM manufacturers WHERE name = 'Ather'), '450 Apex', 2022, 'Electric', 'Electric')
ON CONFLICT (manufacturer_id, model_name) DO NOTHING;

-- Ola Electric Models
INSERT INTO vehicle_models (manufacturer_id, model_name, model_year_start, vehicle_type, engine_capacity) VALUES
((SELECT id FROM manufacturers WHERE name = 'Ola Electric'), 'S1', 2021, 'Electric', 'Electric'),
((SELECT id FROM manufacturers WHERE name = 'Ola Electric'), 'S1 Pro', 2021, 'Electric', 'Electric'),
((SELECT id FROM manufacturers WHERE name = 'Ola Electric'), 'S1 Air', 2023, 'Electric', 'Electric')
ON CONFLICT (manufacturer_id, model_name) DO NOTHING;

-- KTM Models
INSERT INTO vehicle_models (manufacturer_id, model_name, model_year_start, vehicle_type, engine_capacity) VALUES
((SELECT id FROM manufacturers WHERE name = 'KTM India'), 'Duke 125', 2011, 'Motorcycle', '125cc'),
((SELECT id FROM manufacturers WHERE name = 'KTM India'), 'Duke 200', 2012, 'Motorcycle', '200cc'),
((SELECT id FROM manufacturers WHERE name = 'KTM India'), 'Duke 250', 2017, 'Motorcycle', '250cc'),
((SELECT id FROM manufacturers WHERE name = 'KTM India'), 'RC 200', 2014, 'Motorcycle', '200cc'),
((SELECT id FROM manufacturers WHERE name = 'KTM India'), 'RC 390', 2014, 'Motorcycle', '373cc'),
((SELECT id FROM manufacturers WHERE name = 'KTM India'), 'Adventure 390', 2020, 'Motorcycle', '373cc')
ON CONFLICT (manufacturer_id, model_name) DO NOTHING;

-- 4. Update product_master to link parts to manufacturers (make them universal parts)
-- For now, we'll update all NULL manufacturer_id parts to be compatible with ALL manufacturers
-- This is done by creating a "Universal" manufacturer
INSERT INTO manufacturers (name, country) VALUES ('Universal Parts', 'Global')
ON CONFLICT (name) DO NOTHING;

-- Update all parts without manufacturer to Universal
UPDATE product_master 
SET manufacturer_id = (SELECT id FROM manufacturers WHERE name = 'Universal Parts')
WHERE manufacturer_id IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_vehicle_models_manufacturer ON vehicle_models(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_product_master_manufacturer ON product_master(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_product_master_model ON product_master(model_id);

SELECT 
    'Vehicle models added: ' || COUNT(*) 
FROM vehicle_models;

SELECT 
    'Products updated with manufacturer: ' || COUNT(*) 
FROM product_master 
WHERE manufacturer_id = (SELECT id FROM manufacturers WHERE name = 'Universal Parts');
