# SQL Scripts Directory

This directory contains all database-related SQL scripts for the project.

## 📁 Directory Structure

```
sql-scripts/
├── README.md                    # This file
├── CURRENT_SCHEMA.md           # ⭐ Single source of truth for current schema
├── MIGRATION_GUIDE.md          # Guide for using the migration system
├── migrations/                  # ✅ Migration scripts (use these for changes)
│   ├── README.md
│   ├── 000_create_migrations_table.sql
│   └── ...
├── deprecated/                  # ⚠️ Old fix scripts (don't use)
│   ├── README.md
│   └── ...
├── chat/                        # Chat-related scripts (current versions)
│   ├── README.md
│   └── ...
└── lib/                         # Schema files used by application
    └── ...
```

## 🚀 Quick Start

### For New Schema Changes

1. **Read the current schema**: Check `CURRENT_SCHEMA.md`
2. **Create a migration**: Add a new file in `migrations/` following the naming convention
3. **Apply the migration**: Run it in Supabase SQL Editor
4. **Update documentation**: Update `CURRENT_SCHEMA.md` if needed

See `MIGRATION_GUIDE.md` for detailed instructions.

### For Understanding Current Schema

📖 **Read `CURRENT_SCHEMA.md`** - This is the authoritative documentation of the current database structure.

## 📚 Documentation Files

- **`CURRENT_SCHEMA.md`** - Complete documentation of current database schema (tables, columns, indexes, RLS policies, functions, triggers)
- **`MIGRATION_GUIDE.md`** - How to use the migration system
- **`migrations/README.md`** - Migration system details and best practices
- **`deprecated/README.md`** - Why old fix scripts were archived

## ✅ Using Migrations

The migration system provides:
- Versioned, ordered schema changes
- Tracking of applied migrations
- Safe, repeatable database updates

**All future schema changes should be done through migrations.**

See `migrations/README.md` for migration guidelines and `MIGRATION_GUIDE.md` for getting started.

## ⚠️ Deprecated Scripts

All "fix-*.sql" scripts have been moved to the `deprecated/` folder. 

**Do NOT use these scripts** - they represent past attempts to fix issues and may:
- Conflict with current schema
- Cause data loss
- Have incorrect logic

Refer to `CURRENT_SCHEMA.md` instead.

## 📦 Schema Files in `lib/`

The `lib/` directory contains schema definition files used by the application:
- `profiles-schema.sql`
- `community-schema.sql`
- `enhanced-community-schema.sql`
- `gyms-schema.sql`
- `notifications-schema.sql`
- `direct-messages-schema.sql`
- etc.

These files represent the current working schema and are documented in `CURRENT_SCHEMA.md`.

## 🔍 Finding What You Need

- **Current schema documentation**: `CURRENT_SCHEMA.md`
- **How to make changes**: `MIGRATION_GUIDE.md`
- **Migration examples**: `migrations/` directory
- **Old fix scripts** (historical reference): `deprecated/` directory

## 🎯 Key Principles

1. **Single Source of Truth**: `CURRENT_SCHEMA.md` documents the current state
2. **Versioned Changes**: All schema changes go through migrations
3. **No More Fix Scripts**: Use migrations instead of one-off fix scripts
4. **Documentation First**: Update schema docs when making changes

---

**Last Updated:** October 28, 2025

