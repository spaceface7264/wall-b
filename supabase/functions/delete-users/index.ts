// Supabase Edge Function to delete users
// This function requires service role access to delete users from auth.users

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Create Supabase client with service role key
    // SUPABASE_URL is automatically provided by Supabase Edge Functions
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    // Use SERVICE_ROLE_KEY (not SUPABASE_SERVICE_ROLE_KEY) because Supabase CLI doesn't allow secrets starting with SUPABASE_
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    
    if (!supabaseUrl) {
      console.error('Missing SUPABASE_URL environment variable')
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing SUPABASE_URL. This should be automatically provided by Supabase Edge Functions.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (!serviceRoleKey) {
      console.error('Missing SERVICE_ROLE_KEY secret. Set it with: supabase secrets set SERVICE_ROLE_KEY=your-key')
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing SERVICE_ROLE_KEY secret. Set it with: supabase secrets set SERVICE_ROLE_KEY=your-service-role-key' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the requesting user is an admin
    // Decode JWT token to get user ID, then use admin API to get user
    const token = authHeader.replace('Bearer ', '')
    
    let user = null
    let userError = null
    
    try {
      // Decode JWT to get user ID from payload
      const parts = token.split('.')
      if (parts.length !== 3) {
        userError = { message: 'Invalid token format' }
      } else {
        // Decode base64url (JWT uses base64url encoding)
        // Convert base64url to base64, then decode
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
        // Add padding if needed
        const padded = base64 + '='.repeat((4 - base64.length % 4) % 4)
        const payloadJson = atob(padded)
        const payload = JSON.parse(payloadJson)
        const userId = payload.sub
        
        if (!userId) {
          userError = { message: 'Invalid token: missing user ID' }
        } else {
          // Get user using admin API (this works with service role key)
          const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId)
          if (getUserError) {
            userError = getUserError
            console.error('Error getting user by ID:', getUserError.message)
          } else if (userData?.user) {
            user = userData.user
          } else {
            userError = { message: 'User not found' }
          }
        }
      }
    } catch (err) {
      console.error('Error decoding/verifying token:', err)
      userError = { message: 'Invalid token: ' + (err.message || String(err)) }
    }
    
    if (userError) {
      console.error('Error verifying user:', userError.message)
      return new Response(
        JSON.stringify({ error: `Unauthorized: ${userError.message}` }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (!user) {
      console.error('No user found in token')
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error checking admin status:', profileError.message)
      return new Response(
        JSON.stringify({ error: `Forbidden: ${profileError.message}` }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (!profile?.is_admin) {
      console.error(`User ${user.id} is not an admin`)
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required. Your account does not have admin privileges.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { userIds } = await req.json()
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: userIds array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Delete users
    const results = {
      successful: [],
      failed: []
    }

    for (const userId of userIds) {
      try {
        // First, delete the profile (this will cascade delete related data if foreign keys are set up)
        // We need to delete the profile before deleting from auth.users to avoid foreign key constraint issues
        const { error: profileDeleteError } = await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('id', userId)
        
        if (profileDeleteError) {
          console.error(`Error deleting profile for user ${userId}:`, profileDeleteError.message)
          results.failed.push({ userId, error: `Database error deleting user: ${profileDeleteError.message}` })
          continue
        }
        
        // Then delete from auth.users
        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
        if (authDeleteError) {
          console.error(`Error deleting auth user ${userId}:`, authDeleteError.message)
          results.failed.push({ userId, error: `Auth error deleting user: ${authDeleteError.message}` })
        } else {
          results.successful.push(userId)
        }
      } catch (err) {
        console.error(`Unexpected error deleting user ${userId}:`, err)
        results.failed.push({ userId, error: err.message || 'Unknown error' })
      }
    }

    return new Response(
      JSON.stringify({
        success: results.failed.length === 0,
        results
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Unexpected error in delete-users function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

