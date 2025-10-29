import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { User as UserIcon, Settings, Save, Camera, X } from 'lucide-react';
import SidebarLayout from '../components/SidebarLayout';
import { useToast } from '../providers/ToastProvider';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    nickname: '',
    country: '',
    city: '',
    avatar_url: '',
    bio: ''
  });
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const isSavingRef = useRef(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        console.log('Loading user profile data:', user.user_metadata);
        
        // Load extended profile data from profiles table
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileError) {
            // Check if it's a "not found" error (PGRST116) or a real error
            if (profileError.code === 'PGRST116') {
              console.log('No profile found for user, using basic metadata');
            } else {
              console.log('Profile loading error:', profileError.message || 'Unknown error');
            }
            
            // Fallback to basic user metadata
            setProfileData({
              nickname: user.user_metadata?.nickname || user.user_metadata?.full_name || '',
              country: user.user_metadata?.country || '',
              city: user.user_metadata?.city || '',
              avatar_url: user.user_metadata?.avatar_url || '',
              bio: ''
            });
          } else {
            console.log('Loaded extended profile:', profile);
            setProfileData({
              nickname: profile.nickname || profile.full_name || user.user_metadata?.full_name || '',
              country: profile.country || '',
              city: profile.city || '',
              avatar_url: profile.avatar_url || user.user_metadata?.avatar_url || '',
              bio: profile.bio || ''
            });
          }
        } catch (error) {
          console.log('Profile loading failed:', error.message || 'Unknown error');
          // Fallback to basic user metadata
          setProfileData({
            nickname: user.user_metadata?.nickname || user.user_metadata?.full_name || '',
            country: user.user_metadata?.country || '',
            city: user.user_metadata?.city || '',
            avatar_url: user.user_metadata?.avatar_url || '',
            bio: ''
          });
        }
      }
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          // Don't reload profile data if we're currently saving
          if (isSavingRef.current) {
            return;
          }
          
          // Load extended profile data from profiles table
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

          if (profileError) {
            // Check if it's a "not found" error (PGRST116) or a real error
            if (profileError.code === 'PGRST116') {
              // No profile found, use basic metadata
            } else {
              // Profile loading error
            }
            
            // Fallback to basic user metadata
            setProfileData({
              nickname: session.user.user_metadata?.nickname || session.user.user_metadata?.full_name || '',
              country: session.user.user_metadata?.country || '',
              city: session.user.user_metadata?.city || '',
              avatar_url: session.user.user_metadata?.avatar_url || '',
              bio: ''
            });
          } else {
            setProfileData({
              nickname: profile.nickname || profile.full_name || session.user.user_metadata?.full_name || '',
              country: profile.country || '',
              city: profile.city || '',
              avatar_url: profile.avatar_url || session.user.user_metadata?.avatar_url || '',
              bio: profile.bio || ''
            });
          }
          } catch (error) {
            // Fallback to basic user metadata
            setProfileData({
              nickname: session.user.user_metadata?.nickname || session.user.user_metadata?.full_name || '',
              country: session.user.user_metadata?.country || '',
              city: session.user.user_metadata?.city || '',
              avatar_url: session.user.user_metadata?.avatar_url || '',
              bio: ''
            });
          }
        } else {
          // User logged out
          setUser(null);
          setProfileData({
            nickname: '',
            country: '',
            city: '',
            avatar_url: '',
            bio: ''
          });
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [loading, user, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSave = async () => {
    // Prevent multiple simultaneous saves
    if (isSavingRef.current) {
      return;
    }

    // Set this BEFORE any async operations to prevent auth state change interference
    isSavingRef.current = true;
    setIsSaving(true);
    setError('');

    try {
      
      // Update or insert extended profile data
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          nickname: profileData.nickname,
          country: profileData.country,
          city: profileData.city,
          avatar_url: profileData.avatar_url,
          bio: profileData.bio,
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        setError(profileError.message);
        showToast('error', 'Error', profileError.message);
        isSavingRef.current = false;
        setIsSaving(false);
        return;
      }

      showToast('success', 'Updated!', 'Profile saved successfully! ✓');
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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      showToast('error', 'Invalid File', 'Please select a valid image file.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB.');
      showToast('error', 'File Too Large', 'Image size must be less than 5MB.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      // Create a unique filename using the proper structure
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        setError(`Failed to upload image: ${uploadError.message}`);
        showToast('error', 'Upload Failed', `Failed to upload image: ${uploadError.message}`);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL locally
      console.log('Setting avatar URL:', publicUrl);
      setProfileData(prev => {
        const updated = {
          ...prev,
          avatar_url: publicUrl
        };
        console.log('Updated profile data:', updated);
        return updated;
      });

      // Save avatar URL to Supabase user metadata
      try {
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            avatar_url: publicUrl
          }
        });

        if (updateError) {
          console.error('Error saving avatar to profile:', updateError);
          setError('Avatar uploaded but failed to save to profile. Please try again.');
          showToast('error', 'Save Failed', 'Avatar uploaded but failed to save to profile. Please try again.');
          return;
        }

        console.log('Avatar URL saved to user profile successfully');
        showToast('success', 'Uploaded!', 'Profile picture updated! 📸');
      } catch (error) {
        console.error('Error updating user profile:', error);
        setError('Avatar uploaded but failed to save to profile. Please try again.');
        showToast('error', 'Save Failed', 'Avatar uploaded but failed to save to profile. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image. Please try again.');
      showToast('error', 'Upload Failed', 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      setShowImageUpload(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Debug: Log current profile data (removed to prevent console spam)
  // console.log('Current profileData:', profileData);
  // console.log('Avatar URL:', profileData.avatar_url);

 // Replace the return section in your Profile component with this:

return (
  <SidebarLayout currentPage="profile" pageTitle="Profile">
    <div className="mobile-container">
      <div className="mobile-section">
        {/* Profile Header */}
        <div className="animate-fade-in">
          <div className="mobile-card-header">
            <div className="minimal-flex gap-4">
              <div className="profile-avatar-container">
                <div className="profile-avatar">
                  {profileData.avatar_url ? (
                    <img 
                      src={profileData.avatar_url} 
                      alt="Profile" 
                      onError={() => {
                        console.error('Image failed to load:', profileData.avatar_url);
                        setProfileData(prev => ({ ...prev, avatar_url: '' }));
                      }}
                    />
                  ) : (
                    <UserIcon style={{ width: '32px', height: '32px' }} className="text-gray-400" />
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
                <h2 className="mobile-card-title truncate">
                  {profileData.nickname || 'No name set'}
                </h2>
                {(profileData.country || profileData.city) && (
                  <p className="mobile-text-xs text-gray-400 mt-1 truncate">
                    {[profileData.city, profileData.country].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            </div>
            
            <button
              onClick={() => setIsEditing(true)}
              className="mobile-btn-secondary minimal-flex gap-2"
              disabled={isEditing}
            >
              <Settings className="minimal-icon" />
              Edit Profile
            </button>
          </div>
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
                  title="Close"
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
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-2"></div>
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


        {/* Profile Information Card */}
        <div className="mobile-card animate-stagger-2">
          <h2 className="profile-section-header">Profile Information</h2>
          
          <div className="mobile-grid-2">
            {/* Nickname */}
            <div className="profile-field">
              <label>Display Name (Nickname) *</label>
              <input
                type="text"
                name="nickname"
                value={profileData.nickname}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`minimal-input ${!isEditing ? 'cursor-not-allowed' : ''}`}
                placeholder="How others will see you"
              />
            </div>

            {/* Country */}
            <div className="profile-field">
              <label>🌍 Country</label>
              <select
                name="country"
                value={profileData.country}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`minimal-select ${!isEditing ? 'cursor-not-allowed' : ''}`}
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
            </div>

            {/* City */}
            <div className="profile-field">
              <label>🏙️ City</label>
              <input
                type="text"
                name="city"
                value={profileData.city}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`minimal-input ${!isEditing ? 'cursor-not-allowed' : ''}`}
                placeholder="Your city"
              />
            </div>

            {/* Bio - Full Width */}
            <div className="col-span-2 profile-field">
              <label>📝 Bio</label>
              <textarea
                name="bio"
                value={profileData.bio}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`minimal-textarea h-24 ${!isEditing ? 'cursor-not-allowed' : ''}`}
                placeholder="Tell us about yourself..."
                maxLength={500}
              />
              {isEditing && (
                <p className="mobile-text-xs text-gray-500 text-right">
                  {profileData.bio.length}/500 characters
                </p>
              )}
            </div>
          </div>
        </div>


        {/* Save Button */}
        {isEditing && (
          <div className="profile-actions animate-stagger-4">
            <button
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
              className="mobile-btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="mobile-btn-primary minimal-flex gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="minimal-icon" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  </SidebarLayout>
);
}
