import { Heart, MessageCircle, Clock, Share, Bookmark, MoreHorizontal, Edit2, Trash2, Calendar, User, Users, MapPin, Ban, VolumeX, Flag, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from './ConfirmationModal';
import BlockUserModal from './BlockUserModal';
import MuteUserModal from './MuteUserModal';
import ReportPostModal from './ReportPostModal';
import NSFWWarning from './NSFWWarning';
import { isUserBlocked, isUserMuted } from '../../lib/user-blocking';

export default function PostCard({ 
  post, 
  onLike, 
  onComment, 
  onShare, 
  onSave,
  onOpen,
  onEdit,
  onDelete,
  currentUserId,
  isAdmin = false,
  liked = false,
  isLiked = false,
  loadingLike = false,
  isLiking = false,
  showActions = true,
  compact = false
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showMuteModal, setShowMuteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const navigate = useNavigate();
  const isOwnPost = post.user_id === currentUserId;
  const canEdit = showActions && isOwnPost; // Only owners can edit
  const canDelete = showActions && (isOwnPost || isAdmin); // Owners and admins can delete
  const canBlockMute = showActions && !isOwnPost && currentUserId; // Can block/mute if not own post
  const canReport = showActions && currentUserId && !isOwnPost; // Can report if not own post
  const canShowActions = canEdit || canDelete || canBlockMute || canReport; // Show menu if any action is available
  const isPostLiked = liked || isLiked;
  const isPostLoading = loadingLike || isLiking;

  // Check if user is blocked or muted
  useEffect(() => {
    const checkBlockStatus = async () => {
      if (!currentUserId || isOwnPost || !post.user_id) return;
      
      const [blocked, muted] = await Promise.all([
        isUserBlocked(post.user_id),
        isUserMuted(post.user_id)
      ]);
      
      setIsBlocked(blocked);
      setIsMuted(muted);
    };
    
    checkBlockStatus();
    
    // Listen for user block/unblock events
    const handleUserBlockChange = (event) => {
      const { userId } = event.detail;
      if (userId === post.user_id) {
        checkBlockStatus();
      }
    };
    
    window.addEventListener('userBlocked', handleUserBlockChange);
    window.addEventListener('userUnblocked', handleUserBlockChange);
    window.addEventListener('userMuted', handleUserBlockChange);
    window.addEventListener('userUnmuted', handleUserBlockChange);
    
    return () => {
      window.removeEventListener('userBlocked', handleUserBlockChange);
      window.removeEventListener('userUnblocked', handleUserBlockChange);
      window.removeEventListener('userMuted', handleUserBlockChange);
      window.removeEventListener('userUnmuted', handleUserBlockChange);
    };
  }, [currentUserId, post.user_id, isOwnPost]);

  const handleProfileClick = (e) => {
    e.stopPropagation();
    navigate(`/profile/${post.user_id}`);
  };

  // Parse event mentions in content
  const parseEventMentions = (content) => {
    if (!content) return '';
    const eventMentionRegex = /@event:([^@\s]+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = eventMentionRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      
      const eventTitle = match[1];
      parts.push(
        <span
          key={match.index}
          className="inline-flex items-center gap-1 px-2 py-1 bg-[#00d4ff]30 text-[#00d4ff] rounded text-sm font-medium hover:bg-[#00d4ff]40 transition-colors cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            console.log('Event mentioned:', eventTitle);
          }}
        >
          <Calendar className="w-3 h-3" />
          {eventTitle}
        </span>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }
    
    return parts.length > 0 ? parts : content;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 365) return `${diffInDays}d ago`;
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

  const handleLike = (e) => {
    e.stopPropagation();
    if (onLike) onLike(post.id);
  };

  const handleComment = (e) => {
    e.stopPropagation();
    if (onComment) onComment(post.id);
  };

  const handleShare = (e) => {
    e.stopPropagation();
    if (onShare) onShare(post.id);
  };

  const handleSave = (e) => {
    e.stopPropagation();
    if (onSave) onSave(post.id);
  };

  const handleOpen = () => {
    if (onOpen) onOpen(post);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onEdit) onEdit(post);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    // Debug: Check if post.title is corrupted
    if (post.title && (post.title.includes('TIMEOUT') || post.title.includes('installHook'))) {
      console.error('⚠️ Post title appears corrupted:', post.title);
      console.error('Full post object:', post);
    }
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (onDelete) onDelete(post.id);
    setShowDeleteModal(false);
  };

  const toggleMenu = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const authorName = post.profiles?.nickname || post.profiles?.full_name || post.user_name || 'Anonymous';
  const authorAvatar = post.profiles?.avatar_url;
  const authorInitial = authorName.charAt(0).toUpperCase();

  // Hide post if user is blocked
  if (isBlocked) {
    return (
      <div className="p-4 border-b border-gray-700 text-center text-gray-400 text-sm">
        You have blocked this user. Their content is hidden.
      </div>
    );
  }

  // Hide post content if user is muted (but show it's muted)
  if (isMuted) {
    return (
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
          <VolumeX className="w-4 h-4" />
          <span>You have muted {authorName}. Their content is hidden.</span>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div 
        className="post-card post-card-compact animate-fade-in"
        onClick={handleOpen}
      >
        <div className="post-card-header-compact">
          <div className="post-author-compact">
            {authorAvatar ? (
              <img src={authorAvatar} alt={authorName} className="post-avatar-small" />
            ) : (
              <div className="post-avatar-small post-avatar-placeholder">
                {authorInitial}
          </div>
            )}
          <div className="flex-1 min-w-0">
              <h4 className="post-title-compact truncate">{post.title}</h4>
              <div className="post-meta-compact">
              <button
                onClick={handleProfileClick}
                  className="post-author-link"
              >
                  {authorName}
              </button>
                <span className="post-meta-separator">•</span>
                <Clock className="post-meta-icon" />
              <span>{formatTime(post.created_at)}</span>
              {post.tag && (
                <>
                  <span className="post-meta-separator">•</span>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${getTagColor(post.tag)}20`,
                      border: `1px solid ${getTagColor(post.tag)}40`,
                      color: getTagColor(post.tag)
                    }}
                  >
                    {getTagLabel(post.tag)}
                  </span>
                </>
              )}
              </div>
            </div>
          </div>
          <div className="post-actions-compact">
            <button
              onClick={handleLike}
              disabled={isPostLoading || !currentUserId}
              className={`post-action-btn ${isPostLiked ? 'post-action-btn-active' : ''} ${!currentUserId ? 'opacity-60' : ''}`}
              title={!currentUserId ? 'Sign in to like' : ''}
            >
              {isPostLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : !currentUserId ? (
                <Lock className="w-4 h-4" />
              ) : (
                <Heart className={`w-4 h-4 ${isPostLiked ? 'fill-current' : ''}`} />
              )}
              <span>{post.like_count || 0}</span>
            </button>
            <button 
              onClick={handleOpen}
              className={`post-action-btn ${!currentUserId ? 'opacity-60' : ''}`}
              title={!currentUserId ? 'Sign in to comment' : ''}
            >
              {!currentUserId ? (
                <Lock className="w-4 h-4" />
              ) : (
                <MessageCircle className="w-4 h-4" />
              )}
              <span>{post.comment_count || 0}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="animate-fade-in w-full border-b last:border-b-0 transition-all duration-200"
      onClick={handleOpen}
      style={{ 
        padding: '16px 0', 
        cursor: 'pointer',
        borderColor: 'var(--divider-color)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      {/* Header */}
      <div className="post-header" style={{ padding: '0 16px', marginBottom: '0px' }}>
        <div className="post-author-info flex-1" style={{ gap: '4px' }}>
          {authorAvatar ? (
            <img 
              src={authorAvatar} 
              alt={authorName} 
              className="post-avatar"
              onClick={handleProfileClick}
              style={{ width: '28px', height: '28px' }}
            />
          ) : (
            <div 
              className="post-avatar post-avatar-placeholder"
              onClick={handleProfileClick}
              style={{ width: '28px', height: '28px' }}
            >
              {authorInitial}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0 flex-wrap">
              <button
                onClick={handleProfileClick}
                className="text-xs"
                style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                {authorName}
              </button>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {formatTime(post.created_at)}
              </span>
              {post.tag && (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium"
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
        
          {canShowActions && (
          <div className="post-menu-container relative">
              <button 
                onClick={toggleMenu}
              className="post-menu-btn"
              >
              <MoreHorizontal className="w-4 h-4" />
              </button>
              {showMenu && (
              <>
                <div 
                  className="post-menu-overlay"
                  onClick={() => setShowMenu(false)}
                />
                <div className="post-menu-dropdown">
                  {canEdit && (
                    <button
                      onClick={handleEdit}
                      className="post-menu-item"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Edit Post</span>
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={handleDelete}
                      className="post-menu-item post-menu-item-danger"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Post</span>
                    </button>
                  )}
                  {canBlockMute && (
                    <>
                      <div className="border-t border-gray-700 my-1"></div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          setShowMuteModal(true);
                        }}
                        className="post-menu-item"
                      >
                        <VolumeX className="w-4 h-4" />
                        <span>Mute {authorName}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          setShowBlockModal(true);
                        }}
                        className="post-menu-item post-menu-item-danger"
                      >
                        <Ban className="w-4 h-4" />
                        <span>Block {authorName}</span>
                      </button>
                    </>
                  )}
                  {canReport && (
                    <>
                      <div className="border-t border-gray-700 my-1"></div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          setShowReportModal(true);
                        }}
                        className="post-menu-item post-menu-item-danger"
                      >
                        <Flag className="w-4 h-4" />
                        <span>Report Post</span>
                      </button>
                    </>
                  )}
                </div>
              </>
              )}
            </div>
          )}
        </div>

      {/* Content */}
      <div className="post-content" style={{ padding: '0 16px' }}>
        {post.is_nsfw ? (
          <NSFWWarning content={post}>
            <div>
        <h3 className="post-title">{post.title}</h3>
        
        {post.content && (
          <p className="post-text">
            {post.content.length > 200 
              ? (
                <>
                  {parseEventMentions(post.content.substring(0, 200))}
                  <span className="text-gray-400">...</span>
                </>
              )
            : parseEventMentions(post.content)
          }
        </p>
        )}
        
        {/* Media Files */}
        {post.media_files && post.media_files.length > 0 && (
          <div className="post-media">
            {post.media_files.length === 1 ? (
              <div className="post-media-single">
                {post.media_files[0].type?.startsWith('image/') ? (
                  <img
                    src={post.media_files[0].url}
                    alt={post.media_files[0].name || 'Post media'}
                    className="post-media-image"
                    loading="lazy"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                ) : post.media_files[0].type?.startsWith('video/') ? (
                  <video
                    src={post.media_files[0].url}
                    className="post-media-video"
                    controls
                    preload="metadata"
                  />
                ) : null}
              </div>
            ) : (
              <div className="post-media-grid">
                {post.media_files.slice(0, 4).map((file, index) => (
                  <div key={index} className="post-media-item">
                    {file.type?.startsWith('image/') ? (
                        <img
                          src={file.url}
                        alt={file.name || `Media ${index + 1}`}
                        className="post-media-thumb"
                          loading="lazy"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                    ) : file.type?.startsWith('video/') ? (
                        <video
                          src={file.url}
                        className="post-media-thumb"
                          controls
                          preload="metadata"
                        />
                    ) : null}
                      {post.media_files.length > 4 && index === 3 && (
                      <div className="post-media-overlay">
                        <span>+{post.media_files.length - 4}</span>
                        </div>
                      )}
                    </div>
                ))}
              </div>
            )}
          </div>
              )}
            </div>
          </NSFWWarning>
        ) : (
          <>
            <h3 className="post-title">{post.title}</h3>
            
            {post.content && (
              <p className="post-text">
                {post.content.length > 200 
                  ? (
                    <>
                      {parseEventMentions(post.content.substring(0, 200))}
                      <span className="text-gray-400">...</span>
                    </>
                  )
                : parseEventMentions(post.content)
              }
            </p>
            )}
            
            {/* Media Files */}
            {post.media_files && post.media_files.length > 0 && (
              <div className="post-media">
                {post.media_files.length === 1 ? (
                  <div className="post-media-single">
                    {post.media_files[0].type?.startsWith('image/') ? (
                      <img
                        src={post.media_files[0].url}
                        alt={post.media_files[0].name || 'Post media'}
                        className="post-media-image"
                        loading="lazy"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    ) : post.media_files[0].type?.startsWith('video/') ? (
                      <video
                        src={post.media_files[0].url}
                        className="post-media-video"
                        controls
                        preload="metadata"
                      />
                    ) : null}
                  </div>
                ) : (
                  <div className="post-media-grid">
                    {post.media_files.slice(0, 4).map((file, index) => (
                      <div key={index} className="post-media-item">
                        {file.type?.startsWith('image/') ? (
                            <img
                              src={file.url}
                            alt={file.name || `Media ${index + 1}`}
                            className="post-media-thumb"
                              loading="lazy"
                              onError={(e) => e.target.style.display = 'none'}
                            />
                        ) : file.type?.startsWith('video/') ? (
                            <video
                              src={file.url}
                            className="post-media-thumb"
                              controls
                              preload="metadata"
                            />
                        ) : null}
                          {post.media_files.length > 4 && index === 3 && (
                          <div className="post-media-overlay">
                            <span>+{post.media_files.length - 4}</span>
                            </div>
                          )}
                        </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Actions */}
      <div className="post-actions" style={{ padding: '0 16px', marginTop: '1px', gap: '6px' }}>
          <button 
            onClick={handleLike}
          disabled={isPostLoading || !currentUserId}
          className={`post-action-btn ${isPostLiked ? 'post-action-btn-liked' : ''} ${!currentUserId ? 'opacity-60' : ''}`}
          title={!currentUserId ? 'Sign in to like' : ''}
          >
          {isPostLoading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : !currentUserId ? (
            <Lock className="w-4 h-4" />
            ) : (
            <Heart className={`w-4 h-4 ${isPostLiked ? 'fill-current' : ''}`} />
            )}
          <span>{post.like_count || 0}</span>
          </button>
        
          <button 
            onClick={handleOpen}
          className={`post-action-btn ${!currentUserId ? 'opacity-60' : ''}`}
          title={!currentUserId ? 'Sign in to comment' : ''}
          >
          {!currentUserId ? (
            <Lock className="w-4 h-4" />
          ) : (
            <MessageCircle className="w-4 h-4" />
          )}
          <span>{post.comment_count || 0}</span>
          </button>
        
          {onShare && (
            <button 
              onClick={handleShare}
            className="post-action-btn post-action-btn-secondary"
            >
            <Share className="w-4 h-4" />
            </button>
          )}
        
          {onSave && (
            <button 
              onClick={handleSave}
            className="post-action-btn post-action-btn-secondary"
            >
            <Bookmark className="w-4 h-4" />
            </button>
          )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Post"
        message={`Are you sure you want to delete "${post?.title && typeof post.title === 'string' && !post.title.includes('TIMEOUT') && !post.title.includes('installHook') ? post.title : 'this post'}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        icon={Trash2}
      />

      {/* Block User Modal */}
      <BlockUserModal
        isOpen={showBlockModal}
        onClose={(success) => {
          setShowBlockModal(false);
          // Block status will be updated via event listener
        }}
        userId={post.user_id}
        userName={authorName}
      />

      {/* Mute User Modal */}
      <MuteUserModal
        isOpen={showMuteModal}
        onClose={(success) => {
          setShowMuteModal(false);
          // Mute status will be updated via event listener
        }}
        userId={post.user_id}
        userName={authorName}
      />

      {/* Report Post Modal */}
      <ReportPostModal
        isOpen={showReportModal}
        onClose={(success) => {
          setShowReportModal(false);
          if (success) {
            // Report submitted successfully
          }
        }}
        postId={post.id}
        postTitle={post.title}
      />
    </div>
  );
}
