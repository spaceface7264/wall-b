-- Add User Intent Support to Profiles
-- This migration adds user_intent column to store user's purpose for using the app
-- Run this in your Supabase SQL Editor

-- Add user_intent column to profiles table as TEXT[] (array of selected purposes)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS user_intent TEXT[] DEFAULT '{}'::TEXT[];

-- Add index on user_intent for query performance
CREATE INDEX IF NOT EXISTS profiles_user_intent_idx ON profiles USING GIN (user_intent);

-- Update handle_new_user() function to include user_intent field (default to empty array)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    avatar_url, 
    company, 
    role,
    nickname,
    handle,
    user_intent
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.raw_user_meta_data->>'company', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''), -- Use full_name as initial nickname
    NULL, -- Handle will be set during onboarding
    '{}'::TEXT[] -- User intent will be set during onboarding
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent errors if profile already exists
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Add comment for documentation
COMMENT ON COLUMN profiles.user_intent IS 'Array of user purposes: find_partners, discover_gyms, join_communities, learn_techniques, share_progress, find_events';

-- Success message
SELECT 'User intent support added successfully! Column and index created.' as status;


