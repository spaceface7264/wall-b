-- Migration: 000_create_migrations_table
-- Description: Creates the schema_migrations table to track which migrations have been applied
-- Created: 2025-10-28

-- Create migrations tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  version VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  applied_by TEXT DEFAULT current_user,
  checksum TEXT, -- Optional: SHA256 hash of migration file for verification
  execution_time_ms INTEGER -- Optional: Track how long migration took
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS schema_migrations_version_idx ON schema_migrations(version);
CREATE INDEX IF NOT EXISTS schema_migrations_applied_at_idx ON schema_migrations(applied_at DESC);

-- Enable RLS (optional, but good for security)
ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;

-- Policy: Only service_role can manage migrations (recommended for production)
-- In development, you might want to allow authenticated users
CREATE POLICY "Service role can manage migrations" ON schema_migrations
  FOR ALL USING (auth.role() = 'service_role');

-- Add helpful comment
COMMENT ON TABLE schema_migrations IS 'Tracks which database migrations have been applied to this database instance';

