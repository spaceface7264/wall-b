'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { MessageCircle, Users, Clock, Search, Plus, Trash2 } from 'lucide-react';
import UserDiscovery from './UserDiscovery';
import UnreadBadge from './UnreadBadge';
import GroupChatModal from './GroupChatModal';
import ErrorRetry from './ErrorRetry';

export default function ConversationList({ onSelectConversation, currentUserId }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserDiscovery, setShowUserDiscovery] = useState(false);
  const [showGroupChat, setShowGroupChat] = useState(false);
  const [error, setError] = useState(null);
  const [conversationToDelete, setConversationToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (currentUserId) {
      loadConversations();
    }
  }, [currentUserId]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First, check if tables exist by trying a simple query
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          id,
          name,
          type,
          created_by,
          created_at,
          updated_at
        `)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading conversations:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        setError(error);
        return;
      }

      // If no conversations exist, just set empty array
      if (!conversations || conversations.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Get participants for each conversation
      const conversationsWithParticipants = await Promise.all(
        conversations.map(async (conv) => {
          const { data: participants } = await supabase
            .from('conversation_participants')
            .select(`
              user_id,
              last_read_at,
              profiles!user_id (
                full_name,
                avatar_url
              )
            `)
            .eq('conversation_id', conv.id);

          const { data: lastMessage } = await supabase
            .from('direct_messages')
            .select('id, message, created_at, sender_id')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...conv,
            conversation_participants: participants || [],
            direct_messages: lastMessage ? [lastMessage] : []
          };
        })
      );

      // Process conversations to get last message and other participant info
      const processedConversations = conversationsWithParticipants.map(conv => {
        const participants = conv.conversation_participants || [];
        const otherParticipants = participants.filter(p => p.user_id !== currentUserId);
        const lastMessage = conv.direct_messages?.[0] || null;
        
        return {
          ...conv,
          otherParticipants,
          lastMessage,
          unreadCount: 0 // TODO: Calculate unread count
        };
      });

      setConversations(processedConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return date.toLocaleDateString();
  };

  const handleDeleteConversation = async (conversationId) => {
    try {
      setDeleting(true);
      
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) {
        console.error('Error deleting conversation:', error);
        setError(error);
        return;
      }

      // Remove from local state
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      setConversationToDelete(null);
      
    } catch (error) {
      console.error('Error deleting conversation:', error);
      setError(error);
    } finally {
      setDeleting(false);
    }
  };

  const getConversationName = (conversation) => {
    if (conversation.name) return conversation.name;
    
    if (conversation.type === 'direct' && conversation.otherParticipants.length > 0) {
      return conversation.otherParticipants[0].profiles?.full_name || 'Unknown User';
    }
    
    return 'Unknown Conversation';
  };

  const getConversationAvatar = (conversation) => {
    if (conversation.type === 'direct' && conversation.otherParticipants.length > 0) {
      return conversation.otherParticipants[0].profiles?.avatar_url;
    }
    return null;
  };

  const filteredConversations = conversations.filter(conv => {
    const name = getConversationName(conv).toLowerCase();
    const lastMessage = conv.lastMessage?.message?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    
    return name.includes(search) || lastMessage.includes(search);
  });

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-400 text-sm">Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorRetry
        error={error}
        onRetry={loadConversations}
        title="Failed to load conversations"
        description="There was an error loading your conversations. Please try again."
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div>
        <div>
          <div>
            <h2>Messages</h2>
            <p>Connect with your community</p>
          </div>
          <div>
            <button
              onClick={() => setShowGroupChat(true)}
              title="New group chat"
            >
              <Users />
            </button>
            <button
              onClick={() => setShowUserDiscovery(true)}
              title="New conversation"
            >
              <Plus />
            </button>
          </div>
        </div>
        
        <div>
          <Search />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Conversations List */}
      <div>
        {filteredConversations.length === 0 ? (
          <div>
            <div>
              <MessageCircle />
              <h3>
                {searchTerm ? 'No conversations found' : 'No conversations yet'}
              </h3>
              <p>
                {searchTerm ? 'Try a different search term' : 'Start a conversation with someone!'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowUserDiscovery(true)}
                >
                  Start Chatting
                </button>
              )}
            </div>
          </div>
        ) : (
          <div>
            {filteredConversations.map((conversation) => (
              <div key={conversation.id}>
                <div>
                  {/* Avatar */}
                  <div>
                    <div>
                      {getConversationAvatar(conversation) ? (
                        <img
                          src={getConversationAvatar(conversation)}
                          alt={getConversationName(conversation)}
                        />
                      ) : (
                        <Users />
                      )}
                    </div>
                    {/* Online indicator */}
                    <div></div>
                  </div>

                  {/* Conversation Info - Clickable */}
                  <button
                    onClick={() => onSelectConversation(conversation)}
                  >
                    <div>
                      <h3>
                        {getConversationName(conversation)}
                      </h3>
                      <div>
                        <Clock />
                        <span>{formatTime(conversation.lastMessage?.created_at)}</span>
                      </div>
                    </div>
                    
                    <p>
                      {conversation.lastMessage ? (
                        <>
                          <span>
                            {conversation.lastMessage.sender_id === currentUserId ? 'You: ' : ''}
                          </span>
                          {conversation.lastMessage.message}
                        </>
                      ) : (
                        <span>No messages yet</span>
                      )}
                    </p>
                  </button>

                  {/* Action Buttons */}
                  <div>
                    {/* Unread indicator */}
                    <UnreadBadge userId={currentUserId} conversationId={conversation.id} />
                    
                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConversationToDelete(conversation);
                      }}
                      title="Delete conversation"
                    >
                      <Trash2 />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Discovery Modal */}
      <UserDiscovery
        isOpen={showUserDiscovery}
        onClose={() => setShowUserDiscovery(false)}
        onStartConversation={(conversation) => {
          onSelectConversation(conversation);
          setShowUserDiscovery(false);
        }}
        currentUserId={currentUserId}
      />

      {/* Group Chat Modal */}
      <GroupChatModal
        isOpen={showGroupChat}
        onClose={() => setShowGroupChat(false)}
        onCreateGroup={(conversation) => {
          onSelectConversation(conversation);
          setShowGroupChat(false);
          loadConversations(); // Refresh the conversation list
        }}
        currentUserId={currentUserId}
      />

      {/* Delete Confirmation Modal */}
      {conversationToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Delete Conversation</h3>
                <p className="text-sm text-slate-400">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-slate-300 mb-6">
              Are you sure you want to delete "{getConversationName(conversationToDelete)}"? 
              All messages in this conversation will be permanently removed.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setConversationToDelete(null)}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteConversation(conversationToDelete.id)}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
