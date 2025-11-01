import { useState, useRef, useEffect } from 'react';
import { Heart, Reply, Edit2, Trash2, ChevronDown, ChevronUp, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CommentInput from './CommentInput';
import ConfirmationModal from './ConfirmationModal';

// Reply Menu Component
function ReplyMenu({ replyId, replyContent, replyUserId, userId, isAdmin, onEdit, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const menuRef = useRef(null);
  const canEdit = replyUserId === userId;
  const canDelete = replyUserId === userId || isAdmin;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  if (!canEdit && !canDelete) return null;

  return (
    <div className="relative flex-shrink-0" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        className="p-1 hover:bg-gray-700 rounded-md transition-colors"
        aria-label="More options"
      >
        <MoreVertical className="w-3 h-3 text-gray-400" />
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 rounded-lg shadow-lg z-50"
          style={{ 
            minWidth: '140px',
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
                setShowMenu(false);
                onEdit(replyId, replyContent);
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
              <Edit2 className="w-3 h-3" style={{ flexShrink: 0 }} />
              <span>Edit</span>
            </button>
          )}
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
                setShowDeleteModal(true);
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
              <Trash2 className="w-3 h-3" style={{ flexShrink: 0 }} />
              <span>Delete</span>
            </button>
          )}
        </div>
      )}

      {/* Delete Reply Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          onDelete(replyId);
          setShowDeleteModal(false);
        }}
        title="Delete Reply"
        message="Are you sure you want to delete this reply? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        icon={Trash2}
      />
    </div>
  );
}

export default function CommentThread({
  comment,
  postId,
  userId,
  depth = 0,
  replies = [],
  onReply,
  onLike,
  onEdit,
  onDelete,
  isAdmin = false,
}) {
  const [showReplies, setShowReplies] = useState(true);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [liking, setLiking] = useState(false);
  const [liked, setLiked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const isOwnComment = comment.user_id === userId;
  const canModerate = isOwnComment || isAdmin;
  const canEdit = isOwnComment; // Only owners can edit
  const canDelete = isOwnComment || isAdmin; // Owners and admins can delete
  const hasReplies = (replies && replies.length > 0) || (comment.reply_count > 0);
  const canReply = depth === 0; // Only top-level comments can have replies

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  const handleProfileClick = (e, userId) => {
    e.stopPropagation();
    navigate(`/profile/${userId}`);
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

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      const result = await onLike(comment.id);
      if (result) {
        setLiked(result.liked);
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    } finally {
      setLiking(false);
    }
  };

  const handleReply = () => {
    setShowReplyInput(!showReplyInput);
  };

  const handleSubmitReply = async (replyData) => {
    await onReply(replyData);
    setShowReplyInput(false);
  };

  const handleEdit = async () => {
    if (editContent.trim().length < 10) return;
    
    try {
      await onEdit(comment.id, editContent.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Error editing comment:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete(comment.id);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  return (
    <div className={`${depth === 1 ? 'mt-2' : ''}`}>
      <div className={`${depth === 1 ? 'p-3' : 'w-full border-b border-gray-700/50 last:border-b-0 hover:bg-gray-800/30'} transition-all duration-200`} style={depth !== 1 ? { padding: '16px 0' } : {}}>
        {/* Comment Header */}
        <div className="minimal-flex justify-between items-start mb-2" style={{ padding: depth !== 1 ? '0 16px' : '0' }}>
          <div className="minimal-flex gap-2">
            {comment.profiles?.avatar_url ? (
              <img
                src={comment.profiles.avatar_url}
                alt={comment.profiles?.nickname || comment.profiles?.full_name || comment.user_name || 'User'}
                className="w-9 h-9 rounded-full object-cover flex-shrink-0 cursor-pointer"
                onClick={(e) => handleProfileClick(e, comment.user_id)}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className="w-9 h-9 bg-gradient-to-br from-[#087E8B] to-[#087E8B] rounded-full minimal-flex-center flex-shrink-0 cursor-pointer"
              style={{ display: comment.profiles?.avatar_url ? 'none' : 'flex' }}
              onClick={(e) => handleProfileClick(e, comment.user_id)}
            >
              <span className="text-white font-semibold text-sm">
                {(comment.profiles?.nickname || comment.profiles?.full_name || comment.user_name || 'A').charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <button
                onClick={(e) => handleProfileClick(e, comment.user_id)}
                className="mobile-text-sm font-semibold text-[#087E8B] hover:text-[#066a75] transition-colors text-left"
                style={{ fontSize: '14px' }}
              >
                {comment.profiles?.nickname || comment.profiles?.full_name || comment.user_name || 'Anonymous'}
              </button>
              <p className="mobile-text-xs text-gray-400" style={{ fontSize: '12px' }}>
                {formatTime(comment.created_at)}
                {comment.updated_at && comment.updated_at !== comment.created_at && (
                  <span className="ml-1">(edited)</span>
                )}
              </p>
            </div>
          </div>

          {canModerate && !isEditing && (
            <div className="relative flex-shrink-0" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1.5 hover:bg-gray-700 rounded-md transition-colors"
                aria-label="More options"
              >
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
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
                        setIsEditing(true);
                        setShowMenu(false);
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
                      <span>Edit Comment</span>
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        handleDelete();
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
                      <span>Delete Comment</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Comment Content */}
        {isEditing ? (
          <div className="mb-2" style={{ padding: depth !== 1 ? '0 16px' : '0' }}>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value.slice(0, 500))}
              className="minimal-textarea w-full"
              rows={3}
            />
            <div className="minimal-flex gap-2 mt-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
                className="mobile-btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={editContent.trim().length < 10}
                className="mobile-btn-primary"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <p className="mobile-card-content mb-3" style={{ padding: depth !== 1 ? '0 16px' : '0', fontSize: '14px', lineHeight: '1.5' }}>
            {comment.content}
          </p>
        )}

        {/* Comment Actions */}
        {!isEditing && (
          <div className="minimal-flex gap-4 items-center" style={{ padding: depth !== 1 ? '0 16px' : '0' }}>
            <button
              onClick={handleLike}
              disabled={liking}
              className={`icon-button minimal-flex gap-1 text-white hover:text-red-400 ${liking ? 'opacity-50' : ''}`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-current text-red-400' : 'stroke-current'}`} />
              <span className="mobile-text-xs">{comment.like_count}</span>
            </button>

            {canReply && (
              <button
                onClick={handleReply}
                className="icon-button minimal-flex gap-1 text-white hover:text-[#087E8B]"
              >
                <Reply className="w-4 h-4 stroke-current" />
                <span className="mobile-text-xs">Reply</span>
              </button>
            )}

            {hasReplies && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="minimal-flex gap-1 text-gray-400 hover:text-[#087E8B]"
              >
                {showReplies ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                <span className="mobile-text-xs">
                  {comment.reply_count || replies.length} {(comment.reply_count || replies.length) === 1 ? 'reply' : 'replies'}
                </span>
              </button>
            )}
          </div>
        )}

        {/* Reply Input */}
        {showReplyInput && (
          <div className="mt-4 pt-4">
            <CommentInput
              postId={postId}
              parentCommentId={comment.id}
              onSubmit={handleSubmitReply}
              placeholder="Write a reply..."
              autoFocus={true}
              onCancel={() => setShowReplyInput(false)}
            />
          </div>
        )}

        {/* Nested Replies - Displayed within the same card */}
        {hasReplies && showReplies && (
          <div className="mt-4 pt-4">
            <div className="space-y-3">
            {replies.map((reply) => (
              <div key={reply.id} className="ml-6 pl-4 border-l-2 border-[#087E8B]/30 relative">
                <div className="absolute -left-1 top-0 w-2 h-2 bg-[#087E8B] rounded-full"></div>
                
                {/* Reply Content - No card styling */}
                <div className="ml-2 py-2">
                    {/* Reply Header */}
                    <div className="minimal-flex justify-between items-start mb-1">
                      <div className="minimal-flex gap-2">
                        {reply.profiles?.avatar_url ? (
                          <img
                            src={reply.profiles.avatar_url}
                            alt={reply.profiles?.nickname || reply.profiles?.full_name || reply.user_name || 'User'}
                            className="w-9 h-9 rounded-full object-cover flex-shrink-0 cursor-pointer"
                            onClick={(e) => handleProfileClick(e, reply.user_id)}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="w-9 h-9 bg-gradient-to-br from-[#087E8B] to-[#087E8B] rounded-full minimal-flex-center flex-shrink-0 cursor-pointer"
                          style={{ display: reply.profiles?.avatar_url ? 'none' : 'flex' }}
                          onClick={(e) => handleProfileClick(e, reply.user_id)}
                        >
                          <span className="text-white font-semibold text-sm">
                            {(reply.profiles?.nickname || reply.profiles?.full_name || reply.user_name || 'A').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <button
                            onClick={(e) => handleProfileClick(e, reply.user_id)}
                            className="mobile-text-sm font-semibold text-[#087E8B] hover:text-[#066a75] transition-colors text-left"
                            style={{ fontSize: '14px' }}
                          >
                            {reply.profiles?.nickname || reply.profiles?.full_name || reply.user_name || 'Anonymous'}
                          </button>
                          <p className="mobile-text-xs text-gray-400" style={{ fontSize: '12px' }}>
                            {formatTime(reply.created_at)}
                            {reply.updated_at && reply.updated_at !== reply.created_at && (
                              <span className="ml-1">(edited)</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {(reply.user_id === userId || isAdmin) && (
                        <ReplyMenu 
                          replyId={reply.id}
                          replyContent={reply.content}
                          replyUserId={reply.user_id}
                          userId={userId}
                          isAdmin={isAdmin}
                          onEdit={onEdit}
                          onDelete={onDelete}
                        />
                      )}
                    </div>

                    {/* Reply Content */}
                    <p className="mobile-text-xs text-gray-300 mb-2" style={{ fontSize: '14px', lineHeight: '1.5' }}>
                      {reply.content}
                    </p>

                    {/* Reply Actions */}
                    <div className="minimal-flex gap-4 items-center">
                      <button
                        onClick={() => onLike(reply.id)}
                        className="icon-button minimal-flex gap-1 text-xs text-white hover:text-red-400"
                      >
                        <Heart className="w-3 h-3 stroke-current" />
                        <span>{reply.like_count}</span>
                      </button>
                    </div>
                </div>
              </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        icon={Trash2}
      />
    </div>
  );
}

