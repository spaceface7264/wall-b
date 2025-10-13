'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Users, MessageCircle, Plus, MessageSquare, Clock, X, ThumbsUp, MapPin, UserPlus, TrendingUp, Calendar, Settings, ArrowLeft, RefreshCw } from 'lucide-react';
import SidebarLayout from '../../components/SidebarLayout';
import PostCard from '../../components/PostCard';
import EventCard from '../../components/EventCard';
import SimpleEventCard from '../../components/SimpleEventCard';
import CreatePostModal from '../../components/CreatePostModal';
import CreateEventModal from '../../components/CreateEventModal';
import { useRouter, useParams } from 'next/navigation';
// Removed mock data imports - now using Supabase directly

// Supabase client is now imported from lib/supabase.js

export default function CommunityPage() {
  const [user, setUser] = useState(null);
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventRSVPs, setEventRSVPs] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('feed');
  const [selectedTag, setSelectedTag] = useState('all');
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [showEditPostModal, setShowEditPostModal] = useState(false);
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [joining, setJoining] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [likingPost, setLikingPost] = useState(null);
  const [rsvpingEvent, setRsvpingEvent] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [postTags] = useState([
    { name: 'all', label: 'All', color: '#6b7280' },
    { name: 'beta', label: 'Beta', color: '#ef4444' },
    { name: 'event', label: 'Events', color: '#3b82f6' },
    { name: 'question', label: 'Questions', color: '#10b981' },
    { name: 'gear', label: 'Gear', color: '#f59e0b' },
    { name: 'training', label: 'Training', color: '#8b5cf6' },
    { name: 'social', label: 'Social', color: '#ec4899' },
    { name: 'news', label: 'News', color: '#6b7280' }
  ]);
  const router = useRouter();
  const params = useParams();
  const communityId = params.communityId;

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        checkMembership(user.id);
      }
    };
    getUser();
    loadCommunity();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        router.push('/community');
        return;
      }

      if (!communityData) {
        router.push('/community');
        return;
      }

      setCommunity(communityData);
      loadPosts(communityData.id);
      loadEvents(communityData.id);
    } catch (error) {
      console.error('Error loading community:', error);
      router.push('/community');
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async (commId) => {
    try {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('*')
        .eq('community_id', commId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        setPosts([]);
        return;
      }

      setPosts(postsData || []);

      // Check which posts the user has liked
      if (user) {
        const { data: likes } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', (postsData || []).map(p => p.id));

        const liked = new Set(likes?.map(like => like.post_id) || []);
        setLikedPosts(liked);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      setPosts([]);
    }
  };

  const loadEvents = async (commId) => {
    try {
      const { data: eventsData, error } = await supabase
        .from('events')
        .select('*')
        .eq('community_id', commId)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
        return;
      }

      setEvents(eventsData || []);

      // Load RSVPs for events
      if (user && eventsData && eventsData.length > 0) {
        const { data: rsvpsData } = await supabase
          .from('event_rsvps')
          .select('event_id, status')
          .eq('user_id', user.id)
          .in('event_id', eventsData.map(e => e.id));

        const rsvpMap = new Map();
        rsvpsData?.forEach(rsvp => {
          rsvpMap.set(rsvp.event_id, rsvp.status);
        });
        setEventRSVPs(rsvpMap);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents([]);
    }
  };

  const checkMembership = async (userId) => {
    try {
      const { data: membership, error } = await supabase
        .from('community_members')
        .select('id')
        .eq('user_id', userId)
        .eq('community_id', communityId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking membership:', error);
        return;
      }

      setIsMember(!!membership);
    } catch (error) {
      console.error('Error checking membership:', error);
    }
  };

  const joinCommunity = async () => {
    if (!user) return;

    setJoining(true);
    try {
      const { error } = await supabase
        .from('community_members')
        .insert({
          user_id: user.id,
          community_id: communityId,
          role: 'member',
          joined_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error joining community:', error);
        return;
      }

      setIsMember(true);
      setCommunity(prev => prev ? { ...prev, member_count: prev.member_count + 1 } : null);
    } catch (error) {
      console.error('Error joining community:', error);
    } finally {
      setJoining(false);
    }
  };

  const handleOpenPost = (post) => {
    router.push(`/community/${communityId}/post/${post.id}`);
  };

  const handleCreatePost = async (postData) => {
    if (!user) return;

    try {
      const { data: newPost, error } = await supabase
        .from('posts')
        .insert({
          community_id: communityId,
          user_id: user.id,
          user_name: user.user_metadata?.full_name || user.email || 'Anonymous',
          user_email: user.email,
          title: postData.title,
          content: postData.content,
          tag: postData.tag,
          post_type: postData.post_type || 'post',
          media_files: postData.media_files || [],
          like_count: 0,
          comment_count: 0
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating post:', error);
        return;
      }

      if (newPost) {
        // Add the new post to local state immediately for instant feedback
        setPosts(prev => [newPost, ...prev]);
        
        // Close the modal
        setShowNewPostModal(false);
        
        // Show success message
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
        
        // Also reload posts to ensure consistency with database
        await loadPosts(communityId);
      }
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleCreateEvent = async (eventData) => {
    if (!user) {
      throw new Error('You must be logged in to create events');
    }

    // Ensure we have a valid community ID
    if (!communityId) {
      throw new Error('Invalid community. Please try again.');
    }
    
    // Check if community exists in database
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('id')
      .eq('id', communityId)
      .single();
    
    if (communityError || !community) {
      throw new Error('Community not found. Please try again.');
    }

    try {
      // Create event in Supabase
      const { data: newEvent, error } = await supabase
        .from('events')
        .insert({
          community_id: communityId,
          created_by: user.id,
          title: eventData.title,
          description: eventData.description,
          event_date: eventData.event_date,
          location: eventData.location,
          event_type: eventData.event_type,
          max_participants: eventData.max_participants
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create event: ${error.message}`);
      }

      // Add the event to local state
      setEvents(prev => [newEvent, ...prev]);

      // Reload events to ensure consistency
      await loadEvents(communityId);

    } catch (error) {
      throw error; // Re-throw to be caught by the modal
    }
  };

  const handleEditPost = async (postData) => {
    if (!user || !editingPost) return;

    try {
      const { error } = await supabase
        .from('posts')
        .update({
          title: postData.title,
          content: postData.content,
          tag: postData.tag,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingPost.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating post:', error);
        return;
      }

      // Reload posts
      await loadPosts(communityId);
      setEditingPost(null);
    } catch (error) {
      console.error('Error editing post:', error);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting post:', error);
        return;
      }

      // Reload posts
      await loadPosts(communityId);
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleLikePost = async (postId) => {
    if (!user) return;

    setLikingPost(postId);
    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .single();

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('id', existingLike.id);

        if (!error) {
          // Update local state
          const newLikedPosts = new Set(likedPosts);
          newLikedPosts.delete(postId);
          setLikedPosts(newLikedPosts);

          // Update post like count
          setPosts(posts.map(p => 
            p.id === postId 
              ? { ...p, like_count: Math.max(0, p.like_count - 1) }
              : p
          ));
        }
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            post_id: postId
          });

        if (!error) {
          // Update local state
          const newLikedPosts = new Set(likedPosts);
          newLikedPosts.add(postId);
          setLikedPosts(newLikedPosts);

          // Update post like count
          setPosts(posts.map(p => 
            p.id === postId 
              ? { ...p, like_count: p.like_count + 1 }
              : p
          ));
        }
      }
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setLikingPost(null);
    }
  };

  const handleEventRSVP = async (eventId, currentStatus) => {
    if (!user || rsvpingEvent) return;

    setRsvpingEvent(eventId);
    try {
      // Check if user already has an RSVP
      const { data: existingRSVP } = await supabase
        .from('event_rsvps')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('event_id', eventId)
        .single();

      let newStatus;
      if (currentStatus === 'going') {
        newStatus = 'interested';
      } else if (currentStatus === 'interested') {
        newStatus = 'cant_go';
      } else {
        newStatus = 'going';
      }

      if (existingRSVP) {
        // Update existing RSVP
        const { error } = await supabase
          .from('event_rsvps')
          .update({ status: newStatus })
          .eq('id', existingRSVP.id);

        if (!error) {
          setEventRSVPs(prev => new Map(prev.set(eventId, newStatus)));
        }
      } else {
        // Create new RSVP
        const { error } = await supabase
          .from('event_rsvps')
          .insert({
            user_id: user.id,
            event_id: eventId,
            status: newStatus
          });

        if (!error) {
          setEventRSVPs(prev => new Map(prev.set(eventId, newStatus)));
        }
      }
    } catch (error) {
      console.error('Error updating RSVP:', error);
    } finally {
      setRsvpingEvent(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadPosts(communityId);
      await loadEvents(communityId);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredPosts = posts.filter(post => 
    selectedTag === 'all' || post.tag === selectedTag
  );

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <SidebarLayout currentPage="community">
        <div className="mobile-container">
          <div className="mobile-section">
            <div className="mobile-card">
              <div className="loading-skeleton h-8 w-3/4 mb-4"></div>
              <div className="loading-skeleton h-4 w-1/2 mb-2"></div>
              <div className="loading-skeleton h-20 w-full"></div>
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
              <div className="text-center py-8">
                <Users className="minimal-icon mx-auto mb-2 text-gray-500" />
                <p className="mobile-text-sm">Community not found</p>
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
        {/* Success Message */}
        {showSuccessMessage && (
          <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-slide-down">
            ✅ Post created successfully!
          </div>
        )}
        
        <div className="mobile-section">
          {/* Community Header */}
          <div className="mobile-card animate-fade-in" style={{ marginBottom: '20px' }}>
            <div className="minimal-flex" style={{ marginBottom: '20px', gap: '12px' }}>
              <button
                onClick={() => router.back()}
                className="mobile-btn-secondary"
                style={{ padding: '12px' }}
              >
                <ArrowLeft className="minimal-icon" />
              </button>
              <div className="flex-1">
                <h1 className="mobile-card-title" style={{ marginBottom: '6px' }}>{community.name}</h1>
                <div className="minimal-flex" style={{ fontSize: '13px', color: '#9ca3af' }}>
                  <MapPin className="minimal-icon" style={{ marginRight: '4px' }} />
                  <span>{community.gyms?.city}, {community.gyms?.country}</span>
                </div>
              </div>
              {!isMember ? (
                <button
                  onClick={joinCommunity}
                  disabled={joining}
                  className="mobile-btn-primary disabled:opacity-50"
                >
                  {joining ? 'Joining...' : 'Join'}
                </button>
              ) : (
                <div className="minimal-flex mobile-text-xs text-green-400">
                  <UserPlus className="minimal-icon mr-1" />
                  <span>Member</span>
                </div>
              )}
            </div>

            <div className="minimal-flex justify-around py-4" style={{ borderTop: '1px solid #374151', marginTop: '16px' }}>
              <div className="text-center">
                <div className="minimal-heading" style={{ fontSize: '24px', marginBottom: '4px' }}>{community.member_count}</div>
                <div className="minimal-text" style={{ fontSize: '12px', color: '#9ca3af' }}>Members</div>
              </div>
              <div className="text-center">
                <div className="minimal-heading" style={{ fontSize: '24px', marginBottom: '4px' }}>{posts.length}</div>
                <div className="minimal-text" style={{ fontSize: '12px', color: '#9ca3af' }}>Posts</div>
              </div>
              <div className="text-center">
                <div className="minimal-heading" style={{ fontSize: '24px', marginBottom: '4px' }}>{events.length}</div>
                <div className="minimal-text" style={{ fontSize: '12px', color: '#9ca3af' }}>Events</div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mobile-card animate-slide-up" style={{ marginBottom: '20px', marginTop: '20px' }}>
            <div className="minimal-flex justify-around" style={{ gap: '8px' }}>
              {[
                { id: 'feed', label: 'Feed', icon: MessageSquare },
                { id: 'events', label: 'Events', icon: Calendar },
                { id: 'beta', label: 'Beta', icon: TrendingUp },
                { id: 'about', label: 'About', icon: Settings }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`minimal-flex flex-col py-3 px-4 rounded-lg transition-colors ${
                    activeTab === tab.id 
                      ? 'bg-indigo-600 text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                  style={{ gap: '6px' }}
                >
                  <tab.icon className="minimal-icon" />
                  <span className="mobile-text-xs">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Feed Tab */}
          {activeTab === 'feed' && (
            <div className="mobile-section">
              {/* Tag Filter */}
              <div className="mobile-card animate-slide-up">
                <div className="minimal-flex gap-2 overflow-x-auto pb-2">
                  {postTags.map(tag => (
                    <button
                      key={tag.name}
                      onClick={() => setSelectedTag(tag.name)}
                      className={`tag-chip ${
                        selectedTag === tag.name
                          ? `tag-${tag.name === 'all' ? 'news' : tag.name}`
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* New Post Button */}
              {isMember && (
                <div className="mobile-card animate-slide-up minimal-flex gap-2">
                  <button
                    onClick={() => setShowNewPostModal(true)}
                    className="flex-1 mobile-btn-primary"
                  >
                    <Plus className="minimal-icon mr-2" />
                    Create New Post
                  </button>
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="mobile-btn-secondary p-3"
                  >
                    <RefreshCw className={`minimal-icon ${refreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              )}

              {/* Posts Feed */}
              <div className="space-y-3">
                {filteredPosts.length === 0 ? (
                  <div className="mobile-card-flat p-8 text-center">
                    <MessageCircle className="minimal-icon mx-auto mb-3 text-gray-500" />
                    <p className="minimal-text">No posts yet. Be the first to post!</p>
                  </div>
                ) : (
                  filteredPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentUserId={user?.id}
                      liked={likedPosts.has(post.id)}
                      loadingLike={likingPost === post.id}
                      onOpen={handleOpenPost}
                      onLike={handleLikePost}
                      onEdit={(post) => {
                        setEditingPost(post);
                        setShowEditPostModal(true);
                      }}
                      onDelete={handleDeletePost}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="mobile-section">
              <div className="mobile-card mb-4">
                <button
                  onClick={() => setShowNewEventModal(true)}
                  className="mobile-btn-primary w-full minimal-flex-center"
                >
                  <Calendar className="minimal-icon mr-2" />
                  Create New Event
                </button>
              </div>
              
              <div className="space-y-3">
                {events.length === 0 ? (
                  <div className="mobile-card">
                    <div className="minimal-flex-center py-8">
                      <div className="text-center">
                        <Calendar className="minimal-icon mx-auto mb-3 text-gray-500" />
                        <p className="minimal-text">No events scheduled yet.</p>
                        {isMember && (
                          <p className="minimal-text text-sm text-gray-400 mt-1">
                            Create the first event for this community!
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  events.map((event, index) => (
                    <SimpleEventCard
                      key={event.id}
                      event={event}
                      rsvpStatus={eventRSVPs.get(event.id) || null}
                      onRSVP={handleEventRSVP}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Beta Tab */}
          {activeTab === 'beta' && (
            <div className="mobile-section">
              <div className="space-y-3">
                {filteredPosts.filter(post => post.tag === 'beta').map((post, index) => (
                  <div 
                    key={post.id}
                    className={`mobile-card animate-stagger-${Math.min(index + 1, 3)}`}
                  >
                    <div className="minimal-flex">
                      <div className="w-12 h-12 bg-red-600 rounded-lg minimal-flex-center mr-3 flex-shrink-0">
                        <TrendingUp className="minimal-icon text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="mobile-subheading">{post.title}</h3>
                        <p className="mobile-text-sm text-gray-300 mb-2">{post.content}</p>
                        <div className="minimal-flex mobile-text-xs text-gray-400">
                          <Clock className="minimal-icon mr-1" />
                          <span>by {post.user_name} • {formatTime(post.created_at)}</span>
                        </div>
                      </div>
                      <div className="minimal-flex flex-col items-end">
                        <button className="minimal-flex text-gray-400 hover:text-red-400 mb-1">
                          <ThumbsUp className="minimal-icon mr-1" />
                          <span className="mobile-text-xs">{post.like_count}</span>
                        </button>
                        <span className="mobile-text-xs text-red-400">Helpful</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="mobile-section">
              <div className="mobile-card animate-fade-in">
                <h2 className="mobile-subheading mb-4">About {community.name}</h2>
                <p className="mobile-card-content mb-4">{community.description}</p>
                
                {community.gyms && (
                  <div className="mb-4">
                    <h3 className="mobile-subheading mb-2">Gym Information</h3>
                    <div className="space-y-2">
                      <div className="minimal-flex">
                        <MapPin className="minimal-icon mr-2 text-gray-400" />
                        <span className="mobile-text-sm">{community.gyms.address}</span>
                      </div>
                      {community.gyms.description && (
                        <p className="mobile-text-sm text-gray-300">{community.gyms.description}</p>
                      )}
                    </div>
                  </div>
                )}

                {community.rules && (
                  <div>
                    <h3 className="mobile-subheading mb-2">Community Guidelines</h3>
                    <p className="mobile-text-sm text-gray-300">{community.rules}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Create Post Modal */}
          {showNewPostModal && (
            <CreatePostModal
              communityId={communityId}
              onClose={() => setShowNewPostModal(false)}
              onSubmit={handleCreatePost}
            />
          )}

          {/* Edit Post Modal */}
          {showEditPostModal && editingPost && (
            <CreatePostModal
              communityId={communityId}
              onClose={() => {
                setShowEditPostModal(false);
                setEditingPost(null);
              }}
              onSubmit={handleEditPost}
              editMode={true}
              initialData={editingPost}
            />
          )}

          {/* Create Event Modal */}
          {showNewEventModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <CreateEventModal
                communityId={communityId}
                onClose={() => setShowNewEventModal(false)}
                onSubmit={handleCreateEvent}
              />
            </div>
          )}

          {/* Old Modal - Keeping for reference, can be removed */}
          {false && showNewPostModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 minimal-flex-center z-50 animate-fade-in">
              <div className="minimal-card p-6 max-w-2xl w-full mx-4 animate-scale-in">
                <div className="minimal-flex-between mb-4">
                  <h3 className="mobile-subheading">Create New Post</h3>
                  <button
                    onClick={() => setShowNewPost(false)}
                    className="mobile-btn-secondary touch-feedback"
                  >
                    <X className="minimal-icon" />
                  </button>
                </div>
                <form onSubmit={handleNewPost}>
                  <div className="space-y-2">
                    <div>
                      <input
                        type="text"
                        value={newPost.title}
                        onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Post title..."
                        className="w-full minimal-input"
                        maxLength={100}
                        required
                      />
                    </div>
                    <div>
                      <select
                        value={newPost.post_type}
                        onChange={(e) => setNewPost(prev => ({ ...prev, post_type: e.target.value }))}
                        className="w-full minimal-input mb-2"
                      >
                        <option value="post">General Post</option>
                        <option value="beta">Beta</option>
                        <option value="event">Event</option>
                        <option value="question">Question</option>
                        <option value="gear">Gear</option>
                        <option value="training">Training</option>
                        <option value="social">Social</option>
                      </select>
                      <select
                        value={newPost.tag}
                        onChange={(e) => setNewPost(prev => ({ ...prev, tag: e.target.value }))}
                        className="w-full minimal-input"
                      >
                        {postTags.filter(tag => tag.name !== 'all').map(tag => (
                          <option key={tag.name} value={tag.name}>{tag.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <textarea
                        value={newPost.content}
                        onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="What's on your mind? Share your thoughts with the community..."
                        className="w-full minimal-input h-32 resize-none"
                        maxLength={1000}
                        required
                      />
                    </div>
                  </div>
                  <div className="minimal-flex-between mt-4">
                    <p className="minimal-text text-xs text-gray-400">
                      {newPost.content.length}/1000 characters
                    </p>
                    <div className="minimal-flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowNewPost(false)}
                        className="mobile-btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!newPost.title.trim() || !newPost.content.trim()}
                        className="mobile-btn-primary disabled:opacity-50"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
