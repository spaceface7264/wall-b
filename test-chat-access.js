// Test script to verify chat RLS policies are working
// Run this with: node test-chat-access.js

const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testChatAccess() {
  console.log('Testing chat RLS policies...\n');

  try {
    // Test 1: Check if we can access conversation_participants
    console.log('1. Testing conversation_participants access...');
    const { data: participants, error: participantsError } = await supabase
      .from('conversation_participants')
      .select('user_id, conversation_id')
      .limit(5);

    if (participantsError) {
      console.error('❌ conversation_participants access failed:', participantsError.message);
    } else {
      console.log('✅ conversation_participants access successful:', participants?.length || 0, 'rows');
    }

    // Test 2: Check if we can access direct_messages
    console.log('\n2. Testing direct_messages access...');
    const { data: messages, error: messagesError } = await supabase
      .from('direct_messages')
      .select('id, conversation_id, sender_id')
      .limit(5);

    if (messagesError) {
      console.error('❌ direct_messages access failed:', messagesError.message);
    } else {
      console.log('✅ direct_messages access successful:', messages?.length || 0, 'rows');
    }

    // Test 3: Check if we can access conversations
    console.log('\n3. Testing conversations access...');
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('id, name, type')
      .limit(5);

    if (conversationsError) {
      console.error('❌ conversations access failed:', conversationsError.message);
    } else {
      console.log('✅ conversations access successful:', conversations?.length || 0, 'rows');
    }

    // Test 4: Test a complex query with joins
    console.log('\n4. Testing complex query with joins...');
    const { data: complexData, error: complexError } = await supabase
      .from('conversation_participants')
      .select(`
        user_id,
        joined_at,
        profiles!user_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .limit(3);

    if (complexError) {
      console.error('❌ Complex query failed:', complexError.message);
    } else {
      console.log('✅ Complex query successful:', complexData?.length || 0, 'rows');
    }

    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testChatAccess();
