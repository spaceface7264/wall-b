-- Community Reports Schema
-- Run this in your Supabase SQL Editor

-- Create community_reports table
CREATE TABLE IF NOT EXISTS community_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'action_taken')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  action_taken TEXT, -- e.g., 'community_deleted', 'warning_issued', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS community_reports_community_id_idx ON community_reports(community_id);
CREATE INDEX IF NOT EXISTS community_reports_reported_by_idx ON community_reports(reported_by);
CREATE INDEX IF NOT EXISTS community_reports_status_idx ON community_reports(status);
CREATE INDEX IF NOT EXISTS community_reports_created_at_idx ON community_reports(created_at DESC);

-- Prevent duplicate reports from same user for same community
CREATE UNIQUE INDEX IF NOT EXISTS community_reports_unique_user_community 
ON community_reports(reported_by, community_id) 
WHERE status = 'pending';

-- Enable Row Level Security
ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies (make idempotent)
DROP POLICY IF EXISTS "Users can create reports" ON community_reports;
CREATE POLICY "Users can create reports" ON community_reports
  FOR INSERT WITH CHECK (auth.uid() = reported_by);

DROP POLICY IF EXISTS "Users can view their own reports" ON community_reports;
CREATE POLICY "Users can view their own reports" ON community_reports
  FOR SELECT USING (auth.uid() = reported_by OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

DROP POLICY IF EXISTS "Admins can update reports" ON community_reports;
CREATE POLICY "Admins can update reports" ON community_reports
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Function to notify admins when a community is reported
CREATE OR REPLACE FUNCTION notify_admins_community_report()
RETURNS TRIGGER AS $$
DECLARE
  admin_record RECORD;
  community_name TEXT;
  reporter_name TEXT;
BEGIN
  -- Get community name
  SELECT name INTO community_name
  FROM communities
  WHERE id = NEW.community_id;

  -- Get reporter name
  SELECT full_name INTO reporter_name
  FROM profiles
  WHERE id = NEW.reported_by;

  -- Notify all admins
  FOR admin_record IN 
    SELECT id FROM profiles WHERE is_admin = true
  LOOP
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      data
    ) VALUES (
      admin_record.id,
      'system',
      'Community Reported',
      COALESCE(reporter_name, 'Someone') || ' reported community "' || COALESCE(community_name, 'Unknown') || '"',
      jsonb_build_object(
        'report_id', NEW.id,
        'community_id', NEW.community_id,
        'reported_by', NEW.reported_by,
        'reason', NEW.reason,
        'type', 'community_report'
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to notify admins on new report
DROP TRIGGER IF EXISTS notify_admins_community_report_trigger ON community_reports;
CREATE TRIGGER notify_admins_community_report_trigger
  AFTER INSERT ON community_reports
  FOR EACH ROW EXECUTE FUNCTION notify_admins_community_report();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_community_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_community_reports_updated_at_trigger ON community_reports;
CREATE TRIGGER update_community_reports_updated_at_trigger
  BEFORE UPDATE ON community_reports
  FOR EACH ROW EXECUTE FUNCTION update_community_reports_updated_at();

-- Grant permissions
GRANT ALL ON community_reports TO authenticated;
GRANT EXECUTE ON FUNCTION notify_admins_community_report() TO authenticated;
GRANT EXECUTE ON FUNCTION update_community_reports_updated_at() TO authenticated;

