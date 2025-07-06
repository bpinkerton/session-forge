# Vercel Environment Variables Setup

## Overview

SessionForge requires different environment variables for different deployment environments to ensure data isolation and security.

## Environment Types in Vercel

Vercel has three environment types:
1. **Production** - Used for production deployments (main branch)
2. **Preview** - Used for all preview deployments (PRs and staging)
3. **Development** - Used for local development with `vercel dev`

## Required Environment Variables

### 1. Supabase Configuration

| Variable | Production | Preview/Staging | Development |
|----------|------------|-----------------|-------------|
| `VITE_SUPABASE_URL` | Your production Supabase URL | Your staging/dev Supabase URL | Your local Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | Production anon key | Staging/dev anon key | Local anon key |

### 2. Optional: Feature Flags

| Variable | Production | Preview/Staging | Development |
|----------|------------|-----------------|-------------|
| `VITE_ENABLE_DEBUG` | `false` | `true` | `true` |
| `VITE_ENABLE_ANALYTICS` | `true` | `false` | `false` |

## Setting Up in Vercel Dashboard

### Step 1: Navigate to Environment Variables

1. Go to your Vercel project dashboard
2. Click on "Settings" tab
3. Navigate to "Environment Variables"

### Step 2: Add Variables for Each Environment

For each variable, you'll need to:

1. Enter the variable name (e.g., `VITE_SUPABASE_URL`)
2. Enter the value
3. **Select which environments it applies to:**
   - ✅ Production (for main branch)
   - ✅ Preview (for PRs and develop branch)
   - ✅ Development (for local development)

### Example Configuration

#### Production Variables
```bash
# Production Supabase (main branch only)
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...production-key...
VITE_ENABLE_DEBUG=false
VITE_ENABLE_ANALYTICS=true
```

#### Preview/Staging Variables
```bash
# Staging Supabase (develop branch & PRs)
VITE_SUPABASE_URL=https://your-staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...staging-key...
VITE_ENABLE_DEBUG=true
VITE_ENABLE_ANALYTICS=false
```

## Best Practices

### 1. Use Separate Supabase Projects

**Recommended Setup:**
- **Production Supabase Project** → Production deployments only
- **Staging Supabase Project** → Staging and preview deployments
- **Local Supabase** → Local development

This ensures:
- Production data is never exposed in previews
- Testing doesn't affect production
- Each environment has isolated data

### 2. Variable Naming Convention

Always prefix client-side variables with `VITE_` for Vite to expose them:
- ✅ `VITE_SUPABASE_URL`
- ❌ `SUPABASE_URL`

### 3. Security Considerations

- **Never commit** `.env` files to git
- Use Vercel's environment variables for all sensitive data
- Different API keys for different environments
- Production keys should have restricted permissions

## Vercel CLI Configuration

You can also set environment variables using the Vercel CLI:

```bash
# Set production variable
vercel env add VITE_SUPABASE_URL production

# Set preview variable
vercel env add VITE_SUPABASE_URL preview

# Set development variable
vercel env add VITE_SUPABASE_URL development

# Pull environment variables for local development
vercel env pull .env.local
```

## Local Development Setup

For local development, create a `.env.local` file:

```bash
# .env.local (git ignored)
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key
VITE_ENABLE_DEBUG=true
VITE_ENABLE_ANALYTICS=false
```

## Verification

After setting up, verify your configuration:

1. **Production**: Deploy to main branch and check network requests
2. **Preview**: Open a PR and verify it uses staging database
3. **Local**: Run `npm run dev` and ensure local Supabase is used

## Common Issues

### Variables not working?
- Ensure they're prefixed with `VITE_`
- Restart your dev server after changes
- Clear Vercel cache if needed

### Wrong environment being used?
- Check which environments are selected in Vercel dashboard
- Verify branch settings in deployment configuration

### Need to debug which env is active?
Add this to your app:
```typescript
console.log('Environment:', {
  url: import.meta.env.VITE_SUPABASE_URL,
  isProd: import.meta.env.PROD,
  isDev: import.meta.env.DEV,
})