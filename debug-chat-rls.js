// Debug script to test chat RLS policies
// Run this in the browser console when logged in

async function debugChatRLS() {
  const { createClient } = await import('https://cdn.skypack.dev/@supabase/supabase-js@2');
  
  // You'll need to replace these with your actual Supabase URL and anon key
  const supabaseUrl = 'YOUR_SUPABASE_URL';
  const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('Testing RLS policies...');
  
  // Test 1: Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log('User:', user?.id, authError);
  
  if (!user) {
    console.log('User not authenticated');
    return;
  }
  
  // Test 2: Try to get conversations
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('id, name, type, created_by');
  console.log('Conversations:', conversations, convError);
  
  // Test 3: Try to get conversation participants
  const { data: participants, error: partError } = await supabase
    .from('conversation_participants')
    .select('conversation_id, user_id, joined_at');
  console.log('Participants:', participants, partError);
  
  // Test 4: Try to get profiles
  const { data: profiles, error: profError } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, email')
    .limit(5);
  console.log('Profiles:', profiles, profError);
  
  // Test 5: Try the specific query from GroupMembersModal
  if (conversations && conversations.length > 0) {
    const testConvId = conversations[0].id;
    console.log('Testing GroupMembersModal query for conversation:', testConvId);
    
    const { data: members, error: membersError } = await supabase
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
      .eq('conversation_id', testConvId)
      .order('joined_at', { ascending: true });
      
    console.log('Group members query result:', members, membersError);
  }
}

// Run the debug function
debugChatRLS();

