'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Users, MessageCircle, Plus, Heart, MessageSquare, Clock, X, ThumbsUp, Reply, Send, MapPin, UserPlus, Search, Filter, TrendingUp, Calendar, Star, ChevronRight } from 'lucide-react';
import SidebarLayout from '../components/SidebarLayout';
import CommunityCard from '../components/CommunityCard';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
);

export default function CommunityHub() {
  const [user, setUser] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [myCommunities, setMyCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [joiningCommunity, setJoiningCommunity] = useState(null);
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalCommunities: 0,
    trendingPosts: 0
  });
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        loadUserCommunities(user.id);
      }
    };
    getUser();
    loadCommunities();
    loadStats();
  }, []);

  const loadCommunities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('communities')
        .select(`
          *,
          gyms (
            name,
            city,
            country,
            image_url,
            address
          )
        `)
        .eq('is_active', true)
        .order('member_count', { ascending: false });

      if (error) {
        console.error('Error fetching communities:', error);
        // Fallback to mock data
        const mockCommunities = [
          {
            id: '1',
            name: 'The Climbing Hangar Community',
            description: 'Connect with fellow climbers at The Climbing Hangar in London. Share beta, organize meetups, and stay updated on gym events.',
            member_count: 156,
            gyms: {
              name: 'The Climbing Hangar',
              city: 'London',
              country: 'United Kingdom',
              image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb2d26?w=400',
              address: '123 Climbing Street, London E1 6AN'
            }
          },
          {
            id: '2',
            name: 'Boulder Central Community',
            description: 'Join the Boulder Central community in Berlin. Share your sends, get beta, and connect with local climbers.',
            member_count: 89,
            gyms: {
              name: 'Boulder Central',
              city: 'Berlin',
              country: 'Germany',
              image_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400',
              address: '456 Boulder Avenue, Berlin 10115'
            }
          },
          {
            id: '3',
            name: 'Vertical World Community',
            description: 'The Vertical World community in Seattle. From beginners to pros, everyone is welcome to share and learn.',
            member_count: 234,
            gyms: {
              name: 'Vertical World',
              city: 'Seattle',
              country: 'United States',
              image_url: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=400',
              address: '789 Vertical Street, Seattle, WA 98101'
            }
          }
        ];
        setCommunities(mockCommunities);
      } else {
        setCommunities(data || []);
      }
    } catch (error) {
      console.error('Error loading communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserCommunities = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('community_members')
        .select(`
          *,
          communities (
            *,
            gyms (
              name,
              city,
              country,
              image_url
            )
          )
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user communities:', error);
        return;
      }

      setMyCommunities(data?.map(member => member.communities) || []);
    } catch (error) {
      console.error('Error loading user communities:', error);
    }
  };

  const loadStats = async () => {
    try {
      const { data: communitiesData } = await supabase
        .from('communities')
        .select('member_count');

      const { data: postsData } = await supabase
        .from('posts')
        .select('id')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const totalMembers = communitiesData?.reduce((sum, c) => sum + (c.member_count || 0), 0) || 0;
      const totalCommunities = communitiesData?.length || 0;
      const trendingPosts = postsData?.length || 0;

      setStats({ totalMembers, totalCommunities, trendingPosts });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const joinCommunity = async (communityId) => {
    if (!user) return;

    setJoiningCommunity(communityId);
    try {
      const { error } = await supabase
        .from('community_members')
        .insert([{
          community_id: communityId,
          user_id: user.id
        }]);

      if (error) {
        console.error('Error joining community:', error);
        return;
      }

      // Update local state
      const community = communities.find(c => c.id === communityId);
      if (community) {
        setMyCommunities(prev => [...prev, community]);
        setCommunities(prev => prev.map(c => 
          c.id === communityId 
            ? { ...c, member_count: c.member_count + 1 }
            : c
        ));
      }
    } catch (error) {
      console.error('Error joining community:', error);
    } finally {
      setJoiningCommunity(null);
    }
  };

  const leaveCommunity = async (communityId) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error leaving community:', error);
        return;
      }

      // Update local state
      setMyCommunities(prev => prev.filter(c => c.id !== communityId));
      setCommunities(prev => prev.map(c => 
        c.id === communityId 
          ? { ...c, member_count: Math.max(0, c.member_count - 1) }
          : c
      ));
    } catch (error) {
      console.error('Error leaving community:', error);
    }
  };

  const isMemberOfCommunity = (communityId) => {
    return myCommunities.some(c => c.id === communityId);
  };

  const filteredCommunities = communities.filter(community => {
    const matchesSearch = community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         community.gyms?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         community.gyms?.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = !filterLocation || 
                           community.gyms?.city.toLowerCase().includes(filterLocation.toLowerCase()) ||
                           community.gyms?.country.toLowerCase().includes(filterLocation.toLowerCase());

    return matchesSearch && matchesLocation;
  });

  const openCommunity = (communityId) => {
    router.push(`/community/${communityId}`);
  };

  return (
    <SidebarLayout currentPage="community">
      <div className="mobile-container">
        <div className="mobile-section">
          {/* Header Card */}
          <div className="mobile-card animate-fade-in">
            <div className="mobile-card-header">
              <div className="animate-slide-up">
                <h1 className="mobile-card-title">Communities</h1>
                <p className="mobile-card-subtitle">
                  Connect with climbers at your favorite gyms
                </p>
              </div>
              <div className="minimal-flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="mobile-btn-secondary touch-feedback"
                >
                  <Filter className="minimal-icon" />
                </button>
                <button
                  onClick={() => router.push('/community/new')}
                  className="mobile-btn-primary touch-feedback animate-bounce-in"
                >
                  <Plus className="minimal-icon" />
                  New Post
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="minimal-flex justify-around py-4 border-t border-gray-700">
              <div className="text-center">
                <div className="minimal-heading text-2xl">{stats.totalCommunities}</div>
                <div className="minimal-text text-xs">Communities</div>
              </div>
              <div className="text-center">
                <div className="minimal-heading text-2xl">{stats.totalMembers}</div>
                <div className="minimal-text text-xs">Members</div>
              </div>
              <div className="text-center">
                <div className="minimal-heading text-2xl">{stats.trendingPosts}</div>
                <div className="minimal-text text-xs">Posts This Week</div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mobile-card animate-slide-up">
            <div className="minimal-flex gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 minimal-icon text-gray-400" />
                <input
                  type="text"
                  placeholder="Search communities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="minimal-input pl-10"
                />
              </div>
            </div>

            {showFilters && (
              <div className="space-y-3 animate-slide-down">
                <div>
                  <label className="minimal-text block mb-2">Filter by Location</label>
                  <input
                    type="text"
                    placeholder="City or country..."
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                    className="minimal-input w-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* My Communities */}
          {myCommunities.length > 0 && (
            <div className="mobile-section">
              <h2 className="mobile-subheading mb-4 minimal-flex">
                <Star className="minimal-icon mr-2" />
                My Communities
              </h2>
              <div className="space-y-3">
                {myCommunities.map((community, index) => (
                  <CommunityCard
                    key={community.id}
                    community={community}
                    isMember={true}
                    onOpen={openCommunity}
                    showJoinButton={false}
                    className={`animate-stagger-${Math.min(index + 1, 3)}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Discover Communities */}
          <div className="mobile-section">
            <h2 className="mobile-subheading mb-4 minimal-flex">
              <TrendingUp className="minimal-icon mr-2" />
              Discover Communities
            </h2>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="mobile-card">
                    <div className="minimal-flex">
                      <div className="loading-skeleton w-12 h-12 rounded-lg mr-3"></div>
                      <div className="flex-1">
                        <div className="loading-skeleton h-4 w-3/4 mb-2"></div>
                        <div className="loading-skeleton h-3 w-1/2 mb-1"></div>
                        <div className="loading-skeleton h-3 w-1/3"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredCommunities.length === 0 ? (
              <div className="mobile-card">
                <div className="minimal-flex-center py-8">
                  <div className="text-center">
                    <Users className="minimal-icon mx-auto mb-2 text-gray-500" />
                    <p className="mobile-text-sm">No communities found</p>
                    <p className="mobile-text-xs text-gray-400 mt-1">
                      Try adjusting your search or filters
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCommunities.map((community, index) => (
                  <CommunityCard
                    key={community.id}
                    community={community}
                    isMember={isMemberOfCommunity(community.id)}
                    onJoin={joinCommunity}
                    onLeave={leaveCommunity}
                    onOpen={openCommunity}
                    joining={joiningCommunity === community.id}
                    className={`animate-stagger-${Math.min(index + 1, 5)}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}