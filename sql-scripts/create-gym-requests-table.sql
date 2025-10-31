-- Create Gym Requests Table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS gym_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gym_name TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS gym_requests_user_id_idx ON gym_requests(user_id);
CREATE INDEX IF NOT EXISTS gym_requests_status_idx ON gym_requests(status);
CREATE INDEX IF NOT EXISTS gym_requests_created_at_idx ON gym_requests(created_at DESC);

-- Enable Row Level Security
ALTER TABLE gym_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop if exists to make idempotent)
DROP POLICY IF EXISTS "Users can view their own gym requests" ON gym_requests;
CREATE POLICY "Users can view their own gym requests" ON gym_requests
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create gym requests" ON gym_requests;
CREATE POLICY "Users can create gym requests" ON gym_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all gym requests" ON gym_requests;
CREATE POLICY "Admins can view all gym requests" ON gym_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND is_admin = TRUE
    )
  );

DROP POLICY IF EXISTS "Admins can update gym requests" ON gym_requests;
CREATE POLICY "Admins can update gym requests" ON gym_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND is_admin = TRUE
    )
  );

-- Test the table creation
SELECT 'Gym requests table created successfully!' as status;
SELECT 'Users can now submit gym requests and admins can manage them' as info;
