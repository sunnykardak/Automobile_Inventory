-- Migration: add labour_charges table and labour_charge_ids to job_cards

CREATE TABLE IF NOT EXISTS labour_charges (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add column to store selected labour charge ids on job_cards
ALTER TABLE job_cards
  ADD COLUMN IF NOT EXISTS labour_charge_ids INTEGER[];

-- Optional: add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_job_cards_labour_charge_ids ON job_cards USING GIN (labour_charge_ids);
