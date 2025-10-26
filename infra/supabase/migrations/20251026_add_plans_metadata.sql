-- 20251026_add_plans_metadata.sql
-- Add metadata column to plans table

-- Add metadata JSONB column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'plans' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE plans ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Added metadata column to plans table';
  ELSE
    RAISE NOTICE 'metadata column already exists in plans table';
  END IF;
END $$;

-- Create index for better performance on JSONB queries
CREATE INDEX IF NOT EXISTS idx_plans_metadata ON plans USING gin(metadata);
