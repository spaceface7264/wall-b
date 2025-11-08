#!/bin/bash
# Commands to deploy Supabase Edge Function for user deletion
# Run these after: supabase login

cd /Users/rami/Desktop/html/Proj/proj

# Step 1: Link your project
echo "Linking project..."
supabase link --project-ref xnxdxuoecnulcoapawtu

# Step 2: Set service role key (you'll need to get this from Supabase Dashboard → Settings → API)
# Replace YOUR_SERVICE_ROLE_KEY with your actual service role key
echo ""
echo "Next, set your service role key:"
echo "supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here"
echo ""
echo "Get your service role key from: https://supabase.com/dashboard/project/xnxdxuoecnulcoapawtu/settings/api"
echo ""
echo "Then deploy the function:"
echo "supabase functions deploy delete-users"

