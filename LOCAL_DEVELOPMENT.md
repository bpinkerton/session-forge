# Local Supabase Development Workflow

This guide explains how to use Supabase local development for testing database changes before deploying to production.

## Overview

Using Supabase locally allows you to:
- Test database migrations before applying them to staging/production
- Develop with a local database (faster, no internet required)
- Test schema changes safely
- Generate migration files from your changes
- Keep your local and remote databases in sync

## Setup

### 1. Environment Configuration

Create a `.env.local` file with these configurations:

```bash
# For local development
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# For remote development (staging)
# VITE_SUPABASE_URL=https://rvuhpidukddvpoulwdkj.supabase.co
# VITE_SUPABASE_ANON_KEY=<your-staging-anon-key>
```

### 2. Start Local Supabase

```bash
# Start all services
supabase start

# Check status
supabase status
```

### 3. Apply Existing Migrations

```bash
# Push all existing migrations to your local database
supabase db push

# Or reset the database and apply all migrations fresh
supabase db reset
```

## Development Workflow

### Making Database Changes

1. **Make changes in Supabase Studio** (http://localhost:54323)
   - Create tables, columns, functions, etc.
   - Test your changes locally

2. **Generate a migration file**
   ```bash
   # Generate migration from your changes
   supabase db diff -f <migration_name>
   
   # Example for friend codes:
   supabase db diff -f add_friend_codes
   ```

3. **Review the generated migration**
   ```bash
   # Check the generated file
   cat supabase/migrations/*_add_friend_codes.sql
   ```

4. **Test the migration**
   ```bash
   # Reset and reapply all migrations
   supabase db reset
   ```

### Manual Migration Creation

If you prefer writing migrations manually:

1. **Create a new migration file**
   ```bash
   supabase migration new <migration_name>
   ```

2. **Edit the migration file**
   ```bash
   # Copy your SQL to the generated file
   cp sql/05-friend-codes/001_add_friend_codes.sql supabase/migrations/$(date +%Y%m%d%H%M%S)_add_friend_codes.sql
   ```

3. **Apply the migration locally**
   ```bash
   supabase db push
   ```

## Testing Friend Code Migration

Let's test the friend code feature locally:

1. **Apply the friend code migration**
   ```bash
   # Create migration file
   cp sql/05-friend-codes/001_add_friend_codes.sql supabase/migrations/$(date +%Y%m%d%H%M%S)_add_friend_codes.sql
   
   # Apply it
   supabase db push
   ```

2. **Test in local app**
   - Update `.env.local` to use local URLs
   - Run `npm run dev`
   - Sign up/login
   - Check profile for friend code

3. **Verify in Studio**
   - Go to http://localhost:54323
   - Check `user_profiles` table
   - Verify `friend_code` column exists

## Syncing with Remote Database

### Pull Remote Schema

```bash
# Pull schema from staging/production
supabase db pull

# This creates a migration file with any differences
```

### Push to Remote

Once tested locally:

1. **Link to remote project**
   ```bash
   supabase link --project-ref rvuhpidukddvpoulwdkj
   ```

2. **Push migrations**
   ```bash
   # Push to staging/production
   supabase db push --linked
   ```

## Switching Between Local and Remote

### Use Local Database
```bash
# In .env.local
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<local-anon-key>
```

### Use Remote Database
```bash
# In .env.local
VITE_SUPABASE_URL=https://rvuhpidukddvpoulwdkj.supabase.co
VITE_SUPABASE_ANON_KEY=<remote-anon-key>
```

## Common Commands

```bash
# Start local Supabase
supabase start

# Stop local Supabase
supabase stop

# View status and URLs
supabase status

# Reset database (reapply all migrations)
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > src/types/database.ts

# View logs
supabase logs

# Access services
# - Studio: http://localhost:54323
# - API: http://localhost:54321
# - Database: postgresql://postgres:postgres@localhost:54322/postgres
```

## Best Practices

1. **Always test migrations locally first**
   - Use `supabase db reset` to ensure clean application

2. **Use version control for migrations**
   - Commit migration files to git
   - Never modify existing migration files

3. **Name migrations descriptively**
   - Use format: `YYYYMMDDHHMMSS_descriptive_name.sql`

4. **Keep migrations idempotent**
   - Use `IF NOT EXISTS` for creating tables
   - Use `ON CONFLICT` for inserts

5. **Document breaking changes**
   - Note any changes that require app updates

## Troubleshooting

### Docker Issues
```bash
# Make sure Docker is running
docker ps

# Restart Supabase
supabase stop
supabase start
```

### Migration Conflicts
```bash
# Reset local database
supabase db reset

# Pull latest from remote
supabase db pull
```

### Type Generation
```bash
# Generate types from local database
supabase gen types typescript --local > src/types/database.ts

# Generate types from remote
supabase gen types typescript --project-id rvuhpidukddvpoulwdkj > src/types/database.ts
```