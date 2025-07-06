# Branch Protection Setup Guide

This directory contains GitHub branch protection rulesets that can be imported to enforce proper Git workflow and CI/CD practices.

## 📋 Available Rulesets

### 1. `branch-protection-ruleset.json` (Recommended for most teams)
**Basic protection for main and develop branches:**
- ✅ Requires 1 pull request review
- ✅ Requires CI checks to pass (Test Suite, Build, Lint)
- ✅ Dismisses stale reviews on new pushes
- ✅ Prevents direct pushes and force pushes
- ✅ Requires linear history (no merge commits)
- ✅ Prevents branch deletion

### 2. `comprehensive-branch-protection.json` (Enterprise/High-security)
**Advanced protection with security requirements:**
- ✅ Requires 2 pull request reviews
- ✅ Requires code owner reviews
- ✅ All basic protections plus:
  - Security audit checks
  - Secret scanning
  - License compliance
  - Required staging deployment
- ✅ Stricter enforcement

### 3. `feature-branch-protection.json` (Feature branch standards)
**Light protection for feature branches:**
- ✅ Requires basic CI checks (Test Suite, Build)
- ✅ Prevents force pushes
- ✅ Applies to `feature/*`, `hotfix/*`, `bugfix/*` branches

## 🚀 How to Import Rulesets

### Method 1: GitHub CLI (Recommended)
```bash
# Install GitHub CLI if not already installed
brew install gh

# Authenticate
gh auth login

# Import the basic ruleset
gh api repos/:owner/:repo/rulesets \
  --method POST \
  --input .github/branch-protection-ruleset.json

# Import feature branch ruleset
gh api repos/:owner/:repo/rulesets \
  --method POST \
  --input .github/feature-branch-protection.json
```

### Method 2: GitHub Web Interface
1. Go to your repository on GitHub
2. Navigate to **Settings** → **Rules** → **Rulesets**
3. Click **New ruleset** → **Import a ruleset**
4. Upload the JSON file
5. Review and click **Create**

### Method 3: GitHub REST API
```bash
# Replace YOUR_TOKEN, OWNER, and REPO
curl -X POST \
  -H "Authorization: token YOUR_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/OWNER/REPO/rulesets \
  -d @.github/branch-protection-ruleset.json
```

## 🔧 Customization

### Required Status Checks
The rulesets reference these CI job names. Make sure they match your workflow job names:

**From `ci.yml`:**
- `Test Suite`
- `Build Application` 

**From `pr-checks.yml`:**
- `Lint & Format Check`
- `Build Check`

**From `security.yml`:**
- `Dependency Security Audit`
- `Secret Scanning`
- `License Compliance`

### Modifying Rules
To customize the rulesets:

1. **Change required reviewers:**
   ```json
   "required_approving_review_count": 1  // Change to 2 for stricter reviews
   ```

2. **Add/remove status checks:**
   ```json
   "required_status_checks": [
     {
       "context": "Your Custom Check Name",
       "integration_id": null
     }
   ]
   ```

3. **Modify bypass actors:**
   ```json
   "bypass_actors": [
     {
       "actor_id": 1,
       "actor_type": "Integration",    // GitHub Apps
       "bypass_mode": "pull_request"   // or "always"
     }
   ]
   ```

## 🎯 Recommended Setup Order

1. **Start with basic protection** (`branch-protection-ruleset.json`)
2. **Add feature branch protection** (`feature-branch-protection.json`)
3. **Upgrade to comprehensive** (after team is comfortable with workflow)

## 🔍 Verification

After importing, verify the rules are working:

1. Try to push directly to main (should be blocked)
2. Create a PR without CI passing (should be blocked)
3. Create a PR with passing CI (should be mergeable)

## 🆘 Troubleshooting

### Common Issues:

**"Required status check not found"**
- Check that your CI job names match exactly
- Ensure CI has run at least once on a PR

**"Cannot import ruleset"**
- Verify JSON syntax with `jq .github/branch-protection-ruleset.json`
- Check repository permissions (need admin access)

**"Bypass actors not working"**
- Actor IDs may need to be updated for your organization
- Use GitHub Apps integration ID for automated processes

## 📚 Additional Resources

- [GitHub Rulesets Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets)
- [GitHub Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [Status Check API](https://docs.github.com/en/rest/commits/statuses)