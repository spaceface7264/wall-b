-- Create community_join_requests table
-- Run this in your Supabase SQL Editor

-- Create community_join_requests table
CREATE TABLE IF NOT EXISTS community_join_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT, -- Optional message from requester
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  responded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Admin/moderator who responded
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  -- Note: We use a partial unique index instead of a table constraint
  -- to allow users to create new requests after rejection
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS community_join_requests_community_id_idx ON community_join_requests(community_id);
CREATE INDEX IF NOT EXISTS community_join_requests_user_id_idx ON community_join_requests(user_id);
CREATE INDEX IF NOT EXISTS community_join_requests_status_idx ON community_join_requests(status);
CREATE INDEX IF NOT EXISTS community_join_requests_pending_idx ON community_join_requests(community_id, status) WHERE status = 'pending';

-- Partial unique index: Only one pending request per user per community
-- This allows users to create new requests after rejection
CREATE UNIQUE INDEX IF NOT EXISTS community_join_requests_unique_pending 
  ON community_join_requests(community_id, user_id) 
  WHERE status = 'pending';

-- Enable Row Level Security
ALTER TABLE community_join_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can create their own join requests
DROP POLICY IF EXISTS "Users can create join requests" ON community_join_requests;
CREATE POLICY "Users can create join requests" ON community_join_requests
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own join requests
DROP POLICY IF EXISTS "Users can view own join requests" ON community_join_requests;
CREATE POLICY "Users can view own join requests" ON community_join_requests
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Admins and moderators can view all requests for their communities
DROP POLICY IF EXISTS "Admins and moderators can view community join requests" ON community_join_requests;
CREATE POLICY "Admins and moderators can view community join requests" ON community_join_requests
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = community_join_requests.community_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('admin', 'moderator')
    )
  );

-- Admins and moderators can update requests (approve/reject)
DROP POLICY IF EXISTS "Admins and moderators can update join requests" ON community_join_requests;
CREATE POLICY "Admins and moderators can update join requests" ON community_join_requests
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = community_join_requests.community_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = community_join_requests.community_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('admin', 'moderator')
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_community_join_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_community_join_request_updated_at_trigger ON community_join_requests;
CREATE TRIGGER update_community_join_request_updated_at_trigger
  BEFORE UPDATE ON community_join_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_community_join_request_updated_at();

-- Grant permissions
GRANT ALL ON community_join_requests TO authenticated;

-- Test query
SELECT 'community_join_requests table created successfully!' as status;

