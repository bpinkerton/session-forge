# Production Setup Plan

## Current State → Future State

### Current State
- **Single Supabase Project**: Contains test data, used for everything
- **Vercel**: Auto-deploys to production with test data

### Future State
- **Current Supabase Project**: Becomes STAGING environment
- **New Supabase Project**: Clean PRODUCTION environment
- **Vercel**: Test-gated deployments with proper environment isolation

## Migration Steps

### Step 1: Create Production Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create new project: `session-forge-prod` (or similar)
3. Choose the same region as your staging project
4. Save the credentials:
   ```
   Production URL: https://xxxxx.supabase.co
   Production Anon Key: eyJ...
   ```

### Step 2: Set Up Production Database Schema

Since your current project already has the schema, you can copy it:

```bash
# 1. Export schema from current (staging) project
npx supabase db dump --db-url "postgresql://postgres:[STAGING_PASSWORD]@db.[STAGING_PROJECT_ID].supabase.co:5432/postgres" > schema.sql

# 2. Apply schema to production project
npx supabase db push --db-url "postgresql://postgres:[PROD_PASSWORD]@db.[PROD_PROJECT_ID].supabase.co:5432/postgres" < schema.sql
```

Or manually:
1. Copy your migration files from `supabase/migrations/`
2. Apply them to the production project

### Step 3: Configure Vercel Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

#### Production Environment (main branch only)
```
VITE_SUPABASE_URL = https://[NEW-PROD-PROJECT].supabase.co
VITE_SUPABASE_ANON_KEY = eyJ...[NEW-PROD-ANON-KEY]...
```
Select: ✅ Production only

#### Preview Environment (develop branch & PRs)
```
VITE_SUPABASE_URL = https://[CURRENT-PROJECT].supabase.co
VITE_SUPABASE_ANON_KEY = eyJ...[CURRENT-ANON-KEY]...
```
Select: ✅ Preview only

### Step 4: Update Local Development

Update your `.env.local`:
```bash
# For local development, use staging (current project)
VITE_SUPABASE_URL=https://[CURRENT-PROJECT].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...[CURRENT-ANON-KEY]...
```

### Step 5: Test the Setup

1. **Test Staging**: 
   ```bash
   git checkout develop
   git push  # Should deploy to staging with current Supabase
   ```

2. **Test Production**:
   ```bash
   git checkout main
   git push  # Should deploy to production with new clean Supabase
   ```

## Benefits of This Approach

✅ **No Data Migration** - Keep all test data in staging
✅ **Clean Production** - Start fresh with real user data
✅ **Cost Effective** - Reuse existing project instead of creating new staging
✅ **Immediate Implementation** - No need to move any data

## Post-Migration Checklist

- [ ] Production Supabase project created
- [ ] Schema copied to production
- [ ] Vercel environment variables configured
- [ ] Test deployment to staging (develop branch)
- [ ] Test deployment to production (main branch)
- [ ] Update team documentation
- [ ] Set up production backups
- [ ] Configure production security rules

## Security Considerations

### Production Project Settings
1. Enable RLS (Row Level Security) on all tables
2. Set up proper authentication rules
3. Enable 2FA for Supabase dashboard access
4. Regular automated backups
5. Monitoring and alerts

### Staging Project Settings
1. Keep RLS enabled (good practice)
2. Less restrictive for testing
3. Can be reset anytime
4. No critical data

## Future Considerations

### When to Reset Staging Data
- When it gets too cluttered
- Before major testing phases
- On a regular schedule (monthly?)

### Production Data in Staging
- Never copy production data to staging
- Use data generation scripts instead
- Keep environments completely isolated