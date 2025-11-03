-- Fix Login and Profile Creation Issues
-- Run this in Supabase SQL Editor to fix login/signup problems

-- First, ensure nickname and handle columns exist (they might be missing)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS handle TEXT;

-- Drop and recreate the function with proper error handling
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Recreate the trigger function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert profile, using SECURITY DEFINER to bypass RLS
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    avatar_url, 
    company, 
    role,
    nickname,
    handle
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.raw_user_meta_data->>'company', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''), -- Use full_name as initial nickname
    NULL -- Handle will be set during onboarding
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

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Fix existing users who might not have profiles
-- This will create profiles for any auth.users without profiles
INSERT INTO public.profiles (id, email, full_name, nickname, handle)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', ''),
  COALESCE(au.raw_user_meta_data->>'full_name', ''),
  NULL
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;

-- Verify the function and trigger
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created' 
    AND tgrelid = 'auth.users'::regclass
  ) THEN
    RAISE NOTICE 'Trigger on_auth_user_created exists and is active';
  ELSE
    RAISE WARNING 'Trigger on_auth_user_created is missing!';
  END IF;
END $$;

