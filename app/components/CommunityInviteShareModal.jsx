import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabase';
import { Copy, X, Share2, MessageCircle, Mail, Twitter, Facebook, Check, Users, UserPlus, Search } from 'lucide-react';
import { useToast } from '../providers/ToastProvider';
import { useDebounce } from '../hooks/useDebounce';
import UserListSkeleton from './UserListSkeleton';

export default function CommunityInviteShareModal({ isOpen, onClose, communityId, communityName, currentUserId, isPrivate = false }) {
  const [activeTab, setActiveTab] = useState('share'); // 'share' or 'invite'
  const [copied, setCopied] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [invitingUsers, setInvitingUsers] = useState(new Set());
  const [invitedUsers, setInvitedUsers] = useState(new Set());
  const { showToast } = useToast();
  
  // Generate the invite link
  const inviteLink = `${window.location.origin}/community/${communityId}?invite=true`;
  
  // Share text for messaging apps
  const shareText = `Join "${communityName}" on Wall-B! ${inviteLink}`;

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
      setSearchTerm('');
      setActiveTab('share');
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && activeTab === 'invite' && communityId) {
      loadUsers();
      loadExistingMembers();
    }
  }, [isOpen, activeTab, communityId]);

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
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, nickname, handle, avatar_url, email, last_active_at, is_banned')
        .neq('id', currentUserId)
        .not('email', 'is', null)
        .or(`last_active_at.is.null,last_active_at.gte.${sixMonthsAgo.toISOString()}`)
        .order('full_name', { ascending: true })
        .limit(200);
      
      if (error) {
        console.error('Error loading users:', error);
        setUsers([]);
        return;
      }

      // Filter out suspended users, banned users, deleted users, and mock/test users
      const validUsers = (data || []).filter(user => {
        if (suspendedUserIds.has(user.id)) return false;
        if (user.is_banned) return false;
        if (!user.email || user.email.trim() === '') return false;
        
        const email = (user.email || '').toLowerCase();
        if (email.includes('example.com') || 
            email.includes('test@') || 
            email.includes('mock@') ||
            email.includes('testuser') ||
            email.includes('demo@')) {
          return false;
        }
        
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

      setUsers(validUsers.slice(0, 100));
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadExistingMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('community_members')
        .select('user_id')
        .eq('community_id', communityId);

      if (error) {
        console.error('Error loading existing members:', error);
        return;
      }

      const memberIds = new Set((data || []).map(m => m.user_id));
      setInvitedUsers(memberIds);
    } catch (error) {
      console.error('Error loading existing members:', error);
    }
  };

  const handleInviteUser = async (user) => {
    if (invitingUsers.has(user.id) || invitedUsers.has(user.id)) return;

    try {
      setInvitingUsers(prev => new Set([...prev, user.id]));

      const { data: inviterProfile } = await supabase
        .from('profiles')
        .select('nickname, full_name')
        .eq('id', currentUserId)
        .single();

      const inviterName = inviterProfile?.nickname || inviterProfile?.full_name || 'Someone';

      console.log('Creating notification for user:', user.id, 'from:', currentUserId, 'community:', communityId);
      
      // Use the create_notification function (SECURITY DEFINER) to bypass RLS issues
      const { data: notificationData, error: notifError } = await supabase.rpc('create_notification', {
        target_user_id: user.id,
        notification_type: 'community_invite',
        notification_title: 'Community Invitation',
        notification_message: `${inviterName} invited you to join "${communityName}"`,
        notification_data: {
          community_id: communityId,
          community_name: communityName,
          inviter_id: currentUserId,
          inviter_name: inviterName
        },
        expires_in_hours: null
      });

      if (notifError) {
        console.error('Error creating invitation:', notifError);
        console.error('Error details:', JSON.stringify(notifError, null, 2));
        
        // Fallback: Try direct insert if function doesn't exist
        if (notifError.code === '42883' || notifError.message?.includes('function') || notifError.message?.includes('does not exist')) {
          console.log('create_notification function not found, trying direct insert...');
          const { data: directInsertData, error: directError } = await supabase
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
            })
            .select()
            .single();
          
          if (directError) {
            console.error('Direct insert also failed:', directError);
            showToast('error', 'Error', `Failed to send invitation: ${directError.message || 'Unknown error'}`);
            setInvitingUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(user.id);
              return newSet;
            });
            return;
          }
          console.log('Direct insert succeeded:', directInsertData);
        } else {
          // Check if it's a constraint violation (notification type not allowed)
          if (notifError.code === '23514' || notifError.message?.includes('check constraint') || notifError.message?.includes('type')) {
            console.error('Database constraint error: community_invite type may not be allowed. Run the SQL script: sql-scripts/add-community-invite-notification-type.sql');
            showToast('error', 'Database Configuration Error', 'The notification type is not configured. Please contact an administrator.');
          } else {
            showToast('error', 'Error', `Failed to send invitation: ${notifError.message || 'Unknown error'}`);
          }
          setInvitingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(user.id);
            return newSet;
          });
          return;
        }
      }

      console.log('Notification created successfully:', notificationData);

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

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      showToast('success', 'Copied!', 'Invite link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      showToast('error', 'Error', 'Failed to copy link');
    }
  };

  const shareViaWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const shareViaSMS = () => {
    const url = `sms:?body=${encodeURIComponent(shareText)}`;
    window.location.href = url;
  };

  const shareViaEmail = () => {
    const subject = `Join ${communityName} on Wall-B`;
    const body = `Hi!\n\nI'd like to invite you to join "${communityName}" on Wall-B.\n\n${shareText}`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
  };

  const shareViaTwitter = () => {
    const text = `Join "${communityName}" on Wall-B! ${inviteLink}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareViaFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteLink)}`;
    window.open(url, '_blank');
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${communityName}`,
          text: shareText,
          url: inviteLink,
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const filteredUsers = users.filter(user => {
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

  const shareOptions = [
    {
      id: 'copy',
      label: 'Copy Link',
      icon: copied ? Check : Copy,
      onClick: copyToClipboard,
      color: 'bg-gray-700 hover:bg-gray-600'
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: MessageCircle,
      onClick: shareViaWhatsApp,
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      id: 'sms',
      label: 'Messages',
      icon: MessageCircle,
      onClick: shareViaSMS,
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      id: 'email',
      label: 'Email',
      icon: Mail,
      onClick: shareViaEmail,
      color: 'bg-gray-700 hover:bg-gray-600'
    },
    {
      id: 'twitter',
      label: 'Twitter',
      icon: Twitter,
      onClick: shareViaTwitter,
      color: 'bg-blue-400 hover:bg-blue-500'
    },
    {
      id: 'facebook',
      label: 'Facebook',
      icon: Facebook,
      onClick: shareViaFacebook,
      color: 'bg-blue-700 hover:bg-blue-800'
    },
  ];

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-[#252526] w-full max-w-md max-h-[90vh] rounded-lg flex flex-col shadow-xl border border-gray-700"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700 flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Invite & Share</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{communityName}</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
          <button
            onClick={() => setActiveTab('share')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'share'
                ? 'border-b-2 border-accent-blue text-accent-blue'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            style={activeTab === 'share' ? { borderBottomColor: 'var(--accent-blue)' } : {}}
          >
            <div className="flex items-center justify-center gap-2">
              <Share2 className="w-4 h-4" />
              <span>Share Link</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('invite')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'invite'
                ? 'border-b-2 border-accent-blue text-accent-blue'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            style={activeTab === 'invite' ? { borderBottomColor: 'var(--accent-blue)' } : {}}
          >
            <div className="flex items-center justify-center gap-2">
              <Users className="w-4 h-4" />
              <span>Invite Users</span>
            </div>
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 p-6 flex flex-col min-h-0 overflow-y-auto">
          {activeTab === 'share' ? (
            <>
              {/* Invite Link Display */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Invite Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all"
                    style={{ 
                      backgroundColor: 'var(--bg-primary)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)'
                    }}
                  />
                  <button
                    onClick={copyToClipboard}
                    className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      copied 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span className="text-sm">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span className="text-sm">Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Share Options */}
              <div className="space-y-2">
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Share via:</p>
                
                {/* Native Share (Mobile) */}
                {navigator.share && (
                  <button
                    onClick={shareNative}
                    className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-white"
                    style={{ backgroundColor: 'var(--accent-blue)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-blue-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-blue)'}
                  >
                    <Share2 className="w-5 h-5" />
                    <span className="font-medium">Share</span>
                  </button>
                )}

                {/* Share Options Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {shareOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.id}
                        onClick={option.onClick}
                        className={`flex items-center gap-2 p-3 rounded-lg transition-colors text-white ${option.color}`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Info Text */}
              <div className="mt-6 p-3 rounded-lg" style={{ backgroundColor: 'rgba(107, 114, 128, 0.2)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {isPrivate 
                    ? 'Users who click this link will need to be accepted to join this private community. Share it with climbers you\'d like to invite!'
                    : 'Anyone with this link can join the community. Share it with climbers you\'d like to invite!'
                  }
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search users to invite..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all"
                  style={{ 
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              {/* Users List */}
              {loading ? (
                <UserListSkeleton count={6} />
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-50" style={{ color: 'var(--text-muted)' }} />
                  <p className="mb-2 font-medium" style={{ color: 'var(--text-primary)' }}>
                    {debouncedSearchTerm ? 'No users found' : 'No users available to invite'}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
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
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700/50 transition-colors border"
                        style={{ 
                          backgroundColor: 'var(--bg-primary)',
                          borderColor: 'var(--border-color)'
                        }}
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
                            <div className="w-11 h-11 bg-accent-blue rounded-full flex items-center justify-center text-white font-medium text-sm border-2 border-gray-600">
                              {getInitials(displayName)}
                            </div>
                          )}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate text-base" style={{ color: 'var(--text-primary)' }}>
                            {displayName}
                          </h3>
                          {user.handle && (
                            <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>
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
                              ? 'bg-accent-blue text-white cursor-wait'
                              : 'bg-accent-blue hover:bg-accent-blue-hover text-white'
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
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

