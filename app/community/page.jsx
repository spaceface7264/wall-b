'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Plus,
  Search,
  Filter,
  TrendingUp,
  Star
} from 'lucide-react';
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
  const router = useRouter();

  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoading(true);

        // Parallel data loading for better performance
        const [userResult, communitiesResult] = await Promise.allSettled([
          supabase.auth.getUser(),
          loadCommunitiesData()
        ]);

        // Handle user data
        if (userResult.status === 'fulfilled') {
          const { data: { user } } = userResult.value;
          setUser(user);
          if (user) {
            loadUserCommunities(user.id);
          }
        }

        // Handle communities data
        if (communitiesResult.status === 'fulfilled') {
          setCommunities(communitiesResult.value);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load communities from Supabase
  const loadCommunitiesData = async () => {
    try {
      const { data, error } = await supabase
        .from('communities')
        .select(`
          *,
          gyms (
            name,
            city,
            country,
            address
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching communities:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching communities:', error);
      return [];
    }
  };

  const loadUserCommunities = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('community_members')
        .select(`
          communities (
            *,
            gyms (
              name,
              city,
              country,
              address
            )
          )
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user communities:', error);
        setMyCommunities([]);
        return;
      }

      const userCommunities = data?.map(member => member.communities).filter(Boolean) || [];
      setMyCommunities(userCommunities);
    } catch (error) {
      console.error('Error fetching user communities:', error);
      setMyCommunities([]);
    }
  }, []);

  // Memoized filtered communities for better performance
  const filteredCommunities = useMemo(() => {
    return communities.filter(community => {
      const matchesSearch = searchTerm === '' ||
                            community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            community.gyms?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            community.gyms?.city.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesLocation = !filterLocation ||
                              community.gyms?.city.toLowerCase().includes(filterLocation.toLowerCase()) ||
                              community.gyms?.country.toLowerCase().includes(filterLocation.toLowerCase());

      return matchesSearch && matchesLocation;
    });
  }, [communities, searchTerm, filterLocation]);

  const joinCommunity = useCallback(async (communityId) => {
    if (!user) return;

    setJoiningCommunity(communityId);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

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
    
    setJoiningCommunity(null);
  }, [user, communities]);

  const leaveCommunity = useCallback(async (communityId) => {
    if (!user) return;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));

    // Update local state
    setMyCommunities(prev => prev.filter(c => c.id !== communityId));
    setCommunities(prev => prev.map(c => 
      c.id === communityId 
        ? { ...c, member_count: Math.max(0, c.member_count - 1) }
        : c
    ));
  }, [user]);

  const isMemberOfCommunity = useCallback((communityId) => {
    return myCommunities.some(c => c.id === communityId);
  }, [myCommunities]);

  const openCommunity = useCallback((communityId) => {
    router.push(`/community/${communityId}`);
  }, [router]);

  return (
    <SidebarLayout currentPage="community">
      <div className="mobile-container">
        {/* Header Card */}
        <div className="mobile-card animate-fade-in" style={{ marginBottom: '24px', position: 'relative' }}>
          <div className="mobile-card-header" style={{ marginBottom: '16px' }}>
            <div className="animate-slide-up" style={{ paddingRight: '70px' }}>
              <h1 className="mobile-card-title" style={{ marginBottom: '4px' }}>Communities</h1>
              <p className="mobile-card-subtitle">
                Connect with climbers at your favorite gyms
              </p>
            </div>
            <div style={{ position: 'absolute', top: '10px', right: '0px', display: 'flex', gap: '12px', zIndex: 10 }}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: showFilters ? '#818cf8' : '#9ca3af',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.2s ease'
                }}
              >
                <Filter size={18} />
              </button>
              <button
                onClick={() => router.push('/community/new')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#818cf8'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        {showFilters && (
          <div className="mobile-card animate-slide-down" style={{ marginBottom: '24px' }}>
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 minimal-icon text-gray-400" />
                <input
                  type="text"
                  placeholder="Search communities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="minimal-input pl-10"
                />
              </div>
              <div>
                <label className="minimal-text block mb-2 font-medium">Filter by Location</label>
                <input
                  type="text"
                  placeholder="City or country..."
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  className="minimal-input w-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* My Communities */}
        {myCommunities.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <div className="minimal-flex-between items-center mb-4">
              <h2 className="mobile-subheading minimal-flex">
                <Star className="minimal-icon mr-2 text-yellow-400" />
                My Communities
              </h2>
              <span className="minimal-text text-sm text-gray-400">
                {myCommunities.length} joined
              </span>
            </div>
            <div className="space-y-2">
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
        <div style={{ marginBottom: '24px' }}>
          <div className="minimal-flex-between items-center mb-4">
            <h2 className="mobile-subheading minimal-flex">
              <TrendingUp className="minimal-icon mr-2 text-indigo-400" />
              Discover Communities
            </h2>
            <span className="minimal-text text-sm text-gray-400">
              {filteredCommunities.length} available
            </span>
          </div>

          {loading ? (
                   <div className="space-y-2">
                     {Array.from({ length: 3 }, (_, i) => (
                       <div key={i} className="mobile-card">
                         <div className="minimal-flex">
                           <div className="minimal-skeleton w-12 h-12 rounded-lg mr-4 flex-shrink-0"></div>
                           <div className="flex-1 space-y-2">
                             <div className="minimal-skeleton h-5 w-3/4"></div>
                             <div className="minimal-skeleton h-3 w-1/2"></div>
                             <div className="minimal-skeleton h-3 w-1/3"></div>
                           </div>
                           <div className="minimal-skeleton w-20 h-8 rounded"></div>
                         </div>
                       </div>
                     ))}
                   </div>
          ) : filteredCommunities.length === 0 ? (
            <div className="mobile-card">
              <div className="minimal-flex-center py-12">
                <div className="text-center">
                  <p className="mobile-text-sm text-gray-400 mb-2">No communities found</p>
                  <p className="mobile-text-xs text-gray-500">
                    Try adjusting your search or filters
                  </p>
                </div>
              </div>
            </div>
          ) : (
                   <div className="space-y-2">
                     {filteredCommunities.map((community, index) => (
                       <CommunityCard
                         key={`community-${community.id}-${index}`}
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
    </SidebarLayout>
  );
}