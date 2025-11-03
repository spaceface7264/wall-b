

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Users, Search, Check, Plus } from 'lucide-react';
import Avatar from './Avatar';
import UserListSkeleton from './UserListSkeleton';

export default function GroupChatModal({ isOpen, onClose, onCreateGroup, currentUserId }) {
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const toggleUserSelection = (user) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      setError('Please enter a group name and select at least one member');
      return;
    }

    if (!currentUserId) {
      setError('You must be logged in to create a group chat');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create the group conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert([
          {
            name: groupName.trim(),
            type: 'group',
            created_by: currentUserId
          }
        ])
        .select()
        .single();

      if (convError) {
        console.error('Error creating group conversation:', convError);
        setError('Failed to create group. Please try again.');
        return;
      }

      // Add all participants (including creator)
      const participants = [
        { conversation_id: conversation.id, user_id: currentUserId },
        ...selectedUsers.map(user => ({
          conversation_id: conversation.id,
          user_id: user.id
        }))
      ];

      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert(participants);

      if (participantsError) {
        console.error('Error adding participants:', participantsError);
        setError('Failed to add group members. Please try again.');
        return;
      }

      // Format conversation for display
      const groupConversation = {
        ...conversation,
        displayTitle: groupName.trim(),
        displayAvatar: null,
        otherParticipants: selectedUsers,
        lastMessage: null
      };

      onCreateGroup(groupConversation);
      onClose();
    } catch (err) {
      console.error('Exception creating group:', err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setGroupName('');
    setSelectedUsers([]);
    setSearchTerm('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ animation: 'fadeInBackdrop 0.2s ease-out' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div 
        className="mobile-card w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
        style={{ animation: 'slideUpModal 0.3s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--divider-color)' }}>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Create Group Chat</h2>
          <button onClick={handleClose} className="p-2 text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Group Name Input */}
        <div className="p-4 border-b" style={{ borderColor: 'var(--divider-color)' }}>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Group Name
          </label>
          <input
            type="text"
            placeholder="Enter group name..."
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="minimal-input w-full"
            maxLength={50}
          />
        </div>

        {/* Search Users */}
        <div className="p-4 border-b" style={{ borderColor: 'var(--divider-color)' }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="minimal-input w-full pl-10 pr-4"
            />
          </div>
        </div>

        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <div className="p-4 border-b" style={{ borderColor: 'var(--divider-color)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Selected ({selectedUsers.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map(user => (
                <div
                  key={user.id}
                  className="flex items-center gap-2 bg-[#087E8B] text-white px-3 py-1 rounded-full text-sm"
                >
                  <Avatar url={user.avatar_url} size={20} />
                  <span>{user.full_name || 'Unknown User'}</span>
                  <button
                    onClick={() => toggleUserSelection(user)}
                    className="text-[#087E8B] hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="minimal-flex-center py-8">
              <div className="w-6 h-6 border-2 border-[#087E8B] border-t-transparent rounded-full animate-spin mr-2"></div>
              <p className="text-gray-400">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No users found.</p>
            </div>
          ) : (
            filteredUsers.map(user => {
              const isSelected = selectedUsers.some(u => u.id === user.id);
              return (
                <button
                  key={user.id}
                  onClick={() => toggleUserSelection(user)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    isSelected 
                      ? 'bg-[#087E8B] text-white' 
                      : 'bg-gray-800 hover:bg-gray-700 text-white'
                  }`}
                >
                  <Avatar url={user.avatar_url} size={40} />
                  <div className="flex-1 text-left">
                    <h3 className="font-medium">{user.nickname || user.full_name || 'Community Member'}</h3>
                    {user.handle && (
                      <p className="text-sm opacity-70 truncate">@{user.handle}</p>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="w-5 h-5 text-white" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-4 py-2 bg-red-900 text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t flex gap-3" style={{ borderColor: 'var(--divider-color)' }}>
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || selectedUsers.length === 0 || loading}
            className="flex-1 px-4 py-2 bg-[#087E8B] text-white rounded-lg hover:bg-[#066a75] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create Group
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


