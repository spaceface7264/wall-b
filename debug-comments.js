const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
);

async function debugComments() {
  console.log('🔍 Debugging Comment Structure...\n');

  try {
    // Get all comments
    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.log('❌ Error fetching comments:', error.message);
      return;
    }

    console.log(`📊 Found ${comments.length} total comments:`);
    console.log('');

    // Group comments by post
    const commentsByPost = {};
    comments.forEach(comment => {
      if (!commentsByPost[comment.post_id]) {
        commentsByPost[comment.post_id] = [];
      }
      commentsByPost[comment.post_id].push(comment);
    });

    Object.keys(commentsByPost).forEach(postId => {
      const postComments = commentsByPost[postId];
      console.log(`📝 Post ID: ${postId}`);
      console.log(`   Total comments: ${postComments.length}`);
      
      const topLevel = postComments.filter(c => !c.parent_comment_id);
      const replies = postComments.filter(c => c.parent_comment_id);
      
      console.log(`   Top-level comments: ${topLevel.length}`);
      console.log(`   Replies: ${replies.length}`);
      
      if (topLevel.length > 0) {
        console.log('   Top-level comments:');
        topLevel.forEach(comment => {
          console.log(`     • ${comment.content.substring(0, 50)}... (ID: ${comment.id})`);
          
          const commentReplies = replies.filter(r => r.parent_comment_id === comment.id);
          if (commentReplies.length > 0) {
            console.log(`       Replies to this comment:`);
            commentReplies.forEach(reply => {
              console.log(`         ↳ ${reply.content.substring(0, 40)}... (ID: ${reply.id})`);
            });
          }
        });
      }
      
      console.log('');
    });

    // Test the getReplies function logic
    console.log('🧪 Testing getReplies function logic:');
    if (comments.length > 0) {
      const testComment = comments.find(c => !c.parent_comment_id);
      if (testComment) {
        const replies = comments.filter(c => c.parent_comment_id === testComment.id);
        console.log(`   Test comment ID: ${testComment.id}`);
        console.log(`   Replies found: ${replies.length}`);
        replies.forEach(reply => {
          console.log(`     - ${reply.content.substring(0, 30)}...`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugComments();
