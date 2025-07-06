# 🚀 SessionForge Environment Quick Reference

## Environment URLs

| Environment | Branch | Supabase | Deployment URL |
|------------|--------|----------|----------------|
| **Production** | `main` | New Clean Project | `sessionforge.vercel.app` |
| **Staging** | `develop` | Current Project (with test data) | `sessionforge-staging.vercel.app` |
| **Preview** | PRs | Current Project (with test data) | `sessionforge-pr-[number].vercel.app` |
| **Local** | - | Current Project (with test data) | `localhost:5173` |

## Quick Commands

```bash
# Deploy to staging
git checkout develop
git push

# Deploy to production  
git checkout main
git push

# Create preview
git checkout -b feature/new-feature
git push -u origin feature/new-feature
# Then open PR

# Check which environment you're in
console.log(import.meta.env.VITE_SUPABASE_URL)
```

## Environment Indicators

Add this to your app for clarity:

```typescript
// In your app header or footer
const getEnvironmentBadge = () => {
  const url = import.meta.env.VITE_SUPABASE_URL
  
  if (url.includes('localhost')) return '🟨 LOCAL'
  if (url.includes('[CURRENT-PROJECT-ID]')) return '🟧 STAGING'
  if (url.includes('[NEW-PROD-PROJECT-ID]')) return '🟩 PRODUCTION'
  return '🟦 PREVIEW'
}
```

## Data Guidelines

### ✅ Staging/Preview (Current Supabase Project)
- Test data only
- Can break things
- Reset anytime
- Shared by all non-production environments

### 🚨 Production (New Supabase Project)
- Real user data
- Handle with care
- Always backup before migrations
- Restricted access

## Emergency Contacts

- **Staging Issues**: Break anything, it's fine!
- **Production Issues**: Alert team immediately
- **Deployment Issues**: Check GitHub Actions logs
- **Database Issues**: Check Supabase dashboard

---

**Remember**: Current Supabase = Staging/Preview | New Supabase = Production 🎯