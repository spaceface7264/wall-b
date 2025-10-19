'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { Users, Plus, LogOut, Shield, Search, X, Compass, PlusCircle } from 'lucide-react';
import NotificationBell from './NotificationBell';
import BottomNav from './BottomNav';

export default function SidebarLayout({ children, currentPage = 'community', pageTitle = null }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [communities, setCommunities] = useState([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (mounted) {
          setUser(user);
          
          // Check if user is admin and load communities
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('is_admin')
              .eq('id', user.id)
              .single();
            
            setIsAdmin(profile?.is_admin || false);
            loadUserCommunities(user.id);
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting user:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          setUser(session?.user ?? null);
          
          // Check admin status when auth state changes
          if (session?.user) {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', session.user.id)
                .single();
              
              setIsAdmin(profile?.is_admin || false);
              loadUserCommunities(session.user.id);
            } catch (error) {
              console.error('Error checking admin status:', error);
              setIsAdmin(false);
            }
          } else {
            setIsAdmin(false);
            setCommunities([]);
          }
          
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [loading, user, router]);

  // Ripple effect function
  const createRipple = (event) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    const ripple = document.createElement('span');
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');
    
    button.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  const navigateToPage = (page) => {
    router.push(`/${page}`);
    closeDrawer();
  };

  const loadUserCommunities = async (userId) => {
    if (!userId) return;
    
    setCommunitiesLoading(true);
    try {
      console.log('Loading communities for user:', userId);
      
      // First, let's try a simple query to see if the table exists
      const { data: testData, error: testError } = await supabase
        .from('community_members')
        .select('*')
        .limit(1);
      
      if (testError) {
        console.error('Table test error:', testError);
        // If community_members doesn't exist, try communities directly
        const { data: communitiesData, error: communitiesError } = await supabase
          .from('communities')
          .select('id, name, description, member_count')
          .limit(10);
        
        if (communitiesError) {
          console.error('Communities table error:', communitiesError);
          return;
        }
        
        console.log('Using communities table directly:', communitiesData);
        setCommunities(communitiesData || []);
        return;
      }
      
      // If community_members exists, proceed with the original query
      const { data, error } = await supabase
        .from('community_members')
        .select(`
          communities (
            id,
            name,
            description,
            member_count
          )
        `)
        .eq('user_id', userId)
        .order('joined_at', { ascending: false });

      if (error) {
        console.error('Error loading communities:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return;
      }

      console.log('Communities data:', data);
      setCommunities(data?.map(item => item.communities).filter(Boolean) || []);
    } catch (error) {
      console.error('Error loading communities:', error);
    } finally {
      setCommunitiesLoading(false);
    }
  };

  const navigateToCommunity = (communityId) => {
    router.push(`/community/${communityId}`);
    closeDrawer();
  };

  const navigateToJoinCommunity = () => {
    router.push('/community');
    closeDrawer();
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setIsSearchActive(query.length > 0);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearchActive(false);
  };

  const handleSearchAllCommunities = () => {
    if (searchQuery.trim()) {
      router.push(`/community?search=${encodeURIComponent(searchQuery.trim())}`);
      closeDrawer();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchAllCommunities();
    }
  };


  if (loading) {
    return (
      <div className="mobile-app mobile-safe-area flex items-center justify-center animate-fade-in" style={{ backgroundColor: '#252526' }}>
        <div className="text-center animate-bounce-in">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="minimal-text">Loading Wall-B...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="mobile-app mobile-safe-area">
      {/* Mobile Header */}
      <div className="mobile-header">
        <button 
          onClick={toggleDrawer}
          onMouseDown={createRipple}
          className="mobile-touch-target ripple-effect"
        >
          <div className={`mobile-hamburger ${drawerOpen ? 'open' : ''}`}>
            <div className="mobile-hamburger-line"></div>
            <div className="mobile-hamburger-line"></div>
            <div className="mobile-hamburger-line"></div>
          </div>
        </button>
        
        <h1 className="mobile-header-title capitalize">{pageTitle || currentPage}</h1>
        
        <div className="mobile-header-actions">
          <NotificationBell userId={user?.id} />
        </div>
      </div>

      {/* Drawer Overlay */}
      {drawerOpen && (
        <div 
          className="mobile-drawer-overlay open"
          onClick={closeDrawer}
        />
      )}

      {/* Drawer */}
      <div className={`mobile-drawer ${drawerOpen ? 'open' : ''}`}>

        {/* Search Section */}
        <div className="px-4 py-4 border-b border-gray-700">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyPress={handleKeyPress}
              placeholder="Search communities..."
              className="w-full pl-10 pr-10 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-white" />
              </button>
            )}
          </div>
          
          {/* Search All Communities Button - Only show when search is active */}
          {isSearchActive && (
            <button
              onClick={handleSearchAllCommunities}
              className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <Search className="w-4 h-4" />
              <span className="font-medium">Search all communities</span>
            </button>
          )}
        </div>

        {/* Communities Section */}
        <div className="mobile-drawer-nav">
          <div className="py-2">
            {/* Create Community Button - Always at top */}
            <button
              onClick={() => {}}
              onMouseDown={createRipple}
              className="w-full flex items-center justify-between p-3 rounded-none transition-colors ripple-effect hover:bg-gray-700/50 text-gray-300"
            >
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium text-sm truncate">Create Community</span>
                </div>
              </div>
            </button>

            {/* Explore Communities Button */}
            <button
              onClick={navigateToJoinCommunity}
              onMouseDown={createRipple}
              className="w-full flex items-center justify-between p-3 rounded-none transition-colors ripple-effect hover:bg-gray-700/50 text-gray-300"
            >
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium text-sm truncate">Explore Communities</span>
                </div>
              </div>
            </button>

            {communitiesLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : communities.length > 0 ? (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {communities.map((community) => (
                  <button
                    key={community.id}
                    onClick={() => navigateToCommunity(community.id)}
                    onMouseDown={createRipple}
                    className={`w-full flex items-center justify-between p-3 rounded-none transition-colors ripple-effect ${
                      currentPage === 'community' ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-gray-700/50 text-gray-300'
                    }`}
                  >
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium text-sm truncate">{community.name}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <Users className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No communities yet</p>
              </div>
            )}

            {/* Admin Panel - Only show if user is admin */}
            {isAdmin && (
              <button
                onClick={() => navigateToPage('admin')}
                onMouseDown={createRipple}
                className={`w-full flex items-center gap-3 p-3 mt-2 rounded-none transition-colors ripple-effect ${
                  currentPage === 'admin' 
                    ? 'bg-amber-500/20 text-amber-300' 
                    : 'hover:bg-gray-700/50 text-gray-300'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span className="font-medium">Admin Panel</span>
              </button>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="mobile-drawer-footer">
          <button
            onClick={handleLogout}
            onMouseDown={createRipple}
            className="mobile-drawer-item ripple-effect text-red-400 hover:text-red-300"
          >
            <LogOut className="mobile-drawer-icon" />
            <span className="mobile-drawer-text">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`mobile-content ${currentPage === 'chat' ? 'mobile-content-chat' : 'mobile-content-with-cards'}`}>
        <div className="p-comfortable">
          {children}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
