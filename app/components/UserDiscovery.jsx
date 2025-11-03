

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Users, X, MessageCircle } from 'lucide-react';
import UserListSkeleton from './UserListSkeleton';

export default function UserDiscovery({ isOpen, onClose, onStartConversation, currentUserId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Get all users except current user
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, nickname, handle, avatar_url')
        .neq('id', currentUserId)
        .order('full_name', { ascending: true });

      if (error) {
        console.error('Error loading users:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        setUsers([]);
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const name = user.full_name?.toLowerCase() || '';
    const nickname = user.nickname?.toLowerCase() || '';
    const handle = user.handle?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    
    return name.includes(search) || nickname.includes(search) || handle.includes(search);
  });

  const handleStartConversation = async (user) => {
    try {
      // Use the helper function to get or create conversation
      const { data, error } = await supabase.rpc('get_or_create_direct_conversation', {
        user1_id: currentUserId,
        user2_id: user.id
      });

      if (error) {
        console.error('Error creating conversation:', error);
        return;
      }

      // Create conversation object for the UI
      const conversation = {
        id: data,
        type: 'direct',
        otherParticipants: [user],
        lastMessage: null
      };

      onStartConversation(conversation);
      onClose();
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex justify-center items-center p-4 animate-fade-in"
      style={{ animation: 'fadeInBackdrop 0.2s ease-out' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        style={{ animation: 'slideUpModal 0.3s ease-out' }}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Start New Chat</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-4">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#087E8B] focus:border-transparent"
            />
          </div>

          {/* Users List */}
          {loading ? (
            <UserListSkeleton count={6} />
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">
                {searchTerm ? 'No users found' : 'No users available'}
              </p>
              <p className="text-gray-500 text-sm">
                {searchTerm ? 'Try a different search term' : 'All users are already in your conversations'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleStartConversation(user)}
                  className="w-full p-3 text-left hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-[#087E8B] rounded-full flex items-center justify-center flex-shrink-0">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.full_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <Users className="w-5 h-5 text-white" />
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate">
                        {user.nickname || user.full_name || 'Unknown User'}
                      </h3>
                      {user.handle && (
                        <p className="text-sm text-gray-400 truncate">
                          @{user.handle}
                        </p>
                      )}
                    </div>

                    {/* Start Chat Button */}
                    <div className="p-2 text-[#087E8B] hover:text-[#087E8B] transition-colors">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
