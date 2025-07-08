# SessionForge Database Management Guide

## Overview
This document outlines best practices for managing the SessionForge database across all environments (local, staging, production).

## Environment States

### ✅ Local Development
- **Supabase Local**: Fully configured with OAuth providers
- **Config**: `supabase/config.toml` + `supabase/config.local.toml`
- **Database**: Auto-reset with migrations on `supabase start`

### ✅ Staging Environment
- **URL**: `https://rvuhpidukddvpoulwdkj.supabase.co`
- **Status**: ✅ All migrations applied through friends system
- **OAuth**: Configured for staging URLs

### ✅ Production Environment  
- **Status**: ✅ All migrations applied through friends system
- **OAuth**: Configured for production URLs
- **Backup**: Regular automated backups enabled

## Current Schema State (as of 2025-01-08)

### Core Tables
- ✅ `campaigns` - Campaign management
- ✅ `sessions` - Session scheduling  
- ✅ `characters` - Player characters
- ✅ `campaign_members` - Campaign participation
- ✅ `user_profiles` - Extended user data with friend codes
- ✅ `connected_accounts` - OAuth provider links
- ✅ `friendships` - Friend system with pagination
- ✅ `ttrpg_systems` & `play_styles` - Reference data

### Applied Migrations
1. ✅ `20250707200936_initial_schema.sql` - Foundation
2. ✅ `20250707201014_user_profiles.sql` - User system
3. ✅ `20250707201100_add_friend_codes.sql` - Friend codes
4. ✅ `20250708013942_fix_friend_code_schema.sql` - Schema fixes
5. ✅ `20250708015000_fix_oauth_connection_trigger.sql` - OAuth improvements
6. ✅ `20250708020000_add_public_profile_policies.sql` - Public profiles
7. ✅ `20250708035000_create_friends_system.sql` - Friends system
8. ✅ `20250708040000_add_friends_pagination.sql` - Pagination functions
9. ✅ `20250708041622_apply_friends_system_production.sql` - Production deployment
10. ✅ `20250708045000_add_medium_of_play.sql` - Documentation update
11. 🟡 `20250708050000_database_audit_cleanup.sql` - **PENDING** - Performance & cleanup

## Migration Best Practices

### ✅ Production-Safe Migration Pattern
```sql
-- Always use conditional creation
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'new_table') THEN
        CREATE TABLE new_table (...);
    END IF;
END $$;

-- Safe function replacement
CREATE OR REPLACE FUNCTION function_name() ...

-- Safe index creation
CREATE INDEX IF NOT EXISTS idx_name ON table(column);
```

### ✅ Required Migration Checklist
- [ ] Uses `IF NOT EXISTS` for all schema changes
- [ ] Includes proper error handling
- [ ] Documents what the migration does
- [ ] Tests on local environment first
- [ ] Includes rollback notes if needed
- [ ] Updates this documentation

## Current Issues & Next Steps

### 🔴 Critical - Apply Cleanup Migration
```bash
# Apply the audit cleanup migration
supabase db push --linked
```

### 🟡 Performance Optimization Needed
- Missing indexes on frequently queried columns
- RLS policies could be optimized for complex friend queries

### 🟡 Data Integrity Improvements
- Add validation constraints for enum-like fields
- Implement soft deletes for audit trails

## Environment Sync Process

### Local Development Reset
```bash
# Complete reset with latest migrations
supabase stop
supabase start
# All migrations auto-applied
```

### Staging Deployment
```bash
# Apply new migrations to staging
supabase db push --linked --db-url <staging-url>
```

### Production Deployment
```bash
# Always use the production-safe scripts in PRODUCTION_MIGRATION_INSTRUCTIONS.md
# Never run raw `supabase db push` on production
```

## Monitoring & Maintenance

### Weekly Checks
- [ ] Verify all environments have same migration state
- [ ] Check for slow queries in production
- [ ] Review RLS policy performance
- [ ] Monitor storage usage

### Monthly Tasks
- [ ] Update local environment with fresh staging data
- [ ] Review and clean up any orphaned records
- [ ] Analyze query performance and add indexes if needed
- [ ] Update this documentation

## Troubleshooting

### Migration Conflicts
If migrations fail due to existing objects:
1. Check if the object already exists correctly
2. Use `DROP IF EXISTS` followed by `CREATE`
3. For production: Create a new migration to fix conflicts

### Schema Drift
If environments get out of sync:
1. Use `supabase db diff` to compare schemas
2. Create corrective migrations
3. Apply systematically: local → staging → production

### Performance Issues
Common solutions:
1. Add missing indexes (check query plans)
2. Optimize RLS policies with security definer functions
3. Consider materialized views for complex aggregations

## Security Notes

### RLS Policies Status
- ✅ All user data protected by RLS
- ✅ Friend system properly secured
- ✅ OAuth connections isolated per user
- ✅ Public profiles respect privacy settings

### Authentication
- ✅ Multiple OAuth providers (Google, Discord, Twitch)
- ✅ Proper session management
- ✅ Secure token handling

## Next Migration Guidelines

When creating new migrations:
1. **Filename**: Use format `YYYYMMDDHHMMSS_descriptive_name.sql`
2. **Safety**: Always use production-safe patterns
3. **Testing**: Test locally and on staging first
4. **Documentation**: Update this file with changes
5. **Rollback**: Include notes on how to reverse if needed

## Contact & Support

For database issues:
- Local development: Check `supabase logs`
- Staging/Production: Use Supabase Dashboard monitoring
- Migration questions: Refer to this document and `PRODUCTION_MIGRATION_INSTRUCTIONS.md`