# Setting Up OAuth for Local Development

## Overview

To use OAuth providers (Google, Discord, Twitch) with your local Supabase instance, you need to configure both the OAuth providers and your local Supabase settings.

## Step 1: Update OAuth Provider Settings

For each OAuth provider, you need to add localhost redirect URLs:

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project → APIs & Services → Credentials
3. Click on your OAuth 2.0 Client ID
4. Add these to **Authorized JavaScript origins**:
   - `http://localhost:5173`
   - `http://localhost:54321`
5. Add these to **Authorized redirect URIs**:
   - `http://localhost:54321/auth/v1/callback`
   - `http://localhost:5173`

### Discord OAuth
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application → OAuth2
3. Add these to **Redirects**:
   - `http://localhost:54321/auth/v1/callback`
   - `http://localhost:5173`

### Twitch OAuth
1. Go to [Twitch Developer Console](https://dev.twitch.tv/console/apps)
2. Select your application → Edit
3. Add these to **OAuth Redirect URLs**:
   - `http://localhost:54321/auth/v1/callback`
   - `http://localhost:5173`

## Step 2: Configure Local Environment

1. **Add your OAuth credentials to `supabase/.env.local`**:
   ```bash
   # Copy your actual OAuth credentials from your password manager
   GOOGLE_CLIENT_ID=your_actual_google_client_id
   GOOGLE_CLIENT_SECRET=your_actual_google_client_secret
   
   DISCORD_CLIENT_ID=your_actual_discord_client_id
   DISCORD_CLIENT_SECRET=your_actual_discord_client_secret
   
   TWITCH_CLIENT_ID=your_actual_twitch_client_id
   TWITCH_CLIENT_SECRET=your_actual_twitch_client_secret
   ```

2. **Restart Supabase with the new config**:
   ```bash
   supabase stop
   supabase start
   ```

## Step 3: Test OAuth Login

1. Start your app:
   ```bash
   npm run dev
   ```

2. Try logging in with each OAuth provider
3. Check the Inbucket email interface at http://localhost:54324 if you need to verify emails

## Common Issues

### "Redirect URI mismatch" Error
- Make sure you've added `http://localhost:54321/auth/v1/callback` to your OAuth provider
- The redirect URI must match exactly (including http:// not https://)

### "Invalid client" Error
- Check that your credentials in `supabase/.env.local` are correct
- Make sure there are no extra spaces or quotes around the values

### Google OAuth "400: redirect_uri_mismatch"
- Google requires `skip_nonce_check = true` for local development
- This is already set in the `config.local.toml`

### OAuth Works but User Not Created
- Check Supabase logs: `supabase logs auth`
- Verify email confirmations are disabled for local dev in `config.toml`:
  ```toml
  [auth.email]
  enable_confirmations = false
  ```

## Security Notes

- **Never commit** `supabase/.env.local` to git (it's already in .gitignore)
- Use the same OAuth app for local and production if possible (just add localhost URLs)
- Remove localhost URLs from OAuth providers when done developing

## Alternative: Create Separate OAuth Apps

If you prefer complete separation, create new OAuth apps specifically for development:

1. **Google**: Create a new project with suffix "-dev"
2. **Discord**: Create a new application with suffix "-dev"
3. **Twitch**: Create a new application with suffix "-dev"

Then use these development-only credentials in your local environment.