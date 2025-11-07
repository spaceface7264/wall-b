import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { User as UserIcon, Settings, Save, Camera, X, MapPin, Users, MessageCircle, Heart, Calendar as EventIcon, Edit2, Globe, MoreVertical, Eye, EyeOff, Building, Ban, VolumeX, Instagram } from 'lucide-react';
import SidebarLayout from '../components/SidebarLayout';
import { useToast } from '../providers/ToastProvider';
import { enrichCommunitiesWithActualCounts } from '../../lib/community-utils';
import ProfileSkeleton from '../components/ProfileSkeleton';
import { getBlockedUsers, getMutedUsers, unblockUser, unmuteUser } from '../../lib/user-blocking';

export default function Profile() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [communities, setCommunities] = useState([]);
  const [favoriteGyms, setFavoriteGyms] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [gymMenuOpen, setGymMenuOpen] = useState(null);
  const [gymMenuPosition, setGymMenuPosition] = useState({ top: 0, right: 0, flipUp: false });
  const gymMenuRef = useRef(null);
  const gymMenuButtonRef = useRef(null);
  const [error, setError] = useState('');
  const isSavingRef = useRef(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [mutedUsers, setMutedUsers] = useState([]);
  const [loadingBlockedUsers, setLoadingBlockedUsers] = useState(false);
  const [activeTab, setActiveTab] = useState('blocked'); // 'blocked' or 'muted'
  
  const [profileData, setProfileData] = useState({
    nickname: '',
    full_name: '',
    country: '',
    city: '',
    avatar_url: '',
    bio: '',
    email: '',
    company: '',
    climbing_grade: '',
    years_climbing: '',
    favorite_style: '',
    instagram_url: '',
    twitter_url: '',
    website_url: ''
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/');
        return;
      }

        setCurrentUser(user);

        // Load profile data
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile error:', profileError);
          setError('Failed to load profile');
          return;
        }

        if (profile) {
          setProfileData({
            nickname: profile.nickname || '',
            full_name: profile.full_name || '',
            country: profile.country || '',
            city: profile.city || '',
            avatar_url: profile.avatar_url || '',
            bio: profile.bio || '',
            email: profile.email || user.email || '',
            company: profile.company || '',
            climbing_grade: profile.climbing_grade || '',
            years_climbing: profile.years_climbing || '',
            favorite_style: profile.favorite_style || '',
            instagram_url: profile.instagram_url || '',
            twitter_url: profile.twitter_url || '',
            website_url: profile.website_url || ''
          });

          // Load user's communities
          const { data: communityData } = await supabase
              .from('community_members')
              .select(`
                communities (
                  id,
                  name,
                  description,
                  member_count,
                  gyms (
                    name,
                    city
                  )
                )
              `)
            .eq('user_id', user.id);

          if (communityData) {
            const communitiesList = communityData.map(item => item.communities).filter(Boolean);
            // Filter out suspended communities (is_active = false)
            const activeCommunities = communitiesList.filter(c => c.is_active !== false);
            // Enrich with actual member counts.supabase
            const enrichedCommunities = await enrichCommunitiesWithActualCounts(activeCommunities);
            setCommunities(enrichedCommunities);
          }

          // Load favorite gyms
          await loadFavoriteGyms(user.id);
          
          // Load blocked and muted users
          await loadBlockedAndMutedUsers();
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);
  
  const loadBlockedAndMutedUsers = async () => {
    try {
      setLoadingBlockedUsers(true);
      const [blocked, muted] = await Promise.all([
        getBlockedUsers(),
        getMutedUsers()
      ]);
      console.log('Loaded blocked users:', blocked);
      console.log('Loaded muted users:', muted);
      setBlockedUsers(blocked);
      setMutedUsers(muted);
    } catch (error) {
      console.error('Error loading blocked/muted users:', error);
      showToast('error', 'Error', 'Failed to load blocked/muted users');
    } finally {
      setLoadingBlockedUsers(false);
    }
  };
  
  const handleUnblock = async (blockedUserId) => {
    try {
      const result = await unblockUser(blockedUserId);
      if (!result.success) {
        showToast('error', 'Error', result.error || 'Failed to unblock user');
        return;
      }
      
      // Remove from local state
      setBlockedUsers(prev => prev.filter(b => b.blocked_id !== blockedUserId));
      
      // Dispatch event to notify all components
      window.dispatchEvent(new CustomEvent('userUnblocked', { detail: { userId: blockedUserId } }));
      
      showToast('success', 'User Unblocked', 'User has been unblocked. Their content will now be visible.');
    } catch (error) {
      console.error('Error unblocking user:', error);
      showToast('error', 'Error', 'Failed to unblock user');
    }
  };
  
  const handleUnmute = async (mutedUserId) => {
    try {
      const result = await unmuteUser(mutedUserId);
      if (!result.success) {
        showToast('error', 'Error', result.error || 'Failed to unmute user');
        return;
      }
      
      // Remove from local state
      setMutedUsers(prev => prev.filter(m => m.muted_id !== mutedUserId));
      
      // Dispatch event to notify all components
      window.dispatchEvent(new CustomEvent('userUnmuted', { detail: { userId: mutedUserId } }));
      
      showToast('success', 'User Unmuted', 'User has been unmuted. Their content will now be visible.');
    } catch (error) {
      console.error('Error unmuting user:', error);
      showToast('error', 'Error', 'Failed to unmute user');
    }
  };

  const loadFavoriteGyms = async (userId) => {
    try {
      setLoadingFavorites(true);
      
      // First, get the favorite gym IDs
      const { data: favorites, error: favoritesError } = await supabase
        .from('user_favorite_gyms')
        .select('id, hidden, gym_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (favoritesError) {
        console.error('Error loading favorite gyms:', favoritesError);
        return;
      }

      if (!favorites || favorites.length === 0) {
        setFavoriteGyms([]);
        return;
      }

      // Load all favorites (including hidden) - users can always see their own hidden gyms
      // Hidden gyms are only filtered for public profile views
      const allFavorites = favorites;
      
      // Get gym IDs
      const gymIds = allFavorites.map(fav => fav.gym_id);

      // Fetch gym data separately
      const { data: gymsData, error: gymsError } = await supabase
        .from('gyms')
        .select('*')
        .in('id', gymIds);

      if (gymsError) {
        console.error('Error loading gym data:', gymsError);
        return;
      }

      // Map favorites to gyms with favorite metadata
      const gymsMap = new Map(gymsData?.map(gym => [gym.id, gym]) || []);
      
      const allGyms = allFavorites
        .map(fav => {
          const gym = gymsMap.get(fav.gym_id);
          if (!gym) return null;
          return {
            ...gym,
            favorite_id: fav.id,
            hidden: fav.hidden
          };
        })
        .filter(Boolean);

      setFavoriteGyms(allGyms);
    } catch (error) {
      console.error('Error loading favorite gyms:', error);
    } finally {
      setLoadingFavorites(false);
    }
  };

  // Handle clicks outside menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (gymMenuRef.current && !gymMenuRef.current.contains(event.target) && 
          gymMenuButtonRef.current && !gymMenuButtonRef.current.contains(event.target)) {
        setGymMenuOpen(null);
      }
    };

    if (gymMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [gymMenuOpen]);

  const handleToggleHideGym = async (gymId, currentHidden) => {
    if (!currentUser) return;
    
    try {
      const { error } = await supabase
        .from('user_favorite_gyms')
        .update({ hidden: !currentHidden })
        .eq('user_id', currentUser.id)
        .eq('gym_id', gymId);

      if (error) {
        showToast('error', 'Error', 'Failed to update gym visibility');
        return;
      }

      // Update local state - just update the hidden flag, don't remove from display
      setFavoriteGyms(prev => 
        prev.map(gym => 
          gym.id === gymId 
            ? { ...gym, hidden: !currentHidden }
            : gym
        )
      );

      showToast('success', 'Updated', `Gym ${currentHidden ? 'shown' : 'hidden'} from public profile`);
      setGymMenuOpen(null);
    } catch (error) {
      console.error('Error toggling gym visibility:', error);
      showToast('error', 'Error', 'Something went wrong');
    }
  };

  const handleRemoveFavorite = async (gymId) => {
    if (!currentUser) return;
    
    try {
      const { error } = await supabase
        .from('user_favorite_gyms')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('gym_id', gymId);

      if (error) {
        showToast('error', 'Error', 'Failed to remove from favorites');
        return;
      }

      // Remove from local state
      setFavoriteGyms(prev => prev.filter(gym => gym.id !== gymId));
      showToast('success', 'Removed', 'Gym removed from favorites');
      setGymMenuOpen(null);
    } catch (error) {
      console.error('Error removing favorite:', error);
      showToast('error', 'Error', 'Something went wrong');
    }
  };

  const handleViewCommunities = (gymId) => {
    navigate(`/gyms/${gymId}?tab=communities`);
    setGymMenuOpen(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSave = async () => {
    if (!currentUser || isSavingRef.current) return;

    isSavingRef.current = true;
    setIsSaving(true);
    setError('');

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: currentUser.id,
          nickname: profileData.nickname,
          full_name: profileData.full_name || profileData.nickname,
          country: profileData.country,
          city: profileData.city,
          avatar_url: profileData.avatar_url,
          bio: profileData.bio,
          company: profileData.company,
          climbing_grade: profileData.climbing_grade,
          years_climbing: profileData.years_climbing ? parseInt(profileData.years_climbing) : null,
          favorite_style: profileData.favorite_style,
          instagram_url: profileData.instagram_url,
          twitter_url: profileData.twitter_url,
          website_url: profileData.website_url,
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        setError(profileError.message);
        showToast('error', 'Error', profileError.message);
        return;
      }

      showToast('success', 'Updated!', 'Profile saved successfully!');
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
      showToast('error', 'Error', err.message || 'An unexpected error occurred');
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Invalid File', 'Please select a valid image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'File Too Large', 'Image size must be less than 5MB.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        showToast('error', 'Upload Failed', `Failed to upload: ${uploadError.message}`);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setProfileData(prev => ({ ...prev, avatar_url: publicUrl }));
      showToast('success', 'Uploaded!', 'Profile picture updated!');
      setShowImageUpload(false);
    } catch (error) {
      showToast('error', 'Upload Failed', 'Failed to upload image.');
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <SidebarLayout currentPage="profile" pageTitle="Profile">
        <div className="mobile-container">
          <div className="mobile-section">
            <ProfileSkeleton />
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (!currentUser) {
    return null;
  }

  const displayName = profileData.nickname || profileData.full_name || 'No name set';
  const location = [profileData.city, profileData.country].filter(Boolean).join(', ');

  return (
    <SidebarLayout currentPage="profile" pageTitle={displayName}>
      <div className="mobile-container">
        <div className="mobile-section">
          {/* Profile Header */}
          <div className="mobile-card animate-fade-in relative">
            {/* Edit Button - Top Right */}
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-800 rounded-lg transition-colors"
                title="Edit Profile"
              >
                <Edit2 className="w-3 h-3 text-gray-400 hover:text-gray-300" />
              </button>
            )}
            
            <div className="minimal-flex gap-4 mb-4">
              <div className="profile-avatar-container relative">
                <div className="profile-avatar">
                  {profileData.avatar_url ? (
                    <img 
                      src={profileData.avatar_url} 
                      alt={displayName}
                      className="w-full h-full object-cover rounded-full"
                      onError={() => {
                        setProfileData(prev => ({ ...prev, avatar_url: '' }));
                      }}
                    />
                  ) : (
                    <UserIcon className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                {isEditing && (
                  <button
                    onClick={() => setShowImageUpload(true)}
                    className="camera-button"
                    title="Change profile picture"
                  >
                    <Camera className="w-3 h-3 text-white" />
                  </button>
                )}
              </div>
              
              <div className="flex-1 min-w-0 pr-10">
                {!isEditing ? (
                  <>
                    <h2 className="mobile-card-title truncate mb-1">{displayName}</h2>
                    {location && (
                      <p className="mobile-text-xs text-gray-400 truncate minimal-flex gap-1 mb-3">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {location}
                      </p>
                    )}
                    <p className="mobile-text text-gray-300 leading-relaxed text-left mb-3">
                      {profileData.bio || 'No bio yet. Add one to tell others about yourself!'}
                    </p>
                    {(profileData.instagram_url || profileData.twitter_url) && (
                      <div className="flex items-center gap-3">
                        {profileData.instagram_url && (
                          <a
                            href={profileData.instagram_url.startsWith('http') ? profileData.instagram_url : `https://instagram.com/${profileData.instagram_url.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-300 hover:text-white transition-colors"
                          >
                            <Instagram className="w-5 h-5" />
                          </a>
                        )}
                        {profileData.twitter_url && (
                          <a
                            href={profileData.twitter_url.startsWith('http') ? profileData.twitter_url : `https://twitter.com/${profileData.twitter_url.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-300 hover:text-white transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </a>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      name="nickname"
                      value={profileData.nickname}
                      onChange={handleInputChange}
                      placeholder="Display name"
                      className="minimal-input mb-2"
                    />
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      className="minimal-input opacity-50 cursor-not-allowed mb-2"
                    />
                    <textarea
                      name="bio"
                      value={profileData.bio}
                      onChange={handleInputChange}
                      className="minimal-input w-full resize-none mb-2"
                      rows={4}
                      placeholder="Tell us about yourself..."
                      maxLength={500}
                    />
                    <div className="w-full space-y-3">
                      <div className="profile-field">
                        <label className="minimal-label">Instagram</label>
                        <input
                          type="text"
                          name="instagram_url"
                          value={profileData.instagram_url}
                          onChange={handleInputChange}
                          className="minimal-input"
                          placeholder="@username or URL"
                        />
                      </div>
                      <div className="profile-field">
                        <label className="minimal-label">X (Twitter)</label>
                        <input
                          type="text"
                          name="twitter_url"
                          value={profileData.twitter_url}
                          onChange={handleInputChange}
                          className="minimal-input"
                          placeholder="@username or URL"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Save/Cancel Buttons - Only show when editing */}
            {isEditing && (
              <div className="minimal-flex gap-2 mt-4">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setError('');
                  }}
                  className="mobile-btn-secondary flex-1"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="mobile-btn-primary minimal-flex gap-2 flex-1 justify-center"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="minimal-icon" />
                      Save
                    </>
                )}
                </button>
              </div>
            )}
          </div>

          {/* Image Upload Modal */}
          {showImageUpload && (
            <div className="profile-upload-modal" onClick={() => setShowImageUpload(false)}>
              <div className="profile-upload-content" onClick={(e) => e.stopPropagation()}>
                <div className="minimal-flex-between mb-4">
                  <h3 className="minimal-heading">Upload Profile Picture</h3>
                  <button
                    onClick={() => setShowImageUpload(false)}
                    className="mobile-touch-target"
                  >
                    <X className="minimal-icon text-gray-400 hover:text-white" />
                  </button>
                </div>
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="minimal-input w-full mb-4"
                  disabled={isUploading}
                />
                
                {isUploading && (
                  <div className="minimal-flex-center mb-4">
                    <div className="minimal-spinner mr-2"></div>
                    <p className="minimal-text">Uploading...</p>
                  </div>
                )}
                
                <div className="mobile-card-flat p-3">
                  <p className="mobile-text-xs text-gray-400">
                    📋 <strong>Requirements:</strong><br/>
                    • Max file size: 5MB<br/>
                    • Formats: JPG, PNG, GIF<br/>
                    • Recommended: Square image (1:1 ratio)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mobile-card bg-red-900/20 border-red-700/50">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Communities */}
          <div className="pt-8 mt-8">
            <h2 className="profile-section-header minimal-flex gap-2 mb-4">
              <Users className="minimal-icon text-[#00d4ff]" />
              Communities ({communities.length})
            </h2>
            
            {communities.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                <p className="text-gray-400 text-sm mb-2">No communities yet</p>
                <button
                  onClick={() => navigate('/communities')}
                  className="text-[#00d4ff] text-sm hover:underline"
                >
                  Explore communities
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {communities.map((community) => (
                  <div
                    key={community.id}
                    onClick={() => navigate(`/community/${community.id}`)}
                    className="profile-community-item"
                  >
                    <div className="minimal-flex-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{community.name}</h3>
                        {community.gyms && (
                          <p className="mobile-text-xs text-gray-400 truncate">
                            {community.gyms.name} • {community.gyms.city}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 ml-2">
                        <Users className="w-3 h-3" />
                        {community.member_count || 0}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Favorite Gyms */}
          <div className="pt-8 mt-8">
            <h2 className="profile-section-header minimal-flex gap-2 mb-4">
              <Building className="minimal-icon text-[#00d4ff]" />
              Favorite Gyms ({favoriteGyms.filter(g => !g.hidden).length})
              {favoriteGyms.filter(g => g.hidden).length > 0 && (
                <span className="text-xs text-gray-400 font-normal">
                  ({favoriteGyms.filter(g => g.hidden).length} hidden)
                </span>
              )}
            </h2>
            
            {loadingFavorites ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="flex gap-3">
                    <div className="w-12 h-12 bg-gray-800 rounded animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-800 rounded w-3/4 animate-pulse" />
                      <div className="h-3 bg-gray-800 rounded w-1/2 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : favoriteGyms.length === 0 ? (
              <div className="text-center py-8">
                <Building className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                <p className="text-gray-400 text-sm mb-2">No favorite gyms yet</p>
                <button
                  onClick={() => navigate('/gyms')}
                  className="text-[#00d4ff] text-sm hover:underline"
                >
                  Explore gyms
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {favoriteGyms.map((gym) => (
                  <div
                    key={gym.id}
                    className="profile-community-item relative"
                    onClick={() => navigate(`/gyms/${gym.id}`)}
                    style={{
                      opacity: gym.hidden ? 0.6 : 1
                    }}
                  >
                    <div className="minimal-flex-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Gym Image */}
                        <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden relative" style={{ backgroundColor: '#1e1e1e' }}>
                          {gym.image_url ? (
                            <img 
                              src={gym.image_url} 
                              alt={gym.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full minimal-flex-center bg-[#00d4ff]">
                              <span className="text-white font-semibold text-lg">
                                {gym.name?.charAt(0).toUpperCase() || 'G'}
                              </span>
                            </div>
                          )}
                          {gym.hidden && (
                            <div className="absolute top-0 right-0 bg-gray-800/90 rounded-bl p-0.5">
                              <EyeOff className="w-3 h-3 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium truncate" style={{ color: gym.hidden ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                              {gym.name}
                            </h3>
                            {gym.hidden && (
                              <span className="text-xs text-gray-500 flex-shrink-0" title="Hidden from public profile">
                                (Hidden)
                              </span>
                            )}
                          </div>
                          <p className="mobile-text-xs text-gray-400 truncate">
                            <MapPin className="w-3 h-3 inline mr-1" />
                            {gym.city}, {gym.country}
                          </p>
                        </div>
                      </div>

                      {/* 3-Dot Menu Button */}
                      <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          ref={gymMenuOpen === gym.id ? gymMenuButtonRef : null}
                          onClick={(e) => {
                            e.stopPropagation();
                            const button = e.currentTarget;
                            const rect = button.getBoundingClientRect();
                            
                            // DEBUG: Log button position
                            console.log('🔍 Button clicked - Position debug:', {
                              buttonRect: {
                                top: rect.top,
                                bottom: rect.bottom,
                                left: rect.left,
                                right: rect.right,
                                height: rect.height,
                                width: rect.width
                              },
                              viewport: {
                                width: window.innerWidth,
                                height: window.innerHeight,
                                scrollY: window.scrollY
                              }
                            });
                            
                            // Calculate menu dimensions (approximate)
                            const menuHeight = 120; // Approximate height for 3 menu items
                            const menuWidth = 180;
                            const spacing = 4;
                            
                            // Check if there's enough space below, accounting for navbar (typically ~60-80px)
                            const spaceBelow = window.innerHeight - rect.bottom;
                            const spaceAbove = rect.top;
                            const navbarHeight = 70; // Approximate navbar height
                            
                            // Position menu below button if there's enough space, otherwise above
                            const shouldFlipUp = spaceBelow < menuHeight && spaceAbove > menuHeight + navbarHeight;
                            
                            const calculatedPosition = {
                              top: shouldFlipUp ? undefined : rect.bottom + spacing,
                              bottom: shouldFlipUp ? window.innerHeight - rect.top + spacing : undefined,
                              right: window.innerWidth - rect.right,
                              flipUp: shouldFlipUp
                            };
                            
                            // DEBUG: Log calculated position
                            console.log('🔍 Calculated menu position:', {
                              ...calculatedPosition,
                              spaceBelow,
                              spaceAbove,
                              menuHeight,
                              shouldFlipUp
                            });
                            
                            setGymMenuPosition(calculatedPosition);
                            setGymMenuOpen(gymMenuOpen === gym.id ? null : gym.id);
                          }}
                          className="p-2 hover:bg-gray-700 rounded-md transition-colors"
                          aria-label="Gym options"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>

                        {/* Dropdown Menu - Rendered via Portal to avoid positioning issues */}
                        {gymMenuOpen === gym.id && createPortal(
                          <>
                            {/* Overlay */}
                            <div 
                              className="fixed inset-0 z-[1000]" 
                              onClick={() => setGymMenuOpen(null)}
                            />
                            
                            {/* Menu */}
                            <div
                              ref={(el) => {
                                gymMenuRef.current = el;
                                if (el && gymMenuOpen === gym.id) {
                                  // DEBUG: Log actual rendered position
                                  const menuRect = el.getBoundingClientRect();
                                  console.log('🔍 Menu rendered - Actual position:', {
                                    computed: {
                                      top: window.getComputedStyle(el).top,
                                      bottom: window.getComputedStyle(el).bottom,
                                      right: window.getComputedStyle(el).right
                                    },
                                    boundingRect: {
                                      top: menuRect.top,
                                      bottom: menuRect.bottom,
                                      left: menuRect.left,
                                      right: menuRect.right,
                                      width: menuRect.width,
                                      height: menuRect.height
                                    },
                                    expected: gymMenuPosition
                                  });
                                }
                              }}
                              className="fixed rounded-lg shadow-xl z-[1100]"
                              style={{ 
                                top: gymMenuPosition.flipUp ? undefined : (gymMenuPosition.top !== undefined ? `${gymMenuPosition.top}px` : 'auto'),
                                bottom: gymMenuPosition.flipUp ? (gymMenuPosition.bottom !== undefined ? `${gymMenuPosition.bottom}px` : 'auto') : undefined,
                                right: gymMenuPosition.right !== undefined ? `${gymMenuPosition.right}px` : 'auto',
                                minWidth: '180px',
                                backgroundColor: 'var(--bg-surface)', 
                                border: '1px solid var(--border-color)',
                                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                                maxHeight: 'calc(100vh - 80px)',
                                overflowY: 'auto'
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => handleToggleHideGym(gym.id, gym.hidden || false)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors whitespace-nowrap"
                                style={{ 
                                  fontSize: '13px',
                                  color: 'var(--text-secondary)'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-primary)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                {gym.hidden ? (
                                  <>
                                    <Eye className="w-3.5 h-3.5" style={{ flexShrink: 0 }} />
                                    <span>Show on public profile</span>
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="w-3.5 h-3.5" style={{ flexShrink: 0 }} />
                                    <span>Hide from public profile</span>
                                  </>
                                )}
                              </button>
                              
                              <button
                                onClick={() => handleRemoveFavorite(gym.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors whitespace-nowrap"
                                style={{ 
                                  fontSize: '13px',
                                  color: '#ef4444',
                                  borderTop: '1px solid var(--border-color)'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-primary)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <Heart className="w-3.5 h-3.5" style={{ flexShrink: 0 }} />
                                <span>Remove from favorites</span>
                              </button>
                              
                              <button
                                onClick={() => handleViewCommunities(gym.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors whitespace-nowrap"
                                style={{ 
                                  fontSize: '13px',
                                  color: 'var(--text-secondary)',
                                  borderTop: '1px solid var(--border-color)'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-primary)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <Users className="w-3.5 h-3.5" style={{ flexShrink: 0 }} />
                                <span>View communities</span>
                              </button>
                            </div>
                          </>,
                          document.body
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Blocked & Muted Users */}
          <div className="pt-8 mt-8">
            <h2 className="profile-section-header minimal-flex gap-2 mb-4">
              <Ban className="minimal-icon text-red-400" />
              Blocked & Muted Users
            </h2>
            
            {/* Tabs */}
            <div className="flex gap-2 mb-4 border-b border-gray-700">
              <button
                onClick={() => setActiveTab('blocked')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'blocked'
                    ? 'text-red-400 border-b-2 border-red-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Blocked ({blockedUsers.length})
              </button>
              <button
                onClick={() => setActiveTab('muted')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'muted'
                    ? 'text-orange-400 border-b-2 border-orange-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Muted ({mutedUsers.length})
              </button>
            </div>
              
              {loadingBlockedUsers ? (
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="flex gap-3">
                      <div className="w-10 h-10 bg-gray-800 rounded-full animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-800 rounded w-3/4 animate-pulse" />
                        <div className="h-3 bg-gray-800 rounded w-1/2 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activeTab === 'blocked' ? (
                blockedUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <Ban className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                    <p className="text-gray-400 text-sm">No blocked users</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {blockedUsers.map((block) => {
                      const user = block.profiles;
                      const displayName = user?.nickname || user?.full_name || `User ${block.blocked_id.slice(0, 8)}` || 'Unknown User';
                      const avatar = user?.avatar_url;
                      const initial = displayName.charAt(0).toUpperCase();
                      
                      console.log('Rendering blocked user:', { block, user, displayName });
                      
                      return (
                        <div key={block.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {avatar ? (
                              <img
                                src={avatar}
                                alt={displayName}
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  const fallback = e.target.nextSibling;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div
                              className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer"
                              style={{ display: avatar ? 'none' : 'flex' }}
                              onClick={() => navigate(`/profile/${block.blocked_id}`)}
                            >
                              <span className="text-white font-semibold text-sm">{initial}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                                {displayName}
                              </p>
                              {block.reason && (
                                <p className="text-xs text-gray-400 truncate">Reason: {block.reason}</p>
                              )}
                              <p className="text-xs text-gray-500">
                                Blocked {new Date(block.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleUnblock(block.blocked_id)}
                            className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors flex items-center gap-2 flex-shrink-0"
                          >
                            <Ban className="w-4 h-4" />
                            Unblock
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                mutedUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <VolumeX className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                    <p className="text-gray-400 text-sm">No muted users</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mutedUsers.map((mute) => {
                      const user = mute.profiles;
                      const displayName = user?.nickname || user?.full_name || 'Unknown User';
                      const avatar = user?.avatar_url;
                      const initial = displayName.charAt(0).toUpperCase();
                      const isExpired = mute.expires_at && new Date(mute.expires_at) <= new Date();
                      
                      return (
                        <div key={mute.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {avatar ? (
                              <img
                                src={avatar}
                                alt={displayName}
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div
                              className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer"
                              style={{ display: avatar ? 'none' : 'flex' }}
                              onClick={() => navigate(`/profile/${mute.muted_id}`)}
                            >
                              <span className="text-white font-semibold text-sm">{initial}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                                {displayName}
                              </p>
                              {mute.expires_at ? (
                                <p className="text-xs text-gray-400">
                                  {isExpired ? 'Expired' : `Expires ${new Date(mute.expires_at).toLocaleDateString()}`}
                                </p>
                              ) : (
                                <p className="text-xs text-gray-400">Permanent</p>
                              )}
                              <p className="text-xs text-gray-500">
                                Muted {new Date(mute.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleUnmute(mute.muted_id)}
                            className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors flex items-center gap-2 flex-shrink-0"
                          >
                            <VolumeX className="w-4 h-4" />
                            Unmute
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
