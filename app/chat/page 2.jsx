'use client';

import { useState } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import { MessageCircle, Send, Plus, Search } from 'lucide-react';

export default function Chat() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for conversations and messages
  const conversations = [
    {
      id: 1,
      name: 'John Doe',
      lastMessage: 'Hey, how are you doing?',
      timestamp: '2m ago',
      unread: 2,
      avatar: 'JD'
    },
    {
      id: 2,
      name: 'Sarah Wilson',
      lastMessage: 'Thanks for the help earlier!',
      timestamp: '1h ago',
      unread: 0,
      avatar: 'SW'
    },
    {
      id: 3,
      name: 'Mike Chen',
      lastMessage: 'Can we schedule a meeting?',
      timestamp: '3h ago',
      unread: 1,
      avatar: 'MC'
    },
    {
      id: 4,
      name: 'Emma Davis',
      lastMessage: 'The project looks great!',
      timestamp: '1d ago',
      unread: 0,
      avatar: 'ED'
    }
  ];

  const messages = selectedConversation ? [
    {
      id: 1,
      text: 'Hey, how are you doing?',
      sender: 'other',
      timestamp: '2:30 PM'
    },
    {
      id: 2,
      text: 'I\'m doing great! How about you?',
      sender: 'me',
      timestamp: '2:32 PM'
    },
    {
      id: 3,
      text: 'Pretty good, thanks for asking. Working on some new features.',
      sender: 'other',
      timestamp: '2:35 PM'
    },
    {
      id: 4,
      text: 'That sounds exciting! What kind of features?',
      sender: 'me',
      timestamp: '2:36 PM'
    }
  ] : [];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      // Here you would send the message to your backend
      console.log('Sending message:', newMessage);
      setNewMessage('');
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SidebarLayout currentPage="chat">
      <div className="h-full minimal-chat-container">
        {/* Conversations Sidebar */}
        <div className="minimal-chat-sidebar">
          {/* Header */}
          <div className="p-4 border-b border-gray-700">
            <div className="minimal-flex-between mb-3">
              <h2 className="minimal-heading">Messages</h2>
              <button className="minimal-button bg-gray-700 text-gray-300 hover:bg-gray-600">
                <Plus className="minimal-icon" />
              </button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 minimal-icon text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="minimal-input pl-8 w-full"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="minimal-conversation-list">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`minimal-conversation-item ${
                  selectedConversation?.id === conversation.id ? 'active' : ''
                }`}
                onClick={() => setSelectedConversation(conversation)}
              >
                <div className="minimal-flex gap-3">
                  <div className="w-10 h-10 bg-gray-600 rounded-sm minimal-flex-center">
                    <span className="minimal-text text-xs font-medium">
                      {conversation.avatar}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="minimal-flex-between mb-1">
                      <h3 className="minimal-heading truncate">
                        {conversation.name}
                      </h3>
                      <span className="minimal-text text-xs">
                        {conversation.timestamp}
                      </span>
                    </div>
                    <div className="minimal-flex-between">
                      <p className="minimal-text text-sm truncate">
                        {conversation.lastMessage}
                      </p>
                      {conversation.unread > 0 && (
                        <span className="bg-gray-600 text-gray-200 text-xs px-2 py-1 rounded-full min-w-5 minimal-flex-center">
                          {conversation.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="minimal-chat-main">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-700 minimal-flex-between">
                <div className="minimal-flex gap-3">
                  <div className="w-8 h-8 bg-gray-600 rounded-sm minimal-flex-center">
                    <span className="minimal-text text-xs font-medium">
                      {selectedConversation.avatar}
                    </span>
                  </div>
                  <div>
                    <h3 className="minimal-heading">{selectedConversation.name}</h3>
                    <p className="minimal-text text-xs">Online</p>
                  </div>
                </div>
                <button className="minimal-button bg-gray-700 text-gray-300 hover:bg-gray-600">
                  <MessageCircle className="minimal-icon" />
                </button>
              </div>

              {/* Messages */}
              <div className="minimal-message-area">
                <div className="minimal-messages">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`minimal-message ${
                        message.sender === 'me' ? 'sent' : 'received'
                      }`}
                    >
                      <div className={`minimal-message-bubble ${
                        message.sender === 'me' ? 'sent' : 'received'
                      }`}>
                        <p className="minimal-text">{message.text}</p>
                        <span className="minimal-text text-xs opacity-70 mt-1 block">
                          {message.timestamp}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="minimal-message-input">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="minimal-input"
                  />
                  <button type="submit" className="minimal-button">
                    <Send className="minimal-icon" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            /* No Conversation Selected */
            <div className="minimal-flex-center h-full">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="minimal-heading text-lg mb-2">Select a conversation</h3>
                <p className="minimal-text">
                  Choose a conversation from the sidebar to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
