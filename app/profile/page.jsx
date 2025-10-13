'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { User as UserIcon, Mail, Calendar, Settings, Save, Camera, X } from 'lucide-react';
import SidebarLayout from '../components/SidebarLayout';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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
  const [success, setSuccess] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        console.log('Loading user profile data:', user.user_metadata);
        
        // Load extended profile data from profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileError) {
          console.error('Error loading profile:', profileError);
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
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          if (profileError) {
            console.error('Error loading profile:', profileError);
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
    if (success) setSuccess('');
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
    if (success) setSuccess('');
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
    if (success) setSuccess('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');

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
      } else {
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
      }
    } catch (err) {
      setError('An unexpected error occurred');
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
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB.');
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
          return;
        }

        console.log('Avatar URL saved to user profile successfully');
        setSuccess('Profile picture updated and saved successfully!');
      } catch (error) {
        console.error('Error updating user profile:', error);
        setError('Avatar uploaded but failed to save to profile. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image. Please try again.');
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

  return (
    <SidebarLayout currentPage="profile">
      <div className="mobile-container">
        <div className="mobile-section">
          {/* Profile Header Card */}
          <div className="mobile-card">
            <div className="mobile-card-header">
              <div className="minimal-flex">
                <div className="relative">
                  <div className="w-16 h-16 bg-gray-700 rounded-full minimal-flex-center overflow-hidden">
                    {profileData.avatar_url ? (
                      <div>
                        <img 
                          src={profileData.avatar_url} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                          onLoad={() => console.log('Image loaded successfully')}
                          onError={(e) => {
                            console.error('Image failed to load:', e);
                            console.error('Failed URL:', profileData.avatar_url);
                            console.error('Event details:', e.target.src);
                            // Clear the avatar URL if it fails to load
                            setProfileData(prev => ({ ...prev, avatar_url: '' }));
                          }}
                        />
                        <div className="text-xs text-gray-400 mt-1">
                          URL: {profileData.avatar_url}
                        </div>
                      </div>
                    ) : (
                      <UserIcon className="minimal-icon text-gray-300" />
                    )}
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => setShowImageUpload(true)}
                      className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-600 rounded-full minimal-flex-center hover:bg-indigo-700"
                    >
                      <Camera className="w-3 h-3 text-white" />
                    </button>
                  )}
                </div>
                <div className="ml-3">
                  <h2 className="mobile-card-title">
                    {profileData.full_name || 'No name set'}
                  </h2>
                  <p className="mobile-card-subtitle">{profileData.email}</p>
                  {isEditing && (
                    <button
                      onClick={() => setShowImageUpload(true)}
                      className="mobile-text-xs text-indigo-400 hover:text-indigo-300 mt-1"
                    >
                      {profileData.avatar_url ? 'Change photo' : 'Add photo'}
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="mobile-btn-secondary"
              >
                <Settings className="minimal-icon" />
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>
          </div>

          {/* Image Upload Modal */}
          {showImageUpload && (
            <div className="fixed inset-0 bg-black bg-opacity-50 minimal-flex-center z-50">
              <div className="minimal-card p-6 max-w-sm w-full mx-4">
                <div className="minimal-flex-between mb-4">
                  <h3 className="minimal-heading">Upload Profile Picture</h3>
                  <button
                    onClick={() => setShowImageUpload(false)}
                    className="minimal-button bg-gray-700 text-gray-300 hover:bg-gray-600"
                  >
                    <X className="minimal-icon" />
                  </button>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full minimal-input mb-4"
                  disabled={isUploading}
                />
                {isUploading && (
                  <div className="minimal-flex-center mb-4">
                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                    <p className="minimal-text">Uploading...</p>
                  </div>
                )}
                <p className="minimal-text text-xs text-gray-400">
                  Max file size: 5MB. Supported formats: JPG, PNG, GIF
                </p>
              </div>
            </div>
          )}

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-3 p-2 bg-gray-700 border border-gray-600 rounded-sm">
              <p className="minimal-text text-green-400">{success}</p>
            </div>
          )}

          {error && (
            <div className="mb-3 p-2 bg-gray-700 border border-gray-600 rounded-sm">
              <p className="minimal-text text-red-400">{error}</p>
            </div>
          )}

          {/* Profile Form Card */}
          <div className="mobile-card">
            <h2 className="mobile-card-title mb-4">Profile Information</h2>
            <div className="mobile-grid-2">
            <div>
              <label className="minimal-text block mb-1 minimal-flex">
                <Mail className="minimal-icon" />
                Email
              </label>
              <input
                type="email"
                value={profileData.email}
                disabled
                className="minimal-input w-full cursor-not-allowed"
              />
              <p className="minimal-text mt-1">Cannot be changed</p>
            </div>

            <div>
              <label className="minimal-text block mb-1 minimal-flex">
                <Calendar className="minimal-icon" />
                Member Since
              </label>
              <input
                type="text"
                value={profileData.created_at ? new Date(profileData.created_at).toLocaleDateString() : 'Unknown'}
                disabled
                className="minimal-input w-full cursor-not-allowed"
              />
            </div>

            <div>
              <label className="minimal-text block mb-1">Full Name</label>
              <input
                type="text"
                name="full_name"
                value={profileData.full_name}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`minimal-input w-full ${!isEditing ? 'cursor-not-allowed' : ''}`}
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="minimal-text block mb-1">Company</label>
              <input
                type="text"
                name="company"
                value={profileData.company}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`minimal-input w-full ${!isEditing ? 'cursor-not-allowed' : ''}`}
                placeholder="Enter your company"
              />
            </div>

            <div>
              <label className="minimal-text block mb-1">Role</label>
              <input
                type="text"
                name="role"
                value={profileData.role}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`minimal-input w-full ${!isEditing ? 'cursor-not-allowed' : ''}`}
                placeholder="Enter your role"
              />
            </div>

            {/* Bio */}
            <div className="col-span-2">
              <label className="minimal-text block mb-1">Bio</label>
              <textarea
                name="bio"
                value={profileData.bio}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`minimal-input w-full h-20 resize-none ${!isEditing ? 'cursor-not-allowed' : ''}`}
                placeholder="Tell us about yourself and your climbing journey..."
              />
            </div>

            {/* Climbing Stats */}
            <div>
              <label className="minimal-text block mb-1">Climbing Grade</label>
              <select
                name="climbing_grade"
                value={profileData.climbing_grade}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`minimal-input w-full ${!isEditing ? 'cursor-not-allowed' : ''}`}
              >
                <option value="">Select grade</option>
                <option value="V0">V0</option>
                <option value="V1">V1</option>
                <option value="V2">V2</option>
                <option value="V3">V3</option>
                <option value="V4">V4</option>
                <option value="V5">V5</option>
                <option value="V6">V6</option>
                <option value="V7">V7</option>
                <option value="V8">V8</option>
                <option value="V9">V9</option>
                <option value="V10+">V10+</option>
              </select>
            </div>

            <div>
              <label className="minimal-text block mb-1">Years Climbing</label>
              <input
                type="number"
                name="years_climbing"
                value={profileData.years_climbing}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`minimal-input w-full ${!isEditing ? 'cursor-not-allowed' : ''}`}
                placeholder="0"
                min="0"
                max="50"
              />
            </div>

            <div>
              <label className="minimal-text block mb-1">Favorite Style</label>
              <select
                name="favorite_style"
                value={profileData.favorite_style}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`minimal-input w-full ${!isEditing ? 'cursor-not-allowed' : ''}`}
              >
                <option value="">Select style</option>
                <option value="bouldering">Bouldering</option>
                <option value="sport">Sport Climbing</option>
                <option value="trad">Traditional</option>
                <option value="indoor">Indoor</option>
                <option value="outdoor">Outdoor</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>

            {/* Social Links */}
            <div className="col-span-2">
              <h3 className="minimal-text font-medium mb-2">Social Links</h3>
              <div className="mobile-grid-3 gap-2">
                <div>
                  <label className="minimal-text text-xs block mb-1">Instagram</label>
                  <input
                    type="text"
                    value={profileData.social_links.instagram}
                    onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                    disabled={!isEditing}
                    className={`minimal-input w-full text-sm ${!isEditing ? 'cursor-not-allowed' : ''}`}
                    placeholder="@username"
                  />
                </div>
                <div>
                  <label className="minimal-text text-xs block mb-1">Twitter</label>
                  <input
                    type="text"
                    value={profileData.social_links.twitter}
                    onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                    disabled={!isEditing}
                    className={`minimal-input w-full text-sm ${!isEditing ? 'cursor-not-allowed' : ''}`}
                    placeholder="@username"
                  />
                </div>
                <div>
                  <label className="minimal-text text-xs block mb-1">Website</label>
                  <input
                    type="url"
                    value={profileData.social_links.website}
                    onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                    disabled={!isEditing}
                    className={`minimal-input w-full text-sm ${!isEditing ? 'cursor-not-allowed' : ''}`}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          {isEditing && (
            <div className="mt-4 minimal-flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="minimal-button bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50"
              >
                <Save className="minimal-icon" />
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
          </div>

          {/* Activity Stats Card */}
          <div className="mobile-card">
            <h2 className="mobile-card-title mb-4">Activity Stats</h2>
            <div className="mobile-grid-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-400">{profileData.posts_count}</div>
                <div className="minimal-text text-xs">Posts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-400">{profileData.comments_count}</div>
                <div className="minimal-text text-xs">Comments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-400">{profileData.likes_count}</div>
                <div className="minimal-text text-xs">Likes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-400">{profileData.events_attended_count}</div>
                <div className="minimal-text text-xs">Events</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
