const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
);

async function checkAndTestReplies() {
  console.log('🔍 Checking posts and testing comment replies...\n');

  try {
    // 1. Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ No authenticated user found');
      return;
    }
    console.log(`👤 User: ${user.email}`);

    // 2. Check for posts
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, title, community_id')
      .limit(5);

    if (postsError) {
      console.log('❌ Error fetching posts:', postsError.message);
      return;
    }

    console.log(`📝 Found ${posts.length} posts:`);
    posts.forEach((post, index) => {
      console.log(`  ${index + 1}. ${post.title} (ID: ${post.id})`);
    });

    if (posts.length === 0) {
      console.log('\n📝 No posts found. Creating a test post...');
      
      // Get a community to create post in
      const { data: communities, error: commError } = await supabase
        .from('communities')
        .select('id, name')
        .limit(1);

      if (commError || !communities.length) {
        console.log('❌ No communities found to create post in');
        return;
      }

      const community = communities[0];
      console.log(`🏘️ Using community: ${community.name}`);

      // Create a test post
      const { data: newPost, error: postError } = await supabase
        .from('posts')
        .insert({
          community_id: community.id,
          user_id: user.id,
          user_name: user.user_metadata?.full_name || user.email,
          user_email: user.email,
          title: 'Test Post for Comment Replies',
          content: 'This is a test post to verify comment reply functionality works correctly.',
          tag: 'general',
          post_type: 'post',
          media_files: [],
          like_count: 0,
          comment_count: 0
        })
        .select()
        .single();

      if (postError) {
        console.log('❌ Error creating test post:', postError.message);
        return;
      }

      console.log(`✅ Test post created: ${newPost.id}`);
      posts.push(newPost);
    }

    // 3. Use the first post for testing
    const testPost = posts[0];
    console.log(`\n🧪 Testing with post: "${testPost.title}"`);

    // 4. Check existing comments
    const { data: existingComments, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', testPost.id)
      .order('created_at', { ascending: true });

    if (commentsError) {
      console.log('❌ Error fetching comments:', commentsError.message);
      return;
    }

    console.log(`\n💬 Found ${existingComments.length} existing comments:`);
    existingComments.forEach((comment, index) => {
      const isReply = comment.parent_comment_id !== null;
      const indent = isReply ? '  ↳ ' : '• ';
      console.log(`${indent}${comment.content.substring(0, 50)}... (${isReply ? 'Reply' : 'Top-level'})`);
    });

    // 5. Test comment structure
    const topLevelComments = existingComments.filter(c => !c.parent_comment_id);
    const replies = existingComments.filter(c => c.parent_comment_id);

    console.log(`\n📊 Comment Structure:`);
    console.log(`  Top-level comments: ${topLevelComments.length}`);
    console.log(`  Replies: ${replies.length}`);

    // 6. Test reply functionality if we have top-level comments
    if (topLevelComments.length > 0) {
      const parentComment = topLevelComments[0];
      console.log(`\n🔧 Testing reply to comment: "${parentComment.content.substring(0, 30)}..."`);

      // Create a test reply
      const { data: testReply, error: replyError } = await supabase
        .from('comments')
        .insert({
          post_id: testPost.id,
          user_id: user.id,
          user_name: user.user_metadata?.full_name || user.email,
          content: 'This is a test reply to verify threading works!',
          parent_comment_id: parentComment.id,
          like_count: 0,
          reply_count: 0
        })
        .select()
        .single();

      if (replyError) {
        console.log('❌ Error creating test reply:', replyError.message);
      } else {
        console.log('✅ Test reply created successfully!');
        
        // Update parent comment reply count
        const { error: updateError } = await supabase
          .from('comments')
          .update({ reply_count: (parentComment.reply_count || 0) + 1 })
          .eq('id', parentComment.id);

        if (updateError) {
          console.log('⚠️ Warning: Could not update reply count:', updateError.message);
        } else {
          console.log('✅ Parent comment reply count updated');
        }
      }
    } else {
      console.log('\n📝 No top-level comments found. Creating one...');
      
      // Create a top-level comment
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
      } else {
        console.log('✅ Top-level comment created');
        
        // Now create a reply
        const { data: reply, error: replyError } = await supabase
          .from('comments')
          .insert({
            post_id: testPost.id,
            user_id: user.id,
            user_name: user.user_metadata?.full_name || user.email,
            content: 'This is a reply to test threading',
            parent_comment_id: topComment.id,
            like_count: 0,
            reply_count: 0
          })
          .select()
          .single();

        if (replyError) {
          console.log('❌ Error creating reply:', replyError.message);
        } else {
          console.log('✅ Reply created successfully!');
          
          // Update parent comment reply count
          const { error: updateError } = await supabase
            .from('comments')
            .update({ reply_count: 1 })
            .eq('id', topComment.id);

          if (updateError) {
            console.log('⚠️ Warning: Could not update reply count:', updateError.message);
          } else {
            console.log('✅ Parent comment reply count updated');
          }
        }
      }
    }

    console.log('\n✅ Comment reply system test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

checkAndTestReplies();
