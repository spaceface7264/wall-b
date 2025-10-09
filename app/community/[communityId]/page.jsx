'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Users, MessageCircle, Plus, Heart, MessageSquare, Clock, X, ThumbsUp, Reply, Send, MapPin, UserPlus, Search, Filter, TrendingUp, Calendar, Star, ChevronRight, Image, Tag, Hash, Bell, Settings, ArrowLeft } from 'lucide-react';
import SidebarLayout from '../../components/SidebarLayout';
import PostCard from '../../components/PostCard';
import EventCard from '../../components/EventCard';
import { useRouter, useParams } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
);

export default function CommunityPage() {
  const [user, setUser] = useState(null);
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('feed');
  const [selectedTag, setSelectedTag] = useState('all');
  const [showNewPost, setShowNewPost] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [joining, setJoining] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', post_type: 'post', tag: 'general' });
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
  }, [communityId]);

  const loadCommunity = async () => {
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
            address,
            description
          )
        `)
        .eq('id', communityId)
        .single();

      if (error) {
        console.error('Error fetching community:', error);
        // Fallback to mock data
        const mockCommunity = {
          id: communityId,
          name: 'The Climbing Hangar Community',
          description: 'Connect with fellow climbers at The Climbing Hangar in London. Share beta, organize meetups, and stay updated on gym events.',
          member_count: 156,
          rules: 'Welcome to The Climbing Hangar community! Please be respectful, share helpful beta, and keep posts relevant to climbing and this gym.',
          gyms: {
            name: 'The Climbing Hangar',
            city: 'London',
            country: 'United Kingdom',
            image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb2d26?w=400',
            address: '123 Climbing Street, London E1 6AN',
            description: 'Premier bouldering gym in the heart of London with world-class facilities and routes for all levels.'
          }
        };
        setCommunity(mockCommunity);
        loadPosts(mockCommunity.id);
        loadEvents(mockCommunity.id);
      } else {
        setCommunity(data);
        loadPosts(data.id);
        loadEvents(data.id);
      }
    } catch (error) {
      console.error('Error loading community:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async (commId) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('community_id', commId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        // Fallback to mock data
        const mockPosts = [
          {
            id: 1,
            title: "Welcome to The Climbing Hangar Community!",
            content: "Welcome to our community! This is your space to connect with fellow climbers, share beta, organize meetups, and stay updated on gym events. Feel free to introduce yourself and start sharing!",
            user_name: "Admin",
            user_email: "admin@example.com",
            created_at: new Date().toISOString(),
            like_count: 12,
            comment_count: 3,
            post_type: 'social',
            tag: 'social'
          },
          {
            id: 2,
            title: "Beta for the new V6 in the corner",
            content: "Just sent the new V6 in the corner! The key is to use the undercling on the left, then cross over to the right crimp. The top out is tricky - make sure to commit to the final move!",
            user_name: "Climber123",
            user_email: "climber@example.com",
            created_at: new Date(Date.now() - 3600000).toISOString(),
            like_count: 8,
            comment_count: 5,
            post_type: 'beta',
            tag: 'beta'
          },
          {
            id: 3,
            title: "Weekly Training Session - Tomorrow 7PM",
            content: "Join us for our weekly training session tomorrow at 7PM! We'll be working on finger strength and technique. All levels welcome. Meet at the training area.",
            user_name: "TrainingCoach",
            user_email: "coach@example.com",
            created_at: new Date(Date.now() - 7200000).toISOString(),
            like_count: 15,
            comment_count: 7,
            post_type: 'event',
            tag: 'event'
          }
        ];
        setPosts(mockPosts);
      } else {
        setPosts(data || []);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const loadEvents = async (commId) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('community_id', commId)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
        // Fallback to mock data
        const mockEvents = [
          {
            id: 1,
            title: "Weekly Training Session",
            description: "Join us for our weekly training session! We'll be working on finger strength and technique. All levels welcome.",
            event_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            event_type: 'training',
            location: 'Training Area',
            max_participants: 20
          },
          {
            id: 2,
            title: "Boulder Competition",
            description: "Monthly boulder competition with prizes for all categories. Registration required.",
            event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            event_type: 'competition',
            location: 'Main Boulder Area',
            max_participants: 50
          }
        ];
        setEvents(mockEvents);
      } else {
        setEvents(data || []);
      }
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

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking membership:', error);
        return;
      }

      setIsMember(!!data);
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
        .insert([{
          community_id: communityId,
          user_id: user.id
        }]);

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

  const openPost = (post) => {
    // For now, just log the post - can be enhanced later with a modal
    console.log('Opening post:', post);
  };

  const handleNewPost = async (e) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.content.trim() || !user) return;

    const post = {
      community_id: communityId,
      title: newPost.title.trim(),
      content: newPost.content.trim(),
      post_type: newPost.post_type,
      tag: newPost.tag,
      user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
      user_email: user.email,
      like_count: 0,
      comment_count: 0
    };

    try {
      const { data, error } = await supabase
        .from('posts')
        .insert([{
          ...post,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating post:', error);
        // Add to local state as fallback
        const newPostData = {
          id: Date.now(),
          ...post,
          created_at: new Date().toISOString()
        };
        setPosts([newPostData, ...posts]);
      } else {
        setPosts([data, ...posts]);
      }

      setNewPost({ title: '', content: '', post_type: 'post', tag: 'general' });
      setShowNewPost(false);
    } catch (error) {
      console.error('Error creating post:', error);
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
        <div className="mobile-section">
          {/* Community Header */}
          <div className="mobile-card animate-fade-in">
            <div className="minimal-flex mb-4">
              <button
                onClick={() => router.back()}
                className="mobile-btn-secondary mr-3"
              >
                <ArrowLeft className="minimal-icon" />
              </button>
              <div className="flex-1">
                <h1 className="mobile-card-title">{community.name}</h1>
                <div className="minimal-flex mobile-text-xs text-gray-400">
                  <MapPin className="minimal-icon mr-1" />
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

            <div className="minimal-flex justify-around py-4 border-t border-gray-700">
              <div className="text-center">
                <div className="minimal-heading text-2xl">{community.member_count}</div>
                <div className="minimal-text text-xs">Members</div>
              </div>
              <div className="text-center">
                <div className="minimal-heading text-2xl">{posts.length}</div>
                <div className="minimal-text text-xs">Posts</div>
              </div>
              <div className="text-center">
                <div className="minimal-heading text-2xl">{events.length}</div>
                <div className="minimal-text text-xs">Events</div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mobile-card animate-slide-up">
            <div className="minimal-flex justify-around">
              {[
                { id: 'feed', label: 'Feed', icon: MessageSquare },
                { id: 'events', label: 'Events', icon: Calendar },
                { id: 'beta', label: 'Beta', icon: TrendingUp },
                { id: 'about', label: 'About', icon: Settings }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`minimal-flex flex-col gap-1 py-2 px-3 rounded-lg transition-colors ${
                    activeTab === tab.id 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
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
                <div className="mobile-card animate-slide-up">
                  <button
                    onClick={() => setShowNewPost(true)}
                    className="w-full mobile-btn-primary"
                  >
                    <Plus className="minimal-icon mr-2" />
                    Create New Post
                  </button>
                </div>
              )}

              {/* Posts Feed */}
              <div className="space-y-3">
                {filteredPosts.map((post, index) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onOpen={() => openPost(post)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="mobile-section">
              <div className="space-y-3">
                {events.map((event, index) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onRSVP={(eventId, currentStatus) => {
                      // Handle RSVP logic here
                      console.log('RSVP for event:', eventId, currentStatus);
                    }}
                    className={`animate-stagger-${Math.min(index + 1, 3)}`}
                  />
                ))}
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

          {/* New Post Modal */}
          {showNewPost && (
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
                  <div className="space-y-4">
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
