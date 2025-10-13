import { useState } from 'react';
import { Heart, Reply, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import CommentInput from './CommentInput';

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
}) {
  const [showReplies, setShowReplies] = useState(true);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [liking, setLiking] = useState(false);
  const [liked, setLiked] = useState(false);

  const isOwnComment = comment.user_id === userId;
  const hasReplies = (replies && replies.length > 0) || (comment.reply_count > 0);
  const canReply = depth === 0; // Only top-level comments can have replies



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
    if (confirm('Are you sure you want to delete this comment?')) {
      try {
        await onDelete(comment.id);
      } catch (error) {
        console.error('Error deleting comment:', error);
      }
    }
  };

  return (
    <div className={`${depth === 1 ? 'mt-2' : 'mt-4'}`}>
      <div className={`${depth === 1 ? 'p-3 bg-gray-800/30 rounded-lg' : 'mobile-card-flat p-comfortable'}`}>
        {/* Comment Header */}
        <div className="minimal-flex justify-between items-start mb-2">
          <div className="minimal-flex gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full minimal-flex-center flex-shrink-0">
              <span className="text-white font-semibold text-sm">
                {comment.user_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h4 className="mobile-text-sm font-semibold text-white">
                {comment.user_name}
              </h4>
              <p className="mobile-text-xs text-gray-400">
                {formatTime(comment.created_at)}
                {comment.updated_at && comment.updated_at !== comment.created_at && (
                  <span className="ml-1">(edited)</span>
                )}
              </p>
            </div>
          </div>

          {isOwnComment && !isEditing && (
            <div className="minimal-flex gap-1">
              <button
                onClick={() => setIsEditing(true)}
                className="mobile-touch-target p-1 text-gray-400 hover:text-indigo-400"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                className="mobile-touch-target p-1 text-gray-400 hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Comment Content */}
        {isEditing ? (
          <div className="mb-2">
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
          <p className="mobile-card-content mb-3">
            {comment.content}
          </p>
        )}

        {/* Comment Actions */}
        {!isEditing && (
          <div className="minimal-flex gap-4 items-center">
            <button
              onClick={handleLike}
              disabled={liking}
              className={`minimal-flex gap-1 ${
                liked ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
              }`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
              <span className="mobile-text-xs">{comment.like_count}</span>
            </button>

            {canReply && (
              <button
                onClick={handleReply}
                className="minimal-flex gap-1 text-gray-400 hover:text-indigo-400"
              >
                <Reply className="w-4 h-4" />
                <span className="mobile-text-xs">Reply</span>
              </button>
            )}

            {hasReplies && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="minimal-flex gap-1 text-gray-400 hover:text-indigo-400"
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
          <div className="mt-4 pt-4 border-t border-gray-700">
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
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="space-y-3">
            {replies.map((reply) => (
              <div key={reply.id} className="ml-6 pl-4 border-l-2 border-indigo-500/30 relative">
                <div className="absolute -left-1 top-0 w-2 h-2 bg-indigo-500 rounded-full"></div>
                
                {/* Reply Content - Inline display */}
                <div className="p-3 bg-gray-800/40 rounded-lg ml-2 border border-gray-700/50">
                    {/* Reply Header */}
                    <div className="minimal-flex justify-between items-start mb-2">
                      <div className="minimal-flex gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full minimal-flex-center flex-shrink-0">
                          <span className="text-white font-semibold text-xs">
                            {reply.user_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="mobile-text-xs font-semibold text-white">
                            {reply.user_name}
                          </h4>
                          <p className="mobile-text-xs text-gray-400">
                            {formatTime(reply.created_at)}
                            {reply.updated_at && reply.updated_at !== reply.created_at && (
                              <span className="ml-1">(edited)</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {reply.user_id === userId && (
                        <div className="minimal-flex gap-1">
                          <button
                            onClick={() => onEdit(reply.id, reply.content)}
                            className="mobile-touch-target p-1 text-gray-400 hover:text-indigo-400"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onDelete(reply.id)}
                            className="mobile-touch-target p-1 text-gray-400 hover:text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Reply Content */}
                    <p className="mobile-text-xs text-gray-300 mb-3">
                      {reply.content}
                    </p>

                    {/* Reply Actions */}
                    <div className="minimal-flex gap-4 items-center">
                      <button
                        onClick={() => onLike(reply.id)}
                        className="minimal-flex gap-1 text-xs text-gray-400 hover:text-red-400"
                      >
                        <Heart className="w-3 h-3" />
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
    </div>
  );
}

