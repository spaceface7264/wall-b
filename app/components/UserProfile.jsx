
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { User as UserIcon, MapPin, Calendar, Users, MessageCircle, Heart, Calendar as EventIcon, ArrowLeft } from 'lucide-react';
import SidebarLayout from './SidebarLayout';
import CommunityCard from './CommunityCard';

export default function UserProfile({ userId, showBackButton = true }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
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
              gym_id,
              created_at,
              member_count,
              gyms (
                name,
                city,
                address
              )
            )
          `)
          .eq('user_id', userId);

        if (communityError) {
          console.error('Error fetching communities:', communityError);
        } else {
          console.log('Community data fetched:', communityData);
          const communities = communityData?.map(item => item.communities).filter(Boolean) || [];
          console.log('Processed communities:', communities);
          setCommunities(communities);
        }

        // Set user data from profile (we don't need separate user fetch)
        setUser({ id: userId, email: profileData.email });

      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  if (loading) {
    return (
      <SidebarLayout currentPage="profile" pageTitle="Profile">
        <div className="mobile-container">
          <div className="mobile-section">
            <div className="mobile-card animate-pulse">
              <div className="minimal-flex gap-4">
                <div className="w-16 h-16 bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            </div>
            <div className="mobile-card animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
              <div className="grid grid-cols-4 gap-4">
                <div className="h-8 bg-gray-700 rounded"></div>
                <div className="h-8 bg-gray-700 rounded"></div>
                <div className="h-8 bg-gray-700 rounded"></div>
                <div className="h-8 bg-gray-700 rounded"></div>
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
                <div className="text-red-400 mb-4">⚠️</div>
                <h3 className="mobile-card-title mb-2">Profile Not Found</h3>
                <p className="mobile-text text-gray-400 mb-4">{error}</p>
                {showBackButton && (
                  <button
                    onClick={() => navigate(-1)}
                    className="mobile-btn-primary minimal-flex gap-2"
                  >
                    <ArrowLeft className="minimal-icon" />
                    Go Back
                  </button>
                )}
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
                <div className="text-gray-400 mb-4">👤</div>
                <h3 className="mobile-card-title mb-2">No Profile Data</h3>
                <p className="mobile-text text-gray-400">This user hasn't set up their profile yet.</p>
              </div>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  const displayName = profile.nickname || profile.full_name || 'Anonymous';
  const location = [profile.city, profile.country].filter(Boolean).join(', ');

  return (
    <SidebarLayout currentPage="profile" pageTitle={displayName}>
      <div className="mobile-container">
        <div className="mobile-section">
          {/* Profile Header */}
          <div className="mobile-card animate-fade-in">
            <div className="mobile-card-header">
              <div className="minimal-flex gap-4">
                <div className="profile-avatar-container">
                  <div className="profile-avatar">
                    {profile.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt={displayName}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <UserIcon className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h2 className="mobile-card-title truncate">{displayName}</h2>
                  {profile.handle && (
                    <p className="mobile-text-xs text-gray-400">@{profile.handle}</p>
                  )}
                  {location && (
                    <p className="mobile-text-xs text-gray-400 mt-1 truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {location}
                    </p>
                  )}
                  {profile.company && (
                    <p className="mobile-text-xs text-gray-400 mt-1 truncate">{profile.company}</p>
                  )}
                </div>
              </div>
              
              {showBackButton && (
                <button
                  onClick={() => navigate(-1)}
                  className="mobile-btn-secondary minimal-flex gap-2"
                >
                  <ArrowLeft className="minimal-icon" />
                  Back
                </button>
              )}
            </div>
          </div>

          {/* Activity Stats - Minimal inline display */}
          <div className="mobile-card animate-stagger-1">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span className="font-medium">Activity:</span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  {profile.posts_count || 0} posts
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  {profile.likes_count || 0} likes
                </span>
                <span className="flex items-center gap-1">
                  <EventIcon className="w-3 h-3" />
                  {profile.events_attended_count || 0} events
                </span>
              </div>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="mobile-card animate-stagger-2">
              <h2 className="profile-section-header">About</h2>
              <p className="mobile-text text-gray-300 leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {/* Followed Communities */}
          <div className="mobile-card animate-stagger-4">
            <h2 className="profile-section-header">Communities</h2>
            {communities.length > 0 ? (
              <div className="space-y-3">
                {communities.map((community) => (
                  <div
                    key={community.id}
                    onClick={() => navigate(`/community/${community.id}`)}
                    className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:bg-slate-700/50 transition-colors cursor-pointer"
                  >
                    <div className="minimal-flex-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{community.name}</h3>
                        {community.gyms && (
                          <p className="mobile-text-xs text-gray-400 truncate">
                            {community.gyms.name} • {community.gyms.city}
                          </p>
                        )}
                        {community.description && (
                          <p className="mobile-text-xs text-gray-500 mt-1 line-clamp-2">
                            {community.description}
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
            ) : (
              <EmptyProfileCommunities />
            )}
          </div>

          {/* Social Links */}
          {profile.social_links && Object.values(profile.social_links).some(link => link) && (
            <div className="mobile-card animate-stagger-5">
              <h2 className="profile-section-header">Social Links</h2>
              <div className="flex gap-4">
                {profile.social_links.instagram && (
                  <a
                    href={`https://instagram.com/${profile.social_links.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mobile-btn-secondary minimal-flex gap-2"
                  >
                    📸 Instagram
                  </a>
                )}
                {profile.social_links.twitter && (
                  <a
                    href={`https://twitter.com/${profile.social_links.twitter.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mobile-btn-secondary minimal-flex gap-2"
                  >
                    🐦 Twitter
                  </a>
                )}
                {profile.social_links.website && (
                  <a
                    href={profile.social_links.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mobile-btn-secondary minimal-flex gap-2"
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
