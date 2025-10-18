'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { MessageCircle, Users, Clock, Search, Plus } from 'lucide-react';
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
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-800/60 via-slate-800/40 to-slate-900/60 backdrop-blur-sm">
      {/* Header with New Chat Button */}
      <div className="p-4 border-b border-slate-700/30 bg-gradient-to-r from-slate-800/90 via-slate-700/80 to-slate-800/90 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent mb-1">
              Messages
            </h2>
            <p className="text-slate-400 text-sm font-medium">Connect with your community</p>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setShowGroupChat(true)}
              className="p-2.5 bg-gradient-to-r from-emerald-500/90 to-emerald-600/90 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-emerald-500/30 hover:scale-105 active:scale-95 group"
              title="New group chat"
            >
              <Users className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
            </button>
            <button
              onClick={() => setShowUserDiscovery(true)}
              className="p-2.5 bg-gradient-to-r from-indigo-500/90 to-indigo-600/90 text-white rounded-xl hover:from-indigo-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-indigo-500/30 hover:scale-105 active:scale-95 group"
              title="New conversation"
            >
              <Plus className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
            </button>
          </div>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-400 transition-colors duration-200" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-700/60 border border-slate-600/40 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500/60 transition-all duration-300 backdrop-blur-sm hover:bg-slate-700/70 hover:border-slate-600/60 text-sm"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600/50 scrollbar-track-transparent">
        {filteredConversations.length === 0 ? (
          <div className="h-full flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <div className="w-24 h-24 bg-gradient-to-br from-slate-700/80 to-slate-800/80 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl border border-slate-600/30">
                <MessageCircle className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                {searchTerm ? 'No conversations found' : 'No conversations yet'}
              </h3>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                {searchTerm ? 'Try a different search term' : 'Start a conversation with someone!'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowUserDiscovery(true)}
                  className="px-8 py-4 bg-gradient-to-r from-indigo-500/90 to-indigo-600/90 text-white rounded-xl hover:from-indigo-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-indigo-500/30 hover:scale-105 active:scale-95 font-semibold"
                >
                  Start Chatting
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-2 space-y-1.5">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation)}
                className="w-full p-3 text-left hover:bg-slate-700/40 transition-all duration-300 rounded-2xl group border border-transparent hover:border-slate-600/30 hover:shadow-lg hover:shadow-slate-900/20 hover:scale-[1.01] active:scale-[0.99]"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500/90 to-indigo-600/90 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-indigo-500/30 transition-all duration-300 group-hover:scale-105">
                      {getConversationAvatar(conversation) ? (
                        <img
                          src={getConversationAvatar(conversation)}
                          alt={getConversationName(conversation)}
                          className="w-16 h-16 rounded-2xl object-cover"
                        />
                      ) : (
                        <Users className="w-8 h-8 text-white" />
                      )}
                    </div>
                    {/* Online indicator */}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-800 shadow-lg"></div>
                  </div>

                  {/* Conversation Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-white truncate text-lg group-hover:text-indigo-200 transition-colors duration-200">
                        {getConversationName(conversation)}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 group-hover:text-slate-300 transition-colors duration-200">
                        <Clock className="w-3 h-3" />
                        <span className="font-medium">{formatTime(conversation.lastMessage?.created_at)}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-slate-400 truncate leading-relaxed group-hover:text-slate-300 transition-colors duration-200">
                      {conversation.lastMessage ? (
                        <>
                          <span className="font-semibold text-slate-300 group-hover:text-white transition-colors duration-200">
                            {conversation.lastMessage.sender_id === currentUserId ? 'You: ' : ''}
                          </span>
                          {conversation.lastMessage.message}
                        </>
                      ) : (
                        <span className="italic text-slate-500">No messages yet</span>
                      )}
                    </p>
                  </div>

                  {/* Unread indicator */}
                  <div className="flex-shrink-0">
                    <UnreadBadge userId={currentUserId} conversationId={conversation.id} />
                  </div>
                </div>
              </button>
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
    </div>
  );
}
