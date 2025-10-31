

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Users, UserPlus, UserMinus, Crown, Search, MoreVertical } from 'lucide-react';
import Avatar from './Avatar';
import MembersListSkeleton from './MembersListSkeleton';
import UserListSkeleton from './UserListSkeleton';

export default function GroupMembersModal({ isOpen, onClose, conversation, currentUserId }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [removingMember, setRemovingMember] = useState(null);
  const [addingMember, setAddingMember] = useState(null);

  const isAdmin = conversation?.created_by === currentUserId;

  useEffect(() => {
    if (isOpen && conversation) {
      loadMembers();
    }
  }, [isOpen, conversation]);

  const loadMembers = async () => {
    if (!conversation?.id) return;

    try {
      setLoading(true);
      setError(null);

      console.log('Loading members for conversation:', conversation.id);
      console.log('Current user ID:', currentUserId);

      // First try a simple query to test basic access
      console.log('Testing basic conversation_participants access...');
      const { data: testData, error: testError } = await supabase
        .from('conversation_participants')
        .select('user_id, joined_at')
        .eq('conversation_id', conversation.id)
        .limit(1);
        
      if (testError) {
        console.error('Basic query failed:', testError);
        throw testError;
      }
      
      console.log('Basic query succeeded, trying full query...');
      
      const { data, error } = await supabase
        .from('conversation_participants')
        .select(`
          user_id,
          joined_at,
          profiles!user_id (
            id,
            full_name,
            avatar_url,
            email
          )
        `)
        .eq('conversation_id', conversation.id)
        .order('joined_at', { ascending: true });

      if (error) {
        console.warn('Primary query failed, trying fallback approach...', {
          error: error,
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code
        });
        
        // Try a simpler query as fallback
        console.log('Trying fallback query...');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('conversation_participants')
          .select('user_id, joined_at')
          .eq('conversation_id', conversation.id);
          
        if (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
          setError(`Failed to load group members: ${fallbackError.message || 'Unknown error'}`);
          return;
        }
        
        // If fallback worked, get profiles separately
        const userIds = fallbackData.map(p => p.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, email')
          .in('id', userIds);
          
        if (profilesError) {
          console.error('Profiles query failed:', profilesError);
          setError(`Failed to load member profiles: ${profilesError.message || 'Unknown error'}`);
          return;
        }
          
        // Combine the data
        const combinedData = fallbackData.map(participant => ({
          ...participant,
          profiles: profiles?.find(p => p.id === participant.user_id) || null
        }));
        
        console.log('Fallback query successful, loaded members:', combinedData.length);
        setMembers(combinedData);
        return;
      }

      setMembers(data || []);
    } catch (error) {
      console.error('Error loading group members:', error);
      setError('Failed to load group members');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    if (!conversation?.id) return;

    try {
      setLoadingUsers(true);

      // Get current member IDs
      const currentMemberIds = members.map(m => m.user_id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, email')
        .not('id', 'in', `(${currentMemberIds.join(',')})`)
        .order('full_name', { ascending: true });

      if (error) {
        console.error('Error loading available users:', error);
        return;
      }

      setAvailableUsers(data || []);
    } catch (error) {
      console.error('Error loading available users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!conversation?.id || !isAdmin) return;

    try {
      setRemovingMember(userId);

      const { error } = await supabase
        .from('conversation_participants')
        .delete()
        .eq('conversation_id', conversation.id)
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing member:', error);
        setError('Failed to remove member');
        return;
      }

      // Remove from local state
      setMembers(prev => prev.filter(m => m.user_id !== userId));
    } catch (error) {
      console.error('Error removing member:', error);
      setError('Failed to remove member');
    } finally {
      setRemovingMember(null);
    }
  };

  const handleAddMember = async (user) => {
    if (!conversation?.id || !isAdmin) return;

    try {
      setAddingMember(user.id);

      const { error } = await supabase
        .from('conversation_participants')
        .insert([
          {
            conversation_id: conversation.id,
            user_id: user.id
          }
        ]);

      if (error) {
        console.error('Error adding member:', error);
        setError('Failed to add member');
        return;
      }

      // Add to local state
      setMembers(prev => [...prev, {
        user_id: user.id,
        joined_at: new Date().toISOString(),
        profiles: user
      }]);

      // Remove from available users
      setAvailableUsers(prev => prev.filter(u => u.id !== user.id));
    } catch (error) {
      console.error('Error adding member:', error);
      setError('Failed to add member');
    } finally {
      setAddingMember(null);
    }
  };

  const handleShowAddMembers = () => {
    setShowAddMembers(true);
    loadAvailableUsers();
  };

  const filteredMembers = members.filter(member => {
    const name = member.profiles?.full_name?.toLowerCase() || '';
    const email = member.profiles?.email?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    return name.includes(search) || email.includes(search);
  });

  const filteredAvailableUsers = availableUsers.filter(user => {
    const name = user.full_name?.toLowerCase() || '';
    const email = user.email?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    return name.includes(search) || email.includes(search);
  });

  const formatJoinDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="mobile-card w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Group Members</h2>
              <p className="text-sm text-slate-400">{conversation?.name || 'Group Chat'}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Add Members Button (Admin only) */}
        {isAdmin && !showAddMembers && (
          <div className="p-4 border-b border-slate-700">
            <button
              onClick={handleShowAddMembers}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Add Members
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <MembersListSkeleton count={6} />
          ) : error ? (
            <div className="p-4 text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={loadMembers}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : showAddMembers ? (
            /* Add Members View */
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-medium text-white">Add Members</h3>
                <button
                  onClick={() => setShowAddMembers(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {loadingUsers ? (
                <UserListSkeleton count={6} />
              ) : filteredAvailableUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400">No users available to add</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAvailableUsers.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg"
                    >
                      <Avatar url={user.avatar_url} size={40} />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white truncate">
                          {user.full_name || 'Unknown User'}
                        </h4>
                        <p className="text-sm text-slate-400 truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={() => handleAddMember(user)}
                        disabled={addingMember === user.id}
                        className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                      >
                        {addingMember === user.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <UserPlus className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Members List View */
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-medium text-white">
                  Members ({filteredMembers.length})
                </h3>
              </div>

              {filteredMembers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400">No members found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredMembers.map(member => {
                    const isCreator = member.user_id === conversation?.created_by;
                    const isCurrentUser = member.user_id === currentUserId;
                    const canRemove = isAdmin && !isCreator && !isCurrentUser;

                    return (
                      <div
                        key={member.user_id}
                        className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg"
                      >
                        <Avatar url={member.profiles?.avatar_url} size={40} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-white truncate">
                              {member.profiles?.nickname || member.profiles?.full_name || 'Unknown User'}
                            </h4>
                            {isCreator && (
                              <Crown className="w-4 h-4 text-yellow-400" title="Group Admin" />
                            )}
                          </div>
                          <p className="text-sm text-slate-400 truncate">
                            {member.profiles?.email}
                          </p>
                          <p className="text-xs text-slate-500">
                            Joined {formatJoinDate(member.joined_at)}
                          </p>
                        </div>
                        {canRemove && (
                          <button
                            onClick={() => handleRemoveMember(member.user_id)}
                            disabled={removingMember === member.user_id}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Remove member"
                          >
                            {removingMember === member.user_id ? (
                              <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <UserMinus className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && !loading && (
          <div className="px-4 py-2 bg-red-900/20 text-red-400 text-sm border-t border-slate-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
