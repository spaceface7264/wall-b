-- Setup Member Count Trigger (Run separately if needed)
-- This script sets up the trigger function and trigger for automatic member count updates
-- Run this AFTER running the recalculation script
-- Run this in your Supabase SQL Editor

-- Drop existing function and trigger first to avoid conflicts
DROP TRIGGER IF EXISTS update_community_member_count_trigger ON community_members;
DROP FUNCTION IF EXISTS update_community_member_count() CASCADE;

-- Create the trigger function
CREATE FUNCTION update_community_member_count()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE communities 
    SET member_count = member_count + 1 
    WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE communities 
    SET member_count = GREATEST(0, member_count - 1)
    WHERE id = OLD.community_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create the trigger
CREATE TRIGGER update_community_member_count_trigger
  AFTER INSERT OR DELETE ON community_members
  FOR EACH ROW 
  EXECUTE FUNCTION update_community_member_count();



