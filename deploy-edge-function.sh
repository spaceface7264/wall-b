#!/bin/bash
# Deploy Supabase Edge Function for user deletion
# This script will guide you through deploying the delete-users function

set -e  # Exit on error

cd "$(dirname "$0")"

PROJECT_REF="xnxdxuoecnulcoapawtu"
FUNCTION_NAME="delete-users"

echo "🚀 Deploying Supabase Edge Function: $FUNCTION_NAME"
echo ""

# Step 1: Check if logged in
echo "Step 1: Checking Supabase CLI authentication..."
if ! supabase projects list &>/dev/null; then
    echo "❌ Not logged in. Please login first:"
    echo "   supabase login"
    echo ""
    echo "This will open your browser to authenticate."
    exit 1
fi
echo "✅ Authenticated"
echo ""

# Step 2: Link project
echo "Step 2: Linking project..."
if supabase link --project-ref "$PROJECT_REF" 2>&1 | grep -q "already linked"; then
    echo "✅ Project already linked"
else
    supabase link --project-ref "$PROJECT_REF"
    echo "✅ Project linked"
fi
echo ""

# Step 3: Check if service role key is set
echo "Step 3: Checking service role key secret..."
if supabase secrets list 2>&1 | grep -q "SERVICE_ROLE_KEY"; then
    echo "✅ Service role key secret is set"
else
    echo "⚠️  Service role key secret not found"
    echo ""
    echo "Please set it with:"
    echo "   supabase secrets set SERVICE_ROLE_KEY=your-service-role-key"
    echo ""
    echo "Get your service role key from:"
    echo "   https://supabase.com/dashboard/project/$PROJECT_REF/settings/api"
    echo ""
    read -p "Press Enter after you've set the secret, or Ctrl+C to cancel..."
fi
echo ""

# Step 4: Deploy function
echo "Step 4: Deploying function..."
supabase functions deploy "$FUNCTION_NAME"
echo ""

echo "✅ Deployment complete!"
echo ""
echo "The function is now available at:"
echo "   https://$PROJECT_REF.supabase.co/functions/v1/$FUNCTION_NAME"
echo ""
echo "You can now use user deletion in the admin panel."

