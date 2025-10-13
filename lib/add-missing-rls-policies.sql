-- Add Missing RLS Policies
-- Run this in your Supabase SQL Editor

-- Enable RLS on tables that might not have it enabled
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Posts RLS Policies
CREATE POLICY "Anyone can read posts" ON posts
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create posts" ON posts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON posts
  FOR DELETE USING (auth.uid() = user_id);

-- Comments RLS Policies
CREATE POLICY "Anyone can read comments" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- Likes RLS Policies
CREATE POLICY "Anyone can read likes" ON likes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create likes" ON likes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON likes
  FOR DELETE USING (auth.uid() = user_id);

-- Additional RLS policies for existing tables that might be missing them

-- Gyms policies (if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'gyms' AND policyname = 'Anyone can read gyms'
  ) THEN
    ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Anyone can read gyms" ON gyms FOR SELECT USING (true);
    CREATE POLICY "Authenticated users can create gyms" ON gyms FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    CREATE POLICY "Authenticated users can update gyms" ON gyms FOR UPDATE USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Gym reviews policies (if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'gym_reviews' AND policyname = 'Anyone can read gym reviews'
  ) THEN
    ALTER TABLE gym_reviews ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Anyone can read gym reviews" ON gym_reviews FOR SELECT USING (true);
    CREATE POLICY "Users can create their own reviews" ON gym_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update their own reviews" ON gym_reviews FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete their own reviews" ON gym_reviews FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Gym images policies (if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'gym_images' AND policyname = 'Anyone can read gym images'
  ) THEN
    ALTER TABLE gym_images ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Anyone can read gym images" ON gym_images FOR SELECT USING (true);
    CREATE POLICY "Authenticated users can create gym images" ON gym_images FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    CREATE POLICY "Authenticated users can update gym images" ON gym_images FOR UPDATE USING (auth.role() = 'authenticated');
    CREATE POLICY "Authenticated users can delete gym images" ON gym_images FOR DELETE USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Messages policies (if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'messages' AND policyname = 'Allow authenticated users to read messages'
  ) THEN
    -- Messages table already has RLS policies, but let's ensure they exist
    NULL; -- Do nothing as policies should already exist
  END IF;
END $$;

-- Function to check if RLS is enabled on a table
CREATE OR REPLACE FUNCTION check_rls_enabled(table_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  rls_enabled BOOLEAN;
BEGIN
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class
  WHERE relname = table_name;
  
  RETURN COALESCE(rls_enabled, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Function to list all tables without RLS enabled
CREATE OR REPLACE FUNCTION list_tables_without_rls()
RETURNS TABLE(table_name TEXT, rls_enabled BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.relname::TEXT as table_name,
    COALESCE(c.relrowsecurity, FALSE) as rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind = 'r'
    AND n.nspname = 'public'
    AND NOT c.relrowsecurity
  ORDER BY c.relname;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION check_rls_enabled TO authenticated;
GRANT EXECUTE ON FUNCTION list_tables_without_rls TO authenticated;
