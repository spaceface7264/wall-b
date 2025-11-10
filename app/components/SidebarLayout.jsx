import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Users, Plus, LogOut, Shield, Search, X, Compass, PlusCircle, Globe, MessageSquare, MapPin, ChevronLeft, LogIn } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { useLoginModal } from '../providers/LoginModalProvider';
import { useToast } from '../providers/ToastProvider';
import BottomNav from './BottomNav';
import FeedbackModal from './FeedbackModal';
import { enrichCommunitiesWithActualCounts, checkForNewPosts, updateLastViewedAt } from '../../lib/community-utils';
import Skeleton from './Skeleton';
import ListSkeleton from './ListSkeleton';

export default function SidebarLayout({ children, currentPage = 'community', pageTitle = null }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [communities, setCommunities] = useState([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Initialize sidebar state from localStorage or default to expanded
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { showLoginModal } = useLoginModal();

  // Define loadUserCommunities BEFORE useEffect to avoid ReferenceError
  // (const functions are NOT hoisted in JavaScript)
  const loadUserCommunities = async (userId, adminStatus = false) => {
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
          .select('id, name, description, member_count, is_private')
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
            is_active,
            is_private,
            gym_id,
            gyms (
              id,
              name,
              city
            )
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
      // Filter out suspended communities for non-admins
      // Admins can see all communities including suspended ones
      const activeCommunities = adminStatus 
        ? communitiesList 
        : communitiesList.filter(c => c.is_active !== false);
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

  // Ensure dark mode is always applied
  useEffect(() => {
    const root = document.documentElement;
    root.removeAttribute('data-theme'); // Default is dark
    // Clear any light theme from localStorage
    localStorage.removeItem('theme');
  }, []); // Run only on mount

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const newState = !prev;
      localStorage.setItem('sidebarCollapsed', String(newState));
      return newState;
    });
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
              loadUserCommunities(user.id, profile?.is_admin || false);
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
                loadUserCommunities(session.user.id, profile?.is_admin || false);
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

  // Reload communities when admin status changes
  useEffect(() => {
    if (user?.id) {
      loadUserCommunities(user.id, isAdmin);
    }
  }, [isAdmin]);

  // Listen for community join/leave events to update drawer immediately
  useEffect(() => {
    const handleCommunityChange = () => {
      if (user?.id) {
        console.log('🔄 Community changed, reloading drawer communities...');
        loadUserCommunities(user.id, isAdmin);
      }
    };

    // Listen for custom events when communities are joined/left
    window.addEventListener('communityJoined', handleCommunityChange);
    window.addEventListener('communityLeft', handleCommunityChange);

    return () => {
      window.removeEventListener('communityJoined', handleCommunityChange);
      window.removeEventListener('communityLeft', handleCommunityChange);
    };
  }, [user?.id, isAdmin]);

  useEffect(() => {
    // Only redirect to login if we're not already on the login page
    // and only after loading is complete and user is confirmed null
    // Add a delay to allow auth state to settle after navigation
    if (location.pathname === '/' || location.pathname === '/login') {
      return; // Don't redirect if already on login page
    }

    const timer = setTimeout(() => {
      // Allow viewing community pages with invite links without authentication
      const isInviteLink = location.search.includes('invite=true');
      const isCommunityPage = location.pathname.startsWith('/community/') && !location.pathname.includes('/new');
      
      // Removed redirect - let users browse read-only pages
      // Only block access to pages that truly require auth (chat, create community, etc.)
    }, 500); // Increased delay to allow auth state to settle

    return () => clearTimeout(timer);
  }, [loading, user, navigate, location.pathname, location.search]);

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

  const handleUniversalSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      closeDrawer();
      setSearchQuery('');
      setIsSearchActive(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleUniversalSearch();
    }
  };


  if (loading) {
    return (
      <div className="mobile-app mobile-safe-area flex items-center justify-center animate-fade-in" style={{ backgroundColor: '#252526' }}>
        <div className="text-center animate-bounce-in">
          <div className="w-8 h-8 border-4 border-[#3B83F6] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="minimal-text">Loading Send Train...</p>
        </div>
      </div>
    );
  }

  // Allow read-only browsing for unauthenticated users
  // They can view: communities, community pages, gyms, profiles, posts
  // But cannot: join, post, comment, like, message, etc.
  const isPublicReadOnlyPage = 
    location.pathname.startsWith('/communities') ||
    location.pathname.startsWith('/community/') && !location.pathname.includes('/new') && !location.pathname.includes('/settings') ||
    location.pathname.startsWith('/gyms/') ||
    location.pathname === '/gyms' ||
    location.pathname.startsWith('/profile/') ||
    location.pathname === '/home' ||
    location.pathname === '/search';

  if (!user && !isPublicReadOnlyPage) {
    // Block access to pages that require authentication (chat, create community, etc.)
    return (
      <div className="mobile-app mobile-safe-area flex items-center justify-center animate-fade-in" style={{ backgroundColor: '#252526' }}>
        <div className="text-center">
          <p className="minimal-text mb-4">Please log in to continue</p>
          <button
            onClick={() => showLoginModal()}
            className="mobile-btn-primary"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Header - Outside safe-area */}
      <div className="mobile-header mobile-only">
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
          {user ? (
            <NotificationBell userId={user.id} />
          ) : (
          <button
            onClick={() => showLoginModal()}
            className="mobile-btn-secondary text-xs px-1 py-1.5 whitespace-nowrap"
          >
            Sign In
          </button>
          )}
        </div>
      </div>

      <div className="mobile-app mobile-safe-area">

      {/* Drawer Overlay - Mobile Only */}
      {drawerOpen && (
        <div 
          className="mobile-drawer-overlay open mobile-only"
          onClick={closeDrawer}
        />
      )}

      {/* Drawer - Mobile: Sliding drawer, Desktop: Persistent sidebar */}
      <div className={`mobile-drawer desktop-sidebar ${drawerOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`} style={{ overflowX: 'hidden' }}>
        {/* Collapse Toggle Button - Desktop Only */}
        <button
          onClick={toggleSidebar}
          className="desktop-sidebar-toggle desktop-only"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className={`w-5 h-5 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
        </button>

        {/* Logo Section - Desktop Only */}
        <div className="sidebar-logo-section desktop-only">
          {!sidebarCollapsed ? (
            <div className="sidebar-logo-full">
              <h1 className="sidebar-logo-text">Send Train</h1>
            </div>
          ) : (
            <div className="sidebar-logo-icon">
              <span className="sidebar-logo-letter">S</span>
            </div>
          )}
        </div>

        {/* Search Section */}
        <div className={`sidebar-search-section ${sidebarCollapsed ? 'collapsed' : ''}`} style={{ borderColor: 'var(--divider-color)' }}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyPress={handleKeyPress}
              placeholder="Search everything..."
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
          
          {/* Universal Search Button - Only show when search is active */}
          {isSearchActive && (
            <button
              onClick={handleUniversalSearch}
              className="mobile-btn-primary w-full mt-3 flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span className="font-medium">Search everything</span>
            </button>
          )}
          
          {/* Desktop collapsed search icon - hidden on mobile and when not collapsed */}
          <button
            onClick={() => {
              if (sidebarCollapsed) {
                toggleSidebar(); // Expand sidebar when collapsed
                // Focus search input after sidebar expands
                setTimeout(() => {
                  const searchInput = document.querySelector('.sidebar-search-section input');
                  if (searchInput) {
                    searchInput.focus();
                  }
                }, 100);
              } else if (searchQuery.trim()) {
                handleUniversalSearch();
              } else {
                // Focus search input if sidebar is already expanded
                const searchInput = document.querySelector('.sidebar-search-section input');
                if (searchInput) {
                  searchInput.focus();
                }
              }
            }}
            className="sidebar-icon-button desktop-only"
            title="Search everything"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>

        {/* Communities Section */}
        <div className="mobile-drawer-nav">
          <div className="flex flex-col h-full">
            {!user ? null : (
              <>
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
                
                {/* Desktop collapsed icon version */}
                <button
                  onClick={() => {
                    navigate('/community/new');
                    closeDrawer();
                  }}
                  onMouseDown={createRipple}
                  className={`sidebar-icon-button desktop-only ${location.pathname === '/community/new' ? 'active' : ''}`}
                  title="Create Community"
                >
                  <PlusCircle className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Explore Communities Button - Available to all */}
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
            
            {/* Desktop collapsed icon version */}
            <button
              onClick={navigateToJoinCommunity}
              onMouseDown={createRipple}
              className={`sidebar-icon-button desktop-only ${location.pathname === '/communities' ? 'active' : ''}`}
              title="Explore Communities"
            >
              <Compass className="w-5 h-5" />
            </button>

            {/* Find Gyms Button - Available to all */}
            <button
              onClick={() => {
                navigate('/gyms');
                closeDrawer();
              }}
              onMouseDown={createRipple}
              className={`mobile-drawer-item ripple-effect w-full flex-shrink-0 ${
                location.pathname === '/gyms' || location.pathname.startsWith('/gyms/')
                  ? 'active'
                  : ''
              }`}
            >
              <MapPin className="mobile-drawer-icon" />
              <span className="mobile-drawer-text">Find Gyms</span>
            </button>
            
            {/* Desktop collapsed icon version */}
            <button
              onClick={() => {
                navigate('/gyms');
                closeDrawer();
              }}
              onMouseDown={createRipple}
              className={`sidebar-icon-button desktop-only ${location.pathname === '/gyms' || location.pathname.startsWith('/gyms/') ? 'active' : ''}`}
              title="Find Gyms"
            >
              <MapPin className="w-5 h-5" />
            </button>

            {/* Communities List - Only show if user is authenticated */}
            {user && (
              <div className={`flex-1 overflow-y-auto overflow-x-hidden min-h-0 ${sidebarCollapsed ? 'collapsed' : ''}`}>
              {communitiesLoading ? (
                <ListSkeleton variant="community" count={3} />
              ) : communities.length > 0 ? (
                <div className="space-y-1">
                  {communities.map((community) => {
                    // Get gym data - Supabase returns nested relations as arrays
                    const gymData = community.gyms 
                      ? (Array.isArray(community.gyms) ? community.gyms[0] : community.gyms)
                      : null;
                    const gym = gymData;
                    
                    return (
                      <>
                        {/* Mobile/Desktop full version */}
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
                            ? 'ring-1 ring-[#3B83F6]/50'
                            : ''
                        }`}
                        style={
                          community.hasNewPosts && currentCommunityId !== community.id
                            ? { backgroundColor: 'var(--accent-primary-lighter)' }
                            : {}
                        }
                      >
                        <Users className="mobile-drawer-icon" />
                        <div className="flex-1 min-w-0 flex flex-col items-start">
                          <span className="mobile-drawer-text truncate w-full text-left block overflow-hidden text-ellipsis whitespace-nowrap">
                            {community.name}
                          </span>
                          {gym && gym.name && (
                            <div className="flex items-center gap-1 mt-0.5 w-full" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{gym.name}</span>
                            </div>
                          )}
                        </div>
                      </button>
                        
                        {/* Desktop collapsed icon version */}
                        <button
                          key={`${community.id}-collapsed`}
                          onClick={() => navigateToCommunity(community.id)}
                          onMouseDown={createRipple}
                          className={`sidebar-icon-button desktop-only ${
                            currentCommunityId === community.id ? 'active' : ''
                          } ${community.hasNewPosts && currentCommunityId !== community.id ? 'has-new-posts' : ''}`}
                          title={community.name}
                          style={
                            community.hasNewPosts && currentCommunityId !== community.id
                              ? { backgroundColor: 'var(--accent-primary-lighter)' }
                              : {}
                          }
                        >
                          <Users className="w-5 h-5" />
                        </button>
                      </>
                    );
                  })}
                </div>
              ) : null}
              </div>
            )}

            {/* Empty state for unauthenticated users */}
            {!user && !sidebarCollapsed && (
              <div className="flex-1 flex items-center justify-center p-4">
                <p className="text-sm text-gray-400 text-center">Sign in to see your communities</p>
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className={`mobile-drawer-footer ${sidebarCollapsed ? 'collapsed' : ''}`}>
          {/* Sign In Button - Show for guests */}
          {!user && (
            <>
              <button
                onClick={() => {
                  showLoginModal();
                  closeDrawer();
                }}
                onMouseDown={createRipple}
                className="mobile-drawer-item ripple-effect w-full"
              >
                <LogIn className="mobile-drawer-icon" />
                <span className="mobile-drawer-text">Sign In</span>
              </button>
              {/* Desktop collapsed icon version */}
              <button
                onClick={() => {
                  showLoginModal();
                  closeDrawer();
                }}
                onMouseDown={createRipple}
                className="sidebar-icon-button desktop-only"
                title="Sign In"
              >
                <LogIn className="w-5 h-5" />
              </button>
            </>
          )}
          
          {/* Admin Panel - Only show if user is admin */}
          {user && isAdmin && (
            <>
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
              {/* Desktop collapsed icon version */}
              <button
                onClick={() => navigateToPage('admin')}
                onMouseDown={createRipple}
                className={`sidebar-icon-button desktop-only ${currentPage === 'admin' ? 'active' : ''}`}
                title="Admin Panel"
              >
                <Shield className="w-5 h-5" />
              </button>
            </>
          )}
          {user && (
            <>
              <button
                onClick={() => {
                  setFeedbackModalOpen(true);
                  closeDrawer();
                }}
                onMouseDown={createRipple}
                className="mobile-drawer-item ripple-effect"
              >
                <MessageSquare className="mobile-drawer-icon" />
                <span className="mobile-drawer-text">Send Feedback</span>
              </button>
              {/* Desktop collapsed icon version */}
              <button
                onClick={() => {
                  setFeedbackModalOpen(true);
                  closeDrawer();
                }}
                onMouseDown={createRipple}
                className="sidebar-icon-button desktop-only"
                title="Send Feedback"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                onMouseDown={createRipple}
                className="mobile-drawer-item ripple-effect text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200"
              >
                <LogOut className="mobile-drawer-icon" />
                <span className="mobile-drawer-text">Logout</span>
              </button>
              {/* Desktop collapsed icon version */}
              <button
                onClick={handleLogout}
                onMouseDown={createRipple}
                className="sidebar-icon-button desktop-only text-red-400 hover:bg-red-500/10 hover:text-red-300"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`mobile-content desktop-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${currentPage === 'chat' ? 'mobile-content-chat' : 'mobile-content-with-cards'}`}>
          {children}
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <div className="mobile-only">
      <BottomNav />
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
      />
    </div>
    </>
  );
}
