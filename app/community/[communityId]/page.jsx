
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Users, MessageCircle, Plus, MessageSquare, Clock, X, ThumbsUp, MapPin, UserPlus, TrendingUp, Calendar, Settings, ArrowLeft, Shield, Info, MoreHorizontal, RefreshCw, Heart } from 'lucide-react';
import SidebarLayout from '../../components/SidebarLayout';
import TabNavigation from '../../components/TabNavigation';
import PostCard from '../../components/PostCard';
import EventCard from '../../components/EventCard';
import SimpleEventCard from '../../components/SimpleEventCard';
import CreatePostModal from '../../components/CreatePostModal';
import CreateEventModal from '../../components/CreateEventModal';
import MembersList from '../../components/MembersList';
import CalendarView from '../../components/CalendarView';
import { useNavigate, useParams } from 'react-router-dom';

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
  const [showMenu, setShowMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [eventSearchTerm, setEventSearchTerm] = useState('');
  const navigate = useNavigate();
  const params = useParams();
  const communityId = params.communityId;

  const tabs = [
    { id: 'posts', label: 'Posts', icon: MessageCircle },
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
      }
    };
    getUser();
    loadCommunity();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId]);

  // Track last visited community
  useEffect(() => {
    if (communityId) {
      localStorage.setItem('lastVisitedCommunity', communityId);
    }
  }, [communityId]);

  const loadCommunity = async () => {
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
        console.error('Error fetching community:', error);
        navigate('/communities');
        return;
      }

      if (!communityData) {
        navigate('/communities');
        return;
      }

      setCommunity(communityData);
      loadPosts(communityData.id);
      loadEvents(communityData.id);
    } catch (error) {
      console.error('Error loading community:', error);
      navigate('/communities');
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
      setShowSuccessMessage(true);
      setSuccessMessage('Welcome to the community!');
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Error joining community:', error);
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveCommunity = async () => {
    if (!user) return;

    if (!confirm('Are you sure you want to leave this community? You will no longer be able to see posts or participate in discussions.')) {
      return;
    }

    setLeaving(true);
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

      setIsMember(false);
      setCommunity(prev => ({ ...prev, member_count: Math.max(0, (prev.member_count || 0) - 1) }));
      setShowSuccessMessage(true);
      setSuccessMessage('You have left the community');
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Error leaving community:', error);
    } finally {
      setLeaving(false);
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
            {/* Admin Mode Banner */}
            {isAdmin && (
              <div className="mobile-item mobile-item-divider animate-slide-up">
                <div className="flex items-center justify-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-300 text-sm font-medium">Admin Mode - You can moderate all content</span>
                </div>
              </div>
            )}

            {/* Create Post Form */}
            {isMember && (
              <div className="animate-slide-up mb-4">
                <div 
                  onClick={() => setShowNewPostModal(true)}
                  className="w-full p-4 bg-gray-800 border border-gray-600 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors flex items-center gap-3"
                >
                  {/* User Avatar */}
                  <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                    {user?.user_metadata?.full_name ? user.user_metadata.full_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  
                  {/* Write something text */}
                  <div className="text-gray-400 text-sm flex-1">
                    Write something...
                  </div>
                </div>
              </div>
            )}

            {/* Posts Feed */}
            <div className="space-y-2">
              {posts.length === 0 ? (
                <div className="mobile-card">
                  <div className="minimal-flex-center py-12">
                    <div className="text-center">
                      <MessageCircle className="minimal-icon mx-auto mb-4 text-gray-500 text-4xl" />
                      <p className="mobile-text-sm text-gray-400 mb-2">No posts yet</p>
                      <p className="mobile-text-xs text-gray-500">
                        {isMember ? 'Be the first to share something!' : 'Join the community to see posts'}
                      </p>
                    </div>
                  </div>
                </div>
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
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <path d="m21 21-4.34-4.34"></path>
                    <circle cx="11" cy="11" r="8"></circle>
                  </svg>
                </div>
              </div>
              
              {/* Create Event Button */}
              {isMember && (
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
            />
          </div>
        );

      case 'about':
        return (
          <div className="space-y-6">
            {/* Community Info */}
            <div className="mobile-card-flat p-4">
              <h4 className="minimal-heading mb-4 minimal-flex">
                <Info className="minimal-icon mr-2 text-indigo-400" />
                About This Community
              </h4>
              <p className="minimal-text text-sm text-gray-300 leading-relaxed mb-4">
                {community?.description || 'No description available.'}
              </p>
              
              {community?.rules && (
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-white mb-2">Community Rules</h5>
                  <p className="minimal-text text-sm text-gray-300 leading-relaxed">
                    {community.rules}
                  </p>
                </div>
              )}
            </div>

            {/* Gym Connection */}
            {community?.gyms && (
              <div className="mobile-card-flat p-4">
                <h4 className="minimal-heading mb-4 minimal-flex">
                  <MapPin className="minimal-icon mr-2 text-indigo-400" />
                  Connected Gym
                </h4>
                <div className="space-y-2">
                  <h5 className="font-medium text-white">{community.gyms.name}</h5>
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

            {/* Community Stats */}
            <div className="mobile-card-flat p-4">
              <h4 className="minimal-heading mb-4 minimal-flex">
                <TrendingUp className="minimal-icon mr-2 text-indigo-400" />
                Community Stats
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-400">{community?.member_count || 0}</div>
                  <div className="text-sm text-gray-400">Members</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-400">{posts.length}</div>
                  <div className="text-sm text-gray-400">Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-400">{events.length}</div>
                  <div className="text-sm text-gray-400">Events</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-400">
                    {community?.created_at ? new Date(community.created_at).toLocaleDateString() : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-400">Created</div>
                </div>
              </div>
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
            <div className="mobile-card animate-fade-in">
              <div className="minimal-flex-center py-8">
                <div className="minimal-spinner"></div>
                <p className="minimal-text ml-3">Loading community...</p>
              </div>
            </div>
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
    <SidebarLayout currentPage="community" pageTitle={community?.name}>
      <div className="mobile-container">
        <div className="mobile-section">
          {/* Tab Navigation */}
          <div className="animate-slide-up">
            <TabNavigation
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>

          {/* Header */}
          <div className="animate-fade-in mb-6">


            {/* Join Button - Only show for non-members */}
            {!isMember && (
              <div className="mt-4">
                <button
                  onClick={handleJoinCommunity}
                  disabled={joining}
                  className="mobile-btn-primary w-full minimal-flex gap-2 justify-center"
                >
                  {joining ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Joining...
                    </>
                  ) : (
                    <>
                      <UserPlus className="minimal-icon" />
                      Join Community
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Success Message */}
          {showSuccessMessage && (
            <div className="mobile-card animate-slide-up bg-green-500/10 border border-green-500/20">
              <div className="minimal-flex-center py-2">
                <p className="text-green-400 text-sm font-medium">{successMessage}</p>
              </div>
            </div>
          )}


          {/* Tab Content */}
          <div className="mobile-card animate-slide-up">
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

    </SidebarLayout>
  );
}