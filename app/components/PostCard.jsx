import { Users, Heart, MessageCircle, Clock, Share, Bookmark, MoreHorizontal, Edit2, Trash2, Calendar } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
  loadingLike = false,
  showActions = true,
  compact = false
}) {
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();
  const isOwnPost = post.user_id === currentUserId;
  const canShowActions = showActions && (isOwnPost || isAdmin);

  const handleProfileClick = (e) => {
    e.stopPropagation();
    router.push(`/profile/${post.user_id}`);
  };

  // Parse event mentions in content
  const parseEventMentions = (content) => {
    const eventMentionRegex = /@event:([^@\s]+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = eventMentionRegex.exec(content)) !== null) {
      // Add text before the mention
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      
      // Add the event mention as a clickable element
      const eventTitle = match[1];
      parts.push(
        <span
          key={match.index}
          className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-900/30 text-indigo-300 rounded-md text-sm font-medium hover:bg-indigo-800/40 transition-colors cursor-pointer"
          onClick={() => {
            // You could add navigation to event here
            console.log('Event mentioned:', eventTitle);
          }}
        >
          <Calendar className="w-3 h-3" />
          {eventTitle}
        </span>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }
    
    return parts;
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
              <span>by </span>
              <button
                onClick={handleProfileClick}
                className="text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {post.profiles?.nickname || post.profiles?.full_name || post.user_name || 'Anonymous'}
              </button>
              <span className="mx-2">•</span>
              <Clock className="w-3 h-3 mr-1" />
              <span>{formatTime(post.created_at)}</span>
            </div>
          </div>
          <div className="minimal-flex gap-2">
            <button
              onClick={handleLike}
              disabled={loadingLike}
              className={`icon-button minimal-flex gap-1 text-white hover:text-red-400 ${loadingLike ? 'opacity-50' : ''}`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-current text-red-400' : 'stroke-current'}`} />
              <span className="mobile-text-xs">{post.like_count}</span>
            </button>
            <button className="icon-button minimal-flex gap-1 text-white hover:text-indigo-400">
              <MessageCircle className="w-4 h-4 stroke-current" />
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
          <div className="flex-1 min-w-0">
            <h3 className="mobile-subheading truncate">{post.title}</h3>
            <div className="minimal-flex mobile-text-xs text-gray-400">
              <span>by </span>
              <button
                onClick={handleProfileClick}
                className="text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {post.profiles?.nickname || post.profiles?.full_name || post.user_name || 'Anonymous'}
              </button>
              <span className="mx-2">•</span>
              <Clock className="minimal-icon mr-1" />
              <span>{formatTime(post.created_at)}</span>
              <span className="mx-2">•</span>
              <span className={getTagClass(post.tag)}>
                {getTagLabel(post.tag)}
              </span>
            </div>
          </div>
          {canShowActions && (
            <div className="relative">
              <button 
                onClick={toggleMenu}
                className="mobile-btn-secondary p-2"
              >
                <MoreHorizontal className="minimal-icon" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-10 z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-lg min-w-[150px]">
                  <button
                    onClick={handleEdit}
                    className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 minimal-flex gap-2 items-center"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Post
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 minimal-flex gap-2 items-center"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Post
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="mb-4">
        <p className="mobile-card-content">
          {post.content.length > 150 
            ? parseEventMentions(`${post.content.substring(0, 150)}...`)
            : parseEventMentions(post.content)
          }
        </p>
        
        {/* Media Files */}
        {(() => {
          
          if (post.media_files && post.media_files.length > 0) {
            return (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {post.media_files.slice(0, 4).map((file, index) => {
                  return (
                    <div key={index} className="relative">
                      {file && file.type && file.type.startsWith('image/') ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-full h-32 object-cover rounded-lg"
                          loading="lazy"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      ) : file && file.type && file.type.startsWith('video/') ? (
                        <video
                          src={file.url}
                          className="w-full h-32 object-cover rounded-lg"
                          controls
                          preload="metadata"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gray-700 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400 text-xs">Unknown file type</span>
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
                  );
                })}
              </div>
            );
          } else {
            return null;
          }
        })()}
      </div>
      
      <div className="mobile-card-actions">
        <div className="minimal-flex gap-4">
          <button 
            onClick={handleLike}
            disabled={loadingLike}
            className={`icon-button minimal-flex gap-1 text-white hover:text-red-400 ${loadingLike ? 'opacity-50' : ''}`}
          >
            {loadingLike ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Heart className={`w-4 h-4 ${liked ? 'fill-current text-red-400' : 'stroke-current'}`} />
            )}
            <span className="mobile-text-xs">{post.like_count}</span>
          </button>
          <button 
            onClick={handleComment}
            className="icon-button minimal-flex gap-1 text-white hover:text-indigo-400"
          >
            <MessageCircle className="w-4 h-4 stroke-current" />
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
