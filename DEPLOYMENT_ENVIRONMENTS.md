# SessionForge Deployment Environments

This document outlines the configuration for staging and production environments.

## 🌍 Environment Overview

| Environment | Purpose | Database | URL | Branch |
|------------|---------|----------|-----|---------|
| Development | Local dev | Local/Staging Supabase | http://localhost:5173 | feature/* |
| Staging | Testing & QA | Staging Supabase | https://staging.sessionforge.com | develop |
| Production | Live users | Production Supabase | https://sessionforge.com | main |

## 🔧 Environment Configuration

### Development Environment
```env
# .env.local
VITE_SUPABASE_URL=https://your-staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=staging-anon-key
VITE_ENVIRONMENT=development
VITE_ENABLE_DEBUG=true
VITE_ENABLE_ANALYTICS=false
```

### Staging Environment
```env
# Vercel/Netlify Environment Variables
VITE_SUPABASE_URL=https://your-staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=staging-anon-key
VITE_ENVIRONMENT=staging
VITE_ENABLE_DEBUG=true
VITE_ENABLE_ANALYTICS=false
```

### Production Environment
```env
# Vercel/Netlify Environment Variables
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_ANON_KEY=production-anon-key
VITE_ENVIRONMENT=production
VITE_ENABLE_DEBUG=false
VITE_ENABLE_ANALYTICS=true
```

## 🔐 OAuth Configuration

### Google OAuth Setup

#### Staging
1. **Google Cloud Console**
   - Authorized JavaScript origins: `https://staging.sessionforge.com`
   - Authorized redirect URIs: 
     - `https://your-staging-project.supabase.co/auth/v1/callback`
     - `https://staging.sessionforge.com`

2. **Supabase Dashboard (Staging)**
   - Enable Google provider
   - Add Client ID and Secret from Google Cloud Console
   - Site URL: `https://staging.sessionforge.com`

#### Production
1. **Google Cloud Console**
   - Authorized JavaScript origins: `https://sessionforge.com`
   - Authorized redirect URIs:
     - `https://your-production-project.supabase.co/auth/v1/callback`
     - `https://sessionforge.com`

2. **Supabase Dashboard (Production)**
   - Enable Google provider
   - Add Client ID and Secret from Google Cloud Console
   - Site URL: `https://sessionforge.com`

### Discord OAuth Setup

#### Staging
1. **Discord Developer Portal**
   - Create staging app: "SessionForge Staging"
   - Redirects: `https://your-staging-project.supabase.co/auth/v1/callback`

2. **Supabase Dashboard (Staging)**
   - Enable Discord provider
   - Add Client ID and Secret from Discord
   - Scopes: `identify email`

#### Production
1. **Discord Developer Portal**
   - Create production app: "SessionForge"
   - Redirects: `https://your-production-project.supabase.co/auth/v1/callback`

2. **Supabase Dashboard (Production)**
   - Enable Discord provider
   - Add Client ID and Secret from Discord
   - Scopes: `identify email`

## 🚀 Deployment Setup

### Vercel Configuration

1. **Staging Deployment**
   ```json
   {
     "git": {
       "deploymentEnabled": {
         "develop": true
       }
     },
     "env": {
       "VITE_SUPABASE_URL": "@supabase-staging-url",
       "VITE_SUPABASE_ANON_KEY": "@supabase-staging-anon-key",
       "VITE_ENVIRONMENT": "staging"
     }
   }
   ```

2. **Production Deployment**
   ```json
   {
     "git": {
       "deploymentEnabled": {
         "main": true
       }
     },
     "env": {
       "VITE_SUPABASE_URL": "@supabase-production-url",
       "VITE_SUPABASE_ANON_KEY": "@supabase-production-anon-key",
       "VITE_ENVIRONMENT": "production"
     }
   }
   ```

### Netlify Configuration

1. **netlify.toml**
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"

   [context.production]
     environment = { VITE_ENVIRONMENT = "production" }

   [context.develop]
     environment = { VITE_ENVIRONMENT = "staging" }

   [context.branch-deploy]
     environment = { VITE_ENVIRONMENT = "preview" }
   ```

## 📊 Database Management

### Staging Database
- **Purpose**: Testing new features, QA
- **Data**: Test data, can be reset
- **Backups**: Daily (7 day retention)
- **Access**: Development team

### Production Database
- **Purpose**: Live user data
- **Data**: Real user data, never reset
- **Backups**: Continuous (30 day retention)
- **Access**: Restricted, audit logged

## 🔄 Migration Workflow

1. **Feature Development**
   - Develop on feature branch
   - Test with local/staging Supabase
   - Create PR to develop

2. **Staging Deployment**
   - Merge to develop branch
   - Auto-deploy to staging
   - Run migrations on staging Supabase
   - QA testing

3. **Production Release**
   - Create PR from develop to main
   - Review and approve
   - Merge to main
   - Auto-deploy to production
   - Run migrations on production Supabase

## 🚨 Emergency Procedures

### Rollback Production
1. Revert commit on main branch
2. Vercel auto-deploys previous version
3. If database changes: restore from Supabase backup

### Database Issues
1. **Staging**: Can reset from migrations
2. **Production**: Use point-in-time recovery

## 📝 Environment Checklist

### New Staging Setup
- [ ] Create Supabase project
- [ ] Run database migrations
- [ ] Configure OAuth providers
- [ ] Set environment variables
- [ ] Configure deployment platform
- [ ] Test OAuth flows

### New Production Setup  
- [ ] Create separate Supabase project
- [ ] Run database migrations
- [ ] Configure OAuth providers (production URLs)
- [ ] Set environment variables
- [ ] Configure deployment platform
- [ ] Enable backups & monitoring
- [ ] Test OAuth flows
- [ ] Verify environment badge shows "production"

## 🔍 Monitoring

### Application Monitoring
- Error tracking: Sentry (if configured)
- Analytics: Google Analytics (production only)
- Uptime: Vercel/Netlify analytics

### Database Monitoring
- Supabase Dashboard metrics
- Query performance logs
- Storage usage alerts

Remember: Never share production credentials, always use environment variables!