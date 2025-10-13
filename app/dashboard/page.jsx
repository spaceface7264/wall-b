'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import SidebarLayout from '../components/SidebarLayout';
import { Calendar, Users, MessageSquare, MapPin, Clock, ChevronRight, Plus } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [communities, setCommunities] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [rsvpEvents, setRsvpEvents] = useState([]);
  const [stats, setStats] = useState({
    communities: 0,
    posts: 0,
    events: 0,
    comments: 0
  });
  const router = useRouter();

  useEffect(() => {
    getUser();
  }, []);

  const getUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await loadDashboardData(user.id);
      }
    } catch (error) {
      console.error('Error getting user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async (userId) => {
    try {
      // Load user's communities (for display)
      const { data: userCommunities } = await supabase
        .from('community_members')
        .select(`
          communities!inner(id, name, description, member_count, created_at)
        `)
        .eq('user_id', userId)
        .order('joined_at', { ascending: false })
        .limit(5);

      if (userCommunities) {
        setCommunities(userCommunities.map(uc => uc.communities));
      }

      // Load recent posts from user's communities
      const communityIds = userCommunities?.map(uc => uc.communities.id) || [];
      if (communityIds.length > 0) {
        const { data: posts } = await supabase
          .from('posts')
          .select(`
            id, title, content, created_at, tag, like_count, comment_count,
            communities!inner(name)
          `)
          .in('community_id', communityIds)
          .order('created_at', { ascending: false })
          .limit(10);

        if (posts) {
          setRecentPosts(posts);
        }
      }

      // Load user's RSVP'd events (for display)
      const { data: rsvpData } = await supabase
        .from('event_rsvps')
        .select(`
          status, created_at,
          events!inner(id, title, description, event_date, location, event_type, communities!inner(name))
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (rsvpData) {
        setRsvpEvents(rsvpData.map(rsvp => ({
          ...rsvp.events,
          rsvpStatus: rsvp.status,
          rsvpDate: rsvp.created_at
        })));
      }

      // Load ACCURATE user stats (not limited by display limits)
      const [
        { count: totalCommunities },
        { count: totalPosts },
        { count: totalComments },
        { count: totalEvents }
      ] = await Promise.all([
        // Total communities user has joined
        supabase
          .from('community_members')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
        
        // Total posts user has created
        supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
        
        // Total comments user has made
        supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
        
        // Total events user has RSVP'd to
        supabase
          .from('event_rsvps')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
      ]);

      console.log('📊 Dashboard stats loaded:', {
        communities: totalCommunities,
        posts: totalPosts,
        comments: totalComments,
        events: totalEvents
      });

      setStats({
        communities: totalCommunities || 0,
        posts: totalPosts || 0,
        comments: totalComments || 0,
        events: totalEvents || 0
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const getEventTypeIcon = (type) => {
    const icons = {
      'meetup': '📅',
      'competition': '🏆',
      'training': '💪',
      'social': '🎉'
    };
    return icons[type] || '📅';
  };

  const getRSVPStatusColor = (status) => {
    const colors = {
      'going': 'text-green-400',
      'interested': 'text-yellow-400',
      'cant_go': 'text-red-400'
    };
    return colors[status] || 'text-gray-400';
  };

  if (loading) {
    return (
      <SidebarLayout currentPage="main">
        <div className="minimal-flex-center py-8">
          <div className="minimal-text">Loading dashboard...</div>
        </div>
      </SidebarLayout>
    );
  }

  if (!user) {
    return (
      <SidebarLayout currentPage="main">
        <div className="minimal-flex-center py-8">
          <div className="minimal-text">Please sign in to view your dashboard.</div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout currentPage="main">
      <div className="mobile-container">
        <div className="mobile-section">
          <h1 className="mobile-heading">Dashboard</h1>
          <p className="minimal-text text-gray-400">Welcome back, {user.user_metadata?.full_name || user.email}!</p>
        </div>

        {/* Stats Cards */}
        <div className="mobile-section">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="mobile-card">
              <div className="minimal-flex-center">
                <Users className="minimal-icon text-blue-400" />
                <div className="ml-3">
                  <div className="mobile-subheading">{stats.communities}</div>
                  <div className="minimal-text text-gray-400">Communities</div>
                </div>
              </div>
            </div>
            <div className="mobile-card">
              <div className="minimal-flex-center">
                <MessageSquare className="minimal-icon text-green-400" />
                <div className="ml-3">
                  <div className="mobile-subheading">{stats.posts}</div>
                  <div className="minimal-text text-gray-400">Posts</div>
                </div>
              </div>
            </div>
            <div className="mobile-card">
              <div className="minimal-flex-center">
                <Calendar className="minimal-icon text-purple-400" />
                <div className="ml-3">
                  <div className="mobile-subheading">{stats.events}</div>
                  <div className="minimal-text text-gray-400">Events</div>
                </div>
              </div>
            </div>
            <div className="mobile-card">
              <div className="minimal-flex-center">
                <MessageSquare className="minimal-icon text-orange-400" />
                <div className="ml-3">
                  <div className="mobile-subheading">{stats.comments}</div>
                  <div className="minimal-text text-gray-400">Comments</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* My Communities */}
          <div className="mobile-section">
            <div className="minimal-flex-center justify-between mb-4">
              <h2 className="mobile-subheading">My Communities</h2>
              <button
                onClick={() => router.push('/community')}
                className="minimal-button text-sm"
              >
                View All
              </button>
            </div>
            
            {communities.length === 0 ? (
              <div className="mobile-card">
                <div className="minimal-flex-center py-8">
                  <div className="text-center">
                    <Users className="minimal-icon mx-auto mb-3 text-gray-500" />
                    <p className="minimal-text">No communities yet</p>
                    <button
                      onClick={() => router.push('/community')}
                      className="minimal-button mt-3"
                    >
                      <Plus className="minimal-icon mr-2" />
                      Join Communities
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {communities.map((community) => (
                  <div
                    key={community.id}
                    className="mobile-card cursor-pointer hover:border-indigo-500/50 transition-all duration-200"
                    onClick={() => router.push(`/community/${community.id}`)}
                  >
                    <div className="minimal-flex-center justify-between">
                      <div>
                        <h3 className="mobile-subheading">{community.name}</h3>
                        <p className="minimal-text text-gray-400 text-sm">
                          {community.member_count} members
                        </p>
                      </div>
                      <ChevronRight className="minimal-icon text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Posts */}
          <div className="mobile-section">
            <div className="minimal-flex-center justify-between mb-4">
              <h2 className="mobile-subheading">Recent Posts</h2>
              <button
                onClick={() => router.push('/community')}
                className="minimal-button text-sm"
              >
                View All
              </button>
            </div>
            
            {recentPosts.length === 0 ? (
              <div className="mobile-card">
                <div className="minimal-flex-center py-8">
                  <div className="text-center">
                    <MessageSquare className="minimal-icon mx-auto mb-3 text-gray-500" />
                    <p className="minimal-text">No recent posts</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPosts.map((post) => (
                  <div
                    key={post.id}
                    className="mobile-card cursor-pointer hover:border-indigo-500/50 transition-all duration-200"
                    onClick={() => router.push(`/community/${post.community_id}/post/${post.id}`)}
                  >
                    <div className="minimal-flex-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="mobile-subheading truncate">{post.title}</h3>
                        <p className="minimal-text text-gray-400 text-sm">
                          in {post.communities.name} • {formatDate(post.created_at)}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>{post.like_count} likes</span>
                          <span>{post.comment_count} comments</span>
                          <span className="px-2 py-1 bg-gray-700 rounded-full">{post.tag}</span>
                        </div>
                      </div>
                      <ChevronRight className="minimal-icon text-gray-400 ml-2" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* My Events */}
        <div className="mobile-section">
          <div className="minimal-flex-center justify-between mb-4">
            <h2 className="mobile-subheading">My Events</h2>
            <button
              onClick={() => router.push('/community')}
              className="minimal-button text-sm"
            >
              View All
            </button>
          </div>
          
          {rsvpEvents.length === 0 ? (
            <div className="mobile-card">
              <div className="minimal-flex-center py-8">
                <div className="text-center">
                  <Calendar className="minimal-icon mx-auto mb-3 text-gray-500" />
                  <p className="minimal-text">No events RSVP'd yet</p>
                  <button
                    onClick={() => router.push('/community')}
                    className="minimal-button mt-3"
                  >
                    <Plus className="minimal-icon mr-2" />
                    Find Events
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {rsvpEvents.map((event) => (
                <div
                  key={event.id}
                  className="mobile-card cursor-pointer hover:border-indigo-500/50 transition-all duration-200"
                  onClick={() => router.push(`/community/${event.community_id}`)}
                >
                  <div className="minimal-flex-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="text-2xl">{getEventTypeIcon(event.event_type)}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="mobile-subheading truncate">{event.title}</h3>
                        <p className="minimal-text text-gray-400 text-sm">
                          in {event.communities.name}
                        </p>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDate(event.event_date)}
                          </span>
                          {event.location && (
                            <span className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {event.location}
                            </span>
                          )}
                          <span className={`font-medium ${getRSVPStatusColor(event.rsvpStatus)}`}>
                            {event.rsvpStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="minimal-icon text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}