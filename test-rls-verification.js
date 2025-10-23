const { createClient } = require('@supabase/supabase-js');

// Test RLS policies for posts-profiles join
async function testRLSPolicies() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔍 Testing RLS policies...\n');

  // Test 1: Simple posts query
  console.log('1. Testing simple posts query...');
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('id, title, user_id')
    .limit(3);
  
  if (postsError) {
    console.error('❌ Posts query failed:', postsError);
  } else {
    console.log('✅ Posts query successful:', posts?.length || 0, 'posts found');
  }

  // Test 2: Simple profiles query
  console.log('\n2. Testing simple profiles query...');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, nickname, full_name')
    .limit(3);
  
  if (profilesError) {
    console.error('❌ Profiles query failed:', profilesError);
  } else {
    console.log('✅ Profiles query successful:', profiles?.length || 0, 'profiles found');
  }

  // Test 3: Posts with profiles join
  console.log('\n3. Testing posts-profiles join query...');
  const { data: joinedData, error: joinError } = await supabase
    .from('posts')
    .select(`
      id,
      title,
      user_id,
      profiles!user_id (
        nickname,
        full_name
      )
    `)
    .limit(3);
  
  if (joinError) {
    console.error('❌ Join query failed:', joinError);
    console.error('Error details:', {
      message: joinError.message,
      details: joinError.details,
      hint: joinError.hint,
      code: joinError.code
    });
  } else {
    console.log('✅ Join query successful:', joinedData?.length || 0, 'posts with profiles found');
    if (joinedData && joinedData.length > 0) {
      console.log('Sample data:', JSON.stringify(joinedData[0], null, 2));
    }
  }

  // Test 4: Comments with profiles join
  console.log('\n4. Testing comments-profiles join query...');
  const { data: commentsData, error: commentsError } = await supabase
    .from('comments')
    .select(`
      id,
      content,
      user_id,
      profiles!user_id (
        nickname,
        full_name
      )
    `)
    .limit(3);
  
  if (commentsError) {
    console.error('❌ Comments join query failed:', commentsError);
    console.error('Error details:', {
      message: commentsError.message,
      details: commentsError.details,
      hint: commentsError.hint,
      code: commentsError.code
    });
  } else {
    console.log('✅ Comments join query successful:', commentsData?.length || 0, 'comments with profiles found');
  }

  console.log('\n🏁 RLS test completed');
}

testRLSPolicies().catch(console.error);



