import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../../lib/supabase';
import { ArrowLeft, Save, Users, UserPlus, X, Settings as SettingsIcon, Trash2, Shield } from 'lucide-react';
import SidebarLayout from '../../../components/SidebarLayout';
import { useToast } from '../../../providers/ToastProvider';
import ConfirmationModal from '../../../components/ConfirmationModal';

export default function CommunitySettingsPage() {
  const { communityId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [community, setCommunity] = useState(null);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userCommunityRole, setUserCommunityRole] = useState(null);
  const [moderators, setModerators] = useState([]);
  const [members, setMembers] = useState([]);
  const [originalData, setOriginalData] = useState(null);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  
  // Moderator management
  const [showAddModeratorModal, setShowAddModeratorModal] = useState(false);
  const [moderatorSearchQuery, setModeratorSearchQuery] = useState('');
  const [availableMembers, setAvailableMembers] = useState([]);
  const [searchingModerators, setSearchingModerators] = useState(false);
  
  // Confirmation modals
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(null);
  const [showChangesConfirm, setShowChangesConfirm] = useState(false);
  const [removingModerator, setRemovingModerator] = useState(null);

  useEffect(() => {
    checkAccess();
  }, [communityId]);

  useEffect(() => {
    if (community && user) {
      loadModerators();
      loadMembers();
    }
  }, [community, user]);

  const checkAccess = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        navigate('/');
        return;
      }
      
      setUser(authUser);
      
      // Check if user is global admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', authUser.id)
        .single();
      
      setIsAdmin(profile?.is_admin || false);
      
      // Load community
      const { data: communityData, error } = await supabase
        .from('communities')
        .select(`
          *,
          gyms (
            name,
            city,
            country
          )
        `)
        .eq('id', communityId)
        .single();
      
      if (error || !communityData) {
        showToast('error', 'Error', 'Community not found');
        navigate(`/community/${communityId}`);
        return;
      }
      
      setCommunity(communityData);
      setName(communityData.name || '');
      setDescription(communityData.description || '');
      setRules(communityData.rules || '');
      setOriginalData({
        name: communityData.name || '',
        description: communityData.description || '',
        rules: communityData.rules || ''
      });
      
      // Check user's role in community
      const { data: membership } = await supabase
        .from('community_members')
        .select('role')
        .eq('community_id', communityId)
        .eq('user_id', authUser.id)
        .single();
      
      const role = membership?.role || null;
      setUserCommunityRole(role);
      
      // Check if user has permission (community admin/moderator or global admin)
      if (role !== 'admin' && role !== 'moderator' && !profile?.is_admin) {
        showToast('error', 'Access Denied', 'You do not have permission to access community settings');
        navigate(`/community/${communityId}`);
        return;
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error checking access:', error);
      showToast('error', 'Error', 'Failed to load community settings');
      navigate(`/community/${communityId}`);
    }
  };

  const loadModerators = async () => {
    if (!community) return;
    
    try {
      const { data: membersData } = await supabase
        .from('community_members')
        .select('user_id, role, joined_at')
        .eq('community_id', community.id)
        .in('role', ['admin', 'moderator'])
        .order('joined_at', { ascending: true });
      
      if (membersData) {
        // Load profiles for moderators
        const userIds = membersData.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, nickname, email')
          .in('id', userIds);
        
        const moderatorsWithProfiles = membersData.map(member => {
          const profile = profiles?.find(p => p.id === member.user_id);
          return {
            ...member,
            profile: profile || null,
            displayName: profile?.nickname || profile?.full_name || profile?.email || 'Unknown'
          };
        });
        
        setModerators(moderatorsWithProfiles);
      }
    } catch (error) {
      console.error('Error loading moderators:', error);
    }
  };

  const loadMembers = async () => {
    if (!community) return;
    
    try {
      const { data: membersData } = await supabase
        .from('community_members')
        .select('user_id, role, joined_at')
        .eq('community_id', community.id)
        .eq('role', 'member')
        .order('joined_at', { ascending: false })
        .limit(100); // Limit for performance
      
      if (membersData) {
        const userIds = membersData.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, nickname, email')
          .in('id', userIds);
        
        const membersWithProfiles = membersData.map(member => {
          const profile = profiles?.find(p => p.id === member.user_id);
          return {
            ...member,
            profile: profile || null,
            displayName: profile?.nickname || profile?.full_name || profile?.email || 'Unknown'
          };
        });
        
        setMembers(membersWithProfiles);
      }
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const searchMembers = async (query) => {
    if (!query.trim() || !community) {
      setAvailableMembers([]);
      return;
    }
    
    setSearchingModerators(true);
    try {
      // Get all community members
      const { data: allMembers } = await supabase
        .from('community_members')
        .select('user_id, role')
        .eq('community_id', community.id);
      
      const memberIds = allMembers?.map(m => m.user_id) || [];
      
      // Search profiles that are members but not already moderators/admins
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, nickname, email')
        .in('id', memberIds)
        .not('id', 'in', moderators.map(m => m.user_id))
        .or(`full_name.ilike.%${query}%,nickname.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);
      
      setAvailableMembers(profiles || []);
    } catch (error) {
      console.error('Error searching members:', error);
      setAvailableMembers([]);
    } finally {
      setSearchingModerators(false);
    }
  };

  const calculateChanges = () => {
    if (!originalData) return [];
    
    const changes = [];
    if (name !== originalData.name) {
      changes.push({
        field: 'Name',
        old: originalData.name,
        new: name
      });
    }
    if (description !== originalData.description) {
      changes.push({
        field: 'Description',
        old: originalData.description || '(empty)',
        new: description || '(empty)'
      });
    }
    if (rules !== originalData.rules) {
      changes.push({
        field: 'Rules',
        old: originalData.rules || '(empty)',
        new: rules || '(empty)'
      });
    }
    
    return changes;
  };

  const handleSave = async () => {
    const changes = calculateChanges();
    
    if (changes.length === 0) {
      showToast('info', 'No Changes', 'No changes were made');
      return;
    }
    
    setPendingChanges(changes);
    setShowChangesConfirm(true);
  };

  const confirmSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('communities')
        .update({
          name,
          description,
          rules,
          updated_at: new Date().toISOString()
        })
        .eq('id', communityId);
      
      if (error) throw error;
      
      setOriginalData({ name, description, rules });
      setShowChangesConfirm(false);
      setPendingChanges(null);
      showToast('success', 'Success', 'Community settings updated successfully');
    } catch (error) {
      console.error('Error updating community:', error);
      showToast('error', 'Error', 'Failed to update community settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddModerator = async (userId) => {
    try {
      const { error } = await supabase
        .from('community_members')
        .update({ role: 'moderator' })
        .eq('community_id', communityId)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      setShowAddModeratorModal(false);
      setModeratorSearchQuery('');
      setAvailableMembers([]);
      loadModerators();
      loadMembers();
      showToast('success', 'Success', 'Moderator added successfully');
    } catch (error) {
      console.error('Error adding moderator:', error);
      showToast('error', 'Error', 'Failed to add moderator');
    }
  };

  const handleRemoveModerator = async (userId) => {
    setRemovingModerator(userId);
    try {
      const { error } = await supabase
        .from('community_members')
        .update({ role: 'member' })
        .eq('community_id', communityId)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      loadModerators();
      loadMembers();
      showToast('success', 'Success', 'Moderator removed successfully');
    } catch (error) {
      console.error('Error removing moderator:', error);
      showToast('error', 'Error', 'Failed to remove moderator');
    } finally {
      setRemovingModerator(null);
    }
  };

  if (loading) {
    return (
      <SidebarLayout currentPage="community" pageTitle="Settings">
        <div className="mobile-container flex items-center justify-center" style={{ minHeight: '50vh' }}>
          <div className="w-8 h-8 border-2 border-[#087E8B] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </SidebarLayout>
    );
  }

  if (!community) {
    return null;
  }

  const canEdit = userCommunityRole === 'admin' || isAdmin;

  return (
    <SidebarLayout currentPage="community" pageTitle="Settings">
      <div className="mobile-container">
        {/* Header */}
        <div className="mobile-section">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate(`/community/${communityId}`)}
              className="p-2 hover:bg-gray-700/50 rounded transition-colors"
              style={{ borderRadius: 4 }}
            >
              <ArrowLeft className="w-5 h-5 text-gray-300" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-white">Community Settings</h1>
              <p className="text-sm text-gray-400 mt-1">{community.name}</p>
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" />
                Basic Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!canEdit}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#087E8B] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ borderRadius: 4 }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={!canEdit}
                    rows={4}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#087E8B] resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ borderRadius: 4 }}
                    placeholder="Describe your community..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Rules</label>
                  <textarea
                    value={rules}
                    onChange={(e) => setRules(e.target.value)}
                    disabled={!canEdit}
                    rows={6}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#087E8B] resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ borderRadius: 4 }}
                    placeholder="Community rules and guidelines..."
                  />
                </div>
              </div>
              
              {canEdit && (
                <button
                  onClick={handleSave}
                  disabled={saving || calculateChanges().length === 0}
                  className="mt-4 w-full px-4 py-2 bg-[#087E8B] text-white rounded hover:bg-[#066a75] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ borderRadius: 4 }}
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Moderators */}
            {(userCommunityRole === 'admin' || isAdmin) && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Moderators
                  </h2>
                  <button
                    onClick={() => setShowAddModeratorModal(true)}
                    className="px-3 py-1.5 bg-[#087E8B] text-white text-sm rounded hover:bg-[#066a75] transition-colors flex items-center gap-2"
                    style={{ borderRadius: 4 }}
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Moderator
                  </button>
                </div>
                
                {moderators.length === 0 ? (
                  <p className="text-sm text-gray-400">No moderators yet</p>
                ) : (
                  <div className="space-y-2">
                    {moderators.map((moderator) => (
                      <div
                        key={moderator.user_id}
                        className="flex items-center justify-between p-3 bg-gray-800/50 border border-gray-700 rounded"
                        style={{ borderRadius: 4 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#087E8B] rounded-full flex items-center justify-center text-white font-medium">
                            {moderator.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{moderator.displayName}</p>
                            <p className="text-xs text-gray-400">{moderator.role === 'admin' ? 'Admin' : 'Moderator'}</p>
                          </div>
                        </div>
                        {moderator.user_id !== user?.id && moderator.role !== 'admin' && (
                          <button
                            onClick={() => handleRemoveModerator(moderator.user_id)}
                            disabled={removingModerator === moderator.user_id}
                            className="p-2 text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
                            style={{ borderRadius: 4 }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Moderator Modal */}
      {showAddModeratorModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 w-full max-w-md rounded overflow-hidden flex flex-col" style={{ borderRadius: 4 }}>
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Add Moderator</h3>
              <button
                onClick={() => {
                  setShowAddModeratorModal(false);
                  setModeratorSearchQuery('');
                  setAvailableMembers([]);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              <input
                type="text"
                placeholder="Search members by name or email..."
                value={moderatorSearchQuery}
                onChange={(e) => {
                  setModeratorSearchQuery(e.target.value);
                  searchMembers(e.target.value);
                }}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#087E8B]"
                style={{ borderRadius: 4 }}
                autoFocus
              />
              
              <div className="mt-4 max-h-60 overflow-y-auto">
                {searchingModerators ? (
                  <div className="text-center py-4">
                    <div className="w-6 h-6 border-2 border-[#087E8B] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : availableMembers.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">
                    {moderatorSearchQuery ? 'No members found' : 'Start typing to search members'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {availableMembers.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => handleAddModerator(member.id)}
                        className="w-full flex items-center gap-3 p-3 bg-gray-800/50 border border-gray-700 rounded hover:bg-gray-700/50 transition-colors text-left"
                        style={{ borderRadius: 4 }}
                      >
                        <div className="w-10 h-10 bg-[#087E8B] rounded-full flex items-center justify-center text-white font-medium">
                          {(member.nickname || member.full_name || member.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {member.nickname || member.full_name || member.email}
                          </p>
                          {member.email && (member.nickname || member.full_name) && (
                            <p className="text-xs text-gray-400 truncate">{member.email}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Changes Confirmation Modal */}
      <ConfirmationModal
        isOpen={showChangesConfirm}
        onClose={() => {
          setShowChangesConfirm(false);
          setPendingChanges(null);
        }}
        onConfirm={confirmSave}
        title="Confirm Changes"
        message={
          <div>
            <p className="mb-3 text-sm text-gray-300">Are you sure you want to save these changes?</p>
            <div className="space-y-2">
              {pendingChanges?.map((change, idx) => (
                <div key={idx} className="p-2 bg-gray-800/50 rounded border border-gray-700" style={{ borderRadius: 4 }}>
                  <p className="text-xs font-medium text-gray-400 mb-1">{change.field}</p>
                  <p className="text-xs text-gray-300 line-through mb-1">{change.old}</p>
                  <p className="text-xs text-[#087E8B]">{change.new}</p>
                </div>
              ))}
            </div>
          </div>
        }
        confirmText="Save Changes"
        variant="info"
      />
    </SidebarLayout>
  );
}

