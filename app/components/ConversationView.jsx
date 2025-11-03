import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Send, ArrowLeft, Users, MoreHorizontal, Paperclip, Smile, CheckCheck, Trash2, MessageCircle } from 'lucide-react';
import ErrorRetry from './ErrorRetry';
import GroupMembersModal from './GroupMembersModal';
import ConversationMessageSkeleton from './ConversationMessageSkeleton';

export default function ConversationView({ conversation, currentUserId, onBack }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showGroupMembers, setShowGroupMembers] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesStartRef = useRef(null);
  const typingChannelRef = useRef(null);
  const navigate = useNavigate();

  const handleProfileClick = () => {
    if (conversation.type === 'direct' && conversation.otherParticipants?.length > 0) {
      const otherUserId = conversation.otherParticipants[0].user_id;
      navigate(`/profile/${otherUserId}`);
    }
  };

  useEffect(() => {
    if (conversation) {
      loadMessages();
      setupRealtimeSubscription();
      setupTypingSubscription();
      markMessagesAsRead();
    }
  }, [conversation]);

  useEffect(() => {
    // Mark messages as read when conversation changes or new messages arrive
    if (conversation && messages.length > 0) {
      markMessagesAsRead();
    }
  }, [conversation, messages]);

  useEffect(() => {
    // Only auto-scroll if user is near the bottom (within 200px)
    const messagesContainer = messagesEndRef.current?.parentElement;
    if (messagesContainer) {
      const isNearBottom = 
        messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight < 200;
      
      if (isNearBottom || messages.length <= 20) {
        // Small delay to ensure DOM is updated
        setTimeout(() => scrollToBottom(messages.length <= 20), 50);
      }
    }
  }, [messages]);

  const loadMessages = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }
      
      // Check if conversation exists first
      if (!conversation?.id) {
        setMessages([]);
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      console.log('Loading messages for conversation:', conversation.id);
      console.log('Current user ID:', currentUserId);

      const limit = 50;
      const offset = loadMore ? messages.length : 0;

      const { data, error } = await supabase
        .from('direct_messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          message,
          message_type,
          file_url,
          created_at,
          updated_at
        `)
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error loading messages:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        if (!loadMore) {
          setMessages([]);
          setError(error);
        }
        return;
      }

      // Check if there are more messages
      setHasMoreMessages((data || []).length === limit);

      // Get sender profiles for each message
      const messagesWithProfiles = await Promise.all(
        (data || []).map(async (message) => {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, nickname, full_name, avatar_url')
            .eq('id', message.sender_id)
            .single();

          if (profileError) {
            console.error('Error fetching profile for sender:', message.sender_id, profileError);
          }

          return {
            ...message,
            profiles: profile || { nickname: null, full_name: 'Unknown User', avatar_url: null }
          };
        })
      );

      if (loadMore) {
        setMessages(prev => [...messagesWithProfiles, ...prev]);
      } else {
        setMessages(messagesWithProfiles);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      if (!loadMore) {
        setMessages([]);
        setError(error);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!conversation?.id) return;

    const subscription = supabase
      .channel(`conversation-${conversation.id}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'direct_messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        async (payload) => {
          const newMessage = payload.new;
          
          // Get sender profile for the new message
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, nickname, full_name, avatar_url')
            .eq('id', newMessage.sender_id)
            .single();

          if (profileError) {
            console.error('Error fetching profile for new message sender:', newMessage.sender_id, profileError);
          }

          const messageWithProfile = {
            ...newMessage,
            profiles: profile || { nickname: null, full_name: 'Unknown User', avatar_url: null }
          };

          setMessages(prev => {
            // Check if message already exists (avoid duplicates from optimistic updates)
            const exists = prev.some(msg => msg.id === messageWithProfile.id);
            if (exists) return prev;
            return [...prev, { ...messageWithProfile, isNew: true }];
          });
          
          // Auto-scroll to new message
          setTimeout(() => scrollToBottom(), 100);
          
          // Remove "isNew" flag after animation
          setTimeout(() => {
            setMessages(prev => prev.map(msg => 
              msg.id === messageWithProfile.id ? { ...msg, isNew: false } : msg
            ));
          }, 600);
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        (payload) => {
          // Handle message updates (like read receipts)
          setMessages(prev => 
            prev.map(msg => 
              msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
            )
          );
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const setupTypingSubscription = () => {
    if (!conversation?.id) return;

    const subscription = supabase
      .channel(`typing-${conversation.id}`)
      .on('presence', { event: 'sync' }, () => {
        const state = subscription.presenceState();
        const typingUsers = Object.values(state)
          .flat()
          .filter(user => user.user_id !== currentUserId && user.typing)
          .map(user => user.user_name || 'Someone');
        
        setTypingUsers(typingUsers);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // Handle user joining
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // Handle user leaving
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track presence
          await subscription.track({
            user_id: currentUserId,
            user_name: 'Current User', // You might want to get this from profile
            typing: false,
            online_at: new Date().toISOString()
          });
        }
      });

    // Store the channel reference for broadcasting
    typingChannelRef.current = subscription;
    return () => subscription.unsubscribe();
  };

  const markMessagesAsRead = async () => {
    if (!conversation?.id || !currentUserId) return;

    try {
      // Update the user's last_read_at timestamp for this conversation
      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversation.id)
        .eq('user_id', currentUserId);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId || sendingMessage) return;

    const messageText = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    
    // Optimistic update - add message immediately
    const optimisticMessage = {
      id: tempId,
      conversation_id: conversation.id,
      sender_id: currentUserId,
      message: messageText,
      message_type: 'text',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profiles: {
        full_name: 'You',
        avatar_url: null
      },
      sending: true,
      isNew: true
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    setSendingMessage(true);

    // Clear typing indicator
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
    setIsTyping(false);

    // Scroll to bottom after optimistic update
    setTimeout(() => scrollToBottom(), 100);

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .insert([
          {
            conversation_id: conversation.id,
            sender_id: currentUserId,
            message: messageText,
            message_type: 'text'
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Remove optimistic message on error
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
        setNewMessage(messageText); // Restore message on error
      } else {
        // Get sender profile for the real message
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, nickname, full_name, avatar_url')
          .eq('id', currentUserId)
          .single();

        if (profileError) {
          console.error('Error fetching profile for current user:', profileError);
        }

        // Replace optimistic message with real one
        setMessages(prev => prev.map(msg => 
          msg.id === tempId 
            ? { ...data, profiles: profile || { nickname: null, full_name: 'You', avatar_url: null }, sending: false, isNew: true }
            : msg
        ));
        
        // Remove "isNew" flag after animation
        setTimeout(() => {
          setMessages(prev => prev.map(msg => 
            msg.id === data.id ? { ...msg, isNew: false } : msg
          ));
        }, 600);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      setNewMessage(messageText); // Restore message on error
    } finally {
      setSendingMessage(false);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Set typing indicator
    setIsTyping(true);
    
    // Broadcast typing status
    broadcastTypingStatus(true);
    
    // Clear typing indicator after 1 second of no typing
    const timeout = setTimeout(() => {
      setIsTyping(false);
      broadcastTypingStatus(false);
    }, 1000);
    
    setTypingTimeout(timeout);
  };

  const broadcastTypingStatus = async (isTyping) => {
    if (!conversation?.id || !typingChannelRef.current) return;

    try {
      // Use the existing channel reference
      await typingChannelRef.current.track({
        user_id: currentUserId,
        user_name: 'Current User', // You might want to get this from profile
        typing: isTyping,
        online_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error broadcasting typing status:', error);
    }
  };

  const scrollToBottom = (instant = false) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: instant ? 'auto' : 'smooth',
        block: 'end'
      });
    }
  };

  const handleScroll = (e) => {
    const { scrollTop } = e.target;
    if (scrollTop === 0 && hasMoreMessages && !loadingMore) {
      loadMessages(true);
    }
  };

  const loadMoreMessages = () => {
    if (hasMoreMessages && !loadingMore) {
      loadMessages(true);
    }
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

  const handleDeleteConversation = async () => {
    if (!conversation?.id) return;

    try {
      setDeleting(true);
      
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversation.id);

      if (error) {
        console.error('Error deleting conversation:', error);
        setError(error);
        return;
      }

      // Go back to conversation list after successful deletion
      onBack();
      
    } catch (error) {
      console.error('Error deleting conversation:', error);
      setError(error);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const getConversationName = () => {
    if (conversation.name) return conversation.name;
    
    if (conversation.type === 'direct' && conversation.otherParticipants?.length > 0) {
      return conversation.otherParticipants[0].profiles?.full_name || 'Unknown User';
    }
    
    return 'Unknown Conversation';
  };

  const getConversationAvatar = () => {
    if (conversation.type === 'direct' && conversation.otherParticipants?.length > 0) {
      return conversation.otherParticipants[0].profiles?.avatar_url;
    }
    return null;
  };

  const getMessageStatus = (message) => {
    // For now, we'll show basic status. In a full implementation, you'd check read_by data
    const now = new Date();
    const messageTime = new Date(message.created_at);
    const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <span className="text-gray-400">Sending</span>
        </div>
      );
    } else if (diffInMinutes < 5) {
      return (
        <div className="flex items-center gap-1">
          <CheckCheck className="w-3 h-3 text-gray-400" />
          <span className="text-gray-400">Sent</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1">
          <CheckCheck className="w-3 h-3 text-green-400" />
          <span className="text-green-400">Delivered</span>
        </div>
      );
    }
  };

  const shouldShowDateSeparator = (message, prevMessage) => {
    if (!prevMessage) return true;
    
    const messageDate = new Date(message.created_at);
    const prevMessageDate = new Date(prevMessage.created_at);
    
    // Show separator if messages are on different days
    return messageDate.toDateString() !== prevMessageDate.toDateString();
  };

  const formatMessageDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] md:h-full bg-slate-900 rounded-lg overflow-hidden border border-slate-700 w-full">
      {/* Header - Fixed */}
      <div className="fixed top-14 left-0 right-0 md:static md:flex-shrink-0 p-3 border-b border-slate-700 bg-slate-800 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors md:hidden"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 bg-[#087E8B] rounded-lg flex items-center justify-center">
              {getConversationAvatar() ? (
                <img
                  src={getConversationAvatar()}
                  alt={getConversationName()}
                  className="w-10 h-10 rounded-lg object-cover"
                />
              ) : (
                <Users className="w-5 h-5 text-white" />
              )}
            </div>
            {/* Online indicator */}
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900"></div>
          </div>
          
          <div className="flex-1 min-w-0">
            {conversation.type === 'direct' ? (
              <button
                onClick={handleProfileClick}
                className="text-base font-semibold text-[#087E8B] hover:text-[#087E8B] transition-colors truncate text-left"
              >
                {getConversationName()}
              </button>
            ) : (
              <h2 className="text-base font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {getConversationName()}
              </h2>
            )}
            <p className="text-sm text-slate-400">
              {conversation.type === 'direct' ? 'Direct message' : 'Group conversation'}
            </p>
          </div>
          
          {/* Group Members Button */}
          {conversation.type === 'group' && (
            <button
              onClick={() => {
                console.log('Opening group members modal for conversation:', conversation);
                setShowGroupMembers(true);
              }}
              className="p-2 text-slate-400 hover:text-[#087E8B] hover:bg-slate-700/50 rounded-lg transition-colors"
              title="View group members"
            >
              <Users className="w-5 h-5" />
            </button>
          )}
          
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Delete conversation"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 pt-[120px] pb-40 md:pt-4 md:pb-4" onScroll={handleScroll}>
        {/* Load More Button */}
        {hasMoreMessages && !loadingMore && (
          <div className="flex justify-center mb-6">
            <button
              onClick={loadMoreMessages}
              className="px-8 py-4 bg-slate-700/60 text-white text-sm rounded-xl hover:bg-slate-600/60 transition-all duration-300 border border-slate-600/50 hover:border-slate-500/60 backdrop-blur-sm hover:scale-105 active:scale-95 font-medium shadow-lg hover:shadow-slate-900/20"
            >
              Load older messages
            </button>
          </div>
        )}
        
        {/* Loading More Indicator */}
        {loadingMore && (
          <div className="flex justify-center mb-6">
            <div className="w-8 h-8 border-3 border-[#087E8B] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        <div ref={messagesStartRef} />
        {loading ? (
          <ConversationMessageSkeleton count={6} />
        ) : error ? (
          <ErrorRetry
            error={error}
            onRetry={() => loadMessages(false)}
            title="Failed to load messages"
            description="There was an error loading the conversation messages. Please try again."
          />
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full animate-fade-in">
            <div className="text-center max-w-sm px-6">
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#087E8B]/20 to-[#087E8B]600/20 rounded-full flex items-center justify-center mx-auto">
                  <MessageCircle className="w-8 h-8 text-[#087E8B]" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500/30 rounded-full animate-pulse"></div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Start the Conversation</h3>
              <p className="text-gray-400 mb-4 text-sm leading-relaxed">
                Send a message to {getConversationName()} to get started. Your messages will appear here.
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <div className="w-1 h-1 bg-[#087E8B] rounded-full animate-pulse"></div>
                <span>Messages are end-to-end secure</span>
              </div>
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const showDateSeparator = shouldShowDateSeparator(message, prevMessage);
            
            return (
              <div key={message.id}>
                {showDateSeparator && (
                  <div className="flex justify-center my-4">
                    <div className="bg-slate-700/30 text-slate-500 text-xs px-3 py-1.5 rounded-full border border-slate-600/30 backdrop-blur-sm">
                      {formatMessageDate(message.created_at)}
                    </div>
                  </div>
                )}
                <div
                  className={`flex ${message.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                >
              <div 
                className={`flex gap-3 max-w-xs lg:max-w-md ${message.sender_id === currentUserId ? 'flex-row-reverse' : ''} transition-all duration-300`}
                style={{
                  animation: message.isNew ? 'slideInMessage 0.3s ease-out' : undefined,
                  transform: message.isNew ? 'translateY(0)' : undefined
                }}
              >
                {message.sender_id !== currentUserId && (
                  <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                    {message.profiles?.avatar_url ? (
                      <img
                        src={message.profiles.avatar_url}
                        alt={message.profiles.full_name}
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                    ) : (
                      <Users className="w-4 h-4 text-white" />
                    )}
                  </div>
                )}
                
                <div
                  className={`px-3 py-2 rounded-lg text-sm max-w-xs transition-all duration-200 ${
                    message.sender_id === currentUserId
                      ? 'bg-[#087E8B] text-white shadow-md hover:shadow-lg'
                      : 'bg-slate-700 text-white shadow-sm hover:shadow-md'
                  } ${message.sending ? 'opacity-70' : 'opacity-100'} ${message.isNew ? 'scale-[1.02]' : 'scale-100'}`}
                >
                  {message.sender_id !== currentUserId && (
                    <div className="text-xs text-slate-300 mb-2 font-bold">
                      {message.profiles?.nickname || message.profiles?.full_name || 'Unknown User'}
                    </div>
                  )}
                  <div className="mb-2">
                    <p className="leading-relaxed">{message.message}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs opacity-90">
                    <span className="text-slate-300 font-medium" title={new Date(message.created_at).toLocaleString()}>
                      {formatTime(message.created_at)}
                    </span>
                    {message.sender_id === currentUserId && (
                      <div className="flex items-center gap-1 ml-2">
                        {message.sending ? (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                            <span className="text-gray-400 text-[10px]">Sending</span>
                          </div>
                        ) : (
                          getMessageStatus(message)
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
              </div>
            );
          })
        )}
        
        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start animate-fade-in">
            <div className="flex gap-2 max-w-xs">
              <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div className="px-4 py-2.5 rounded-lg text-sm bg-slate-700 text-white shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1.5 items-center">
                    <div className="w-2 h-2 bg-[#087E8B] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-2 h-2 bg-[#087E8B] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                    <div className="w-2 h-2 bg-[#087E8B] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                  <span className="text-xs text-slate-300 font-medium">
                    {typingUsers.length === 1
                      ? `${typingUsers[0]} is typing...`
                      : `${typingUsers.join(', ')} are typing...`
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input - Fixed */}
      <div className="fixed bottom-20 left-0 right-0 md:static md:flex-shrink-0 p-3 border-t border-slate-700 bg-slate-800 z-20" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        <form onSubmit={sendMessage} className="flex gap-2">
          {/* Attachment Button */}
          <button
            type="button"
            className="p-2 text-slate-400 hover:text-[#087E8B] hover:bg-slate-700/50 rounded-lg transition-colors"
            title="Attach file"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          
          {/* Message Input */}
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder="Type your message..."
            disabled={!currentUserId || sendingMessage}
            maxLength={500}
            className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#087E8B] focus:border-[#087E8B] transition-colors text-sm"
          />
          
          {/* Emoji Button */}
          <button
            type="button"
            className="p-2 text-slate-400 hover:text-[#087E8B] hover:bg-slate-700/50 rounded-lg transition-colors"
            title="Add emoji"
          >
            <Smile className="w-4 h-4" />
          </button>
          
          {/* Send Button */}
          <button
            type="submit"
            disabled={!newMessage.trim() || !currentUserId || sendingMessage}
            className="p-2 bg-[#087E8B] text-white rounded-lg hover:bg-[#066a75] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {sendingMessage ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
        
        {/* Character Count */}
        {newMessage.length > 400 && (
          <div className="mt-2 text-xs text-slate-400 text-right">
            {newMessage.length}/500 characters
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
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
              Are you sure you want to delete "{getConversationName()}"? 
              All messages in this conversation will be permanently removed.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConversation}
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

      {/* Group Members Modal */}
      {conversation?.type === 'group' && (
        <GroupMembersModal
          isOpen={showGroupMembers}
          onClose={() => setShowGroupMembers(false)}
          conversation={conversation}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}
