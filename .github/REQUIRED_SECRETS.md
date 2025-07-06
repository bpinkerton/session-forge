# Required GitHub Secrets Configuration

This document lists all the secrets that need to be configured in your GitHub repository for the CI/CD pipeline to work properly.

## 🔑 How to Add Secrets

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret listed below

## 📋 Required Secrets

### Supabase Configuration

#### `SUPABASE_ACCESS_TOKEN`
- **Description**: Personal access token for Supabase CLI authentication
- **How to get**: 
  1. Go to [Supabase Dashboard](https://app.supabase.com)
  2. Click your profile → **Access Tokens**
  3. Generate a new token with appropriate permissions
- **Used in**: All Supabase branching workflows
- **Required for**: Preview branch creation, schema syncing, cleanup

#### `SUPABASE_PROJECT_ID`
- **Description**: Your main Supabase project reference ID
- **How to get**:
  1. Go to your Supabase project dashboard
  2. Settings → General → Reference ID
- **Format**: `abcdefghijklmnop` (16 character string)
- **Used in**: All Supabase CLI commands

#### `STAGING_SUPABASE_URL`
- **Description**: Supabase URL for staging environment (fallback when preview branch unavailable)
- **How to get**:
  1. Supabase project → Settings → API
  2. Copy the Project URL
- **Format**: `https://your-staging-project.supabase.co`
- **Used in**: Vercel preview deployments as fallback

#### `STAGING_SUPABASE_ANON_KEY`
- **Description**: Supabase anonymous key for staging environment
- **How to get**:
  1. Supabase project → Settings → API
  2. Copy the `anon` `public` key
- **Format**: `eyJ...` (long JWT token)
- **Used in**: Vercel preview deployments as fallback

### Vercel Configuration

#### `VERCEL_TOKEN`
- **Description**: Vercel authentication token for deployments
- **How to get**:
  1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
  2. Settings → Tokens
  3. Create a new token
- **Scope**: Should have deployment permissions
- **Used in**: All Vercel deployment workflows

#### `VERCEL_ORG_ID`
- **Description**: Your Vercel organization/team ID
- **How to get**:
  1. Run `vercel link` in your project locally
  2. Check `.vercel/project.json` for `orgId`
  3. OR: Vercel Dashboard → Settings → General
- **Format**: `team_xxxxxxxxxxxxxxxx` or `prj_xxxxxxxxxxxxxxxx`
- **Used in**: Vercel deployments

#### `VERCEL_PROJECT_ID`
- **Description**: Your Vercel project ID
- **How to get**:
  1. Run `vercel link` in your project locally
  2. Check `.vercel/project.json` for `projectId`
  3. OR: Vercel project → Settings → General → Project ID
- **Format**: `prj_xxxxxxxxxxxxxxxx`
- **Used in**: Vercel deployments

## 🔧 Optional Secrets (For Enhanced Features)

### GitHub Integration

#### `GITHUB_TOKEN`
- **Description**: Automatically provided by GitHub Actions
- **Note**: This is automatically available, you don't need to create it
- **Used in**: PR comments, status updates

## 🚨 Security Best Practices

### Token Permissions
- **Supabase Token**: Grant minimum required permissions (project management, database access)
- **Vercel Token**: Grant only deployment permissions, not account management
- **Never commit tokens**: Always use GitHub secrets, never hardcode in code

### Token Rotation
- **Regularly rotate** access tokens (quarterly recommended)
- **Monitor usage** in respective dashboards
- **Revoke unused tokens** immediately

### Environment Separation
- **Use different projects** for staging vs production
- **Separate tokens** for different environments when possible
- **Limit token scope** to specific projects/organizations

## 🔍 Verification

After adding all secrets, you can verify the configuration by:

1. **Creating a test PR** to trigger the preview workflows
2. **Checking workflow logs** in GitHub Actions tab
3. **Confirming Supabase branch creation** in Supabase Dashboard
4. **Verifying Vercel deployment** in Vercel Dashboard

## 🆘 Troubleshooting

### Common Issues

**"Authentication failed"**
- Check token validity and permissions
- Verify token format (no extra spaces/characters)
- Ensure token scope includes required permissions

**"Project not found"**
- Verify project IDs are correct
- Check that tokens have access to specified projects
- Ensure project exists and is active

**"Invalid JSON response"**
- Check Supabase CLI version compatibility
- Verify project reference ID format
- Check network connectivity and API availability

### Getting Help

1. **Check workflow logs** for specific error messages
2. **Verify all secrets** are properly configured
3. **Test individual commands** locally with same tokens
4. **Check service status** (Supabase, Vercel) for outages

## 📚 Related Documentation

- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)