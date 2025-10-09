'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Send, MessageCircle, Users, CheckCheck, AlertCircle } from 'lucide-react';
import SidebarLayout from '../components/SidebarLayout';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
);

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchMessages();
      setupRealtimeSubscription();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        if (error.code === 'PGRST116') {
          setError('Messages table does not exist. Please set up the database first.');
          setMessages([]);
          return;
        }
        setError('Failed to fetch messages. Please try again.');
        throw error;
      }
      setMessages(data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages. Please check your connection.');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || sendingMessage) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSendingMessage(true);

    try {
      const { error } = await supabase
        .from('messages')
        .insert([
          {
            user_id: user.id,
            user_email: user.email,
            message: messageText,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) {
        console.error('Supabase error:', error);
        if (error.code === 'PGRST116') {
          setError('Messages table does not exist. Please set up the database first.');
          return;
        }
        setError('Failed to send message. Please try again.');
        throw error;
      }
      setError(null);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please check your connection.');
    } finally {
      setSendingMessage(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set typing indicator
    setIsTyping(true);
    
    // Clear typing indicator after 1 second of no typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
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

  if (loading) {
    return (
      <SidebarLayout currentPage="chat">
        <div className="minimal-flex-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="minimal-text">Loading chat...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (!user) {
    return (
      <SidebarLayout currentPage="chat">
        <div className="minimal-flex-center h-64">
          <p className="minimal-text">Please log in to access chat</p>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout currentPage="chat">
      <div className="h-[calc(100vh-12rem)]">
        <div className="mobile-card h-full flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b" style={{ borderColor: '#374151' }}>
            <div className="minimal-flex-between">
              <div className="minimal-flex">
                <MessageCircle className="minimal-icon mr-2" />
                <h1 className="minimal-heading">Community Chat</h1>
              </div>
              <div className="minimal-flex text-xs text-gray-400">
                <Users className="minimal-icon mr-1" />
                <span>{onlineUsers + 1} online</span>
              </div>
            </div>
            {error && (
              <div className="mt-3 p-2 bg-red-900 border border-red-700 rounded-sm">
                <div className="minimal-flex">
                  <AlertCircle className="minimal-icon mr-2 text-red-400" />
                  <p className="minimal-text text-red-300">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="minimal-flex-center h-full">
                <div className="minimal-flex">
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                  <p className="minimal-text">Loading messages...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="minimal-flex-center h-full">
                <div className="text-center">
                  <MessageCircle className="minimal-icon mx-auto mb-2 text-gray-500" />
                  <p className="minimal-text">No messages yet. Start the conversation!</p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.user_id === user.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-3 rounded-lg text-sm ${
                      message.user_id === user.id
                        ? 'text-white'
                        : 'text-white'
                    }`}
                    style={{
                      backgroundColor: message.user_id === user.id ? '#374151' : '#4B5563'
                    }}
                  >
                    {message.user_id !== user.id && (
                      <div className="text-xs text-gray-300 mb-1 font-medium">
                        {message.user_email.split('@')[0]}
                      </div>
                    )}
                    <div className="mb-1">
                      <p className="leading-relaxed">{message.message}</p>
                    </div>
                    <div className="minimal-flex-between text-xs text-gray-400">
                      <span>{formatTime(message.created_at)}</span>
                      {message.user_id === user.id && (
                        <div className="minimal-flex">
                          <CheckCheck className="minimal-icon" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: '#4B5563' }}>
                  <div className="minimal-flex text-gray-400">
                    <div className="flex space-x-1 mr-2">
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs">Someone is typing...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t" style={{ borderColor: '#374151' }}>
            <form onSubmit={sendMessage} className="flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={handleTyping}
                placeholder="Type your message..."
                className="flex-1 minimal-input"
                disabled={!user || sendingMessage}
                maxLength={500}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || !user || sendingMessage}
                className="minimal-button mobile-touch-target disabled:opacity-50"
                style={{ backgroundColor: '#374151' }}
              >
                {sendingMessage ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="minimal-icon" />
                )}
              </button>
            </form>
            {newMessage.length > 400 && (
              <div className="mt-2 text-xs text-gray-400 text-right">
                {newMessage.length}/500 characters
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
