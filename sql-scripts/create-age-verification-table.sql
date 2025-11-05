-- Age Verification Schema
-- Run this in your Supabase SQL Editor

-- Add age verification columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age_verification_method TEXT CHECK (age_verification_method IN ('manual', 'document', 'none')) DEFAULT 'none';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age_verification_date TIMESTAMP WITH TIME ZONE;

-- Add minimum age requirement to communities table
-- Minimum age is 16 (no NSFW content allowed)
ALTER TABLE communities ADD COLUMN IF NOT EXISTS minimum_age_required INTEGER DEFAULT 16 CHECK (minimum_age_required >= 16);

-- Create index for age verification queries
CREATE INDEX IF NOT EXISTS profiles_age_verified_idx ON profiles(age_verified);
CREATE INDEX IF NOT EXISTS profiles_date_of_birth_idx ON profiles(date_of_birth) WHERE date_of_birth IS NOT NULL;
CREATE INDEX IF NOT EXISTS communities_minimum_age_idx ON communities(minimum_age_required);

-- Function to calculate age from date of birth
CREATE OR REPLACE FUNCTION calculate_age(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
  IF birth_date IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN EXTRACT(YEAR FROM AGE(birth_date));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if user meets age requirement
-- Minimum age is 16
CREATE OR REPLACE FUNCTION user_meets_age_requirement(user_id UUID, min_age INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  user_age INTEGER;
  user_verified BOOLEAN;
BEGIN
  -- Ensure minimum age is at least 16
  IF min_age < 16 THEN
    min_age := 16;
  END IF;
  
  -- Get user's age verification status
  SELECT age_verified, calculate_age(date_of_birth)
  INTO user_verified, user_age
  FROM profiles
  WHERE id = user_id;
  
  -- If age is verified, check actual age
  IF user_verified AND user_age IS NOT NULL THEN
    RETURN user_age >= min_age;
  END IF;
  
  -- If not verified, default to false (must verify)
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON COLUMN profiles.age_verified IS 'Whether the user has verified their age (minimum 16 years old required)';
COMMENT ON COLUMN profiles.date_of_birth IS 'Optional date of birth for age verification. Used for strict age checks.';
COMMENT ON COLUMN profiles.age_verification_method IS 'Method used for age verification: manual (checkbox), document (ID verification), none';
COMMENT ON COLUMN communities.minimum_age_required IS 'Minimum age required to join this community (default 16, minimum allowed is 16)';

-- Test the schema updates
SELECT 'Age verification schema created successfully!' as status;
