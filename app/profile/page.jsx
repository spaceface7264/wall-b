import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { User as UserIcon, Settings, Save, Camera, X, MapPin, Users, MessageCircle, Heart, Calendar as EventIcon, Edit2, Globe } from 'lucide-react';
import SidebarLayout from '../components/SidebarLayout';
import { useToast } from '../providers/ToastProvider';

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
  const [error, setError] = useState('');
  const isSavingRef = useRef(false);
  
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
            setCommunities(communityData.map(item => item.communities).filter(Boolean));
          }
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
            <div className="mobile-card animate-fade-in">
              <div className="minimal-flex-center py-8">
                <div className="minimal-spinner"></div>
                <p className="minimal-text ml-3">Loading profile...</p>
              </div>
            </div>
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
          <div className="mobile-card animate-fade-in">
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
              
              <div className="flex-1 min-w-0">
                {!isEditing ? (
                  <>
                    <h2 className="mobile-card-title truncate mb-1">{displayName}</h2>
                {profileData.email && (
                      <p className="mobile-text-xs text-gray-400 truncate mb-1">{profileData.email}</p>
                )}
                {location && (
                      <p className="mobile-text-xs text-gray-400 truncate minimal-flex gap-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                    {location}
                  </p>
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
                  </>
                )}
              </div>
            </div>

            {/* Edit Button */}
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                className="mobile-btn-secondary minimal-flex gap-2 w-full justify-center"
                  >
                <Edit2 className="minimal-icon" />
                    Edit Profile
                  </button>
                ) : (
              <div className="minimal-flex gap-2">
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

          {/* Bio */}
          <div className="mobile-card animate-slide-up">
            <h2 className="profile-section-header">About</h2>
            {!isEditing ? (
              <p className="mobile-text text-gray-300 leading-relaxed">
                {profileData.bio || 'No bio yet. Add one to tell others about yourself!'}
              </p>
            ) : (
              <textarea
                name="bio"
                value={profileData.bio}
                onChange={handleInputChange}
                className="minimal-input w-full resize-none"
                rows={4}
                placeholder="Tell us about yourself..."
                maxLength={500}
              />
            )}
          </div>

          {/* Climbing Information */}
          <div className="mobile-card animate-slide-up">
            <h2 className="profile-section-header">Climbing Info</h2>
            <div className="mobile-grid-3">
              <div className="profile-field">
                <label className="minimal-label">Current Grade</label>
                {!isEditing ? (
                  <p className="profile-info-value">{profileData.climbing_grade || 'Not set'}</p>
                ) : (
                  <input
                    type="text"
                    name="climbing_grade"
                    value={profileData.climbing_grade}
                    onChange={handleInputChange}
                    className="minimal-input"
                    placeholder="e.g., V6, 5.12a"
                  />
                )}
              </div>
              
              <div className="profile-field">
                <label className="minimal-label">Years Climbing</label>
                {!isEditing ? (
                  <p className="profile-info-value">{profileData.years_climbing || 'Not set'}</p>
                ) : (
                  <input
                    type="number"
                    name="years_climbing"
                    value={profileData.years_climbing}
                    onChange={handleInputChange}
                    className="minimal-input"
                    placeholder="0"
                    min="0"
                  />
                )}
              </div>
              
              <div className="profile-field">
                <label className="minimal-label">Favorite Style</label>
                {!isEditing ? (
                  <p className="profile-info-value capitalize">{profileData.favorite_style || 'Not set'}</p>
                ) : (
                  <select
                    name="favorite_style"
                    value={profileData.favorite_style}
                    onChange={handleInputChange}
                    className="minimal-input"
                  >
                    <option value="">Select style</option>
                    <option value="bouldering">Bouldering</option>
                    <option value="sport">Sport Climbing</option>
                    <option value="trad">Traditional</option>
                    <option value="toprope">Top Rope</option>
                    <option value="all">All Styles</option>
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mobile-card animate-slide-up">
            <h2 className="profile-section-header">Additional Information</h2>
            <div className="mobile-grid-3">
              <div className="profile-field">
                <label className="minimal-label">Company</label>
                {!isEditing ? (
                  <p className="profile-info-value">{profileData.company || 'Not set'}</p>
                ) : (
                <input
                  type="text"
                    name="company"
                    value={profileData.company}
                  onChange={handleInputChange}
                    className="minimal-input"
                    placeholder="Your company/organization"
                />
                )}
              </div>

              <div className="profile-field">
                <label className="minimal-label">Country</label>
                {!isEditing ? (
                  <p className="profile-info-value">{profileData.country || 'Not set'}</p>
                ) : (
                <select
                  name="country"
                  value={profileData.country}
                  onChange={handleInputChange}
                    className="minimal-input"
                >
                  <option value="">Select country</option>
                  <option value="Denmark">🇩🇰 Denmark</option>
                  <option value="Sweden">🇸🇪 Sweden</option>
                  <option value="Norway">🇳🇴 Norway</option>
                  <option value="Germany">🇩🇪 Germany</option>
                  <option value="Netherlands">🇳🇱 Netherlands</option>
                  <option value="United Kingdom">🇬🇧 United Kingdom</option>
                  <option value="United States">🇺🇸 United States</option>
                  <option value="Canada">🇨🇦 Canada</option>
                  <option value="France">🇫🇷 France</option>
                  <option value="Spain">🇪🇸 Spain</option>
                  <option value="Italy">🇮🇹 Italy</option>
                  <option value="Other">🌍 Other</option>
                </select>
                )}
              </div>

              <div className="profile-field">
                <label className="minimal-label">City</label>
                {!isEditing ? (
                  <p className="profile-info-value">{profileData.city || 'Not set'}</p>
                ) : (
                <input
                  type="text"
                  name="city"
                  value={profileData.city}
                  onChange={handleInputChange}
                    className="minimal-input"
                  placeholder="Your city"
                />
                )}
              </div>
            </div>
          </div>

          {/* Social Links */}
          {(isEditing || profileData.instagram_url || profileData.twitter_url || profileData.website_url) && (
            <div className="mobile-card animate-slide-up">
              <h2 className="profile-section-header">Social Links</h2>
              <div className="space-y-3">
                <div className="profile-field">
                  <label className="minimal-label">Instagram</label>
                  {!isEditing ? (
                    profileData.instagram_url ? (
                      <a
                        href={profileData.instagram_url.startsWith('http') ? profileData.instagram_url : `https://instagram.com/${profileData.instagram_url.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300"
                      >
                        {profileData.instagram_url}
                      </a>
                    ) : (
                      <p className="profile-info-value">Not set</p>
                    )
                  ) : (
                    <input
                      type="text"
                      name="instagram_url"
                      value={profileData.instagram_url}
                      onChange={handleInputChange}
                      className="minimal-input"
                      placeholder="@username or URL"
                    />
                  )}
            </div>

                <div className="profile-field">
                  <label className="minimal-label">Twitter/X</label>
                  {!isEditing ? (
                    profileData.twitter_url ? (
                      <a
                        href={profileData.twitter_url.startsWith('http') ? profileData.twitter_url : `https://twitter.com/${profileData.twitter_url.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300"
                      >
                        {profileData.twitter_url}
                      </a>
                    ) : (
                      <p className="profile-info-value">Not set</p>
                    )
                  ) : (
                    <input
                      type="text"
                      name="twitter_url"
                      value={profileData.twitter_url}
                      onChange={handleInputChange}
                      className="minimal-input"
                      placeholder="@username or URL"
                    />
                  )}
                </div>
                
                <div className="profile-field">
                  <label className="minimal-label">Website</label>
                  {!isEditing ? (
                    profileData.website_url ? (
                      <a
                        href={profileData.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300"
                      >
                        {profileData.website_url}
                      </a>
                    ) : (
                      <p className="profile-info-value">Not set</p>
                    )
                  ) : (
                    <input
                      type="url"
                      name="website_url"
                      value={profileData.website_url}
                      onChange={handleInputChange}
                      className="minimal-input"
                      placeholder="https://..."
                    />
                  )}
                </div>
              </div>
              </div>
            )}

          {/* Communities */}
          {communities.length > 0 && (
            <div className="mobile-card animate-slide-up">
              <h2 className="profile-section-header minimal-flex gap-2">
                <Users className="minimal-icon text-indigo-400" />
                Communities ({communities.length})
              </h2>
              <div className="space-y-2">
                  {communities.map((community) => (
                    <div
                      key={community.id}
                      onClick={() => navigate(`/community/${community.id}`)}
                    className="profile-community-item"
                    >
                      <div className="minimal-flex-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white truncate">{community.name}</h3>
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
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
