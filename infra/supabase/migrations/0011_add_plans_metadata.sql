-- Migration: Add metadata column to plans table
-- Description: Adds JSONB column to store rich metadata (features, limitations, descriptions, flags)
-- Date: 2025-10-29
-- Author: CodeArchitect Pro

-- Add metadata JSONB column to plans table
ALTER TABLE public.plans 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_plans_metadata ON public.plans USING gin(metadata);

-- Add comment to document the column purpose
COMMENT ON COLUMN public.plans.metadata IS 'Rich metadata for plan: type, currency, description, features, limitations, isActive, isPopular, discountPercentage';

-- Update existing plans with default metadata structure
UPDATE public.plans 
SET metadata = jsonb_build_object(
  'type', CASE 
    WHEN name ILIKE '%single%' THEN 'single'
    WHEN name ILIKE '%unlimited%' THEN 'monthly-unlimited'
    WHEN visit_quota IS NOT NULL AND visit_quota > 0 THEN 'monthly-limited'
    WHEN name ILIKE '%company%' OR name ILIKE '%corporate%' THEN 'company'
    ELSE 'single'
  END,
  'currency', 'AZN',
  'description', name,
  'features', '[]'::jsonb,
  'limitations', '[]'::jsonb,
  'isActive', true,
  'isPopular', false,
  'discountPercentage', 0
)
WHERE metadata IS NULL OR metadata = '{}'::jsonb;

-- Verify migration
DO $$
DECLARE
  column_exists boolean;
  index_exists boolean;
BEGIN
  -- Check if column exists
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'plans' 
    AND column_name = 'metadata'
  ) INTO column_exists;
  
  -- Check if index exists
  SELECT EXISTS (
    SELECT 1 
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'plans' 
    AND indexname = 'idx_plans_metadata'
  ) INTO index_exists;
  
  -- Output results
  IF column_exists AND index_exists THEN
    RAISE NOTICE '✅ Migration successful: metadata column and index created';
  ELSE
    RAISE EXCEPTION '❌ Migration failed: column_exists=%, index_exists=%', column_exists, index_exists;
  END IF;
END $$;
