import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Users, Plus, LogOut, Shield, Search, X, Compass, PlusCircle, Globe, Sun, Moon } from 'lucide-react';
import NotificationBell from './NotificationBell';
import BottomNav from './BottomNav';
import { enrichCommunitiesWithActualCounts, checkForNewPosts, updateLastViewedAt } from '../../lib/community-utils';
import Skeleton from './Skeleton';
import ListSkeleton from './ListSkeleton';

export default function SidebarLayout({ children, currentPage = 'community', pageTitle = null }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [communities, setCommunities] = useState([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [theme, setTheme] = useState(() => {
    // Initialize theme from localStorage or default to 'dark'
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'dark';
  });
  const navigate = useNavigate();
  const location = useLocation();

  // Define loadUserCommunities BEFORE useEffect to avoid ReferenceError
  // (const functions are NOT hoisted in JavaScript)
  const loadUserCommunities = async (userId) => {
    if (!userId) return;
    
    setCommunitiesLoading(true);
    try {
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
        
        setCommunities(communitiesData || []);
        return;
      }
      
      // If community_members exists, proceed with the original query
      // Filter out suspended communities (is_active = true or null for backward compatibility)
      const { data, error } = await supabase
        .from('community_members')
        .select(`
          communities (
            id,
            name,
            description,
            member_count,
            is_active
          )
        `)
        .eq('user_id', userId)
        .order('joined_at', { ascending: false });

      if (error) {
        console.error('Error loading communities:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return;
      }

      const communitiesList = data?.map(item => item.communities).filter(Boolean) || [];
      // Filter out suspended communities
      const activeCommunities = communitiesList.filter(c => c.is_active !== false);
      // Enrich with actual member counts
      const enrichedCommunities = await enrichCommunitiesWithActualCounts(activeCommunities);
      
      // Check for new posts in each community
      const communitiesWithNewPosts = await Promise.all(
        enrichedCommunities.map(async (community) => {
          const hasNewPosts = await checkForNewPosts(community.id, userId);
          return { ...community, hasNewPosts };
        })
      );
      
      setCommunities(communitiesWithNewPosts);
    } catch (error) {
      console.error('Error loading communities:', error);
    } finally {
      setCommunitiesLoading(false);
    }
  };

  // Theme management - Apply theme immediately on mount to prevent flash
  useEffect(() => {
    const root = document.documentElement;
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme'); // Default is dark
    }
  }, []); // Run only on mount

  // Theme management - Apply theme to document when it changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme'); // Default is dark
    }
    // Save to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    let mounted = true;
    let timeoutId;

    // SAFETY: Timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      if (mounted) {
        console.error('⚠️ TIMEOUT: Auth check took > 5 seconds, forcing loading=false');
        setLoading(false);
      }
    }, 5000);

    const getUser = async () => {
      try {
        // Check if supabase exists
        if (!supabase) {
          console.error('❌ CRITICAL: supabase client is undefined!');
          if (mounted) {
            clearTimeout(timeoutId);
            setLoading(false);
            setUser(null);
          }
          return;
        }

        // Use getSession() instead of getUser() - it's faster and more reliable
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          if (mounted) {
            clearTimeout(timeoutId);
            setLoading(false);
            setUser(null);
          }
          return;
        }

        const user = session?.user ?? null;

        if (mounted) {
          setUser(user);
          
          // Check if user is admin and load communities
          if (user) {
            try {
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('is_admin, is_banned')
                .eq('id', user.id)
                .maybeSingle();
              
              if (profileError && profileError.code !== 'PGRST116') {
                console.error('❌ Profile error:', profileError);
              }
              
              // Check if user is banned
              if (profile && profile.is_banned) {
                console.log('⚠️ User is banned, signing out...');
                await supabase.auth.signOut();
                if (mounted) {
                  setUser(null);
                  setLoading(false);
                  // Redirect to login page
                  if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
                    window.location.href = '/login';
                  }
                }
                return;
              }
              
              setIsAdmin(profile?.is_admin || false);
              loadUserCommunities(user.id);
            } catch (error) {
              console.error('❌ Profile check failed:', error);
              setIsAdmin(false);
            }
          }
          
          clearTimeout(timeoutId);
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ getUser() failed:', error);
        console.error('❌ Error details:', error.message);
        if (mounted) {
          clearTimeout(timeoutId);
          setLoading(false);
          setUser(null);
        }
      }
    };

    getUser();

    let subscription;
    try {
      const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (mounted) {
            setUser(session?.user ?? null);
            
            if (session?.user) {
              try {
                const { data: profile, error: profileError } = await supabase
                  .from('profiles')
                  .select('is_admin, is_banned')
                  .eq('id', session.user.id)
                  .maybeSingle();
                
                if (profileError && profileError.code !== 'PGRST116') {
                  console.error('Error checking admin status:', profileError);
                }
                
                // Check if user is banned
                if (profile && profile.is_banned) {
                  console.log('⚠️ User is banned, signing out...');
                  await supabase.auth.signOut();
                  if (mounted) {
                    setUser(null);
                    // Redirect to login page
                    if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
                      window.location.href = '/login';
                    }
                  }
                  return;
                }
                
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
            
            clearTimeout(timeoutId);
            setLoading(false);
          }
        }
      );
      subscription = sub;
    } catch (error) {
      console.error('❌ Failed to setup auth listener:', error);
    }

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    // Only redirect to login if we're not already on the login page
    // and only after loading is complete and user is confirmed null
    // Add a delay to allow auth state to settle after navigation
    if (location.pathname === '/' || location.pathname === '/login') {
      return; // Don't redirect if already on login page
    }

    const timer = setTimeout(() => {
      if (!loading && !user) {
        console.log('🔒 No authenticated user, redirecting to login...');
        navigate('/');
      }
    }, 500); // Increased delay to allow auth state to settle

    return () => clearTimeout(timer);
  }, [loading, user, navigate, location.pathname]);

  // Memoize community IDs to avoid unnecessary subscription recreations
  const communityIdsString = communities.map(c => c.id).filter(Boolean).sort().join(',');
  const communityIds = useMemo(() => {
    return new Set(communities.map(c => c.id).filter(Boolean));
  }, [communityIdsString]);

  // Extract current community ID from location pathname if on community page
  const currentCommunityId = useMemo(() => {
    const match = location.pathname.match(/^\/community\/([^\/]+)$/);
    return match ? match[1] : null;
  }, [location.pathname]);

  // Clear indicator for currently viewed community
  useEffect(() => {
    if (currentCommunityId && user?.id) {
      setCommunities(prev => 
        prev.map(comm => 
          comm.id === currentCommunityId ? { ...comm, hasNewPosts: false } : comm
        )
      );
    }
  }, [currentCommunityId, user?.id]);

  // Realtime subscription for new posts in joined communities
  useEffect(() => {
    if (!user?.id || communityIds.size === 0) return;

    console.log('Setting up realtime subscription for new posts in communities:', Array.from(communityIds));

    // Subscribe to all post inserts and filter client-side
    // This is more reliable than trying to use complex filters
    const channel = supabase
      .channel('community-new-posts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts'
        },
        async (payload) => {
          const newPost = payload.new;
          const communityId = newPost.community_id;
          
          // Only process if this post is in a joined community and not from current user
          if (communityId && communityIds.has(communityId) && newPost.user_id !== user.id) {
            console.log('New post detected in community:', communityId);
            
            // Update the community's hasNewPosts status
            setCommunities(prev => 
              prev.map(comm => 
                comm.id === communityId ? { ...comm, hasNewPosts: true } : comm
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realtime subscription for new posts');
      supabase.removeChannel(channel);
    };
  }, [user?.id, communityIds]);

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
      navigate('/');
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
    navigate(`/${page}`);
    closeDrawer();
  };

  const navigateToCommunity = (communityId) => {
    // Clear the new posts indicator immediately when navigating
    if (user?.id && communityId) {
      updateLastViewedAt(communityId, user.id);
      // Update local state to remove indicator immediately
      setCommunities(prev => 
        prev.map(comm => 
          comm.id === communityId ? { ...comm, hasNewPosts: false } : comm
        )
      );
    }
    navigate(`/community/${communityId}`);
    closeDrawer();
  };

  const navigateToJoinCommunity = () => {
    navigate('/communities');
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
      navigate(`/communities?search=${encodeURIComponent(searchQuery.trim())}`);
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
          <div className="w-8 h-8 border-4 border-[#087E8B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="minimal-text">Loading Rocha...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Instead of returning null (blank screen), redirect to login
    // This ensures user sees something rather than blank page
    return (
      <div className="mobile-app mobile-safe-area flex items-center justify-center animate-fade-in" style={{ backgroundColor: '#252526' }}>
        <div className="text-center">
          <p className="minimal-text mb-4">Please log in to continue</p>
          <button
            onClick={() => navigate('/')}
            className="mobile-btn-primary"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
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
        <div className="px-4 py-4 border-b" style={{ borderColor: 'var(--divider-color)' }}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyPress={handleKeyPress}
              placeholder="Search communities..."
              className="minimal-input w-full pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {/* Search All Communities Button - Only show when search is active */}
          {isSearchActive && (
            <button
              onClick={handleSearchAllCommunities}
              className="mobile-btn-primary w-full mt-3 flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span className="font-medium">Search all communities</span>
            </button>
          )}
        </div>

        {/* Communities Section */}
        <div className="mobile-drawer-nav">
          <div className="flex flex-col h-full">
            {/* Create Community Button - Always at top */}
            <button
              onClick={() => {
                navigate('/community/new');
                closeDrawer();
              }}
              onMouseDown={createRipple}
              className={`mobile-drawer-item ripple-effect w-full flex-shrink-0 ${
                location.pathname === '/community/new'
                  ? 'active'
                  : ''
              }`}
            >
              <PlusCircle className="mobile-drawer-icon" />
              <span className="mobile-drawer-text">Create Community</span>
            </button>

            {/* Explore Communities Button */}
            <button
              onClick={navigateToJoinCommunity}
              onMouseDown={createRipple}
              className={`mobile-drawer-item ripple-effect w-full flex-shrink-0 ${
                location.pathname === '/communities'
                  ? 'active'
                  : ''
              }`}
            >
              <Compass className="mobile-drawer-icon" />
              <span className="mobile-drawer-text">Explore Communities</span>
            </button>

            {/* Communities List - Takes remaining space */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {communitiesLoading ? (
                <ListSkeleton variant="community" count={3} />
              ) : communities.length > 0 ? (
                <div className="space-y-1">
                  {communities.map((community) => (
                    <button
                      key={community.id}
                      onClick={() => navigateToCommunity(community.id)}
                      onMouseDown={createRipple}
                      className={`mobile-drawer-item ripple-effect w-full ${
                        currentCommunityId === community.id
                          ? 'active'
                          : ''
                      } ${
                        community.hasNewPosts && currentCommunityId !== community.id
                          ? 'ring-1 ring-[#087E8B]/50'
                          : ''
                      }`}
                      style={
                        community.hasNewPosts && currentCommunityId !== community.id
                          ? { backgroundColor: 'var(--accent-primary-lighter)' }
                          : {}
                      }
                    >
                      <Users className="mobile-drawer-icon" />
                      <span className="mobile-drawer-text truncate">
                        {community.name}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Users className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No communities yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="mobile-drawer-footer">
          {/* Admin Panel - Only show if user is admin */}
          {isAdmin && (
            <button
              onClick={() => navigateToPage('admin')}
              onMouseDown={createRipple}
              className={`mobile-drawer-item ripple-effect ${
                currentPage === 'admin' 
                  ? 'active'
                  : ''
              }`}
            >
              <Shield className="mobile-drawer-icon" />
              <span className="mobile-drawer-text">Admin Panel</span>
            </button>
          )}
          <button
            onClick={() => {
              toggleTheme();
              closeDrawer();
            }}
            onMouseDown={createRipple}
            className="mobile-drawer-item ripple-effect"
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? (
              <Sun className="mobile-drawer-icon" />
            ) : (
              <Moon className="mobile-drawer-icon" />
            )}
            <span className="mobile-drawer-text">
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>
          <button
            onClick={handleLogout}
            onMouseDown={createRipple}
            className="mobile-drawer-item ripple-effect text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200"
          >
            <LogOut className="mobile-drawer-icon" />
            <span className="mobile-drawer-text">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`mobile-content ${currentPage === 'chat' ? 'mobile-content-chat' : 'mobile-content-with-cards'}`}>
          {children}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
