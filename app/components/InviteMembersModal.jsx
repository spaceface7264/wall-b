import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Users, X, UserPlus, Check } from 'lucide-react';
import UserListSkeleton from './UserListSkeleton';
import { useToast } from '../providers/ToastProvider';

export default function InviteMembersModal({ isOpen, onClose, communityId, communityName, currentUserId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [invitingUsers, setInvitingUsers] = useState(new Set());
  const [invitedUsers, setInvitedUsers] = useState(new Set());
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      loadExistingMembers();
    }
  }, [isOpen, communityId]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Get all users except current user
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, nickname, handle, avatar_url')
        .neq('id', currentUserId)
        .order('full_name', { ascending: true })
        .limit(100); // Limit to first 100 users for performance

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

  const loadExistingMembers = async () => {
    try {
      // Get all existing community members to exclude them from the list
      const { data, error } = await supabase
        .from('community_members')
        .select('user_id')
        .eq('community_id', communityId);

      if (error) {
        console.error('Error loading existing members:', error);
        return;
      }

      const memberIds = new Set((data || []).map(m => m.user_id));
      setInvitedUsers(memberIds); // Users who are already members don't need invites
    } catch (error) {
      console.error('Error loading existing members:', error);
    }
  };

  const handleInviteUser = async (user) => {
    if (invitingUsers.has(user.id) || invitedUsers.has(user.id)) return;

    try {
      setInvitingUsers(prev => new Set([...prev, user.id]));

      // Get inviter's profile info
      const { data: inviterProfile } = await supabase
        .from('profiles')
        .select('nickname, full_name')
        .eq('id', currentUserId)
        .single();

      const inviterName = inviterProfile?.nickname || inviterProfile?.full_name || 'Someone';

      // Create invitation notification
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'community_invite',
          title: 'Community Invitation',
          message: `${inviterName} invited you to join "${communityName}"`,
          data: {
            community_id: communityId,
            community_name: communityName,
            inviter_id: currentUserId,
            inviter_name: inviterName
          }
        });

      if (notifError) {
        console.error('Error creating invitation:', notifError);
        showToast('error', 'Error', 'Failed to send invitation');
        setInvitingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(user.id);
          return newSet;
        });
        return;
      }

      // Mark as invited
      setInvitedUsers(prev => new Set([...prev, user.id]));
      showToast('success', 'Invitation Sent', `Invitation sent to ${user.nickname || user.full_name || 'user'}`);
    } catch (error) {
      console.error('Error inviting user:', error);
      showToast('error', 'Error', 'Something went wrong');
      setInvitingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(user.id);
        return newSet;
      });
    } finally {
      setInvitingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(user.id);
        return newSet;
      });
    }
  };

  const filteredUsers = users.filter(user => {
    // Exclude already invited/member users
    if (invitedUsers.has(user.id)) return false;

    const name = user.full_name?.toLowerCase() || '';
    const nickname = user.nickname?.toLowerCase() || '';
    const handle = user.handle?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    
    return name.includes(search) || nickname.includes(search) || handle.includes(search);
  });

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Invite Members</h2>
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
              placeholder="Search users to invite..."
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
                {searchTerm ? 'No users found' : 'No users available to invite'}
              </p>
              <p className="text-gray-500 text-sm">
                {searchTerm ? 'Try a different search term' : 'All users are already members of this community'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => {
                const isInviting = invitingUsers.has(user.id);
                const isInvited = invitedUsers.has(user.id);
                const displayName = user.nickname || user.full_name || 'Unknown User';
                
                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={displayName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-[#087E8B] rounded-full flex items-center justify-center text-white font-medium text-sm">
                          {getInitials(displayName)}
                        </div>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate">
                        {displayName}
                      </h3>
                      {user.handle && (
                        <p className="text-sm text-gray-400 truncate">
                          @{user.handle}
                        </p>
                      )}
                    </div>

                    {/* Invite Button */}
                    <button
                      onClick={() => handleInviteUser(user)}
                      disabled={isInviting || isInvited}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                      style={{
                        backgroundColor: isInvited ? 'var(--bg-surface)' : 'var(--primary-color)',
                        color: isInvited ? 'var(--text-muted)' : 'white'
                      }}
                    >
                      {isInviting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm">Inviting...</span>
                        </>
                      ) : isInvited ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span className="text-sm">Invited</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          <span className="text-sm">Invite</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

