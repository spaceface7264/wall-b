'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Users, MessageCircle, Plus, Heart, MessageSquare, Clock, X, ThumbsUp, Reply, Send } from 'lucide-react';
import SidebarLayout from '../components/SidebarLayout';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
);

export default function Community() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [showNewPost, setShowNewPost] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [loadingLikes, setLoadingLikes] = useState(new Set());

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        loadUserLikes(user.id);
      }
    };
    getUser();
    fetchPosts();
  }, []);

  const loadUserLikes = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', userId)
        .not('post_id', 'is', null);

      if (error) {
        console.error('Error loading user likes:', error);
        return;
      }

      const likedPostIds = new Set(data.map(like => like.post_id));
      setLikedPosts(likedPostIds);
    } catch (error) {
      console.error('Error loading user likes:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        // Fallback to mock data if database doesn't exist yet
        const mockPosts = [
          {
            id: 1,
            title: "Welcome to the Community!",
            content: "This is our community space where you can share ideas, ask questions, and connect with other users. Click on any post to read the full content and join the conversation!",
            user_name: "Admin",
            user_email: "admin@example.com",
            created_at: new Date().toISOString(),
            like_count: 12,
            comment_count: 3
          },
          {
            id: 2,
            title: "Mobile App Development Tips",
            content: "Here are some best practices for building mobile-first applications with React and Next.js. Focus on performance, user experience, and responsive design. Always test on real devices and consider offline functionality.",
            user_name: "Developer",
            user_email: "dev@example.com",
            created_at: new Date(Date.now() - 3600000).toISOString(),
            like_count: 8,
            comment_count: 5
          },
          {
            id: 3,
            title: "UI/UX Design Patterns",
            content: "Sharing some modern design patterns that work well for mobile applications. Consider using consistent spacing, clear typography, and intuitive navigation patterns. Always prioritize accessibility and user feedback.",
            user_name: "Designer",
            user_email: "designer@example.com",
            created_at: new Date(Date.now() - 7200000).toISOString(),
            like_count: 15,
            comment_count: 7
          }
        ];
        setPosts(mockPosts);
      } else {
        setPosts(data || []);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (postId) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
        setComments([]);
      } else {
        setComments(data || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    }
  };

  const handleNewPost = async (e) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.content.trim() || !user) return;

    const post = {
      title: newPost.title.trim(),
      content: newPost.content.trim(),
      user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
      user_email: user.email,
      like_count: 0,
      comment_count: 0
    };

    try {
      const { data, error } = await supabase
        .from('posts')
        .insert([{
          ...post,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating post:', error);
        // Add to local state as fallback
        const newPostData = {
          id: Date.now(),
          ...post,
          created_at: new Date().toISOString()
        };
        setPosts([newPostData, ...posts]);
      } else {
        setPosts([data, ...posts]);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      // Add to local state as fallback
      const newPostData = {
        id: Date.now(),
        ...post,
        created_at: new Date().toISOString()
      };
      setPosts([newPostData, ...posts]);
    }

    setNewPost({ title: '', content: '' });
    setShowNewPost(false);
  };

  const handleLike = async (postId) => {
    if (!user || loadingLikes.has(postId)) return;

    setLoadingLikes(prev => new Set([...prev, postId]));

    try {
      const isLiked = likedPosts.has(postId);
      
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error unliking post:', error);
          return;
        }

        setLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
        
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, like_count: Math.max(0, post.like_count - 1) }
            : post
        ));

        // Update selected post if it's the same
        if (selectedPost && selectedPost.id === postId) {
          setSelectedPost(prev => ({
            ...prev,
            like_count: Math.max(0, prev.like_count - 1)
          }));
        }
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert([{
            post_id: postId,
            user_id: user.id
          }]);

        if (error) {
          console.error('Error liking post:', error);
          return;
        }

        setLikedPosts(prev => new Set([...prev, postId]));
        
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, like_count: post.like_count + 1 }
            : post
        ));

        // Update selected post if it's the same
        if (selectedPost && selectedPost.id === postId) {
          setSelectedPost(prev => ({
            ...prev,
            like_count: prev.like_count + 1
          }));
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLoadingLikes(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !selectedPost) return;

    const comment = {
      post_id: selectedPost.id,
      user_id: user.id,
      user_email: user.email,
      user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
      content: newComment.trim()
    };

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([comment])
        .select()
        .single();

      if (error) {
        console.error('Error creating comment:', error);
        // Add to local state as fallback
        const newCommentData = {
          id: Date.now(),
          ...comment,
          created_at: new Date().toISOString(),
          like_count: 0
        };
        setComments([...comments, newCommentData]);
      } else {
        setComments([...comments, data]);
      }

      // Update comment count in posts list
      setPosts(prev => prev.map(post => 
        post.id === selectedPost.id 
          ? { ...post, comment_count: post.comment_count + 1 }
          : post
      ));

      // Update comment count in selected post
      setSelectedPost(prev => ({
        ...prev,
        comment_count: prev.comment_count + 1
      }));

      setNewComment('');
    } catch (error) {
      console.error('Error creating comment:', error);
    }
  };

  const openPost = (post) => {
    setSelectedPost(post);
    fetchComments(post.id);
  };

  const closePost = () => {
    setSelectedPost(null);
    setComments([]);
    setNewComment('');
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <SidebarLayout currentPage="community">
      <div className="mobile-container">
        <div className="mobile-section">
          {/* Header Card */}
          <div className="mobile-card">
            <div className="mobile-card-header">
              <div>
                <h1 className="mobile-card-title">Community</h1>
                <p className="mobile-card-subtitle">
                  Connect with other users, share ideas, and build together.
                </p>
              </div>
              <button
                onClick={() => setShowNewPost(true)}
                className="mobile-btn-primary"
              >
                <Plus className="minimal-icon" />
                New Post
              </button>
            </div>
          </div>

          {/* New Post Modal */}
          {showNewPost && (
            <div className="fixed inset-0 bg-black bg-opacity-50 minimal-flex-center z-50">
              <div className="minimal-card p-6 max-w-2xl w-full mx-4">
                <div className="minimal-flex-between mb-4">
                  <h3 className="mobile-subheading">Create New Post</h3>
                  <button
                    onClick={() => setShowNewPost(false)}
                    className="mobile-btn-secondary"
                  >
                    <X className="minimal-icon" />
                  </button>
                </div>
                <form onSubmit={handleNewPost}>
                  <div className="space-y-4">
                    <div>
                      <input
                        type="text"
                        value={newPost.title}
                        onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Post title..."
                        className="w-full minimal-input"
                        maxLength={100}
                        required
                      />
                    </div>
                    <div>
                      <textarea
                        value={newPost.content}
                        onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="What's on your mind? Share your thoughts with the community..."
                        className="w-full minimal-input h-32 resize-none"
                        maxLength={1000}
                        required
                      />
                    </div>
                  </div>
                  <div className="minimal-flex-between mt-4">
                    <p className="minimal-text text-xs text-gray-400">
                      {newPost.content.length}/1000 characters
                    </p>
                    <div className="minimal-flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowNewPost(false)}
                        className="mobile-btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!newPost.title.trim() || !newPost.content.trim()}
                        className="mobile-btn-primary disabled:opacity-50"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Post Detail Modal */}
          {selectedPost && (
            <div className="fixed inset-0 bg-black bg-opacity-50 minimal-flex-center z-50">
              <div className="minimal-card p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="minimal-flex-between mb-4">
                  <h3 className="mobile-subheading">{selectedPost.title}</h3>
                  <button
                    onClick={closePost}
                    className="mobile-btn-secondary"
                  >
                    <X className="minimal-icon" />
                  </button>
                </div>
                
                {/* Post Content */}
                <div className="mb-6">
                  <div className="minimal-flex mb-3">
                    <div className="w-8 h-8 bg-gray-700 rounded-full minimal-flex-center mr-3">
                      <Users className="minimal-icon text-gray-300" />
                    </div>
                    <div>
                      <h4 className="minimal-heading">{selectedPost.user_name}</h4>
                      <div className="minimal-flex mobile-text-xs text-gray-400">
                        <Clock className="minimal-icon mr-1" />
                        <span>{formatTime(selectedPost.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mobile-card-content">
                    {selectedPost.content}
                  </div>
                  
                  <div className="mobile-card-actions">
                    <div className="minimal-flex gap-4">
                      <button 
                        onClick={() => handleLike(selectedPost.id)}
                        disabled={loadingLikes.has(selectedPost.id)}
                        className={`minimal-flex ${likedPosts.has(selectedPost.id) ? 'text-red-400' : 'text-gray-400 hover:text-red-400'} ${loadingLikes.has(selectedPost.id) ? 'opacity-50' : ''}`}
                      >
                        {loadingLikes.has(selectedPost.id) ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
                        ) : (
                          <Heart className={`minimal-icon mr-1 ${likedPosts.has(selectedPost.id) ? 'fill-current' : ''}`} />
                        )}
                        <span className="mobile-text-xs">{selectedPost.like_count}</span>
                      </button>
                      <button className="minimal-flex text-gray-400">
                        <MessageCircle className="minimal-icon mr-1" />
                        <span className="mobile-text-xs">{selectedPost.comment_count}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="border-t border-gray-700 pt-6">
                  <h4 className="minimal-heading mb-4">Comments ({comments.length})</h4>
                  
                  {/* Add Comment */}
                  <form onSubmit={handleComment} className="mb-6">
                    <div className="minimal-flex gap-3">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 minimal-input"
                        maxLength={500}
                      />
                      <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="mobile-btn-primary disabled:opacity-50"
                      >
                        <Send className="minimal-icon" />
                      </button>
                    </div>
                  </form>

                  {/* Comments List */}
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="mobile-card-compact">
                        <div className="minimal-flex mb-2">
                          <div className="w-6 h-6 bg-gray-700 rounded-full minimal-flex-center mr-2">
                            <Users className="w-3 h-3 text-gray-300" />
                          </div>
                          <div>
                            <h5 className="minimal-text font-medium">{comment.user_name}</h5>
                            <div className="minimal-flex mobile-text-xs text-gray-400">
                              <Clock className="w-3 h-3 mr-1" />
                              <span>{formatTime(comment.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        <p className="mobile-text-sm text-gray-300 ml-8">
                          {comment.content}
                        </p>
                      </div>
                    ))}
                    
                    {comments.length === 0 && (
                      <div className="text-center py-8">
                        <MessageCircle className="minimal-icon mx-auto mb-2 text-gray-500" />
                        <p className="minimal-text">No comments yet. Be the first to comment!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Posts Feed */}
          <div className="mobile-section">
            {loading ? (
              <div className="mobile-card">
                <div className="minimal-flex-center py-8">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                  <p className="mobile-text-sm">Loading posts...</p>
                </div>
              </div>
            ) : posts.length === 0 ? (
              <div className="mobile-card">
                <div className="minimal-flex-center py-8">
                  <div className="text-center">
                    <MessageSquare className="minimal-icon mx-auto mb-2 text-gray-500" />
                    <p className="mobile-text-sm">No posts yet. Be the first to share!</p>
                  </div>
                </div>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="mobile-card cursor-pointer" onClick={() => openPost(post)}>
                  <div className="mobile-card-header">
                    <div className="minimal-flex">
                      <div className="w-8 h-8 bg-gray-700 rounded-full minimal-flex-center mr-3">
                        <Users className="minimal-icon text-gray-300" />
                      </div>
                      <div>
                        <h3 className="mobile-subheading">{post.title}</h3>
                        <div className="minimal-flex mobile-text-xs text-gray-400">
                          <span>by {post.user_name}</span>
                          <span className="mx-2">•</span>
                          <Clock className="minimal-icon mr-1" />
                          <span>{formatTime(post.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="minimal-heading mb-2">{post.title}</h4>
                    <p className="mobile-card-content">
                      {post.content.length > 150 
                        ? `${post.content.substring(0, 150)}...` 
                        : post.content
                      }
                    </p>
                  </div>
                  
                  <div className="mobile-card-actions">
                    <div className="minimal-flex gap-4">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(post.id);
                        }}
                        disabled={loadingLikes.has(post.id)}
                        className={`minimal-flex ${likedPosts.has(post.id) ? 'text-red-400' : 'text-gray-400 hover:text-red-400'} ${loadingLikes.has(post.id) ? 'opacity-50' : ''}`}
                      >
                        {loadingLikes.has(post.id) ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
                        ) : (
                          <Heart className={`minimal-icon mr-1 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                        )}
                        <span className="mobile-text-xs">{post.like_count}</span>
                      </button>
                      <button className="minimal-flex text-gray-400 hover:text-indigo-400">
                        <MessageCircle className="minimal-icon mr-1" />
                        <span className="mobile-text-xs">{post.comment_count}</span>
                      </button>
                    </div>
                    <p className="mobile-text-xs text-gray-400">Click to read more</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}