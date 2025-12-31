-- Migrate existing data to new level values
-- beginner/intermediate → detailed (자세한 설명)
-- advanced → concise (간단한 설명)
UPDATE "user_profiles"
SET "level" = 'detailed'
WHERE "level" IN ('beginner', 'intermediate');

UPDATE "user_profiles"
SET "level" = 'concise'
WHERE "level" = 'advanced';

-- Drop old constraint if it exists (name varies by Drizzle version)
DO $$
BEGIN
  -- Drop constraint if exists (suppress errors if not found)
  ALTER TABLE "user_profiles" DROP CONSTRAINT IF EXISTS "user_profiles_level_check";
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Add new constraint for updated enum values
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_level_check"
CHECK ("level" IN ('detailed', 'concise'));

-- Set new default
ALTER TABLE "user_profiles" ALTER COLUMN "level" SET DEFAULT 'detailed';
