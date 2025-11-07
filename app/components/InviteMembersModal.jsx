import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabase';
import { Search, Users, X, UserPlus, Check } from 'lucide-react';
import UserListSkeleton from './UserListSkeleton';
import { useToast } from '../providers/ToastProvider';
import { useDebounce } from '../hooks/useDebounce';

export default function InviteMembersModal({ isOpen, onClose, communityId, communityName, currentUserId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
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
      
      // First, get all suspended user IDs
      const { data: suspensionsData } = await supabase
        .from('user_suspensions')
        .select('user_id')
        .eq('is_active', true);
      
      const suspendedUserIds = new Set((suspensionsData || []).map(s => s.user_id));
      
      // Calculate cutoff date for inactive users (6 months ago)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      // Get all users except current user
      // Include users with null last_active_at (new users) or active within last 6 months
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, nickname, handle, avatar_url, email, last_active_at')
        .neq('id', currentUserId)
        .or(`last_active_at.is.null,last_active_at.gte.${sixMonthsAgo.toISOString()}`)
        .order('full_name', { ascending: true })
        .limit(200); // Increased limit since we're filtering more aggressively
      
      if (error) {
        console.error('Error loading users:', error);
        setUsers([]);
        return;
      }

      // Filter out suspended users and mock/test users
      const validUsers = (data || []).filter(user => {
        // Exclude suspended users
        if (suspendedUserIds.has(user.id)) return false;
        
        // Exclude mock/test users by email pattern
        const email = (user.email || '').toLowerCase();
        if (email.includes('example.com') || 
            email.includes('test@') || 
            email.includes('mock@') ||
            email.includes('testuser') ||
            email.includes('demo@')) {
          return false;
        }
        
        // Exclude users with mock/test names
        const fullName = (user.full_name || '').toLowerCase();
        const nickname = (user.nickname || '').toLowerCase();
        if (fullName.includes('test user') || 
            fullName.includes('mock user') ||
            nickname.includes('testuser') ||
            nickname.includes('mockuser')) {
          return false;
        }
        
        return true;
      });

      setUsers(validUsers.slice(0, 100)); // Limit to 100 after filtering
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

    if (!debouncedSearchTerm.trim()) return true;

    const name = user.full_name?.toLowerCase() || '';
    const nickname = user.nickname?.toLowerCase() || '';
    const handle = user.handle?.toLowerCase() || '';
    const search = debouncedSearchTerm.toLowerCase();
    
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

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/60 z-[9999] flex items-start md:items-center justify-center md:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-[#252526] w-full h-full md:h-auto md:rounded-lg md:max-w-md md:max-h-[90vh] flex flex-col shadow-xl"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 md:p-4 border-b border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">Invite Members</h2>
            <p className="text-sm text-gray-400 mt-1">to {communityName}</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 p-6 md:p-4 flex flex-col min-h-0 overflow-y-auto">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users to invite..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2663EB] focus:border-transparent transition-all"
            />
          </div>

          {/* Users List */}
          {loading ? (
            <UserListSkeleton count={6} />
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-500 mx-auto mb-4 opacity-50" />
              <p className="text-gray-300 mb-2 font-medium">
                {debouncedSearchTerm ? 'No users found' : 'No users available to invite'}
              </p>
              <p className="text-gray-500 text-sm">
                {debouncedSearchTerm ? 'Try a different search term' : 'All users are already members of this community'}
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
                    className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors border border-gray-700/50"
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={displayName}
                          className="w-11 h-11 rounded-full object-cover border-2 border-gray-600"
                        />
                      ) : (
                        <div className="w-11 h-11 bg-[#2663EB] rounded-full flex items-center justify-center text-white font-medium text-sm border-2 border-gray-600">
                          {getInitials(displayName)}
                        </div>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate text-base">
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
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 flex-shrink-0 ${
                        isInvited 
                          ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
                          : isInviting
                          ? 'bg-[#2663EB] text-white cursor-wait'
                          : 'bg-[#2663EB] hover:bg-[#1e4fd4] text-white'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isInviting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm font-medium">Inviting...</span>
                        </>
                      ) : isInvited ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span className="text-sm font-medium">Invited</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          <span className="text-sm font-medium">Invite</span>
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

  return createPortal(modalContent, document.body);
}

