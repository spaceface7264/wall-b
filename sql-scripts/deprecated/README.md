# Deprecated SQL Scripts

⚠️ **WARNING: DO NOT USE THESE SCRIPTS** ⚠️

## Why These Scripts Are Deprecated

These scripts represent past attempts to fix database issues. They have been archived because:

1. **Multiple Attempts**: Many scripts attempt to fix the same issues (e.g., `fix-community-ids.sql`, `fix-community-ids-safe.sql`, `fix-community-ids-simple.sql`, `fix-community-ids-minimal.sql`)

2. **Schema Instability**: These scripts suggest the schema wasn't planned properly initially, leading to multiple "fix" attempts

3. **Risk of Conflicts**: Running these scripts could conflict with the current working schema

4. **No Tracking**: There's no way to know which of these scripts have been applied

5. **Potential Data Loss**: Some scripts include `DROP TABLE` statements or other destructive operations

## What to Use Instead

✅ **Use the migration system**: See `../MIGRATION_GUIDE.md`

✅ **Refer to current schema**: See `../CURRENT_SCHEMA.md` for the single source of truth

✅ **Create new migrations**: Use `../migrations/` directory for any future schema changes

## Archived Scripts

### Main Directory Fix Scripts

- `fix-comments-complete.sql`
- `fix-comments-schema.sql`
- `fix-community-ids.sql` (and variants: -minimal, -safe, -simple)
- `fix-event-permissions.sql` (and -simple variant)
- `fix-events-rls.sql`
- `fix-events-schema.sql`
- `fix-events-table.sql`
- `fix-foreign-keys.sql`
- `fix-notification-functions.sql`
- `fix-orphaned-data.sql`
- `fix-posts-profiles-join.sql`
- `fix-posts-schema.sql`
- `fix-posts-table-complete.sql`
- `fix-rls-policies.sql`
- `fix-storage-policies.sql`
- `fix-user-display-names.sql`
- `update-communities-schema.sql`
- `clean-orphaned-data.sql`
- `cleanup-old-communities.sql`

### Chat System Fix Scripts (deprecated/chat/)

- `fix-all-chat-rls-policies.sql`
- `fix-conversation-participants-rls.sql`
- `fix-function-permissions.sql`
- `EMERGENCY_RLS_FIX.sql`
- `FINAL_RLS_FIX.sql`
- `chat-setup-fresh.sql`
- `chat-setup-safe.sql`
- `chat-setup-simple.sql`
- `conversations-schema-fixed.sql`
- `conversations-schema-simple.sql`
- `chat-policies-fixed.sql`
- `chat-policies-simple.sql`
- `chat-rls-policies-safe.sql`

## Current Schema Reference

The current working schema is documented in:
- `../CURRENT_SCHEMA.md` - Complete schema documentation
- `../lib/direct-messages-schema.sql` - Current chat schema (if needed)
- `../lib/enhanced-community-schema.sql` - Current community schema (if needed)

## If You Need to Reference These Scripts

These scripts are kept for historical reference only. If you need to:

1. **Understand what was fixed**: Check `CURRENT_SCHEMA.md` to see the current state
2. **See the history**: These files are in version control (git history)
3. **Apply a fix**: Create a new migration in `../migrations/` instead

## Migration from Old System

If you're migrating from the old "fix script" system:

1. ✅ Run `../migrations/000_create_migrations_table.sql` to set up tracking
2. ✅ Verify your current schema matches `CURRENT_SCHEMA.md`
3. ✅ For any future changes, use the migration system
4. ✅ Do NOT run any scripts from this deprecated folder

---

**Last Updated:** October 28, 2025  
**Reason for Archive:** Migration to proper migration system

