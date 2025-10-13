const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
);

async function testCommentReplies() {
  console.log('🧪 Testing Comment Reply System...\n');

  try {
    // 1. Get a test post
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, title')
      .limit(1);

    if (postsError || !posts.length) {
      console.log('❌ No posts found to test with');
      return;
    }

    const testPost = posts[0];
    console.log(`📝 Using post: "${testPost.title}" (ID: ${testPost.id})`);

    // 2. Get a test user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ No authenticated user found');
      return;
    }
    console.log(`👤 Using user: ${user.email}`);

    // 3. Create a top-level comment
    console.log('\n📝 Creating top-level comment...');
    const { data: topComment, error: topError } = await supabase
      .from('comments')
      .insert({
        post_id: testPost.id,
        user_id: user.id,
        user_name: user.user_metadata?.full_name || user.email,
        content: 'This is a top-level comment for testing replies',
        parent_comment_id: null,
        like_count: 0,
        reply_count: 0
      })
      .select()
      .single();

    if (topError) {
      console.log('❌ Error creating top-level comment:', topError.message);
      return;
    }
    console.log(`✅ Top-level comment created: ${topComment.id}`);

    // 4. Create a reply to the top-level comment
    console.log('\n💬 Creating reply to top-level comment...');
    const { data: reply, error: replyError } = await supabase
      .from('comments')
      .insert({
        post_id: testPost.id,
        user_id: user.id,
        user_name: user.user_metadata?.full_name || user.email,
        content: 'This is a reply to the top-level comment',
        parent_comment_id: topComment.id,
        like_count: 0,
        reply_count: 0
      })
      .select()
      .single();

    if (replyError) {
      console.log('❌ Error creating reply:', replyError.message);
      return;
    }
    console.log(`✅ Reply created: ${reply.id}`);

    // 5. Update the parent comment's reply count
    console.log('\n📊 Updating parent comment reply count...');
    const { error: updateError } = await supabase
      .from('comments')
      .update({ reply_count: 1 })
      .eq('id', topComment.id);

    if (updateError) {
      console.log('❌ Error updating reply count:', updateError.message);
    } else {
      console.log('✅ Reply count updated');
    }

    // 6. Verify the comment structure
    console.log('\n🔍 Verifying comment structure...');
    const { data: allComments, error: fetchError } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', testPost.id)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.log('❌ Error fetching comments:', fetchError.message);
      return;
    }

    console.log(`\n📋 Found ${allComments.length} comments:`);
    allComments.forEach((comment, index) => {
      const isReply = comment.parent_comment_id !== null;
      const indent = isReply ? '  ↳ ' : '• ';
      console.log(`${indent}${comment.content} (${isReply ? 'Reply' : 'Top-level'})`);
    });

    // 7. Test comment filtering
    const topLevelComments = allComments.filter(c => !c.parent_comment_id);
    const replies = allComments.filter(c => c.parent_comment_id);

    console.log(`\n📊 Summary:`);
    console.log(`  Top-level comments: ${topLevelComments.length}`);
    console.log(`  Replies: ${replies.length}`);

    // 8. Test reply retrieval for specific comment
    const testCommentReplies = allComments.filter(c => c.parent_comment_id === topComment.id);
    console.log(`  Replies to test comment: ${testCommentReplies.length}`);

    console.log('\n✅ Comment reply system test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCommentReplies();
