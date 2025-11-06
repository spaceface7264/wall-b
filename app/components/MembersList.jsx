import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Search, Users, Crown, Shield, User, UserPlus, Share2 } from 'lucide-react';
import { EmptyMembers, EmptySearch } from './EmptyState';
import MembersListSkeleton from './MembersListSkeleton';
import InviteMembersModal from './InviteMembersModal';
import ShareInviteModal from './ShareInviteModal';

export default function MembersList({ communityId, isAdmin = false, userCommunityRole = null, communityName = 'Community' }) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);
  const membersPerPage = 20;
  const navigate = useNavigate();

  const handleProfileClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (communityId) {
      loadMembers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId, currentPage, searchTerm]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      
      // First, get all members from community_members table
      const { data: membersData, error: membersError } = await supabase
        .from('community_members')
        .select('*')
        .eq('community_id', communityId)
        .order('joined_at', { ascending: false });

      if (membersError) {
        console.error('Error loading members:', membersError);
        setMembers([]);
        setTotalMembers(0);
        setTotalPages(1);
        return;
      }

      if (!membersData || membersData.length === 0) {
        setMembers([]);
        setTotalMembers(0);
        setTotalPages(1);
        return;
      }

      // Get user IDs and load profiles separately to avoid RLS issues
      const userIds = membersData.map(m => m.user_id);
      
      // Try to get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, nickname, handle, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
      }

      // Combine members with profiles
      const membersWithProfiles = membersData.map(member => {
        const profile = profiles?.find(p => p.id === member.user_id);
        return {
          ...member,
          profiles: profile || null
        };
      });

      // Filter by search term if provided
      let filteredMembers = membersWithProfiles;
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        filteredMembers = membersWithProfiles.filter(member => {
          const profile = member.profiles;
          const searchableText = [
            profile?.full_name || '',
            profile?.nickname || '',
            profile?.handle || '',
            member.role || ''
          ].join(' ').toLowerCase();
          return searchableText.includes(searchLower);
        });
      }

      // Calculate pagination
      const total = filteredMembers.length;
      setTotalMembers(total);
      const pages = Math.ceil(total / membersPerPage);
      setTotalPages(pages || 1);

      // Apply pagination
      const startIndex = (currentPage - 1) * membersPerPage;
      const endIndex = startIndex + membersPerPage;
      const paginatedMembers = filteredMembers.slice(startIndex, endIndex);

      setMembers(paginatedMembers);
    } catch (error) {
      console.error('Error loading members:', error);
      setMembers([]);
      setTotalMembers(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return Crown;
      case 'moderator':
        return Shield;
      default:
        return User;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'moderator':
        return 'text-blue-400 bg-blue-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const formatJoinDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading && members.length === 0) {
    return <MembersListSkeleton count={6} />;
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search members..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-[#087E8B]"
        />
      </div>

      {/* Members Count and Invite Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Users className="w-4 h-4" />
          <span>{totalMembers} member{totalMembers !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-2">
          {totalPages > 1 && (
            <div className="text-sm text-gray-400">
              Page {currentPage} of {totalPages}
            </div>
          )}
          {/* Invite Button - Show for community admins/moderators */}
          {(userCommunityRole === 'admin' || userCommunityRole === 'moderator' || isAdmin) && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                title="Share invite link"
              >
                <Share2 className="w-4 h-4" />
                Share Link
              </button>
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[#087E8B] hover:bg-[#066a75] text-white rounded-lg transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Invite
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Members List */}
      {members.length === 0 ? (
        searchTerm ? (
          <EmptySearch
            searchTerm={searchTerm}
            onClearSearch={() => setSearchTerm('')}
          />
        ) : (
          <EmptyMembers />
        )
      ) : (
        <div className="space-y-2">
          {members.map((member) => {
            const profile = member.profiles;
            const RoleIcon = getRoleIcon(member.role);
            const displayName = profile?.nickname || profile?.full_name || 'Unknown User';
            
            return (
              <div
                key={member.id}
                className="flex items-center gap-3 p-3 bg-gray-800 rounded hover:bg-gray-700 transition-colors cursor-pointer"
                onClick={() => handleProfileClick(member.user_id)}
              >
                {/* Avatar */}
                <div className="relative">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={displayName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-[#087E8B] rounded-full flex items-center justify-center text-white font-medium text-sm">
                      {getInitials(displayName)}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gray-800 rounded-full flex items-center justify-center border border-gray-700">
                    <RoleIcon className="w-2.5 h-2.5 text-gray-400" />
                  </div>
                </div>

                {/* Member Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProfileClick(member.user_id);
                      }}
                      className="font-medium text-white hover:text-[#087E8B] transition-colors truncate text-left"
                    >
                      {displayName}
                    </button>
                    {member.role !== 'member' && (
                      <span className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${getRoleColor(member.role)}`}>
                        {member.role === 'admin' ? 'Admin' : 'Moderator'}
                      </span>
                    )}
                  </div>
                  {profile?.handle && (
                    <p className="text-sm text-gray-400 truncate">
                      @{profile.handle}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Joined {formatJoinDate(member.joined_at)}
                  </p>
                </div>

                {/* Admin Actions */}
                {isAdmin && member.role !== 'admin' && (
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                      title="Promote to moderator"
                    >
                      <Shield className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      title="Remove member"
                    >
                      <User className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
          >
            Previous
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = i + 1;
            return (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  currentPage === page
                    ? 'bg-[#087E8B] text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {page}
              </button>
            );
          })}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Invite Members Modal */}
      {showInviteModal && (
        <InviteMembersModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          communityId={communityId}
          communityName={communityName}
          currentUserId={currentUserId}
        />
      )}

      {/* Share Invite Modal */}
      {showShareModal && (
        <ShareInviteModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          communityId={communityId}
          communityName={communityName}
        />
      )}
    </div>
  );
}
