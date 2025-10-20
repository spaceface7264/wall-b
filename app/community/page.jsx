'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Plus,
  Search,
  Filter,
  TrendingUp
} from 'lucide-react';
import SidebarLayout from '../components/SidebarLayout';
import CommunityCard from '../components/CommunityCard';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Global state manager to prevent any duplicate API calls
let globalDataLoaded = false;
let globalCommunitiesData = null;
let globalUserData = null;
let globalLoadingPromise = null;

export default function CommunityHub() {
  const [user, setUser] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [myCommunities, setMyCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [joiningCommunity, setJoiningCommunity] = useState(null);
  const [leavingCommunity, setLeavingCommunity] = useState(null);
  const isLoadingDataRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    console.log('🔄 Main useEffect triggered, hasLoaded:', hasLoadedRef.current, 'globalLoaded:', globalDataLoaded);
    
    // CRITICAL: Only run once ever - even if component remounts or multiple instances
    if (hasLoadedRef.current || isLoadingDataRef.current || globalDataLoaded) {
      console.log('⏸️ Already loaded or loading, skipping...');
      
      // If we already have global data, use it immediately
      if (globalCommunitiesData) {
        console.log('♻️ Using cached communities data');
        setCommunities(globalCommunitiesData);
        setLoading(false);
      }
      if (globalUserData) {
        console.log('♻️ Using cached user data');
        setUser(globalUserData);
      }
      return;
    }
    
    // If there's already a loading promise, wait for it instead of starting a new one
    if (globalLoadingPromise) {
      console.log('⏳ Waiting for existing loading promise...');
      globalLoadingPromise.then(() => {
        if (globalCommunitiesData) {
          setCommunities(globalCommunitiesData);
          setLoading(false);
        }
        if (globalUserData) {
          setUser(globalUserData);
        }
      });
      return;
    }
    
    const loadAllData = async () => {
      console.log('🚀 Starting data load...');
      try {
        isLoadingDataRef.current = true;
        hasLoadedRef.current = true; // Mark as loaded immediately
        globalDataLoaded = true; // Mark globally as loaded
        setLoading(true);

        // Load communities directly without useCallback
        console.log('🔄 Loading communities...');
        const { data: communitiesData, error: communitiesError } = await supabase
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

        if (communitiesError) {
          console.error('Error fetching communities:', communitiesError);
        } else {
          console.log('✅ Communities loaded successfully:', communitiesData?.length || 0);
          globalCommunitiesData = communitiesData || []; // Cache globally
          setCommunities(globalCommunitiesData);
        }

        // Load user data
        console.log('🔄 Loading user data...');
        const { data: { user } } = await supabase.auth.getUser();
        globalUserData = user; // Cache globally
        setUser(user);
        
        if (user) {
          console.log('🔄 Loading user communities...');
          loadUserCommunities(user.id);
        }

      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        console.log('✅ Data load completed');
        setLoading(false);
        isLoadingDataRef.current = false;
        globalLoadingPromise = null; // Clear the promise
      }
    };

    // Store the promise globally to prevent duplicate calls
    globalLoadingPromise = loadAllData();
  }, []); // Empty dependency array - only run once

  // REMOVED: This useEffect can cause routing conflicts
  // useEffect(() => {
  //   const checkLastVisitedCommunity = async () => { ... }
  // }, [router]);


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

      const matchesType = filterType === 'all' || 
                          (filterType === 'gym' && community.community_type === 'gym') ||
                          (filterType === 'general' && community.community_type === 'general');

      return matchesSearch && matchesLocation && matchesType;
    });
  }, [communities, searchTerm, filterLocation, filterType]);

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

    // Confirm before leaving
    if (!confirm('Are you sure you want to leave this community? You will no longer be able to see posts or participate in discussions.')) {
      return;
    }

    setLeavingCommunity(communityId);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600));

      // Update local state
      setMyCommunities(prev => prev.filter(c => c.id !== communityId));
      setCommunities(prev => prev.map(c => 
        c.id === communityId 
          ? { ...c, member_count: Math.max(0, c.member_count - 1) }
          : c
      ));
    } finally {
      setLeavingCommunity(null);
    }
  }, [user]);

  const isMemberOfCommunity = useCallback((communityId) => {
    return myCommunities.some(c => c.id === communityId);
  }, [myCommunities]);

  const openCommunity = useCallback((communityId) => {
    router.push(`/community/${communityId}`);
  }, [router]);

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <SidebarLayout currentPage="community" pageTitle="Communities">
        <div className="mobile-container">
          <div className="minimal-flex-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
              <p className="text-white">Loading communities...</p>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout currentPage="community" pageTitle="Communities">
      <div className="mobile-container">
        {/* Header */}
        <div className="animate-fade-in" style={{ marginBottom: '24px', position: 'relative' }}>
          <div className="mobile-card-header" style={{ marginBottom: '16px' }}>
            <div className="animate-slide-up" style={{ paddingRight: '70px' }}>
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
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search communities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              
              {/* Filter Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Filter by Location
                  </label>
                  <input
                    type="text"
                    placeholder="City or country..."
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Filter by Type
                  </label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="all">All Communities</option>
                    <option value="gym">Gym Communities</option>
                    <option value="general">General Communities</option>
                  </select>
                </div>
              </div>
              
              {/* Clear Filters Button */}
              {(searchTerm || filterLocation || filterType !== 'all') && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterLocation('');
                      setFilterType('all');
                    }}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        )}


        {/* Communities List */}
        <div style={{ marginBottom: '24px' }}>

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
                         leaving={leavingCommunity === community.id}
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