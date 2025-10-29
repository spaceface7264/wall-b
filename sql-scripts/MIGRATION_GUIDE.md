# Database Migration Guide

## Overview

This guide explains the new database migration system that replaces the previous "fix script" approach.

## Why Migrations?

The previous approach of having dozens of "fix-*.sql" scripts led to:
- ❌ Confusion about which scripts to run
- ❌ Uncertainty about the current database state
- ❌ Risk of applying conflicting changes
- ❌ No tracking of what's been applied

The new migration system provides:
- ✅ Clear versioning and ordering
- ✅ Tracking of applied migrations
- ✅ Single source of truth (CURRENT_SCHEMA.md)
- ✅ Safe, repeatable database changes

## Directory Structure

```
sql-scripts/
├── CURRENT_SCHEMA.md          # Single source of truth for current schema
├── MIGRATION_GUIDE.md         # This file
├── migrations/                 # Migration scripts (applied in order)
│   ├── README.md              # Migration system documentation
│   ├── 000_create_migrations_table.sql
│   ├── 001_your_migration.sql
│   └── ...
└── deprecated/                # Old fix scripts (archived, don't use)
    ├── README.md              # Why these are deprecated
    ├── fix-community-ids.sql
    └── ...
```

## Getting Started

### 1. Initialize Migration Tracking

First, run the migration table creation script:

Run this in Supabase SQL Editor:
```sql
-- File: migrations/000_create_migrations_table.sql
```

This creates the `schema_migrations` table that tracks applied migrations.

### 2. Check Current Schema

Refer to `CURRENT_SCHEMA.md` for the current database structure. This document is the single source of truth.

### 3. Create New Migrations

When you need to change the schema:

1. Create a new migration file: `migrations/001_your_change.sql`
2. Write SQL to make the change (see migration guidelines below)
3. Test on a development database
4. Apply to production
5. Update `CURRENT_SCHEMA.md` to reflect the change

## Migration Example

```sql
-- Migration: 001_add_user_preferences
-- Description: Adds a preferences JSONB column to the profiles table
-- Created: 2025-10-28

-- Add preferences column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

-- Create index for common queries
CREATE INDEX IF NOT EXISTS profiles_preferences_idx 
ON profiles USING GIN (preferences);

-- Record migration
INSERT INTO schema_migrations (version, name)
VALUES ('001_add_user_preferences', 'Add user preferences column')
ON CONFLICT (version) DO NOTHING;
```

## Migration Guidelines

### Safe Patterns

✅ **Idempotent operations** (can run multiple times safely):
```sql
CREATE INDEX IF NOT EXISTS idx_name ON table(column);
ALTER TABLE table ADD COLUMN IF NOT EXISTS column TEXT;
CREATE OR REPLACE FUNCTION function_name() ...
```

✅ **Safe additions**:
- Adding new columns with defaults
- Creating new tables
- Adding new indexes
- Creating new functions

### Risky Patterns (Handle with Care)

⚠️ **Requires careful planning**:
- Dropping columns (ensure no app code depends on them)
- Changing column types (may need data migration)
- Renaming tables/columns (may break foreign keys)
- Dropping constraints (may affect data integrity)

⚠️ **Breaking changes** (coordinate with app deployment):
- Adding NOT NULL columns without defaults
- Changing foreign key constraints
- Modifying RLS policies in ways that affect access

### Testing Migrations

1. **Test on local/dev database first**
2. **Test with sample data** similar to production
3. **Test rollback** (if applicable)
4. **Verify app still works** after migration
5. **Check performance** - new indexes may need time to build

## Common Migration Scenarios

### Adding a Column

```sql
-- Migration: 002_add_bio_to_profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
```

### Creating a Table

```sql
-- Migration: 003_create_notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Adding an Index

```sql
-- Migration: 004_add_user_email_index
CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON profiles(email) 
WHERE email IS NOT NULL;
```

### Modifying RLS Policy

```sql
-- Migration: 005_update_posts_rls
-- Drop old policy
DROP POLICY IF EXISTS "old_policy_name" ON posts;

-- Create new policy
CREATE POLICY "new_policy_name" ON posts
  FOR SELECT USING (auth.role() = 'authenticated' AND is_public = TRUE);
```

## Coordinating with Application Code

When a migration requires application code changes:

1. **Plan the deployment**:
   - Will app break if migration runs first?
   - Will app break if migration runs second?
   - Can they be deployed together?

2. **Backward compatibility**:
   - Can you make the change backward compatible?
   - Can you deploy app code that works with old and new schema?

3. **Deployment order** (if not compatible):
   - Option A: Migration first, then deploy app code
   - Option B: Deploy app code first (with feature flag), then migration
   - Option C: Deploy together during maintenance window

## Troubleshooting

### Migration Already Applied

If you try to apply a migration that's already in `schema_migrations`:
- The migration itself should be idempotent (use `IF NOT EXISTS`)
- The INSERT into `schema_migrations` will use `ON CONFLICT DO NOTHING`

### Migration Failed Partway Through

PostgreSQL wraps DDL in transactions, so failures should roll back automatically. However:

1. Check what actually changed
2. Verify `schema_migrations` wasn't updated
3. Fix the migration script
4. Re-apply

### Need to Rollback

1. Check if a rollback script exists (`.rollback.sql` file)
2. If not, create a new migration that reverses the change
3. Apply the rollback migration
4. Update `CURRENT_SCHEMA.md`

## Old Fix Scripts

All old "fix-*.sql" scripts have been moved to the `deprecated/` folder. 

**Do not use these scripts** - they represent past attempts to fix issues and may:
- Conflict with current schema
- Drop and recreate tables (data loss risk)
- Have incorrect or outdated logic

Refer to `CURRENT_SCHEMA.md` instead to understand the current schema.

## Questions?

- Check `CURRENT_SCHEMA.md` for current schema documentation
- Review migration examples in `migrations/` directory
- Consult PostgreSQL documentation for specific SQL syntax
- Test changes in development first!

