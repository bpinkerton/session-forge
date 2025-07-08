# Debugging OAuth Issues

## Current Problem
OAuth login redirects back to login screen with an error in the URL.

## Steps to Debug

### 1. Check Browser Developer Tools
1. Open your app: http://localhost:5173
2. Open Developer Tools (F12)
3. Go to **Console** tab
4. Go to **Network** tab
5. Try OAuth login again
6. Look for:
   - Red errors in Console
   - Failed network requests in Network tab
   - Any redirect URLs with error parameters

### 2. Check OAuth Provider Settings

Make sure each provider has these URLs configured:

**Google Cloud Console:**
- Authorized JavaScript origins: 
  - `http://localhost:5173`
  - `http://localhost:54321`
- Authorized redirect URIs:
  - `http://localhost:54321/auth/v1/callback`

**Discord Developer Portal:**
- Redirects:
  - `http://localhost:54321/auth/v1/callback`

**Twitch Developer Console:**
- OAuth Redirect URLs:
  - `http://localhost:54321/auth/v1/callback`

### 3. Test the OAuth Flow Step by Step

1. **Manual OAuth URL Test:**
   ```
   http://localhost:54321/auth/v1/authorize?provider=google&redirect_to=http://localhost:5173
   ```

2. **Check if credentials are loaded:**
   ```bash
   # Check if your OAuth credentials are being read
   docker exec supabase_auth_session-forge env | grep -E "GOOGLE_|DISCORD_|TWITCH_"
   ```

### 4. Common Issues & Solutions

**Issue: "Invalid redirect_uri"**
- Solution: Add `http://localhost:54321/auth/v1/callback` to OAuth provider

**Issue: "Invalid client_id"**
- Solution: Check `supabase/.env.local` has correct credentials

**Issue: "Unauthorized redirect_uri"**
- Solution: Supabase config `site_url` and `additional_redirect_urls` need to match your app

**Issue: Gets to callback but then redirects to login**
- Solution: App is not handling the auth state properly

### 5. Current Configuration

Your local Supabase should be configured with:
- Site URL: `http://localhost:5173`
- Additional redirect URLs: `["http://localhost:5173", "http://127.0.0.1:5173"]`
- OAuth providers: Google, Discord, Twitch enabled

### 6. Test Commands

```bash
# Check if Supabase is running
supabase status

# Check OAuth provider status
curl -s "http://localhost:54321/auth/v1/settings" | jq '.external'

# Manual test OAuth URL (replace google with discord/twitch)
open "http://localhost:54321/auth/v1/authorize?provider=google&redirect_to=http://localhost:5173"
```