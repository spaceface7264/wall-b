import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useGeolocation } from '../hooks/useGeolocation';
import { getRecommendedCommunities, getRecommendedGyms } from '../../lib/recommendation-utils';
import CommunityCard from '../components/CommunityCard';
import GymCard from '../components/GymCard';
import ListSkeleton from '../components/ListSkeleton';
import { Users, MapPin, ArrowRight, Sparkles } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userIntent, setUserIntent] = useState([]);
  const [recommendedCommunities, setRecommendedCommunities] = useState([]);
  const [recommendedGyms, setRecommendedGyms] = useState([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [loadingGyms, setLoadingGyms] = useState(true);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  const { location, requestLocation, isSupported: geolocationSupported } = useGeolocation();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        if (currentUser) {
          // Get user profile with intent
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_intent, nickname')
            .eq('id', currentUser.id)
            .single();

          if (profile) {
            setUserIntent(profile.user_intent || []);

            // Check if this is user's first visit after onboarding
            const lastHomeVisit = localStorage.getItem('home_last_visit');
            if (!lastHomeVisit) {
              setIsFirstVisit(true);
              localStorage.setItem('home_last_visit', new Date().toISOString());
            }
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
      {/* Welcome Message */}
      {isFirstVisit && (
        <div className="mobile-section mb-6">
          <div className="mobile-card p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-600/30">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <div>
                <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Welcome to Rocha!
                </h2>
                <p className="mobile-text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  We've personalized your feed based on your interests. Check out these recommendations below.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommended Communities Section */}
      <div className="mobile-section mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="minimal-icon text-[#087E8B]" />
            <h2 className="minimal-heading">Recommended Communities</h2>
          </div>
          <button
            onClick={() => navigate('/communities')}
            className="flex items-center gap-1 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loadingCommunities ? (
          <ListSkeleton variant="community" count={4} />
        ) : recommendedCommunities.length === 0 ? (
          <div className="mobile-card p-8 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-500" />
            <p className="mobile-text" style={{ color: 'var(--text-muted)' }}>
              No communities to recommend right now. Check out all communities to discover more.
            </p>
            <button
              onClick={() => navigate('/communities')}
              className="mobile-btn-primary mt-4"
            >
              Explore Communities
            </button>
          </div>
        ) : (
          <div style={{ marginLeft: 'calc(-1 * var(--container-padding-mobile))', marginRight: 'calc(-1 * var(--container-padding-mobile))' }}>
            <div className="flex flex-col gap-3 px-3">
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
            <h2 className="minimal-heading">Recommended Gyms</h2>
          </div>
          <button
            onClick={() => navigate('/gyms')}
            className="flex items-center gap-1 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
          >
            View All
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
            <div className="flex flex-col gap-3 px-3">
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

