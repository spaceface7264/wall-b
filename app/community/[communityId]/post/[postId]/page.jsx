'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, Heart, MessageCircle, Edit2, Trash2 } from 'lucide-react';
import SidebarLayout from '../../../../components/SidebarLayout';
import CommentThread from '../../../../components/CommentThread';
import CommentInput from '../../../../components/CommentInput';
import CreatePostModal from '../../../../components/CreatePostModal';
// Removed mock data imports - now using Supabase directly

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
);

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { communityId, postId } = params;

  const [user, setUser] = useState(null);
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // Get post from Supabase
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();
      
      if (postError || !postData) {
        console.error('Error fetching post:', postError);
        router.push(`/community/${communityId}`);
        return;
      }

      setPost(postData);

      // Check if user liked the post
      if (user) {
        const { data: like } = await supabase
          .from('likes')
          .select('id')
          .eq('user_id', user.id)
          .eq('post_id', postId)
          .single();
        setLiked(!!like);
      }

      // Get comments with proper ordering (top-level first, then replies)
      const { data: commentsData } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true }); // Changed to ascending for proper threading
      setComments(commentsData || []);

    } catch (error) {
      console.error('Error loading post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user || liking) return;

    setLiking(true);
    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .single();

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('id', existingLike.id);

        if (!error) {
          setLiked(false);
          setPost({ ...post, like_count: Math.max(0, post.like_count - 1) });
        }
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            post_id: postId
          });

        if (!error) {
          setLiked(true);
          setPost({ ...post, like_count: post.like_count + 1 });
        }
      }
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setLiking(false);
    }
  };

  const handleAddComment = async (commentData) => {
    if (!user) return;


    try {
      const { data: newComment, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          user_name: user.user_metadata?.full_name || user.email,
          content: commentData.content,
          parent_comment_id: commentData.parentCommentId || null,
          like_count: 0,
          reply_count: 0
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding comment:', error);
        return;
      }

      if (newComment) {
        // Add comment to local state
        setComments([newComment, ...comments]);
        
        // Update post comment count
        setPost({ ...post, comment_count: post.comment_count + 1 });

        // If this is a reply, update the parent comment's reply count
        if (commentData.parentCommentId) {
          setComments(prevComments => 
            prevComments.map(comment => 
              comment.id === commentData.parentCommentId
                ? { ...comment, reply_count: (comment.reply_count || 0) + 1 }
                : comment
            )
          );
        }

      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!user) return null;

    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('comment_id', commentId)
        .single();

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('id', existingLike.id);

        if (!error) {
          // Update comment like count
          setComments(comments.map(c => 
            c.id === commentId 
              ? { ...c, like_count: Math.max(0, c.like_count - 1) }
              : c
          ));
        }
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            comment_id: commentId
          });

        if (!error) {
          // Update comment like count
          setComments(comments.map(c => 
            c.id === commentId 
              ? { ...c, like_count: c.like_count + 1 }
              : c
          ));
        }
      }
    } catch (error) {
      console.error('Error liking comment:', error);
      return null;
    }
  };

  const handleEditComment = async (commentId, content) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('comments')
        .update({
          content: content,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating comment:', error);
        return;
      }

      // Update local state
      setComments(comments.map(c => 
        c.id === commentId 
          ? { ...c, content: content, updated_at: new Date().toISOString() }
          : c
      ));
    } catch (error) {
      console.error('Error editing comment:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!user) return;

    try {
      // Find the comment to get its parent_comment_id
      const commentToDelete = comments.find(c => c.id === commentId);
      
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting comment:', error);
        return;
      }

      // Remove comment from local state
      setComments(comments.filter(c => c.id !== commentId));
      
      // Update post comment count
      setPost({ ...post, comment_count: Math.max(0, post.comment_count - 1) });

      // If this was a reply, update the parent comment's reply count
      if (commentToDelete && commentToDelete.parent_comment_id) {
        setComments(prevComments => 
          prevComments.map(comment => 
            comment.id === commentToDelete.parent_comment_id
              ? { ...comment, reply_count: Math.max(0, (comment.reply_count || 0) - 1) }
              : comment
          )
        );
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleEditPost = async (postData) => {
    if (!user) return;

    try {
      const { data: updated, error } = await supabase
        .from('posts')
        .update({
          title: postData.title,
          content: postData.content,
          tag: postData.tag,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating post:', error);
        return;
      }

      if (updated) {
        setPost(updated);
      }
    } catch (error) {
      console.error('Error editing post:', error);
    }
  };

  const handleDeletePost = async () => {
    if (!user) return;

    if (confirm('Are you sure you want to delete this post?')) {
      try {
        const { error } = await supabase
          .from('posts')
          .delete()
          .eq('id', postId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error deleting post:', error);
          return;
        }

        router.push(`/community/${communityId}`);
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return date.toLocaleDateString();
  };

  const getTagClass = (tag) => {
    const classes = {
      beta: 'tag-chip tag-beta',
      event: 'tag-chip tag-event',
      question: 'tag-chip tag-question',
      gear: 'tag-chip tag-gear',
      training: 'tag-chip tag-training',
      social: 'tag-chip tag-social',
      news: 'tag-chip tag-news'
    };
    return classes[tag] || 'tag-chip tag-news';
  };

  const getTagLabel = (tag) => {
    const labels = {
      beta: 'Beta',
      event: 'Event',
      question: 'Question',
      gear: 'Gear',
      training: 'Training',
      social: 'Social',
      news: 'News'
    };
    return labels[tag] || 'General';
  };

  // Organize comments by parent
  const topLevelComments = comments.filter(c => !c.parent_comment_id);
  const getReplies = (commentId) => comments.filter(c => c.parent_comment_id === commentId);
  
  // Count only top-level comments for display
  const topLevelCommentCount = topLevelComments.length;



  if (loading) {
    return (
      <SidebarLayout currentPage="community">
        <div className="mobile-container">
          <div className="minimal-flex-center" style={{ minHeight: '50vh' }}>
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="minimal-text">Loading post...</p>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (!post) {
    return (
      <SidebarLayout currentPage="community">
        <div className="mobile-container">
          <div className="minimal-flex-center" style={{ minHeight: '50vh' }}>
            <p className="minimal-text">Post not found</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  const isOwnPost = user && post.user_id === user.id;

  return (
    <SidebarLayout currentPage="community">
      <div className="mobile-container">
        {/* Back Button */}
        <button
          onClick={() => router.push(`/community/${communityId}`)}
          className="mobile-btn-secondary minimal-flex gap-2 mb-4"
        >
          <ArrowLeft className="minimal-icon" />
          Back to Community
        </button>

        {/* Post Card */}
        <div className="mobile-card animate-fade-in" style={{ marginBottom: '24px' }}>
          <div className="mobile-card-header" style={{ marginBottom: '16px' }}>
            <div className="minimal-flex justify-between">
              <div className="flex-1">
                <div className="minimal-flex" style={{ gap: '12px', marginBottom: '12px' }}>
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full minimal-flex-center flex-shrink-0">
                    <span className="text-white font-semibold">
                      {post.user_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="mobile-subheading" style={{ marginBottom: '2px' }}>{post.user_name}</h3>
                    <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                      {formatTime(post.created_at)}
                      {post.updated_at && post.updated_at !== post.created_at && (
                        <span className="ml-1">(edited)</span>
                      )}
                    </p>
                  </div>
                </div>
                <span className={getTagClass(post.tag)}>
                  {getTagLabel(post.tag)}
                </span>
              </div>

              {isOwnPost && (
                <div className="minimal-flex gap-2">
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="mobile-btn-secondary p-2"
                  >
                    <Edit2 className="minimal-icon" />
                  </button>
                  <button
                    onClick={handleDeletePost}
                    className="mobile-btn-secondary p-2 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="minimal-icon" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h1 className="text-2xl font-bold text-white" style={{ marginBottom: '12px', lineHeight: '1.3' }}>
              {post.title}
            </h1>
            <p className="mobile-card-content whitespace-pre-wrap" style={{ lineHeight: '1.7' }}>
              {post.content}
            </p>
          </div>

          <div className="mobile-card-actions" style={{ paddingTop: '16px', marginTop: '16px' }}>
            <div className="minimal-flex" style={{ gap: '20px' }}>
              <button
                onClick={handleLike}
                disabled={liking}
                className={`minimal-flex ${
                  liked ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
                } ${liking ? 'opacity-50' : ''}`}
                style={{ gap: '6px', transition: 'all 0.2s' }}
              >
                {liking ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Heart className={`minimal-icon ${liked ? 'fill-current' : ''}`} />
                )}
                <span>{post.like_count}</span>
              </button>
              <div className="minimal-flex text-gray-400" style={{ gap: '6px' }}>
                <MessageCircle className="minimal-icon" />
                <span>{post.comment_count}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Add Comment Section */}
        <div className="mb-6">
          <h3 className="mobile-subheading mb-3">Add Comment</h3>
          <CommentInput
            postId={postId}
            onSubmit={handleAddComment}
            placeholder="Share your thoughts..."
          />
        </div>


        {/* Comments Section */}
        <div className="mb-6">
          <h3 className="mobile-subheading mb-3">
            Comments ({topLevelCommentCount})
          </h3>

          {topLevelComments.length === 0 ? (
            <div className="mobile-card-flat p-4 text-center">
              <p className="minimal-text">No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <div>
              {topLevelComments.map((comment) => (
                <CommentThread
                  key={comment.id}
                  comment={comment}
                  postId={postId}
                  userId={user?.id}
                  depth={0}
                  replies={getReplies(comment.id)}
                  onReply={handleAddComment}
                  onLike={handleLikeComment}
                  onEdit={handleEditComment}
                  onDelete={handleDeleteComment}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Post Modal */}
      {showEditModal && (
        <CreatePostModal
          communityId={communityId}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleEditPost}
          editMode={true}
          initialData={post}
        />
      )}
    </SidebarLayout>
  );
}

