# Environment Architecture

## Recommended Setup

```mermaid
graph TB
    subgraph "Production Environment"
        PM[main branch] --> PD[Production Deploy]
        PD --> PS[(Production Supabase)]
        PD --> PU[sessionforge.com]
    end
    
    subgraph "Staging Environment"
        DM[develop branch] --> SD[Staging Deploy]
        SD --> SS[(Staging Supabase)]
        SD --> SU[staging.sessionforge.com]
    end
    
    subgraph "Preview Environment"
        PR[Pull Requests] --> PV[Preview Deploy]
        PV --> SS[(Staging Supabase)]
        PV --> PRU[pr-123.sessionforge.com]
    end
    
    subgraph "Local Development"
        LD[Local Dev] --> LS[(Local Supabase)]
        LD --> LU[localhost:5173]
    end
```

## Environment Isolation

### Why Separate Databases?

1. **Data Protection**: Production data never exposed in previews
2. **Safe Testing**: Break things in staging without affecting users
3. **Realistic Testing**: Staging mirrors production setup
4. **Easy Cleanup**: Reset staging data anytime

### Database Setup

#### 1. Production Supabase Project
- Real user data
- Strict access controls
- Regular backups
- Production-only API keys

#### 2. Staging Supabase Project
- Test data only
- Shared by staging and preview deployments
- Can be reset/cleaned regularly
- Less restrictive for testing

#### 3. Local Supabase (Optional)
- For offline development
- Complete control
- Fast iteration
- No cloud costs

## Quick Setup Commands

### 1. Create Supabase Projects

```bash
# Create production project
npx supabase projects create session-forge-prod --org-id YOUR_ORG_ID

# Create staging project
npx supabase projects create session-forge-staging --org-id YOUR_ORG_ID
```

### 2. Set Vercel Environment Variables

```bash
# Production variables (main branch only)
vercel env add VITE_SUPABASE_URL production
# Enter: https://xxxxx.supabase.co (production URL)

vercel env add VITE_SUPABASE_ANON_KEY production
# Enter: eyJ... (production anon key)

# Staging/Preview variables (develop & PRs)
vercel env add VITE_SUPABASE_URL preview
# Enter: https://yyyyy.supabase.co (staging URL)

vercel env add VITE_SUPABASE_ANON_KEY preview
# Enter: eyJ... (staging anon key)
```

### 3. Verify Setup

```bash
# Check production
git checkout main
vercel --prod
# Should connect to production Supabase

# Check staging
git checkout develop
vercel
# Should connect to staging Supabase
```

## Migration Strategy

When you need to update database schema:

1. **Develop locally** with local Supabase
2. **Test in staging** by applying migrations
3. **Deploy to production** after verification

```bash
# Apply migrations to staging
npx supabase db push --db-url postgresql://postgres:password@db.staging.supabase.co:5432/postgres

# After testing, apply to production
npx supabase db push --db-url postgresql://postgres:password@db.prod.supabase.co:5432/postgres
```

## Cost Optimization

- **Free Tier**: Use Supabase free tier for staging/preview
- **Pause Unused**: Pause staging project when not in use
- **Share Preview DB**: All previews share staging database
- **Local First**: Develop locally to minimize cloud usage