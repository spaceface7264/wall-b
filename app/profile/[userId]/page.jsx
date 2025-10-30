import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { User as UserIcon, MapPin, Users, MessageCircle, Heart, Calendar as EventIcon, ArrowLeft, Globe } from 'lucide-react';
import SidebarLayout from '../../components/SidebarLayout';
import CommunityCard from '../../components/CommunityCard';

export default function PublicProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();

    const loadProfile = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        setError('');

        // Fetch user profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileError) {
          if (profileError.code === 'PGRST116') {
            setError('User profile not found');
          } else {
            setError('Failed to load profile');
          }
          return;
        }

        setProfile(profileData);

        // Fetch user's community memberships
        const { data: communityData, error: communityError } = await supabase
          .from('community_members')
          .select(`
            communities (
              id,
              name,
              description,
              member_count,
              gyms (
                name,
                city,
                country
              )
            )
          `)
          .eq('user_id', userId);

        if (communityError) {
          console.error('Error fetching communities:', communityError);
        } else {
          const communitiesList = communityData?.map(item => item.communities).filter(Boolean) || [];
          setCommunities(communitiesList);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

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

  if (error) {
    return (
      <SidebarLayout currentPage="profile" pageTitle="Profile">
        <div className="mobile-container">
          <div className="mobile-section">
            <div className="mobile-card">
              <div className="text-center py-8">
                <div className="text-red-400 mb-4 text-4xl">⚠️</div>
                <h3 className="mobile-card-title mb-2">Profile Not Found</h3>
                <p className="mobile-text text-gray-400 mb-4">{error}</p>
                <button
                  onClick={() => navigate(-1)}
                  className="mobile-btn-primary minimal-flex gap-2"
                >
                  <ArrowLeft className="minimal-icon" />
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (!profile) {
    return (
      <SidebarLayout currentPage="profile" pageTitle="Profile">
        <div className="mobile-container">
          <div className="mobile-section">
            <div className="mobile-card">
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4 text-4xl">👤</div>
                <h3 className="mobile-card-title mb-2">No Profile Data</h3>
                <p className="mobile-text text-gray-400">This user hasn't set up their profile yet.</p>
              </div>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  const handleSendMessage = async () => {
    if (!currentUserId || !userId || sendingMessage) return;
    
    // Don't allow messaging yourself
    if (currentUserId === userId) {
      return;
    }

    try {
      setSendingMessage(true);
      
      // Create or get existing conversation
      const { data: conversationId, error } = await supabase.rpc('get_or_create_direct_conversation', {
        user1_id: currentUserId,
        user2_id: userId
      });

      if (error) {
        console.error('Error creating conversation:', error);
        alert('Failed to start conversation. Please try again.');
        return;
      }

      // Navigate to chat page
      navigate('/chat');
    } catch (err) {
      console.error('Error starting conversation:', err);
      alert('Failed to start conversation. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const displayName = profile.nickname || profile.full_name || 'Anonymous';
  const location = [profile.city, profile.country].filter(Boolean).join(', ');
  const isOwnProfile = currentUserId === userId;

  return (
    <SidebarLayout currentPage="profile" pageTitle={displayName}>
      <div className="mobile-container">
        <div className="mobile-section">
          {/* Profile Header */}
          <div className="mobile-card animate-fade-in">
            <div className="minimal-flex gap-4 mb-4">
              <div className="profile-avatar-container">
                <div className="profile-avatar">
                  {profile.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={displayName}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                  ) : null}
                  {!profile.avatar_url && (
                    <UserIcon className="w-8 h-8 text-gray-400" style={{ display: profile.avatar_url ? 'none' : 'block' }} />
                  )}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h2 className="mobile-card-title truncate mb-1">{displayName}</h2>
                {profile.handle && (
                  <p className="mobile-text-xs text-gray-400 truncate mb-1">@{profile.handle}</p>
                )}
                {profile.email && profile.show_email && (
                  <p className="mobile-text-xs text-gray-400 truncate mb-1">{profile.email}</p>
                )}
                {location && (
                  <p className="mobile-text-xs text-gray-400 truncate minimal-flex gap-1">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    {location}
                  </p>
                )}
                {profile.company && (
                  <p className="mobile-text-xs text-gray-400 truncate mt-1">{profile.company}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => navigate(-1)}
                className="mobile-btn-secondary minimal-flex gap-2 flex-1 justify-center"
              >
                <ArrowLeft className="minimal-icon" />
                Back
              </button>
              {!isOwnProfile && currentUserId && (
                <button
                  onClick={handleSendMessage}
                  disabled={sendingMessage}
                  className="mobile-btn-primary minimal-flex gap-2 flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageCircle className="minimal-icon" />
                  {sendingMessage ? 'Starting...' : 'Send Message'}
                </button>
              )}
            </div>
          </div>

          {/* Activity Stats */}
          {profile.show_activity !== false && (
            <div className="mobile-card animate-slide-up">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400 font-medium">Activity:</span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-gray-300">
                    <MessageCircle className="w-4 h-4" />
                    {profile.posts_count || 0}
                  </span>
                  <span className="flex items-center gap-1 text-gray-300">
                    <Heart className="w-4 h-4" />
                    {profile.likes_received_count || 0}
                  </span>
                  <span className="flex items-center gap-1 text-gray-300">
                    <EventIcon className="w-4 h-4" />
                    {profile.events_attended_count || 0}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <div className="mobile-card animate-slide-up">
              <h2 className="profile-section-header">About</h2>
              <p className="mobile-text text-gray-300 leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {/* Climbing Info */}
          {(profile.climbing_grade || profile.years_climbing || profile.favorite_style) && (
            <div className="mobile-card animate-slide-up">
              <h2 className="profile-section-header">Climbing Info</h2>
              <div className="mobile-grid-3">
                {profile.climbing_grade && (
                  <div className="profile-field">
                    <div className="profile-info-label">Current Grade</div>
                    <div className="profile-info-value">{profile.climbing_grade}</div>
                  </div>
                )}
                {profile.years_climbing && (
                  <div className="profile-field">
                    <div className="profile-info-label">Years Climbing</div>
                    <div className="profile-info-value">{profile.years_climbing} years</div>
                  </div>
                )}
                {profile.favorite_style && (
                  <div className="profile-field">
                    <div className="profile-info-label">Favorite Style</div>
                    <div className="profile-info-value capitalize">{profile.favorite_style}</div>
                  </div>
                )}
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
                  <CommunityCard
                    key={community.id}
                    community={community}
                    isMember={false}
                    onLeave={() => {}}
                    onOpen={() => navigate(`/community/${community.id}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Social Links */}
          {(profile.instagram_url || profile.twitter_url || profile.website_url) && (
            <div className="mobile-card animate-slide-up">
              <h2 className="profile-section-header minimal-flex gap-2">
                <Globe className="minimal-icon text-indigo-400" />
                Social Links
              </h2>
              <div className="space-y-2">
                {profile.instagram_url && (
                  <a
                    href={profile.instagram_url.startsWith('http') ? profile.instagram_url : `https://instagram.com/${profile.instagram_url.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="profile-social-link"
                  >
                    📸 Instagram
                  </a>
                )}
                {profile.twitter_url && (
                  <a
                    href={profile.twitter_url.startsWith('http') ? profile.twitter_url : `https://twitter.com/${profile.twitter_url.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="profile-social-link"
                  >
                    🐦 Twitter/X
                  </a>
                )}
                {profile.website_url && (
                  <a
                    href={profile.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="profile-social-link"
                  >
                    🌐 Website
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
