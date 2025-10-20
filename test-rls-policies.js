// Test script to verify RLS policies are working correctly
// Run this with: node test-rls-policies.js

const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRLSPolicies() {
  console.log('Testing RLS policies...\n');

  try {
    // Test 1: Check if we can access conversation_participants
    console.log('1. Testing conversation_participants access...');
    const { data: participants, error: participantsError } = await supabase
      .from('conversation_participants')
      .select('user_id, conversation_id, joined_at')
      .limit(5);

    if (participantsError) {
      console.error('❌ conversation_participants access failed:', participantsError);
    } else {
      console.log('✅ conversation_participants access successful:', participants?.length || 0, 'records');
    }

    // Test 2: Check if we can access profiles
    console.log('\n2. Testing profiles access...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, email')
      .limit(5);

    if (profilesError) {
      console.error('❌ profiles access failed:', profilesError);
    } else {
      console.log('✅ profiles access successful:', profiles?.length || 0, 'records');
    }

    // Test 3: Test the joined query that's failing
    console.log('\n3. Testing joined query (conversation_participants + profiles)...');
    const { data: joinedData, error: joinedError } = await supabase
      .from('conversation_participants')
      .select(`
        user_id,
        joined_at,
        profiles!user_id (
          id,
          full_name,
          avatar_url,
          email
        )
      `)
      .limit(5);

    if (joinedError) {
      console.error('❌ Joined query failed:', joinedError);
      console.error('Error details:', {
        message: joinedError.message,
        details: joinedError.details,
        hint: joinedError.hint,
        code: joinedError.code
      });
    } else {
      console.log('✅ Joined query successful:', joinedData?.length || 0, 'records');
    }

    // Test 4: Check current user
    console.log('\n4. Testing authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Auth check failed:', authError);
    } else if (user) {
      console.log('✅ User authenticated:', user.id);
    } else {
      console.log('⚠️ No user authenticated (this might be expected for anon key)');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testRLSPolicies();

