-- Ensure all future IDs are professional-looking
-- Run this in your Supabase SQL Editor

-- Create a function to generate professional UUIDs
CREATE OR REPLACE FUNCTION generate_professional_uuid()
RETURNS UUID AS $$
BEGIN
  -- Generate a proper UUID that looks professional
  RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql;

-- Update default values for ID columns to use professional UUIDs
-- (This ensures new records get professional UUIDs automatically)

-- For communities table
ALTER TABLE communities ALTER COLUMN id SET DEFAULT generate_professional_uuid();

-- For posts table  
ALTER TABLE posts ALTER COLUMN id SET DEFAULT generate_professional_uuid();

-- For events table
ALTER TABLE events ALTER COLUMN id SET DEFAULT generate_professional_uuid();

-- For profiles table
ALTER TABLE profiles ALTER COLUMN id SET DEFAULT generate_professional_uuid();

-- For gyms table (if it has UUID id column)
-- ALTER TABLE gyms ALTER COLUMN id SET DEFAULT generate_professional_uuid();

-- For community_members table
ALTER TABLE community_members ALTER COLUMN id SET DEFAULT generate_professional_uuid();

-- For event_rsvps table
ALTER TABLE event_rsvps ALTER COLUMN id SET DEFAULT generate_professional_uuid();

-- For comments table
ALTER TABLE comments ALTER COLUMN id SET DEFAULT generate_professional_uuid();

-- For likes table
ALTER TABLE likes ALTER COLUMN id SET DEFAULT generate_professional_uuid();

-- For notifications table
ALTER TABLE notifications ALTER COLUMN id SET DEFAULT generate_professional_uuid();

-- Create a trigger to ensure all new records get professional UUIDs
CREATE OR REPLACE FUNCTION ensure_professional_uuid()
RETURNS TRIGGER AS $$
BEGIN
  -- If the ID is null or looks like a placeholder, generate a new one
  IF NEW.id IS NULL OR 
     NEW.id::text ~ '^[a-f]{8}-[a-f]{4}-[a-f]{4}-[a-f]{4}-[a-f]{12}$' OR
     NEW.id::text ~ '^[0-9]{8}-[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{12}$' THEN
    NEW.id = generate_professional_uuid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to relevant tables
DROP TRIGGER IF EXISTS ensure_professional_uuid_communities ON communities;
CREATE TRIGGER ensure_professional_uuid_communities
  BEFORE INSERT ON communities
  FOR EACH ROW EXECUTE FUNCTION ensure_professional_uuid();

DROP TRIGGER IF EXISTS ensure_professional_uuid_posts ON posts;
CREATE TRIGGER ensure_professional_uuid_posts
  BEFORE INSERT ON posts
  FOR EACH ROW EXECUTE FUNCTION ensure_professional_uuid();

DROP TRIGGER IF EXISTS ensure_professional_uuid_events ON events;
CREATE TRIGGER ensure_professional_uuid_events
  BEFORE INSERT ON events
  FOR EACH ROW EXECUTE FUNCTION ensure_professional_uuid();

DROP TRIGGER IF EXISTS ensure_professional_uuid_profiles ON profiles;
CREATE TRIGGER ensure_professional_uuid_profiles
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION ensure_professional_uuid();

-- Grant permissions
GRANT EXECUTE ON FUNCTION generate_professional_uuid() TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_professional_uuid() TO authenticated;

SELECT 'Professional UUID system installed successfully!' as status;


