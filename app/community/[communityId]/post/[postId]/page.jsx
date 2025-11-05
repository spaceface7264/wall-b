
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Edit2, Trash2, Shield, X, ChevronLeft, ChevronRight, MoreVertical, Users, MapPin } from 'lucide-react';
import SidebarLayout from '../../../../components/SidebarLayout';
import CommentThread from '../../../../components/CommentThread';
import CommentInput from '../../../../components/CommentInput';
import CreatePostModal from '../../../../components/CreatePostModal';
import ConfirmationModal from '../../../../components/ConfirmationModal';
import { supabase } from '../../../../../lib/supabase';
import { EmptyComments } from '../../../../components/EmptyState';
import PostCardSkeleton from '../../../../components/PostCardSkeleton';

export default function PostDetailPage() {
  const navigate = useNavigate();
  const params = useParams();
  const { communityId, postId } = params;

  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [showDeletePostModal, setShowDeletePostModal] = useState(false);
  const menuRef = useRef(null);
  const [communityName, setCommunityName] = useState(null);
  const [authorDisplayName, setAuthorDisplayName] = useState(null);
  const [authorAvatar, setAuthorAvatar] = useState(null);
  const [gymData, setGymData] = useState(null);

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowPostMenu(false);
      }
    };

    if (showPostMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPostMenu]);

  // Keyboard navigation for image modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showImageModal || !post?.media_files) return;
      
      if (e.key === 'Escape') {
        setShowImageModal(false);
      } else if (e.key === 'ArrowLeft') {
        setSelectedImageIndex(prev => 
          prev === 0 ? post.media_files.length - 1 : prev - 1
        );
      } else if (e.key === 'ArrowRight') {
        setSelectedImageIndex(prev => 
          prev === post.media_files.length - 1 ? 0 : prev + 1
        );
      }
    };

    if (showImageModal) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [showImageModal, post?.media_files]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // Check admin status
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        
        setIsAdmin(profile?.is_admin || false);
      }

      // Get post from Supabase
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();
      
      if (postError || !postData) {
        console.error('Error fetching post:', postError);
        navigate(`/community/${communityId}`);
        return;
      }

      setPost(postData);

      // Fetch community name and gym data
      const { data: communityData } = await supabase
        .from('communities')
        .select(`
          name,
          gym_id,
          gyms (
            id,
            name,
            city,
            country
          )
        `)
        .eq('id', communityId)
        .single();
      
      if (communityData) {
        setCommunityName(communityData.name);
        // Extract gym data (handle both array and object formats from Supabase)
        const gym = communityData.gyms 
          ? (Array.isArray(communityData.gyms) ? communityData.gyms[0] : communityData.gyms)
          : null;
        if (gym && gym.id) {
          setGymData(gym);
        }
      }

      // Fetch author's display name and avatar from profiles
      if (postData.user_id) {
        const { data: authorProfile } = await supabase
          .from('profiles')
          .select('nickname, full_name, avatar_url')
          .eq('id', postData.user_id)
          .single();
        
        if (authorProfile) {
          const displayName = authorProfile.nickname || authorProfile.full_name || postData.user_name || 'Anonymous';
          setAuthorDisplayName(displayName);
          setAuthorAvatar(authorProfile.avatar_url || null);
        } else {
          setAuthorDisplayName(postData.user_name || 'Anonymous');
          setAuthorAvatar(null);
        }
      }

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

      // Get comments with proper ordering and user profile data
      // Top-level comments: newest first, replies: chronological (oldest first) under parent
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select(`
          *,
          profiles!user_id (
            nickname,
            full_name,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true }); // Load all in chronological order, we'll sort top-level by newest in display

      if (commentsError) {
        console.error('❌ Error loading comments with profiles join:', commentsError);
        console.log('🔄 Trying fallback query without profiles join...');
        
        // Fallback: try without profiles join
        const { data: fallbackComments } = await supabase
          .from('comments')
          .select('*')
          .eq('post_id', postId)
          .order('created_at', { ascending: true });
          
        setComments(fallbackComments || []);
      } else {
        setComments(commentsData || []);
      }

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

          // Create notification for post author (if not the current user)
          if (post.user_id !== user.id) {
            try {
              await supabase
                .from('notifications')
                .insert({
                  user_id: post.user_id,
                  type: 'post_like',
                  title: 'New Like',
                  message: `${user.user_metadata?.full_name || 'Someone'} liked your post`,
                  data: { post_id: postId, liker_id: user.id, community_id: communityId }
                });
            } catch (notifError) {
              console.error('Error creating like notification:', notifError);
            }
          }
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
      // Get user's current display name from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('nickname, full_name')
        .eq('id', user.id)
        .single();

      const displayName = profile?.nickname || profile?.full_name || user.user_metadata?.full_name || 'Anonymous';

      const { data: newComment, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          user_name: displayName,
          content: commentData.content,
          parent_comment_id: commentData.parentCommentId || null,
          like_count: 0,
          reply_count: 0
        })
        .select(`
          *,
          profiles!user_id (
            nickname,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) {
        console.error('Error adding comment:', error);
        return;
      }

      if (newComment) {
        // Add comment to local state and update parent reply count in one operation
        if (commentData.parentCommentId) {
          // It's a reply: append to comments and update parent's reply count
          setComments(prevComments => {
            const updated = prevComments.map(comment => 
              comment.id === commentData.parentCommentId
                ? { ...comment, reply_count: (comment.reply_count || 0) + 1 }
                : comment
            );
            return [...updated, newComment];
          });
        } else {
          // It's a top-level comment: prepend to comments
          setComments([newComment, ...comments]);
        }
        
        // Update post comment count
        setPost({ ...post, comment_count: post.comment_count + 1 });

        // Create notification for post author (if not the current user)
        if (post.user_id !== user.id) {
          try {
            await supabase
              .from('notifications')
              .insert({
                user_id: post.user_id,
                type: 'post_comment',
                title: 'New Comment',
                message: `${user.user_metadata?.full_name || 'Someone'} commented on your post`,
                data: { post_id: postId, comment_id: newComment.id, commenter_id: user.id, community_id: communityId }
              });
          } catch (notifError) {
            console.error('Error creating comment notification:', notifError);
          }
        }

        // If this is a reply, also notify the parent comment author
        if (commentData.parentCommentId) {
          const parentComment = comments.find(c => c.id === commentData.parentCommentId);
          if (parentComment && parentComment.user_id !== user.id) {
            try {
              await supabase
                .from('notifications')
                .insert({
                  user_id: parentComment.user_id,
                  type: 'comment_reply',
                  title: 'New Reply',
                  message: `${user.user_metadata?.full_name || 'Someone'} replied to your comment`,
                  data: { post_id: postId, comment_id: newComment.id, parent_comment_id: commentData.parentCommentId, replier_id: user.id, community_id: communityId }
                });
            } catch (notifError) {
              console.error('Error creating reply notification:', notifError);
            }
          }
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

          // Create notification for comment author (if not the current user)
          const likedComment = comments.find(c => c.id === commentId);
          if (likedComment && likedComment.user_id !== user.id) {
            try {
              await supabase
                .from('notifications')
                .insert({
                  user_id: likedComment.user_id,
                  type: 'comment_like',
                  title: 'New Like',
                  message: `${user.user_metadata?.full_name || 'Someone'} liked your comment`,
                  data: { comment_id: commentId, liker_id: user.id, post_id: postId, community_id: communityId }
                });
            } catch (notifError) {
              console.error('Error creating comment like notification:', notifError);
            }
          }
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
      let query = supabase
        .from('comments')
        .update({
          content: content,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId);

      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      }

      const { error } = await query;

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
      
      let query = supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      }

      const { error } = await query;

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

    try {
      // For admins, don't check user_id - let RLS handle it
      let query = supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      // Only add user_id check for non-admins
      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      }

      const { error } = await query;

      if (error) {
        console.error('Error deleting post:', error);
        return;
      }

      navigate(`/community/${communityId}`);
    } catch (error) {
      console.error('Error deleting post:', error);
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

  const getTagColor = (tag) => {
    const colors = {
      general: '#6b7280',
      beta: '#ef4444',
      event: '#3b82f6',
      question: '#10b981',
      gear: '#f59e0b',
      training: '#8b5cf6',
      social: '#ec4899',
      news: '#6b7280'
    };
    return colors[tag] || '#6b7280';
  };

  const getTagLabel = (tag) => {
    const labels = {
      general: 'General',
      beta: 'Beta',
      event: 'Events',
      question: 'Questions',
      gear: 'Gear',
      training: 'Training',
      social: 'Social',
      news: 'News'
    };
    return labels[tag] || 'General';
  };

  // Organize comments by parent
  // Sort top-level comments: newest first, replies stay in chronological order (oldest first)
  const topLevelComments = comments
    .filter(c => !c.parent_comment_id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // Newest first for top-level
  
  const getReplies = (commentId) => 
    comments
      .filter(c => c.parent_comment_id === commentId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); // Oldest first for replies
  
  // Count only top-level comments for display
  const topLevelCommentCount = topLevelComments.length;



  if (loading) {
  return (
    <SidebarLayout currentPage="community">
      <div className="mobile-container">
        <div className="mobile-section">
            <PostCardSkeleton />
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
  const canEdit = isOwnPost; // Only owners can edit
  const canDelete = isOwnPost || isAdmin; // Owners and admins can delete

  return (
    <SidebarLayout currentPage="community">
      <div className="mobile-container">
        {/* Desktop: Multi-column layout, Mobile: Single column */}
        <div className="desktop-post-detail-layout">
          {/* Left Column: Post Content */}
          <div className="desktop-post-main">
        {/* Post Card */}
        <div className="animate-fade-in w-full border-b border-gray-700/50 mb-6" style={{ paddingBottom: '24px' }}>
          <div className="mobile-card-header mt-6" style={{ marginBottom: '16px' }}>
            <div className="mb-4">
              <div className="flex items-start gap-2 mb-2">
                {/* Profile Icon */}
                <div className="flex-shrink-0">
                  {authorAvatar ? (
                    <img
                      src={authorAvatar}
                      alt={authorDisplayName || 'Author'}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-10 h-10 bg-gradient-to-br from-[#087E8B] to-[#087E8B] rounded-full minimal-flex-center ${authorAvatar ? 'hidden' : ''}`}
                  >
                    <span className="text-white font-semibold text-sm">
                      {authorDisplayName ? authorDisplayName.charAt(0).toUpperCase() : 'A'}
                    </span>
                  </div>
                </div>

                {/* Community, Gym Name and Creator Name Stacked */}
                <div className="flex-1 min-w-0">
                  {/* Breadcrumb: Community and Gym */}
                  <div className="flex flex-col gap-1 mb-1">
                    {/* Community Name with icon */}
                    {communityName && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/community/${communityId}`);
                        }}
                        className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-300 transition-colors cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>{communityName}</span>
                      </button>
                    )}
                    
                    {/* Gym Name with map icon (if exists) */}
                    {gymData && gymData.name && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/gyms/${gymData.id}`);
                        }}
                        className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-300 transition-colors cursor-pointer"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{gymData.name}</span>
                      </button>
                    )}
                  </div>
                  
                  {/* Creator Name */}
                  {authorDisplayName && post?.user_id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/profile/${post.user_id}`);
                      }}
                      className="text-base font-medium text-white hover:text-gray-300 transition-colors cursor-pointer block"
                    >
                      {authorDisplayName}
                    </button>
                  )}
                  {authorDisplayName && !post?.user_id && (
                    <p className="text-base font-medium text-white">
                      {authorDisplayName}
                    </p>
                  )}
                </div>

                {/* Time since post */}
                <div className="flex-shrink-0 pt-0.5">
                  <p className="text-xs text-gray-400">
                    {formatTime(post.created_at)}
                    {post.updated_at && post.updated_at !== post.created_at && (
                      <span className="ml-1">(edited)</span>
                    )}
                  </p>
                </div>

                {/* Three-Dot Menu */}
                {(canEdit || canDelete) && (
                  <div className="relative flex-shrink-0" ref={menuRef}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPostMenu(!showPostMenu);
                      }}
                      className="p-1.5 hover:bg-gray-700 rounded-md transition-colors"
                      aria-label="More options"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>

                    {/* Dropdown Menu */}
                    {showPostMenu && (
                      <div
                        role="menu"
                        className="absolute right-0 top-full mt-1 rounded-lg shadow-lg z-50"
                        style={{ 
                          minWidth: '160px',
                          backgroundColor: 'var(--bg-surface)', 
                          border: '1px solid var(--border-color)',
                          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {canEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowEditModal(true);
                              setShowPostMenu(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors whitespace-nowrap"
                            style={{ 
                              fontSize: '11px',
                              color: 'var(--text-secondary)'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-primary)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            role="menuitem"
                          >
                            <Edit2 className="w-3.5 h-3.5" style={{ flexShrink: 0 }} />
                            <span>Edit Post</span>
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowPostMenu(false);
                              setShowDeletePostModal(true);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors whitespace-nowrap"
                            style={{ 
                              fontSize: '11px',
                              color: '#ef4444'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-primary)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            role="menuitem"
                          >
                            <Trash2 className="w-3.5 h-3.5" style={{ flexShrink: 0 }} />
                            <span>Delete Post</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Post Title */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h1 className="text-2xl font-bold" style={{ lineHeight: '1.3', color: 'var(--text-primary)' }}>
                  {post.title}
                </h1>
                {post.tag && (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${getTagColor(post.tag)}20`,
                      border: `1px solid ${getTagColor(post.tag)}40`,
                      color: getTagColor(post.tag)
                    }}
                  >
                    {getTagLabel(post.tag)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Post Body */}
          <div style={{ marginBottom: '20px' }}>
            <p className="mobile-card-content whitespace-pre-wrap" style={{ lineHeight: '1.7' }}>
              {post.content}
            </p>
          </div>

          {/* Media Files Display */}
          {post.media_files && post.media_files.length > 0 && (
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-2">
                {post.media_files.slice(0, 4).map((file, index) => (
                  <div 
                    key={index} 
                    className="relative cursor-pointer group"
                    onClick={() => {
                      setSelectedImageIndex(index);
                      setShowImageModal(true);
                    }}
                  >
                    {file && file.type && file.type.startsWith('image/') ? (
                      <img
                        src={file.url}
                        alt={file.name || `Image ${index + 1}`}
                        className="w-full h-32 object-cover rounded border border-gray-600 group-hover:opacity-90 transition-opacity"
                        onError={(e) => {
                          console.error('❌ Image failed to load:', file.url, e);
                          e.target.style.display = 'none';
                        }}
                        onLoad={() => console.log('✅ Image loaded successfully:', file.url)}
                      />
                    ) : file && file.type && file.type.startsWith('video/') ? (
                      <video
                        src={file.url}
                        className="w-full h-32 object-cover rounded border border-gray-600 group-hover:opacity-90 transition-opacity"
                        controls
                        onError={(e) => {
                          console.error('❌ Video failed to load:', file.url, e);
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-32 bg-gray-700 rounded-lg border border-gray-600 flex items-center justify-center group-hover:bg-gray-600 transition-colors">
                        <span className="text-gray-400 text-sm">File</span>
                      </div>
                    )}
                    {post.media_files.length > 4 && index === 3 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          +{post.media_files.length - 4} more
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mobile-card-actions" style={{ paddingTop: '0', marginTop: '12px' }}>
            <div className="minimal-flex" style={{ gap: '20px' }}>
              <button
                onClick={handleLike}
                disabled={liking}
                className={`icon-button minimal-flex text-white hover:text-red-400 ${liking ? 'opacity-50' : ''}`}
                style={{ gap: '6px' }}
              >
                {liking ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Heart className={`w-4 h-4 ${liked ? 'fill-current text-red-400' : 'stroke-current'}`} />
                )}
                <span>{post.like_count}</span>
              </button>
              <div className="minimal-flex text-white" style={{ gap: '6px' }}>
                <MessageCircle className="w-4 h-4 stroke-current" />
                <span>{post.comment_count}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Comment Input - Under post, before comments */}
        <div className="mb-6" style={{ marginLeft: 'calc(-1 * var(--container-padding-mobile))', marginRight: 'calc(-1 * var(--container-padding-mobile))', padding: '0 var(--container-padding-mobile)' }}>
          <CommentInput
            postId={postId}
            onSubmit={handleAddComment}
            placeholder="jump in"
          />
            </div>
        </div>

          {/* Right Column: Comments Sidebar (Desktop Only) */}
          <div className="desktop-comments-sidebar">
        {/* Comments Section */}
        <div className="mb-6" style={{ marginLeft: 'calc(-1 * var(--container-padding-mobile))', marginRight: 'calc(-1 * var(--container-padding-mobile))' }}>
          {topLevelComments.length === 0 ? (
            <EmptyComments onCreateClick={() => {/* Scroll to input field */}} />
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
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          )}
            </div>
          </div>

          {/* Mobile: Comments below post */}
          <div className="mobile-comments mobile-only">
            {/* Comments Section */}
            <div className="mb-6" style={{ marginLeft: 'calc(-1 * var(--container-padding-mobile))', marginRight: 'calc(-1 * var(--container-padding-mobile))' }}>
              {topLevelComments.length === 0 ? (
                <EmptyComments onCreateClick={() => {/* Scroll to input field */}} />
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
                      isAdmin={isAdmin}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
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

      {/* Image Modal with Carousel */}
      {showImageModal && post.media_files && post.media_files.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation Arrows */}
            {post.media_files.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImageIndex(prev => 
                    prev === 0 ? post.media_files.length - 1 : prev - 1
                  )}
                  className="absolute left-4 z-10 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setSelectedImageIndex(prev => 
                    prev === post.media_files.length - 1 ? 0 : prev + 1
                  )}
                  className="absolute right-4 z-10 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Main Image/Video */}
            <div className="max-w-full max-h-full flex items-center justify-center">
              {post.media_files[selectedImageIndex] && post.media_files[selectedImageIndex].type && post.media_files[selectedImageIndex].type.startsWith('image/') ? (
                <img
                  src={post.media_files[selectedImageIndex].url}
                  alt={post.media_files[selectedImageIndex].name || `Image ${selectedImageIndex + 1}`}
                  className="max-w-full max-h-full object-contain rounded-lg"
                  onError={(e) => {
                    console.error('❌ Full-size image failed to load:', post.media_files[selectedImageIndex].url, e);
                    e.target.style.display = 'none';
                  }}
                />
              ) : post.media_files[selectedImageIndex] && post.media_files[selectedImageIndex].type && post.media_files[selectedImageIndex].type.startsWith('video/') ? (
                <video
                  src={post.media_files[selectedImageIndex].url}
                  className="max-w-full max-h-full rounded-lg"
                  controls
                  autoPlay
                  onError={(e) => {
                    console.error('❌ Full-size video failed to load:', post.media_files[selectedImageIndex].url, e);
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="bg-gray-700 rounded-lg p-8 text-center">
                  <span className="text-gray-400 text-lg">Unsupported file type</span>
                </div>
              )}
            </div>

            {/* Image Counter */}
            {post.media_files.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 rounded-full px-3 py-1 text-white text-sm">
                {selectedImageIndex + 1} / {post.media_files.length}
              </div>
            )}

            {/* Thumbnail Strip */}
            {post.media_files.length > 1 && (
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto">
                {post.media_files.map((file, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-12 h-12 rounded-lg border-2 overflow-hidden ${
                      index === selectedImageIndex 
                        ? 'border-white' 
                        : 'border-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {file && file.type && file.type.startsWith('image/') ? (
                      <img
                        src={file.url}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : file && file.type && file.type.startsWith('video/') ? (
                      <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                        <span className="text-white text-xs">📹</span>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                        <span className="text-white text-xs">📄</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Post Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeletePostModal}
        onClose={() => setShowDeletePostModal(false)}
        onConfirm={handleDeletePost}
        title="Delete Post"
        message={`Are you sure you want to delete "${post?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        icon={Trash2}
      />
    </SidebarLayout>
  );
}

