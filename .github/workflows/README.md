# CI/CD Workflows

Simple test-gated deployments for SessionForge.

## Workflows

### 1. `ci.yml` - Continuous Integration
**Triggers**: All pushes and pull requests

**Steps**:
- Install dependencies
- Run linter (`npm run lint`)
- Type check (`npx tsc --noEmit`)
- Run tests (`npm run test:run`)
- Build application (`npm run build`)

### 2. `vercel-preview.yml` - Preview Deployments
**Triggers**: Pull requests

**Steps**:
- Run all CI checks (tests must pass!)
- Deploy preview to Vercel if tests pass

## That's it!

Simple, reliable, test-gated deployments. No complex staging environments or preview branches - just working software that deploys when tests pass.