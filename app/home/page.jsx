import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useGeolocation } from '../hooks/useGeolocation';
import { getRecommendedCommunities, getRecommendedGyms } from '../../lib/recommendation-utils';
import CommunityCard from '../components/CommunityCard';
import GymCard from '../components/GymCard';
import ListSkeleton from '../components/ListSkeleton';
import { Users, MapPin, ArrowRight, Sparkles, PlusCircle } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userIntent, setUserIntent] = useState([]);
  const [recommendedCommunities, setRecommendedCommunities] = useState([]);
  const [recommendedGyms, setRecommendedGyms] = useState([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [loadingGyms, setLoadingGyms] = useState(true);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [loginCount, setLoginCount] = useState(0);

  const { location, requestLocation, isSupported: geolocationSupported } = useGeolocation();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        if (currentUser) {
          // Check login count for welcome message (show for first 5 logins)
          const userVisitKey = `home_login_count_${currentUser.id}`;
          const savedCount = localStorage.getItem(userVisitKey);
          const currentCount = savedCount ? parseInt(savedCount, 10) : 0;
          const newCount = currentCount + 1;
          
          setLoginCount(newCount);
          setIsFirstVisit(newCount <= 5);
          
          localStorage.setItem(userVisitKey, newCount.toString());
          
          if (newCount <= 5) {
            console.log(`Welcome message shown (login ${newCount}/5) for user:`, currentUser.id);
          }

          // Get user profile with intent
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_intent, nickname')
            .eq('id', currentUser.id)
            .single();

          if (profile) {
            setUserIntent(profile.user_intent || []);
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    const loadRecommendations = async () => {
      if (!user || userIntent.length === 0) {
        setLoadingCommunities(false);
        setLoadingGyms(false);
        return;
      }

      // Request location if supported (for location-based recommendations)
      // Only request once, don't retry on errors
      if (geolocationSupported && !location) {
        requestLocation().catch(() => {
          // Silently fail - location is optional for recommendations
          // Recommendations will work without location, just without distance sorting
        });
      }

      // Load recommended communities
      try {
        setLoadingCommunities(true);
        const communities = await getRecommendedCommunities(user.id, userIntent, location, 8);
        setRecommendedCommunities(communities);
      } catch (error) {
        console.error('Error loading recommended communities:', error);
      } finally {
        setLoadingCommunities(false);
      }

      // Load recommended gyms
      try {
        setLoadingGyms(true);
        const gyms = await getRecommendedGyms(user.id, userIntent, location, 8);
        setRecommendedGyms(gyms);
      } catch (error) {
        console.error('Error loading recommended gyms:', error);
      } finally {
        setLoadingGyms(false);
      }
    };

    loadRecommendations();
  }, [user, userIntent, location, geolocationSupported]);

  const handleJoinCommunity = async (communityId) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('community_members')
        .insert({
          community_id: communityId,
          user_id: user.id
        });

      if (error) {
        console.error('Error joining community:', error);
        return;
      }

      // Remove from recommended list
      setRecommendedCommunities(prev => prev.filter(c => c.id !== communityId));
    } catch (error) {
      console.error('Error joining community:', error);
    }
  };

  return (
    <div className="mobile-container">
      {/* Welcome Message - First 5 Logins */}
      {isFirstVisit && (
        <div className="mobile-section mb-6">
          <div className="mobile-card p-6">
            <div className="space-y-4">
              <div className="mb-2">
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="w-6 h-6 text-blue-400" />
                  <h3 className="mobile-heading text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Welcome to Send Train!
                  </h3>
                </div>
                <p className="mobile-text-sm ml-9" style={{ color: 'var(--text-muted)' }}>
                  Your new climbing community hub
                </p>
              </div>
              <p className="mobile-text text-left" style={{ color: 'var(--text-muted)' }}>
                Connecting you with communities in local climbing gyms and around the world.
              </p>
              <p className="mobile-text text-left" style={{ color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>How it works:</strong> Join communities around your favorite gyms or interests, share your sends, ask questions, share beta, and training tips, discover events, and connect with climbers who share your passion.
              </p>
              <p className="mobile-text text-left" style={{ color: 'var(--text-muted)' }}>
                No communities match your interests yet? No problem! Be a trailblazer and create your own community where climbers can come together. Create the community and be the first to rally your crew. Every great climbing community starts with someone taking the first step.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recommended Communities Section */}
      <div className="mobile-section mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="minimal-icon text-[#087E8B]" />
            <h2 className="minimal-heading">Communities</h2>
          </div>
          <button
            onClick={() => navigate('/communities')}
            className="flex items-center gap-1 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
          >
            Explore
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loadingCommunities ? (
          <ListSkeleton variant="community" count={4} />
        ) : recommendedCommunities.length === 0 ? (
          <div className="mobile-card p-8 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-500" />
            <p className="mobile-text" style={{ color: 'var(--text-muted)' }}>
              No communities to recommend right now. We're still building the network!
            </p>
            <div className="flex flex-col md:flex-row gap-3 mt-4 desktop-mx">
              <button
                onClick={() => navigate('/communities')}
                className="mobile-btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                Explore Communities
              </button>
              <button
                onClick={() => navigate('/community/new')}
                className="mobile-btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                Create Community
              </button>
            </div>
          </div>
        ) : (
          <div style={{ marginLeft: 'calc(-1 * var(--container-padding-mobile))', marginRight: 'calc(-1 * var(--container-padding-mobile))' }}>
            <div className="desktop-grid-3 px-3">
              {recommendedCommunities.map((community) => (
                <div
                  key={community.id}
                  className="rounded-lg transition-all duration-200 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    padding: 'var(--card-padding-mobile)'
                  }}
                  onClick={() => navigate(`/community/${community.id}`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                  }}
                >
                  <CommunityCard
                    community={community}
                    isMember={false}
                    onJoin={() => handleJoinCommunity(community.id)}
                    onLeave={() => {}}
                    onReport={() => {}}
                    onOpen={() => navigate(`/community/${community.id}`)}
                    joining={false}
                    leaving={false}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recommended Gyms Section */}
      <div className="mobile-section mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="minimal-icon text-[#087E8B]" />
            <h2 className="minimal-heading">Gyms</h2>
          </div>
          <button
            onClick={() => navigate('/gyms')}
            className="flex items-center gap-1 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
          >
            Explore
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loadingGyms ? (
          <ListSkeleton variant="gym" count={4} />
        ) : recommendedGyms.length === 0 ? (
          <div className="mobile-card p-8 text-center">
            <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-500" />
            <p className="mobile-text" style={{ color: 'var(--text-muted)' }}>
              No gyms to recommend right now. Check out all gyms to discover more.
            </p>
            <button
              onClick={() => navigate('/gyms')}
              className="mobile-btn-primary mt-4"
            >
              Explore Gyms
            </button>
          </div>
        ) : (
          <div style={{ marginLeft: 'calc(-1 * var(--container-padding-mobile))', marginRight: 'calc(-1 * var(--container-padding-mobile))' }}>
            <div className="desktop-grid-3 px-3">
              {recommendedGyms.map((gym) => (
                <GymCard
                  key={gym.id}
                  gym={gym}
                  onOpen={(gym) => navigate(`/gyms/${gym.id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

