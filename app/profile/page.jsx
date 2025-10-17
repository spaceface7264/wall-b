'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { User as UserIcon, Mail, Calendar, Settings, Save, Camera, X } from 'lucide-react';
import SidebarLayout from '../components/SidebarLayout';
import { useToast } from '../providers/ToastProvider';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    email: '',
    full_name: '',
    company: '',
    role: '',
    created_at: '',
    avatar_url: '',
    // Extended profile fields
    bio: '',
    climbing_grade: '',
    years_climbing: '',
    favorite_style: '',
    social_links: {
      instagram: '',
      twitter: '',
      website: ''
    },
    privacy_settings: {
      show_email: true,
      show_activity: true,
      show_location: true
    },
    // Activity counters
    posts_count: 0,
    comments_count: 0,
    likes_count: 0,
    events_attended_count: 0
  });
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const router = useRouter();
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
            .eq('user_id', user.id)
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
              email: user.email || '',
              full_name: user.user_metadata?.full_name || '',
              company: user.user_metadata?.company || '',
              role: user.user_metadata?.role || '',
              created_at: user.created_at || '',
              avatar_url: user.user_metadata?.avatar_url || '',
              bio: '',
              climbing_grade: '',
              years_climbing: '',
              favorite_style: '',
              social_links: { instagram: '', twitter: '', website: '' },
              privacy_settings: { show_email: true, show_activity: true, show_location: true },
              posts_count: 0,
              comments_count: 0,
              likes_count: 0,
              events_attended_count: 0
            });
          } else {
            console.log('Loaded extended profile:', profile);
            setProfileData({
              email: user.email || '',
              full_name: profile.full_name || user.user_metadata?.full_name || '',
              company: profile.company || user.user_metadata?.company || '',
              role: profile.role || user.user_metadata?.role || '',
              created_at: user.created_at || '',
              avatar_url: profile.avatar_url || user.user_metadata?.avatar_url || '',
              bio: profile.bio || '',
              climbing_grade: profile.climbing_grade || '',
              years_climbing: profile.years_climbing || '',
              favorite_style: profile.favorite_style || '',
              social_links: profile.social_links || { instagram: '', twitter: '', website: '' },
              privacy_settings: profile.privacy_settings || { show_email: true, show_activity: true, show_location: true },
              posts_count: profile.posts_count || 0,
              comments_count: profile.comments_count || 0,
              likes_count: profile.likes_count || 0,
              events_attended_count: profile.events_attended_count || 0
            });
          }
        } catch (error) {
          console.log('Profile loading failed:', error.message || 'Unknown error');
          // Fallback to basic user metadata
          setProfileData({
            email: user.email || '',
            full_name: user.user_metadata?.full_name || '',
            company: user.user_metadata?.company || '',
            role: user.user_metadata?.role || '',
            created_at: user.created_at || '',
            avatar_url: user.user_metadata?.avatar_url || '',
            bio: '',
            climbing_grade: '',
            years_climbing: '',
            favorite_style: '',
            social_links: { instagram: '', twitter: '', website: '' },
            privacy_settings: { show_email: true, show_activity: true, show_location: true },
            posts_count: 0,
            comments_count: 0,
            likes_count: 0,
            events_attended_count: 0
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
          console.log('Auth state changed, loading profile data:', session.user.user_metadata);
          
          // Load extended profile data from profiles table
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
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
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name || '',
              company: session.user.user_metadata?.company || '',
              role: session.user.user_metadata?.role || '',
              created_at: session.user.created_at || '',
              avatar_url: session.user.user_metadata?.avatar_url || '',
              bio: '',
              climbing_grade: '',
              years_climbing: '',
              favorite_style: '',
              social_links: { instagram: '', twitter: '', website: '' },
              privacy_settings: { show_email: true, show_activity: true, show_location: true },
              posts_count: 0,
              comments_count: 0,
              likes_count: 0,
              events_attended_count: 0
            });
          } else {
            console.log('Loaded extended profile:', profile);
            setProfileData({
              email: session.user.email || '',
              full_name: profile.full_name || session.user.user_metadata?.full_name || '',
              company: profile.company || session.user.user_metadata?.company || '',
              role: profile.role || session.user.user_metadata?.role || '',
              created_at: session.user.created_at || '',
              avatar_url: profile.avatar_url || session.user.user_metadata?.avatar_url || '',
              bio: profile.bio || '',
              climbing_grade: profile.climbing_grade || '',
              years_climbing: profile.years_climbing || '',
              favorite_style: profile.favorite_style || '',
              social_links: profile.social_links || { instagram: '', twitter: '', website: '' },
              privacy_settings: profile.privacy_settings || { show_email: true, show_activity: true, show_location: true },
              posts_count: profile.posts_count || 0,
              comments_count: profile.comments_count || 0,
              likes_count: profile.likes_count || 0,
              events_attended_count: profile.events_attended_count || 0
            });
          }
          } catch (error) {
            console.log('Profile loading failed:', error.message || 'Unknown error');
            // Fallback to basic user metadata
            setProfileData({
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name || '',
              company: session.user.user_metadata?.company || '',
              role: session.user.user_metadata?.role || '',
              created_at: session.user.created_at || '',
              avatar_url: session.user.user_metadata?.avatar_url || '',
              bio: '',
              climbing_grade: '',
              years_climbing: '',
              favorite_style: '',
              social_links: { instagram: '', twitter: '', website: '' },
              privacy_settings: { show_email: true, show_activity: true, show_location: true },
              posts_count: 0,
              comments_count: 0,
              likes_count: 0,
              events_attended_count: 0
            });
          }
        } else {
          // User logged out
          setUser(null);
          setProfileData({
            email: '',
            full_name: '',
            company: '',
            role: '',
            created_at: '',
            avatar_url: '',
            bio: '',
            climbing_grade: '',
            years_climbing: '',
            favorite_style: '',
            social_links: { instagram: '', twitter: '', website: '' },
            privacy_settings: { show_email: true, show_activity: true, show_location: true },
            posts_count: 0,
            comments_count: 0,
            likes_count: 0,
            events_attended_count: 0
          });
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [loading, user, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSocialLinkChange = (platform, value) => {
    setProfileData(prev => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [platform]: value
      }
    }));
    if (error) setError('');
  };

  const handlePrivacySettingChange = (setting, value) => {
    setProfileData(prev => ({
      ...prev,
      privacy_settings: {
        ...prev.privacy_settings,
        [setting]: value
      }
    }));
    if (error) setError('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');

    try {
      // Update user metadata for basic fields
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: profileData.full_name,
          company: profileData.company,
          role: profileData.role,
          avatar_url: profileData.avatar_url
        }
      });

      if (authError) {
        setError(authError.message);
        showToast('error', 'Error', authError.message);
        return;
      }

      // Update or insert extended profile data
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: profileData.full_name,
          company: profileData.company,
          role: profileData.role,
          avatar_url: profileData.avatar_url,
          bio: profileData.bio,
          climbing_grade: profileData.climbing_grade,
          years_climbing: profileData.years_climbing ? parseInt(profileData.years_climbing) : null,
          favorite_style: profileData.favorite_style,
          social_links: profileData.social_links,
          privacy_settings: profileData.privacy_settings,
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        setError(profileError.message);
        showToast('error', 'Error', profileError.message);
      } else {
        showToast('success', 'Updated!', 'Profile saved successfully! ✓');
        setIsEditing(false);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      showToast('error', 'Error', 'An unexpected error occurred');
    } finally {
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

  // Debug: Log current profile data
  console.log('Current profileData:', profileData);
  console.log('Avatar URL:', profileData.avatar_url);

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
                  {profileData.full_name || 'No name set'}
                </h2>
                <p className="mobile-card-subtitle truncate">{profileData.email}</p>
                {profileData.company && (
                  <p className="mobile-text-xs text-gray-400 mt-1 truncate">{profileData.company}</p>
                )}
              </div>
            </div>
            
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="mobile-btn-secondary minimal-flex gap-2"
            >
              <Settings className="minimal-icon" />
              {isEditing ? 'Cancel' : 'Edit Profile'}
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

        {/* Activity Stats Card */}
        <div className="mobile-card animate-stagger-1">
          <h2 className="profile-section-header">Activity Overview</h2>
          <div className="mobile-grid-4">
            <div className="activity-stat">
              <div className="activity-stat-number">{profileData.posts_count}</div>
              <div className="activity-stat-label">Posts</div>
            </div>
            <div className="activity-stat">
              <div className="activity-stat-number">{profileData.comments_count}</div>
              <div className="activity-stat-label">Comments</div>
            </div>
            <div className="activity-stat">
              <div className="activity-stat-number">{profileData.likes_count}</div>
              <div className="activity-stat-label">Likes</div>
            </div>
            <div className="activity-stat">
              <div className="activity-stat-number">{profileData.events_attended_count}</div>
              <div className="activity-stat-label">Events</div>
            </div>
          </div>
        </div>

        {/* Profile Information Card */}
        <div className="mobile-card animate-stagger-2">
          <h2 className="profile-section-header">Profile Information</h2>
          
          <div className="mobile-grid-2">
            {/* Email */}
            <div className="profile-field">
              <label className="minimal-flex gap-2">
                <Mail className="minimal-icon" />
                Email Address
              </label>
              <input
                type="email"
                value={profileData.email}
                disabled
                className="minimal-input cursor-not-allowed"
              />
              <p className="mobile-text-xs text-gray-500">Email cannot be changed</p>
            </div>

            {/* Member Since */}
            <div className="profile-field">
              <label className="minimal-flex gap-2">
                <Calendar className="minimal-icon" />
                Member Since
              </label>
              <input
                type="text"
                value={profileData.created_at ? new Date(profileData.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}
                disabled
                className="minimal-input cursor-not-allowed"
              />
            </div>

            {/* Full Name */}
            <div className="profile-field">
              <label>Full Name *</label>
              <input
                type="text"
                name="full_name"
                value={profileData.full_name}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`minimal-input ${!isEditing ? 'cursor-not-allowed' : ''}`}
                placeholder="Enter your full name"
              />
            </div>

            {/* Company */}
            <div className="profile-field">
              <label>Company / Gym</label>
              <input
                type="text"
                name="company"
                value={profileData.company}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`minimal-input ${!isEditing ? 'cursor-not-allowed' : ''}`}
                placeholder="Where do you climb?"
              />
            </div>

            {/* Role */}
            <div className="profile-field">
              <label>Role / Title</label>
              <input
                type="text"
                name="role"
                value={profileData.role}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`minimal-input ${!isEditing ? 'cursor-not-allowed' : ''}`}
                placeholder="e.g., Route Setter, Instructor"
              />
            </div>

            {/* Climbing Grade */}
            <div className="profile-field">
              <label>🏔️ Current Grade</label>
              <select
                name="climbing_grade"
                value={profileData.climbing_grade}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`minimal-select ${!isEditing ? 'cursor-not-allowed' : ''}`}
              >
                <option value="">Select your grade</option>
                <option value="V0">V0 - Beginner</option>
                <option value="V1">V1</option>
                <option value="V2">V2</option>
                <option value="V3">V3</option>
                <option value="V4">V4 - Intermediate</option>
                <option value="V5">V5</option>
                <option value="V6">V6</option>
                <option value="V7">V7 - Advanced</option>
                <option value="V8">V8</option>
                <option value="V9">V9</option>
                <option value="V10+">V10+ - Expert</option>
              </select>
            </div>

            {/* Years Climbing */}
            <div className="profile-field">
              <label>⏱️ Years Climbing</label>
              <input
                type="number"
                name="years_climbing"
                value={profileData.years_climbing}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`minimal-input ${!isEditing ? 'cursor-not-allowed' : ''}`}
                placeholder="0"
                min="0"
                max="50"
              />
            </div>

            {/* Favorite Style */}
            <div className="profile-field">
              <label>💪 Favorite Style</label>
              <select
                name="favorite_style"
                value={profileData.favorite_style}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`minimal-select ${!isEditing ? 'cursor-not-allowed' : ''}`}
              >
                <option value="">Select style</option>
                <option value="bouldering">🧗 Bouldering</option>
                <option value="sport">🪢 Sport Climbing</option>
                <option value="trad">⛰️ Traditional</option>
                <option value="indoor">🏢 Indoor</option>
                <option value="outdoor">🌲 Outdoor</option>
                <option value="mixed">🔀 Mixed</option>
              </select>
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
                placeholder="Tell us about yourself and your climbing journey..."
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

        {/* Social Links Card */}
        <div className="mobile-card animate-stagger-3">
          <h2 className="profile-section-header">Social Links</h2>
          
          <div className="social-links-container">
            <div className="mobile-grid-3">
              <div className="profile-field">
                <label className="mobile-text-xs">📸 Instagram</label>
                <input
                  type="text"
                  value={profileData.social_links.instagram}
                  onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                  disabled={!isEditing}
                  className={`minimal-input text-sm ${!isEditing ? 'cursor-not-allowed' : ''}`}
                  placeholder="@username"
                />
              </div>
              <div className="profile-field">
                <label className="mobile-text-xs">🐦 Twitter</label>
                <input
                  type="text"
                  value={profileData.social_links.twitter}
                  onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                  disabled={!isEditing}
                  className={`minimal-input text-sm ${!isEditing ? 'cursor-not-allowed' : ''}`}
                  placeholder="@username"
                />
              </div>
              <div className="profile-field">
                <label className="mobile-text-xs">🌐 Website</label>
                <input
                  type="url"
                  value={profileData.social_links.website}
                  onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                  disabled={!isEditing}
                  className={`minimal-input text-sm ${!isEditing ? 'cursor-not-allowed' : ''}`}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        {isEditing && (
          <div className="profile-actions animate-stagger-4">
            <button
              onClick={() => {
                setIsEditing(false);
                // Optionally reload profile data here
              }}
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
