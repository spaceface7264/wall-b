# Database Migrations

This directory contains numbered migration scripts that should be applied in order to update the database schema.

## Migration System

Migrations are tracked using the `schema_migrations` table, which records:
- Version (migration number + name)
- When it was applied
- Who applied it
- Optional checksum and execution time

## Migration Naming Convention

Migrations should be named: `NNN_description.sql`

Where:
- `NNN` is a zero-padded 3-digit number (001, 002, 003, etc.)
- `description` is a short, descriptive name in snake_case

Examples:
- `001_add_user_preferences.sql`
- `002_create_events_table.sql`
- `003_add_post_tags_index.sql`

## Creating a New Migration

1. Create a new file in this directory following the naming convention
2. Start with a header comment:
   ```sql
   -- Migration: NNN_description
   -- Description: Brief description of what this migration does
   -- Created: YYYY-MM-DD
   ```

3. Write your migration SQL (see guidelines below)
4. Test the migration on a development database first
5. Commit the migration file to version control

## Migration Guidelines

### DO:
- ✅ Make migrations idempotent where possible (use `IF NOT EXISTS`, `CREATE OR REPLACE`, etc.)
- ✅ Include both UP and DOWN migrations in comments, or create separate rollback scripts
- ✅ Test migrations on a copy of production data before applying
- ✅ Document breaking changes in the migration header
- ✅ Keep migrations small and focused on a single change
- ✅ Use transactions where appropriate (Supabase/PostgreSQL automatically wraps DDL in transactions)

### DON'T:
- ❌ Modify existing migration files that have already been applied
- ❌ Create migrations that depend on application code being deployed first
- ❌ Drop tables/columns without providing a migration path or data export
- ❌ Include data migrations in schema migrations (use seed scripts instead)

## Applying Migrations

### Manual Application

1. Check which migrations have been applied:
   ```sql
   SELECT * FROM schema_migrations ORDER BY version;
   ```

2. Apply a migration manually:
   ```sql
   -- Run the migration SQL in Supabase SQL Editor
   -- Then record it:
   INSERT INTO schema_migrations (version, name)
   VALUES ('001_description', 'Add user preferences')
   ON CONFLICT (version) DO NOTHING;
   ```

### Automated Application (Future)

A migration runner script could be created that:
- Reads migration files in order
- Checks `schema_migrations` table
- Applies only unapplied migrations
- Records success/failure

## Rollback Strategy

For critical changes, consider:

1. **Creating a rollback script** alongside the migration:
   - `001_add_user_preferences.sql` (UP)
   - `001_add_user_preferences.rollback.sql` (DOWN)

2. **Documenting rollback steps** in comments:
   ```sql
   -- ROLLBACK (if needed):
   -- ALTER TABLE users DROP COLUMN preferences;
   ```

3. **Version control** - You can always revert to a previous schema version by:
   - Creating a new migration that reverses the change
   - Restoring from a database backup

## Migration Best Practices

1. **Always backup** before applying migrations to production
2. **Test migrations** on staging first
3. **Review migrations** in pull requests
4. **Coordinate deployments** - schema changes may require application code changes
5. **Document breaking changes** - update API documentation, notify team

## Current Migrations

| Version | Name | Description | Applied |
|---------|------|-------------|---------|
| 000 | create_migrations_table | Creates the schema_migrations tracking table | ✅ |

---

**Note:** This migration system replaces the previous "fix script" approach. All future schema changes should be done through migrations.

