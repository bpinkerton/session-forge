#!/bin/bash

# Setup Supabase Branches for SessionForge
# This script creates the staging branch and configures the project for branching

set -e

echo "🚀 Setting up Supabase branches for SessionForge"
echo "=============================================="

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Check for required environment variables
if [ -z "$SUPABASE_PROJECT_ID" ]; then
    echo "❌ SUPABASE_PROJECT_ID not set"
    echo "Please set: export SUPABASE_PROJECT_ID=your-project-id"
    exit 1
fi

if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "❌ SUPABASE_ACCESS_TOKEN not set"
    echo "Please set: export SUPABASE_ACCESS_TOKEN=your-access-token"
    exit 1
fi

echo "✅ Prerequisites checked"

# Create staging branch
echo ""
echo "📌 Creating staging branch..."
supabase branches create staging \
    --project-ref $SUPABASE_PROJECT_ID \
    --experimental \
    --git-branch develop || {
        echo "⚠️  Staging branch might already exist, continuing..."
    }

# Get staging branch details
echo ""
echo "📊 Getting staging branch details..."
STAGING_DETAILS=$(supabase branches show staging \
    --project-ref $SUPABASE_PROJECT_ID \
    --experimental --json)

STAGING_URL=$(echo $STAGING_DETAILS | jq -r '.url')
STAGING_ANON_KEY=$(echo $STAGING_DETAILS | jq -r '.anon_key')

# Get main branch (production) details
echo ""
echo "📊 Getting production branch details..."
PROD_DETAILS=$(supabase branches show main \
    --project-ref $SUPABASE_PROJECT_ID \
    --experimental --json || echo '{}')

# If main branch doesn't exist, use project URL
if [ "$PROD_DETAILS" = "{}" ]; then
    echo "ℹ️  Using project root as production (no main branch)"
    PROD_URL="https://${SUPABASE_PROJECT_ID}.supabase.co"
    # You'll need to get this from your Supabase dashboard
    PROD_ANON_KEY="[YOUR_CURRENT_ANON_KEY]"
else
    PROD_URL=$(echo $PROD_DETAILS | jq -r '.url')
    PROD_ANON_KEY=$(echo $PROD_DETAILS | jq -r '.anon_key')
fi

# Output environment variables
echo ""
echo "✨ Branch setup complete!"
echo ""
echo "📝 Add these to your Vercel environment variables:"
echo ""
echo "=== PRODUCTION (main branch) ==="
echo "VITE_SUPABASE_URL=$PROD_URL"
echo "VITE_SUPABASE_ANON_KEY=$PROD_ANON_KEY"
echo ""
echo "=== STAGING (develop branch) ==="
echo "VITE_SUPABASE_URL=$STAGING_URL"
echo "VITE_SUPABASE_ANON_KEY=$STAGING_ANON_KEY"
echo ""
echo "=== LOCAL DEVELOPMENT (.env.local) ==="
echo "# Use staging branch for local development"
echo "VITE_SUPABASE_URL=$STAGING_URL"
echo "VITE_SUPABASE_ANON_KEY=$STAGING_ANON_KEY"
echo ""

# Create/update .env.local
read -p "Would you like to update .env.local with staging credentials? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cat > .env.local << EOF
# SessionForge Local Development Environment
# Using Supabase staging branch

VITE_SUPABASE_URL=$STAGING_URL
VITE_SUPABASE_ANON_KEY=$STAGING_ANON_KEY

# Environment indicator
VITE_ENVIRONMENT=development
VITE_ENABLE_DEBUG=true
VITE_ENABLE_ANALYTICS=false
EOF
    echo "✅ Updated .env.local with staging credentials"
fi

echo ""
echo "🎉 Setup complete! Next steps:"
echo "1. Add the environment variables to Vercel"
echo "2. Test deployments to ensure correct branch is used"
echo "3. Commit this script for team use"