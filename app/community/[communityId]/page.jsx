
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { Users, MessageCircle, Plus, MessageSquare, Clock, X, ThumbsUp, MapPin, UserPlus, TrendingUp, Calendar, Settings, ArrowLeft, Shield, Info, MoreHorizontal, RefreshCw, Heart, Flag, AlertTriangle, UserMinus } from 'lucide-react';
import SidebarLayout from '../../components/SidebarLayout';
import ReportCommunityModal from '../../components/ReportCommunityModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import PostCard from '../../components/PostCard';
import { EmptyPosts, EmptyEvents, EmptyMembers } from '../../components/EmptyState';
import EventCard from '../../components/EventCard';
import SimpleEventCard from '../../components/SimpleEventCard';
import CreatePostModal from '../../components/CreatePostModal';
import CreateEventModal from '../../components/CreateEventModal';
import MembersList from '../../components/MembersList';
import CalendarView from '../../components/CalendarView';
import { useNavigate, useParams } from 'react-router-dom';
import { getActualMemberCount, updateLastViewedAt } from '../../../lib/community-utils';
import ListSkeleton from '../../components/ListSkeleton';

export default function CommunityPage() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventRSVPs, setEventRSVPs] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [showEditPostModal, setShowEditPostModal] = useState(false);
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [likingPost, setLikingPost] = useState(null);
  const [rsvpingEvent, setRsvpingEvent] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [eventSearchTerm, setEventSearchTerm] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [creator, setCreator] = useState(null);
  const [moderators, setModerators] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const params = useParams();
  const communityId = params.communityId;

  const tabs = [
    { id: 'posts', label: 'Forum', icon: MessageCircle },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'about', label: 'About', icon: Info }
  ];

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        checkMembership(user.id);
        checkAdminStatus(user.id);
        // Load user profile for display name
        const { data: profile } = await supabase
          .from('profiles')
          .select('nickname, full_name')
          .eq('id', user.id)
          .single();
        if (profile) {
          setUserProfile(profile);
        }
      }
    };
    getUser();
    loadCommunity();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId]);

  // Track last visited community and update last_viewed_at
  useEffect(() => {
    if (communityId && user?.id) {
      localStorage.setItem('lastVisitedCommunity', communityId);
      // Update last_viewed_at when user visits the community
      updateLastViewedAt(communityId, user.id);
    }
  }, [communityId, user?.id]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const loadCommunity = async (retryCount = 0) => {
    try {
      setLoading(true);
      
      const { data: communityData, error } = await supabase
        .from('communities')
        .select(`
          *,
          gyms (
            name,
            city,
            country,
            address,
            description
          )
        `)
        .eq('id', communityId)
        .single();

      if (error) {
        // If community not found and we haven't retried, wait and retry once
        // This handles race condition when navigating immediately after creation
        if (error.code === 'PGRST116' && retryCount < 1) {
          console.log('Community not found yet, retrying...');
          setTimeout(() => {
            loadCommunity(retryCount + 1);
          }, 1000);
          return;
        }
        console.error('Error fetching community:', error);
        navigate('/communities');
        return;
      }

      if (!communityData) {
        // Retry once if data is null (might be a timing issue)
        if (retryCount < 1) {
          setTimeout(() => {
            loadCommunity(retryCount + 1);
          }, 1000);
          return;
        }
        navigate('/communities');
        return;
      }

      // Get actual member count to ensure accuracy
      const actualMemberCount = await getActualMemberCount(communityData.id);
      setCommunity({ ...communityData, member_count: actualMemberCount });
      
      // Load creator (first member)
      try {
        const { data: membersData } = await supabase
          .from('community_members')
          .select('user_id, joined_at, role')
          .eq('community_id', communityData.id)
          .order('joined_at', { ascending: true })
          .limit(1);
        
        if (membersData && membersData.length > 0) {
          const firstMember = membersData[0];
          // Fetch profile separately to avoid RLS issues
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, nickname')
            .eq('id', firstMember.user_id)
            .single();
          
          setCreator({
            name: profile?.nickname || profile?.full_name || 'Unknown',
            joinedAt: firstMember.joined_at
          });
        }
      } catch (error) {
        console.error('Error loading creator:', error);
      }
      
      loadPosts(communityData.id);
      loadEvents(communityData.id);
      loadModerators(communityData.id);
      
      // Update last_viewed_at when community loads successfully
      if (user?.id) {
        updateLastViewedAt(communityData.id, user.id);
      }
    } catch (error) {
      console.error('Error loading community:', error);
      // Only redirect on final retry
      if (retryCount >= 1) {
      navigate('/communities');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async (commId) => {
    try {
      console.log('🔄 Loading posts for community:', commId);
      
      // First try with profiles join
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!user_id (
            nickname,
            full_name,
            avatar_url
          )
        `)
        .eq('community_id', commId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading posts with profiles join:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Fallback: try without profiles join
        console.log('🔄 Trying fallback query without profiles join...');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('posts')
          .select('*')
          .eq('community_id', commId)
          .order('created_at', { ascending: false });
          
        if (fallbackError) {
          console.error('❌ Fallback query also failed:', fallbackError);
          setPosts([]);
          return;
        }
        
        console.log('✅ Fallback query succeeded, loaded posts without profiles');
        setPosts(fallbackData || []);
        return;
      }

      console.log('✅ Loaded posts with profiles join:', postsData?.length || 0);
      postsData?.forEach((post, index) => {
        console.log(`📝 Post ${index} (${post.id}):`, {
          title: post.title,
          user_name: post.user_name,
          profile_nickname: post.profiles?.nickname,
          hasMediaFiles: !!post.media_files,
          mediaFilesType: typeof post.media_files,
          mediaFilesLength: post.media_files?.length
        });
      });

      setPosts(postsData || []);
    } catch (error) {
      console.error('❌ Unexpected error loading posts:', error);
      setPosts([]);
    }
  };

  const loadEvents = async (commId) => {
    try {
      const { data: eventsData, error } = await supabase
        .from('events')
        .select('*')
        .eq('community_id', commId)
        .order('event_date', { ascending: true });

      if (error) {
        console.error('Error loading events:', error);
        return;
      }

      setEvents(eventsData || []);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadModerators = async (commId) => {
    try {
      const { data: membersData, error } = await supabase
        .from('community_members')
        .select(`
          *,
          profiles (
            id,
            nickname,
            full_name,
            avatar_url,
            handle
          )
        `)
        .eq('community_id', commId)
        .in('role', ['moderator', 'admin']);

      if (error) {
        console.error('Error loading moderators:', error);
        return;
      }

      setModerators(membersData || []);
    } catch (error) {
      console.error('Error loading moderators:', error);
    }
  };

  const checkMembership = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('community_members')
        .select('id')
        .eq('community_id', communityId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking membership:', error);
        return;
      }

      setIsMember(!!data);
    } catch (error) {
      console.error('Error checking membership:', error);
    }
  };

  const checkAdminStatus = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error checking admin status:', error);
        return;
      }
      setIsAdmin(data?.is_admin || false);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const handleJoinCommunity = async () => {
    if (!user) return;

    setJoining(true);
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

      setIsMember(true);
      setCommunity(prev => ({ ...prev, member_count: (prev.member_count || 0) + 1 }));
      // Show welcome modal instead of success message
      setShowWelcomeModal(true);
    } catch (error) {
      console.error('Error joining community:', error);
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveCommunity = async () => {
    if (!user) return;

    setLeaving(true);
    try {
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error leaving community:', error);
        showToast('error', 'Error', 'Failed to leave community');
        return;
      }

      setIsMember(false);
      setCommunity(prev => ({ ...prev, member_count: Math.max(0, (prev.member_count || 0) - 1) }));
      showToast('success', 'Success', 'You have left the community');
      
      // Redirect to communities page after leaving
      setTimeout(() => {
        navigate('/communities');
      }, 1500);
    } catch (error) {
      console.error('Error leaving community:', error);
      showToast('error', 'Error', 'Something went wrong');
    } finally {
      setLeaving(false);
    }
  };

  const handleReportCommunity = () => {
    setShowReportModal(true);
  };

  const handleReportModalClose = (success) => {
    setShowReportModal(false);
    if (success) {
      setShowSuccessMessage(true);
      setSuccessMessage('Thank you for reporting. Admins will review this community.');
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
  };


  const handleDeletePost = async (postId) => {
    if (!user) return;

    try {
      let query = supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      }

      const { error } = await query;

      if (error) {
        console.error('Error deleting post:', error);
        return;
      }
      await loadPosts(communityId);
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleLikePost = async (postId) => {
    if (!user) return;

    setLikingPost(postId);
    try {
      const isLiked = likedPosts.has(postId);
      
      if (isLiked) {
        // Remove like
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error removing like:', error);
          return;
        }

        setLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });

        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, like_count: Math.max(0, post.like_count - 1) }
            : post
        ));
      } else {
        // Add like
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        if (error) {
          console.error('Error adding like:', error);
          return;
        }

        setLikedPosts(prev => new Set([...prev, postId]));
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, like_count: post.like_count + 1 }
            : post
        ));

        // Create notification for post author (if not the current user)
        const likedPost = posts.find(p => p.id === postId);
        if (likedPost && likedPost.user_id !== user.id) {
          try {
            await supabase
              .from('notifications')
              .insert({
                user_id: likedPost.user_id,
                type: 'post_like',
                title: 'New Like',
                message: `${user.user_metadata?.full_name || 'Someone'} liked your post`,
                data: { post_id: postId, liker_id: user.id, community_id: communityId }
              });
          } catch (notifError) {
            console.error('Error creating like notification:', notifError);
          }
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLikingPost(null);
    }
  };

  const handleCreatePost = async (postData) => {
    try {
      
      const { data, error } = await supabase
        .from('posts')
        .insert({
          title: postData.title,
          content: postData.content,
          community_id: communityId,
          user_id: user.id,
          post_type: postData.post_type || 'post',
          tag: postData.tag || 'general',
          media_files: postData.media_files || []
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating post:', error);
        throw error;
      }


      // Add the new post to the beginning of the posts array
      setPosts(prev => [data, ...prev]);
      
      // Update community member count if this is the first post
      if (posts.length === 0) {
        setCommunity(prev => ({ ...prev, member_count: (prev.member_count || 0) + 1 }));
      }

      return data;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  };

  const handleUpdatePost = async (postId, postData) => {
    if (!user) return;

    try {
      // Only allow owners to update their posts (admins cannot edit)
      const { data: updated, error } = await supabase
        .from('posts')
        .update({
          title: postData.title,
          content: postData.content,
          tag: postData.tag,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .eq('user_id', user.id) // Only owner can update
        .select()
        .single();

      if (error) {
        console.error('Error updating post:', error);
        throw error;
      }

      if (updated) {
        // Update the post in the local state
        setPosts(prev => prev.map(p => p.id === postId ? updated : p));
      }
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  };

  const handleCreateEvent = async (eventData) => {
    try {
      console.log('🎉 Creating event with data:', eventData);
      
      const { data, error } = await supabase
        .from('events')
        .insert({
          title: eventData.title,
          description: eventData.description,
          event_date: eventData.event_date,
          location: eventData.location,
          event_type: eventData.event_type,
          max_participants: eventData.max_participants,
          community_id: communityId,
          created_by: user?.id,
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error creating event:', error);
        throw error;
      }

      console.log('✅ Event created successfully:', data);
      
      // Refresh events if we're on the events tab
      if (activeTab === 'events') {
        loadEvents(communityId);
      }

      return data;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadPosts(communityId),
        loadEvents(communityId)
      ]);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'posts':
        return (
          <div className="space-y-4">
            {/* Posts Feed */}
            <div className="post-feed" style={{ marginLeft: 'calc(-1 * var(--container-padding-mobile))', marginRight: 'calc(-1 * var(--container-padding-mobile))' }}>
              {/* Create Post Button */}
              {(isMember || isAdmin) && (
                <div style={{ marginLeft: 'var(--container-padding-mobile)', marginRight: 'var(--container-padding-mobile)', marginBottom: '16px' }}>
                  <button
                    onClick={() => setShowNewPostModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-full text-gray-300 hover:bg-gray-800 hover:border-gray-600 hover:text-white transition-all duration-200"
                  >
                    <Plus className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-medium">Create post</span>
                  </button>
                </div>
              )}
              {posts.length === 0 ? (
                <EmptyPosts
                  onCreateClick={() => setShowNewPostModal(true)}
                  isMember={isMember || isAdmin}
                />
              ) : (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={user?.id}
                    isAdmin={isAdmin}
                    onLike={handleLikePost}
                    onDelete={handleDeletePost}
                    onEdit={(post) => {
                      setEditingPost(post);
                      setShowEditPostModal(true);
                    }}
                    onOpen={(post) => {
                      navigate(`/community/${communityId}/post/${post.id}`);
                    }}
                    isLiked={likedPosts.has(post.id)}
                    isLiking={likingPost === post.id}
                    showActions={true}
                  />
                ))
              )}
            </div>
          </div>
        );

      case 'members':
        return (
          <div className="space-y-4">
            <MembersList communityId={communityId} isAdmin={isAdmin} />
          </div>
        );

      case 'calendar':
        return (
          <div className="space-y-4">
            {/* Search and Create Event */}
            <div className="flex gap-3 items-center">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search events..."
                  value={eventSearchTerm}
                  onChange={(e) => setEventSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-[#087E8B]"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <path d="m21 21-4.34-4.34"></path>
                    <circle cx="11" cy="11" r="8"></circle>
                  </svg>
                </div>
              </div>
              
              {/* Create Event Button */}
              {(isMember || isAdmin) && (
                <button
                  onClick={() => setShowNewEventModal(true)}
                  className="mobile-btn-secondary minimal-flex gap-2 text-sm px-4 py-2"
                >
                  <Plus className="minimal-icon w-4 h-4" />
                  Create Event
                </button>
              )}
            </div>
            
            <CalendarView 
              communityId={communityId} 
              userId={user?.id} 
              searchTerm={eventSearchTerm}
              isMember={isMember || isAdmin}
              onCreateClick={() => setShowNewEventModal(true)}
            />
          </div>
        );

      case 'about':
        return (
          <div className="space-y-6">
            {/* Description */}
            <div className="animate-slide-up">
              <h4 className="minimal-heading mb-3 minimal-flex">
                <Info className="minimal-icon mr-2 text-[#087E8B]" />
                About This Community
              </h4>
              <p className="mobile-text-sm text-gray-300 leading-relaxed mb-4">
                {community?.description || 'No description available.'}
              </p>
              
              {community?.rules && (
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-white mb-2">Community Rules</h5>
                  <p className="mobile-text-sm text-gray-300 leading-relaxed">
                    {community.rules}
                  </p>
                </div>
              )}
            </div>

            {/* Gym Connection */}
            {community?.gyms && (
              <div className="animate-slide-up">
                <h4 className="minimal-heading mb-3 minimal-flex">
                  <MapPin className="minimal-icon mr-2 text-[#087E8B]" />
                  Location
                </h4>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-200">{community.gyms.name}</p>
                  <p className="text-sm text-gray-300">{community.gyms.city}, {community.gyms.country}</p>
                  {community.gyms.address && (
                    <p className="text-sm text-gray-400">{community.gyms.address}</p>
                  )}
                  {community.gyms.description && (
                    <p className="text-sm text-gray-300 mt-2">{community.gyms.description}</p>
                  )}
                </div>
              </div>
            )}

            {/* Moderators List */}
            <div className="animate-slide-up">
              <h4 className="minimal-heading mb-4 minimal-flex">
                <Shield className="minimal-icon mr-2 text-[#087E8B]" />
                Moderators
              </h4>
              {moderators.length === 0 ? (
                <p className="text-sm text-gray-400">No moderators assigned.</p>
              ) : (
                <div className="space-y-2">
                  {moderators.map((moderator) => {
                    const profile = moderator.profiles;
                    const displayName = profile?.nickname || profile?.full_name || 'Unknown';
                    return (
                      <div
                        key={moderator.id}
                        className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg"
                      >
                        {profile?.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt={displayName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-[#087E8B] rounded-full flex items-center justify-center text-white font-medium text-sm">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-white truncate">{displayName}</p>
                            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-300">
                              {moderator.role === 'admin' ? 'Admin' : 'Moderator'}
                            </span>
                          </div>
                          {profile?.handle && (
                            <p className="text-sm text-gray-400 truncate">@{profile.handle}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <SidebarLayout currentPage="community">
        <div className="mobile-container">
          <div className="mobile-section">
            <ListSkeleton variant="post" count={3} />
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (!community) {
    return (
      <SidebarLayout currentPage="community">
        <div className="mobile-container">
          <div className="mobile-section">
            <div className="mobile-card">
              <div className="minimal-flex-center py-8">
                <div className="text-center">
                  <Users className="minimal-icon mx-auto mb-2 text-gray-500" />
                  <p className="mobile-text-sm">Community not found</p>
                  <button 
                    onClick={() => navigate('/communities')}
                    className="mobile-btn-primary mt-4"
                  >
                    Back to Communities
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout currentPage="community">
      <div className="mobile-container">
        <div className="mobile-section">
          {/* Community Header */}
          <div className="mb-1 animate-fade-in pt-4">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-white mb-2">{community?.name}</h1>
                <div className="flex flex-col gap-1 text-sm text-gray-400 mb-3">
                  {community?.gyms && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="text-gray-300">{community.gyms.name}</span>
                      {community.gyms.city && (
                        <span className="text-gray-400">• {community.gyms.city}</span>
                      )}
                    </div>
                  )}
                  {creator && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 flex-shrink-0" />
                      <span>Created by <span className="text-gray-300">{creator.name}</span></span>
                      {community?.created_at && (
                        <span className="text-gray-400">
                          • {new Date(community.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tab Buttons, Join/Joined Button and Menu */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
              {/* Join/Leave Button */}
              {!isMember ? (
                <button
                  onClick={handleJoinCommunity}
                  disabled={joining}
                  className="px-2.5 py-1 text-sm rounded-full border-2 border-[#087E8B] text-[#087E8B] hover:bg-[#087E8B] hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0"
                >
                  {joining ? 'Joining...' : 'Join'}
                </button>
              ) : (
                <button
                  onClick={handleLeaveCommunity}
                  className="px-2.5 py-1 text-sm rounded-full bg-[#087E8B] text-white hover:bg-[#066a75] transition-all duration-200 whitespace-nowrap flex-shrink-0"
                >
                  Joined
                </button>
              )}

              {/* Scrollable Tab Buttons */}
              <div className="flex items-center gap-1 min-w-max">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-all duration-200
                        ${activeTab === tab.id
                          ? 'bg-[#087E8B] text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
                        }
                      `}
                    >
                      {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Three-dot menu */}
              <div className="relative flex-shrink-0" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                
                {showMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        handleReportCommunity();
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2 transition-colors"
                    >
                      <Flag className="w-4 h-4" />
                      Report Community
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Success Message */}
          {showSuccessMessage && (
            <div className="animate-slide-up mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="minimal-flex-center">
                <p className="text-green-400 text-sm font-medium">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Tab Content */}
          <div className="animate-slide-up">
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showNewPostModal && (
        <CreatePostModal
          communityId={communityId}
          onClose={() => setShowNewPostModal(false)}
          onSubmit={async (postData) => {
            await handleCreatePost(postData);
            setShowNewPostModal(false);
          }}
          communityName={community?.name || 'Community'}
          userName={user?.user_metadata?.full_name || 'User'}
        />
      )}

      {showEditPostModal && editingPost && (
        <CreatePostModal
          communityId={communityId}
          editMode={true}
          initialData={editingPost}
          onClose={() => {
            setShowEditPostModal(false);
            setEditingPost(null);
          }}
          onSubmit={async (postData) => {
            await handleUpdatePost(editingPost.id, postData);
            setShowEditPostModal(false);
            setEditingPost(null);
          }}
          communityName={community?.name || 'Community'}
          userName={user?.user_metadata?.full_name || 'User'}
        />
      )}

      {showNewEventModal && (
        <CreateEventModal
          communityId={communityId}
          onClose={() => setShowNewEventModal(false)}
          onSubmit={async (eventData) => {
            await handleCreateEvent(eventData);
            setShowNewEventModal(false);
          }}
        />
      )}

      {showReportModal && (
        <ReportCommunityModal
          isOpen={showReportModal}
          onClose={handleReportModalClose}
          communityId={communityId}
          communityName={community?.name || 'Community'}
        />
      )}


      {/* Welcome Modal - Slides up from bottom */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pointer-events-none">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto"
            onClick={() => setShowWelcomeModal(false)}
            style={{ animation: 'fadeIn 0.3s ease-out' }}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-md bg-slate-800 rounded-t-3xl rounded-b-3xl shadow-2xl border border-slate-700 pointer-events-auto animate-slide-up-from-bottom">
            <div className="p-6">
              {/* Welcome Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[#087E8B] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-1xl font-bold text-white mb-2">
                  Welcome {(() => {
                    const displayName = userProfile?.nickname || userProfile?.full_name || user?.user_metadata?.full_name;
                    return displayName || 'to the Community';
                  })()}!
                </h2>
                <p className="text-slate-400 text-sm">
                  You're now part of the community. Get started below.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pb-6">
                {/* Create Post Button */}
                <button
                  onClick={() => {
                    setShowWelcomeModal(false);
                    setShowNewPostModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#087E8B] hover:bg-[#066a75] text-white rounded-xl transition-colors font-medium"
                >
                  <MessageSquare className="w-5 h-5" />
                  Create post
                </button>

                {/* Community Rules Button */}
                <button
                  onClick={() => {
                    setShowWelcomeModal(false);
                    setShowRulesModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors font-medium border border-slate-600"
                >
                  <Shield className="w-5 h-5" />
                  Community rules
                </button>

                {/* Skip Button */}
                <button
                  onClick={() => setShowWelcomeModal(false)}
                  className="w-full px-4 py-3 text-slate-400 hover:text-white rounded-xl transition-colors font-medium"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Community Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setShowRulesModal(false)}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-lg bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 max-h-[80vh] overflow-hidden transform transition-all duration-300 animate-slide-up">
            <div className="p-6 overflow-y-auto max-h-[80vh]">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#087E8B] rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Community Rules
                  </h2>
                </div>
                <button
                  onClick={() => setShowRulesModal(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Rules Content */}
              <div className="text-slate-300 whitespace-pre-wrap">
                {community?.rules ? (
                  <p className="text-sm leading-relaxed">{community.rules}</p>
                ) : (
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">
                      No specific rules have been set for this community yet.
                    </p>
                    <p className="text-slate-500 text-xs mt-2">
                      Please be respectful and follow general community guidelines.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-slate-700">
                <button
                  onClick={() => setShowRulesModal(false)}
                  className="w-full px-4 py-2 bg-[#087E8B] hover:bg-[#066a75] text-white rounded-lg transition-colors font-medium"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}