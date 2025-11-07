

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { MessageCircle, Users, Clock, Search, Plus } from 'lucide-react';
import UserDiscovery from './UserDiscovery';
import UnreadBadge from './UnreadBadge';
import GroupChatModal from './GroupChatModal';
import ErrorRetry from './ErrorRetry';
import ConversationListSkeleton from './ConversationListSkeleton';

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
      
      // Get conversations the user participates in - RLS should filter, but we query via participants for extra security
      // First get conversation IDs for the current user
      const { data: userConversations, error: participantError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUserId);

      if (participantError) {
        console.error('Error loading user conversations:', participantError);
        setError(participantError);
        return;
      }

      if (!userConversations || userConversations.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Extract conversation IDs
      const conversationIds = userConversations.map(uc => uc.conversation_id);

      // Now get the full conversation details for those IDs (RLS will double-check)
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
        .in('id', conversationIds)
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
          const { data: participants, error: participantsError } = await supabase
            .from('conversation_participants')
            .select(`
              user_id,
              last_read_at,
              profiles!user_id (
                id,
                nickname,
                full_name,
                avatar_url
              )
            `)
            .eq('conversation_id', conv.id);

          if (participantsError) {
            console.error('Error fetching participants for conversation:', conv.id, participantsError);
          }

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
      <div className="h-full p-4">
        <ConversationListSkeleton count={5} />
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
    <div className="flex flex-col h-[calc(100vh-56px)] md:h-full bg-slate-900 rounded-lg overflow-hidden border border-slate-700 w-full">
      {/* Header - Fixed */}
      <div className="fixed top-14 left-0 right-0 md:static md:flex-shrink-0 p-3 border-b border-slate-700 bg-slate-800 z-20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Messages</h2>
            <p className="text-sm text-slate-400">Connect with your community</p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setShowGroupChat(true)}
              className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              title="New group chat"
            >
              <Users className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowUserDiscovery(true)}
              className="p-2 bg-[#2663EB] text-white rounded-lg hover:bg-[#1e4fd4] transition-colors"
              title="New conversation"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2663EB] focus:border-[#2663EB] transition-colors text-sm"
          />
        </div>
      </div>

      {/* Conversations List - Scrollable */}
      <div className="flex-1 overflow-y-auto pt-[120px] md:pt-0">
        {filteredConversations.length === 0 ? (
          <div className="flex items-center justify-center h-full p-6">
            <div className="text-center max-w-sm">
              <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-base font-medium text-white mb-2">
                {searchTerm ? 'No conversations found' : 'No conversations yet'}
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                {searchTerm ? 'Try a different search term' : 'Start a conversation with someone!'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowUserDiscovery(true)}
                  className="px-4 py-2 bg-[#2663EB] text-white rounded-lg hover:bg-[#1e4fd4] transition-colors text-sm font-medium"
                >
                  Start Chatting
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredConversations.map((conversation) => (
              <div key={conversation.id} className="group">
                <button
                  onClick={() => onSelectConversation(conversation)}
                  className="w-full flex items-center gap-3 p-2 hover:bg-slate-700/50 transition-colors rounded-lg text-left"
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 bg-[#2663EB] rounded-lg flex items-center justify-center">
                      {getConversationAvatar(conversation) ? (
                        <img
                          src={getConversationAvatar(conversation)}
                          alt={getConversationName(conversation)}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <Users className="w-5 h-5 text-white" />
                      )}
                    </div>
                    {/* Online indicator */}
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900"></div>
                  </div>

                  {/* Conversation Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-white truncate">
                        {getConversationName(conversation)}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(conversation.lastMessage?.created_at)}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-slate-400 truncate">
                      {conversation.lastMessage ? (
                        <>
                          <span className="text-slate-300">
                            {conversation.lastMessage.sender_id === currentUserId ? 'You: ' : ''}
                          </span>
                          {conversation.lastMessage.message}
                        </>
                      ) : (
                        <span className="italic text-slate-500">No messages yet</span>
                      )}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Unread indicator */}
                    <UnreadBadge userId={currentUserId} conversationId={conversation.id} />
                  </div>
                </button>
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
