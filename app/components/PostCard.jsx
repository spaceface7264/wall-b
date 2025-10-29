import { Heart, MessageCircle, Clock, Share, Bookmark, MoreHorizontal, Edit2, Trash2, Calendar, User } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const isOwnPost = post.user_id === currentUserId;
  const canShowActions = showActions && (isOwnPost || isAdmin);
  const isPostLiked = liked || isLiked;
  const isPostLoading = loadingLike || isLiking;

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
          className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-900/30 text-indigo-300 rounded text-sm font-medium hover:bg-indigo-800/40 transition-colors cursor-pointer"
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
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getTagClass = (tag) => {
    const classes = {
      beta: 'post-tag post-tag-beta',
      event: 'post-tag post-tag-event',
      question: 'post-tag post-tag-question',
      gear: 'post-tag post-tag-gear',
      training: 'post-tag post-tag-training',
      social: 'post-tag post-tag-social',
      news: 'post-tag post-tag-news'
    };
    return classes[tag] || 'post-tag post-tag-news';
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
    if (confirm('Are you sure you want to delete this post?')) {
      if (onDelete) onDelete(post.id);
    }
  };

  const toggleMenu = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const authorName = post.profiles?.nickname || post.profiles?.full_name || post.user_name || 'Anonymous';
  const authorAvatar = post.profiles?.avatar_url;
  const authorInitial = authorName.charAt(0).toUpperCase();

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
              </div>
            </div>
          </div>
          <div className="post-actions-compact">
            <button
              onClick={handleLike}
              disabled={isPostLoading}
              className={`post-action-btn ${isPostLiked ? 'post-action-btn-active' : ''}`}
            >
              <Heart className={`w-4 h-4 ${isPostLiked ? 'fill-current' : ''}`} />
              <span>{post.like_count || 0}</span>
            </button>
            <button className="post-action-btn">
              <MessageCircle className="w-4 h-4" />
              <span>{post.comment_count || 0}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="post-card animate-fade-in"
      onClick={handleOpen}
    >
      {/* Header */}
      <div className="post-header">
        <div className="post-author-info">
          {authorAvatar ? (
            <img 
              src={authorAvatar} 
              alt={authorName} 
              className="post-avatar"
              onClick={handleProfileClick}
            />
          ) : (
            <div 
              className="post-avatar post-avatar-placeholder"
              onClick={handleProfileClick}
            >
              {authorInitial}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <button
              onClick={handleProfileClick}
              className="post-author-name"
            >
              {authorName}
            </button>
            <div className="post-meta">
              <Clock className="post-meta-icon" />
              <span>{formatTime(post.created_at)}</span>
              {post.tag && (
                <>
                  <span className="post-meta-separator">•</span>
                  <span className={getTagClass(post.tag)}>
                    {getTagLabel(post.tag)}
                  </span>
                </>
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
                  <button
                    onClick={handleEdit}
                    className="post-menu-item"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit Post</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="post-menu-item post-menu-item-danger"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Post</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="post-content">
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
      
      {/* Actions */}
      <div className="post-actions">
        <button 
          onClick={handleLike}
          disabled={isPostLoading}
          className={`post-action-btn ${isPostLiked ? 'post-action-btn-liked' : ''}`}
        >
          {isPostLoading ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Heart className={`w-4 h-4 ${isPostLiked ? 'fill-current' : ''}`} />
          )}
          <span>{post.like_count || 0}</span>
        </button>
        
        <button 
          onClick={handleComment}
          className="post-action-btn"
        >
          <MessageCircle className="w-4 h-4" />
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
    </div>
  );
}
