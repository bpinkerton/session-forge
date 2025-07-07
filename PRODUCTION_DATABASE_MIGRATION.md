# Production Database Migration Guide

This guide covers migrating your SessionForge database schema from staging to production Supabase.

## 🚀 Migration Methods

### Method 1: Using Supabase CLI (Recommended)

1. **Install Supabase CLI**
```bash
# macOS/Linux
brew install supabase/tap/supabase

# Or using npm
npm install -g supabase
```

2. **Generate migrations from staging**
```bash
# Login to Supabase
supabase login

# Link to your staging project
supabase link --project-ref your-staging-project-ref

# Generate a migration from your staging database
supabase db diff --schema public > production_schema.sql
```

3. **Apply to production**
```bash
# Link to production project
supabase link --project-ref your-production-project-ref

# Apply the migration
supabase db push production_schema.sql
```

### Method 2: Manual SQL Export/Import

1. **Export schema from staging Supabase Dashboard**
   - Go to SQL Editor in staging project
   - Run this to generate complete schema:
```sql
-- Get complete schema dump
SELECT 
  'CREATE EXTENSION IF NOT EXISTS "' || extname || '";' as sql
FROM pg_extension
WHERE extname NOT IN ('plpgsql', 'pg_stat_statements')
UNION ALL
SELECT 
  pg_catalog.pg_get_functiondef(p.oid) || ';' as sql
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
UNION ALL
SELECT 
  'CREATE TABLE ' || schemaname || '.' || tablename || ' (' ||
  array_to_string(
    array_agg(
      column_name || ' ' || data_type || 
      CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END
    ), ', '
  ) || ');' as sql
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY schemaname, tablename;
```

2. **Use the SQL files in order**
```bash
# Execute these files in your production Supabase SQL editor:
01-initial/database-migration-v2.sql
01-initial/database-complete-fix.sql
02-features/campaign-invitations.sql
02-features/campaign-soft-delete.sql
03-fixes/fix-campaign-policies.sql
03-fixes/fix-soft-delete-function.sql
03-fixes/fix-invitation-ambiguous-column.sql
04-user-profiles/003_user_profiles.sql
04-user-profiles/004_storage_setup.sql  # If exists
```

### Method 3: pg_dump (Most Complete)

1. **From staging Supabase**
```bash
# Get connection string from Supabase dashboard
STAGING_DB_URL="postgresql://postgres:[password]@[host]:[port]/postgres"

# Dump schema only (no data)
pg_dump "$STAGING_DB_URL" \
  --schema-only \
  --no-owner \
  --no-privileges \
  --no-subscriptions \
  --no-publications \
  --schema=public \
  --schema=auth \
  --schema=storage \
  > sessionforge_schema.sql
```

2. **Apply to production**
```bash
PROD_DB_URL="postgresql://postgres:[password]@[host]:[port]/postgres"

# Apply schema
psql "$PROD_DB_URL" < sessionforge_schema.sql
```

## 📋 Production Setup Checklist

### 1. Database Schema Migration
- [ ] Create production Supabase project
- [ ] Enable required extensions (uuid-ossp, pgcrypto)
- [ ] Run migrations in order (see Method 2)
- [ ] Verify all tables created
- [ ] Verify RLS policies active
- [ ] Test trigger functions

### 2. Storage Setup
- [ ] Create 'profile-pictures' bucket
- [ ] Set bucket to public
- [ ] Apply storage policies from migration

### 3. Authentication Setup
- [ ] Enable Email auth
- [ ] Configure OAuth providers:
  - [ ] Google OAuth
  - [ ] Discord OAuth
  - [ ] Configure redirect URLs for production domain

### 4. Environment Configuration
```env
# Production .env
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-prod-anon-key
VITE_ENVIRONMENT=production
VITE_ENABLE_DEBUG=false
VITE_ENABLE_ANALYTICS=true
```

### 5. OAuth Redirect URLs
Configure in each OAuth provider's console:
- **Callback URL**: `https://your-prod-project.supabase.co/auth/v1/callback`
- **Redirect URL**: `https://your-production-domain.com`

### 6. Post-Migration Verification
```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

-- Verify storage bucket
SELECT name, public 
FROM storage.buckets;
```

## 🔄 Staging vs Production Configuration

### Staging
- **Supabase Project**: staging-sessionforge
- **Domain**: staging.sessionforge.com
- **Environment**: `VITE_ENVIRONMENT=staging`
- **Debug**: Enabled
- **Analytics**: Disabled

### Production  
- **Supabase Project**: prod-sessionforge
- **Domain**: sessionforge.com
- **Environment**: `VITE_ENVIRONMENT=production`
- **Debug**: Disabled
- **Analytics**: Enabled

## ⚠️ Important Notes

1. **No Data Migration**: This guide covers schema only. User data stays in staging.
2. **OAuth Apps**: You'll need separate OAuth apps for production with production URLs.
3. **Secrets**: Never commit production credentials to git.
4. **Testing**: Always test migrations on a development database first.
5. **Backups**: Enable point-in-time recovery in production Supabase.

## 🚨 Rollback Strategy

If issues occur:
1. Production Supabase maintains automatic backups
2. Keep schema export before migration
3. Can restore using Supabase dashboard's backup feature

## 📝 Migration Order Summary

```sql
-- Run in this exact order:
1. 01-initial/database-migration-v2.sql
2. 01-initial/database-complete-fix.sql  
3. 02-features/campaign-invitations.sql
4. 02-features/campaign-soft-delete.sql
5. 03-fixes/fix-campaign-policies.sql
6. 03-fixes/fix-soft-delete-function.sql
7. 03-fixes/fix-invitation-ambiguous-column.sql
8. 04-user-profiles/003_user_profiles.sql
9. 04-user-profiles/004_storage_setup.sql (if exists)
```

After migration, your production database will have the complete SessionForge schema ready for use!