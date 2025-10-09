import { Users, Heart, MessageCircle, Clock, Share, Bookmark, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';

export default function PostCard({ 
  post, 
  onLike, 
  onComment, 
  onShare, 
  onSave,
  onOpen,
  liked = false,
  loadingLike = false,
  showActions = true,
  compact = false
}) {
  const [showReactions, setShowReactions] = useState(false);

  const formatTime = (timestamp) => {
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

  if (compact) {
    return (
      <div 
        className="mobile-card-compact cursor-pointer touch-feedback"
        onClick={handleOpen}
      >
        <div className="minimal-flex">
          <div className="w-6 h-6 bg-gray-700 rounded-full minimal-flex-center mr-2 flex-shrink-0">
            <Users className="w-3 h-3 text-gray-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="mobile-text-sm font-medium truncate">{post.title}</h4>
            <div className="minimal-flex mobile-text-xs text-gray-400">
              <span>by {post.user_name}</span>
              <span className="mx-2">•</span>
              <Clock className="w-3 h-3 mr-1" />
              <span>{formatTime(post.created_at)}</span>
            </div>
          </div>
          <div className="minimal-flex gap-2">
            <button 
              onClick={handleLike}
              disabled={loadingLike}
              className={`minimal-flex ${liked ? 'text-red-400' : 'text-gray-400'} ${loadingLike ? 'opacity-50' : ''}`}
            >
              <Heart className={`w-3 h-3 mr-1 ${liked ? 'fill-current' : ''}`} />
              <span className="mobile-text-xs">{post.like_count}</span>
            </button>
            <button className="minimal-flex text-gray-400">
              <MessageCircle className="w-3 h-3 mr-1" />
              <span className="mobile-text-xs">{post.comment_count}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="mobile-card card-interactive animate-fade-in"
      onClick={handleOpen}
    >
      <div className="mobile-card-header">
        <div className="minimal-flex">
          <div className="w-8 h-8 bg-gray-700 rounded-full minimal-flex-center mr-3">
            <Users className="minimal-icon text-gray-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="mobile-subheading truncate">{post.title}</h3>
            <div className="minimal-flex mobile-text-xs text-gray-400">
              <span>by {post.user_name}</span>
              <span className="mx-2">•</span>
              <Clock className="minimal-icon mr-1" />
              <span>{formatTime(post.created_at)}</span>
              <span className="mx-2">•</span>
              <span className={getTagClass(post.tag)}>
                {getTagLabel(post.tag)}
              </span>
            </div>
          </div>
          {showActions && (
            <button 
              onClick={(e) => e.stopPropagation()}
              className="mobile-btn-secondary p-2"
            >
              <MoreHorizontal className="minimal-icon" />
            </button>
          )}
        </div>
      </div>
      
      <div className="mb-4">
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
            onClick={handleLike}
            disabled={loadingLike}
            className={`minimal-flex ${liked ? 'text-red-400' : 'text-gray-400 hover:text-red-400'} ${loadingLike ? 'opacity-50' : ''}`}
          >
            {loadingLike ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
            ) : (
              <Heart className={`minimal-icon mr-1 ${liked ? 'fill-current' : ''}`} />
            )}
            <span className="mobile-text-xs">{post.like_count}</span>
          </button>
          <button 
            onClick={handleComment}
            className="minimal-flex text-gray-400 hover:text-indigo-400"
          >
            <MessageCircle className="minimal-icon mr-1" />
            <span className="mobile-text-xs">{post.comment_count}</span>
          </button>
          {onShare && (
            <button 
              onClick={handleShare}
              className="minimal-flex text-gray-400 hover:text-green-400"
            >
              <Share className="minimal-icon mr-1" />
            </button>
          )}
          {onSave && (
            <button 
              onClick={handleSave}
              className="minimal-flex text-gray-400 hover:text-yellow-400"
            >
              <Bookmark className="minimal-icon mr-1" />
            </button>
          )}
        </div>
        <p className="mobile-text-xs text-gray-400">Click to read more</p>
      </div>
    </div>
  );
}
