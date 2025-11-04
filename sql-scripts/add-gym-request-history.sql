-- Add Gym Request History Table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS gym_request_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_request_id UUID NOT NULL REFERENCES gym_requests(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'approved', 'rejected', 'restored', 'edited')),
  changed_by UUID REFERENCES auth.users(id),
  changes JSONB DEFAULT '{}'::jsonb, -- Store field changes like {gym_name: {old: 'Old Name', new: 'New Name'}}
  notes TEXT, -- Additional notes about the change
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS gym_request_history_gym_request_id_idx ON gym_request_history(gym_request_id);
CREATE INDEX IF NOT EXISTS gym_request_history_created_at_idx ON gym_request_history(created_at DESC);
CREATE INDEX IF NOT EXISTS gym_request_history_action_idx ON gym_request_history(action);

-- Enable Row Level Security
ALTER TABLE gym_request_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Admins can view all gym request history" ON gym_request_history;
CREATE POLICY "Admins can view all gym request history" ON gym_request_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND is_admin = TRUE
    )
  );

DROP POLICY IF EXISTS "Users can view their own gym request history" ON gym_request_history;
CREATE POLICY "Users can view their own gym request history" ON gym_request_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM gym_requests 
      WHERE id = gym_request_history.gym_request_id 
      AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can insert gym request history" ON gym_request_history;
CREATE POLICY "System can insert gym request history" ON gym_request_history
  FOR INSERT WITH CHECK (true); -- Allow system to create history

-- Success message
SELECT 'Gym request history table created successfully!' as status;

