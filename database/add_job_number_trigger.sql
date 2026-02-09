-- Create sequence for job numbers if not exists
CREATE SEQUENCE IF NOT EXISTS job_number_seq START 1;

-- Create function to generate job number
CREATE OR REPLACE FUNCTION generate_job_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.job_number IS NULL OR NEW.job_number = '' THEN
    NEW.job_number := 'JOB-' || LPAD(nextval('job_number_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS set_job_number ON job_cards;
CREATE TRIGGER set_job_number
  BEFORE INSERT ON job_cards
  FOR EACH ROW
  EXECUTE FUNCTION generate_job_number();

-- Set sequence to max existing job number + 1
DO $$
DECLARE
  max_num INT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(job_number FROM 'JOB-([0-9]+)') AS INT)), 0) INTO max_num FROM job_cards;
  PERFORM setval('job_number_seq', GREATEST(max_num + 1, 1), false);
END $$;
