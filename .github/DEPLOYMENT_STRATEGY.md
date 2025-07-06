# SessionForge Deployment Strategy

## Branch Deployment Matrix

| Branch | Tests Required | Deployment Target | Automatic | Trigger |
|--------|---------------|-------------------|-----------|---------|
| `main` | ✅ All must pass | Production | Yes | Push after tests pass |
| `develop` | ✅ All must pass | Staging | Yes | Push after tests pass |
| `feature/*` | ❌ No deployment | None | No | N/A |
| Pull Requests | ✅ All must pass | Preview | Yes | PR opened/updated |

## Deployment URLs

- **Production**: `sessionforge.vercel.app` (or your custom domain)
- **Staging**: `sessionforge-staging.vercel.app`
- **Preview**: `sessionforge-[pr-number].vercel.app`

## Key Features

### 🛡️ Test Protection
- **Zero broken deployments** - deployments only happen after tests pass
- Failing tests = no deployment (automatic blocking)
- Includes unit tests, integration tests, linting, and type checking

### 🔄 Automatic Deployments
- **Production**: Automatic on `main` branch (after tests)
- **Staging**: Automatic on `develop` branch (after tests)
- **Preview**: Automatic on pull requests (after tests)
- **Feature branches**: No automatic deployments

### 🚀 Deployment Flow

```
1. Developer pushes code
2. GitHub Actions runs tests
3. If tests pass → Deploy to appropriate environment
4. If tests fail → Block deployment & notify
```

## Why This Strategy?

1. **Safety**: Production never receives broken code
2. **Visibility**: Every PR gets a preview URL for testing
3. **Staging**: `develop` branch provides a staging environment
4. **Simplicity**: Feature branches don't clutter deployments
5. **Speed**: Automatic deployments when it's safe

## Manual Override

If you absolutely need to deploy despite test failures (not recommended):

```bash
# Deploy directly using Vercel CLI
vercel --prod  # Production
vercel         # Preview
```

⚠️ **Warning**: Manual deployments bypass test protection!