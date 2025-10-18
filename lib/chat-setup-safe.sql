-- Safe Chat Database Setup
-- This script handles existing tables and constraints gracefully

-- Step 1: Create conversations table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT, -- Optional name for group conversations
  type TEXT DEFAULT 'direct',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Add constraint for type column (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'conversations_type_check'
    ) THEN
        ALTER TABLE conversations ADD CONSTRAINT conversations_type_check 
        CHECK (type IN ('direct', 'group'));
    END IF;
END $$;

-- Step 3: Create conversation_participants table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- Step 4: Create direct_messages table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  file_url TEXT, -- For file attachments
  read_by JSONB DEFAULT '{}', -- Track who read the message
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Add constraint for message_type column (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'direct_messages_type_check'
    ) THEN
        ALTER TABLE direct_messages ADD CONSTRAINT direct_messages_type_check 
        CHECK (message_type IN ('text', 'image', 'file'));
    END IF;
END $$;

-- Step 6: Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS conversations_created_at_idx ON conversations(created_at);
CREATE INDEX IF NOT EXISTS conversations_type_idx ON conversations(type);
CREATE INDEX IF NOT EXISTS conversation_participants_conversation_id_idx ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS conversation_participants_user_id_idx ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS direct_messages_conversation_id_created_at_idx ON direct_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS direct_messages_sender_id_idx ON direct_messages(sender_id);

-- Step 7: Enable Row Level Security (RLS) - this is safe to run multiple times
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
