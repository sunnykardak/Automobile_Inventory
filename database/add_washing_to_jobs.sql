-- Migration: Add washing service fields to job_cards table
-- This allows job cards to include washing services

ALTER TABLE job_cards
ADD COLUMN include_washing BOOLEAN DEFAULT FALSE,
ADD COLUMN washing_vehicle_type VARCHAR(50),
ADD COLUMN washing_type VARCHAR(50),
ADD COLUMN washing_diesel_wash BOOLEAN DEFAULT FALSE,
ADD COLUMN washing_addons TEXT[],
ADD COLUMN washing_charges DECIMAL(10,2) DEFAULT 0.00;

-- Add comment for documentation
COMMENT ON COLUMN job_cards.include_washing IS 'Whether this job includes washing service';
COMMENT ON COLUMN job_cards.washing_vehicle_type IS 'Vehicle category for washing: bike_125, sport_bike, heavy_bike, car, suv';
COMMENT ON COLUMN job_cards.washing_type IS 'Type of wash: water_wash, foam_wash';
COMMENT ON COLUMN job_cards.washing_diesel_wash IS 'Whether diesel wash is included';
COMMENT ON COLUMN job_cards.washing_addons IS 'Array of addon services: chain_lubing, chain_cleaning';
COMMENT ON COLUMN job_cards.washing_charges IS 'Total washing service charges';
