# CI/CD Workflows

Simple and reliable: **Vercel handles deployments**, **GitHub Actions runs tests**.

## How It Works

### 🧪 Tests (GitHub Actions)
- **`ci.yml`** runs on every push/PR
- Lints, type checks, tests, and builds
- Fast feedback on code quality

### 🚀 Deployments (Vercel)
- **Automatic preview deployments** for every PR
- **Automatic production deployment** when merged to main
- **Built-in Vercel GitHub integration** - no custom workflows needed

## That's it!

No complex test-gating, no custom deployment scripts, no staging environments. Just reliable, automatic deployments with separate test feedback.