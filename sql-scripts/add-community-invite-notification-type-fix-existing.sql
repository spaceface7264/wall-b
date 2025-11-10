-- Safe migration script: Update notifications schema to support community_invite type
-- This version handles existing data that might violate the constraint
-- Run this in your Supabase SQL Editor

-- Step 1: Drop the existing constraint (if it exists)
DO $$ 
BEGIN
  -- Drop the constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'notifications_type_check'
  ) THEN
    ALTER TABLE notifications DROP CONSTRAINT notifications_type_check;
    RAISE NOTICE 'Dropped existing constraint';
  ELSE
    RAISE NOTICE 'No existing constraint found';
  END IF;
END $$;

-- Step 2: Check for any invalid notification types
-- If there are any, we'll need to handle them
DO $$
DECLARE
  invalid_types TEXT[];
BEGIN
  SELECT ARRAY_AGG(DISTINCT type) INTO invalid_types
  FROM notifications
  WHERE type NOT IN (
    'comment_reply', 'post_like', 'comment_like', 'event_invite', 
    'event_reminder', 'mention', 'direct_message', 'community_join',
    'community_invite', 'event_rsvp', 'post_comment', 'system',
    'community_join_request', 'community_join_request_approved', 'community_join_request_rejected'
  );
  
  IF invalid_types IS NOT NULL AND array_length(invalid_types, 1) > 0 THEN
    RAISE WARNING 'Found invalid notification types: %', array_to_string(invalid_types, ', ');
    RAISE WARNING 'These rows will need to be updated or deleted before adding the constraint';
    -- Optionally, you can update them to 'system' type:
    -- UPDATE notifications SET type = 'system' WHERE type = ANY(invalid_types);
  END IF;
END $$;

-- Step 3: Add the new constraint with all valid types
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN (
    'comment_reply', 
    'post_like', 
    'comment_like', 
    'event_invite', 
    'event_reminder', 
    'mention', 
    'direct_message', 
    'community_join',
    'community_invite',
    'event_rsvp', 
    'post_comment', 
    'system',
    'community_join_request',
    'community_join_request_approved',
    'community_join_request_rejected'
  ));

-- Step 4: Verify the constraint was added
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'notifications_type_check'
  ) THEN
    RAISE NOTICE 'Successfully added constraint with community_invite support';
  ELSE
    RAISE EXCEPTION 'Failed to add constraint';
  END IF;
END $$;

