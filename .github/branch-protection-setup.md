# Branch Protection Setup Guide

This guide helps you set up branch protection rules to ensure tests pass before merging.

## Required Branch Protection Rules

### For `main` branch:

1. **Go to**: Repository Settings → Branches → Add rule
2. **Branch name pattern**: `main`
3. **Enable the following settings**:

   ✅ **Require a pull request before merging**
   - Require approvals: 1
   - Dismiss stale PR approvals when new commits are pushed
   - Require review from code owners (if CODEOWNERS file exists)

   ✅ **Require status checks to pass before merging**
   - Require branches to be up to date before merging
   - **Required status checks**:
     - `Test Suite` (from CI/CD Pipeline)
     - `Build Application` (from CI/CD Pipeline)
     - `Lint & Format Check` (from Pull Request Checks)
     - `Test Suite` (from Pull Request Checks)
     - `Build Check` (from Pull Request Checks)

   ✅ **Require conversation resolution before merging**

   ✅ **Require signed commits** (recommended)

   ✅ **Require linear history** (optional, for cleaner git history)

   ✅ **Include administrators** (enforce rules for all users)

### For `develop` branch:

1. **Go to**: Repository Settings → Branches → Add rule
2. **Branch name pattern**: `develop`
3. **Enable the following settings**:

   ✅ **Require a pull request before merging**
   - Require approvals: 1

   ✅ **Require status checks to pass before merging**
   - Require branches to be up to date before merging
   - **Required status checks**:
     - `Test Suite` (from CI/CD Pipeline)
     - `Build Application` (from CI/CD Pipeline)

   ✅ **Include administrators**

## GitHub CLI Setup (Alternative)

You can also set up branch protection using GitHub CLI:

```bash
# Protect main branch
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["Test Suite","Build Application","Lint & Format Check","Build Check"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  --field restrictions=null

# Protect develop branch
gh api repos/:owner/:repo/branches/develop/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["Test Suite","Build Application"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1}' \
  --field restrictions=null
```

## Repository Settings

### General Settings
- **Allow merge commits**: ✅ (default)
- **Allow squash merging**: ✅ (recommended for feature branches)
- **Allow rebase merging**: ✅ (optional)
- **Automatically delete head branches**: ✅ (keeps repo clean)

### Actions Permissions
- **Actions permissions**: Allow all actions and reusable workflows
- **Fork pull request workflows**: Require approval for first-time contributors

## Required Secrets

Add these secrets in Repository Settings → Secrets and variables → Actions:

### For Enhanced Functionality (Optional)
```
CODECOV_TOKEN=your_codecov_token
SLACK_WEBHOOK_URL=your_slack_webhook_url
VERCEL_TOKEN=your_vercel_token (if using Vercel)
NETLIFY_AUTH_TOKEN=your_netlify_token (if using Netlify)
```

## Verification

After setting up branch protection:

1. Create a test feature branch
2. Make a small change
3. Create a pull request to `main`
4. Verify that:
   - Tests must pass before merge is allowed
   - PR review is required
   - Status checks appear and must be green

## Troubleshooting

### Status Checks Not Appearing
- Ensure workflow files are in `.github/workflows/`
- Check that workflow names match the required status checks
- Verify workflows have run at least once on the branch

### Tests Not Running
- Check GitHub Actions tab for workflow execution
- Verify package.json has the correct test scripts
- Ensure dependencies are properly configured

### Permission Issues
- Verify GitHub Actions has write permissions
- Check if branch protection rules apply to administrators
- Ensure personal access tokens have sufficient scope

## Best Practices

1. **Start with develop branch protection** to test workflows
2. **Gradually add more strict rules** as team adapts
3. **Monitor workflow run times** and optimize if needed
4. **Regularly review and update** protection rules
5. **Train team members** on the new workflow

## Test Gate Philosophy

Our pipeline implements a "test-first" deployment strategy:

```
Code Change → Tests Pass → Build Success → Security Check → Deploy
     ↓            ↓            ↓              ↓            ↓
  Required    Required     Required       Required    Approved
```

This ensures:
- **Quality**: All code changes are tested
- **Reliability**: Broken code cannot reach production  
- **Security**: Vulnerabilities are caught early
- **Confidence**: Deployments are predictable and safe