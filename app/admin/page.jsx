import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Users, Shield, Settings, MapPin, Flag, CheckCircle, XCircle, Clock, Trash2, MessageSquare, FileText, Search, AlertCircle, MoreVertical, User, MessageCircle, Ban, ShieldCheck, ShieldOff, AlertTriangle, Edit, BarChart3, X } from 'lucide-react';
import SidebarLayout from '../components/SidebarLayout';
import ConfirmationModal from '../components/ConfirmationModal';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [gymRequests, setGymRequests] = useState([]);
  const [communityReports, setCommunityReports] = useState([]);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [postReports, setPostReports] = useState([]);
  const [commentReports, setCommentReports] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [moderationView, setModerationView] = useState('reports'); // 'reports', 'posts', 'comments'
  const [activeTab, setActiveTab] = useState('users');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [openCommunityMenuId, setOpenCommunityMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0, flipUp: false });
  const [communityMenuPosition, setCommunityMenuPosition] = useState({ top: 0, right: 0, flipUp: false });
  const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, action: null, data: null });
  const [editingCommunity, setEditingCommunity] = useState(null);
  const [assigningModerator, setAssigningModerator] = useState(null);
  const [viewingCommunity, setViewingCommunity] = useState(null);
  const [communityModerators, setCommunityModerators] = useState({});
  const [communityMetrics, setCommunityMetrics] = useState({});
  const [communityMembers, setCommunityMembers] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    checkAdmin();
    loadData();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      
      if (!profile?.is_admin) {
        navigate('/communities');
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin status:', error);
      navigate('/communities');
    } finally {
      setIsLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [
        usersRes, 
        communitiesRes, 
        gymRequestsRes, 
        reportsRes,
        postsRes,
        commentsRes,
        postReportsRes,
        commentReportsRes
      ] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('communities').select('*, gyms(name, city, country)').order('created_at', { ascending: false }),
        supabase.from('gym_requests').select('*, profiles(full_name, email)').order('created_at', { ascending: false }),
        supabase.from('community_reports').select('*, communities(id, name), profiles!reported_by(id, full_name)').order('created_at', { ascending: false }),
        supabase.from('posts').select('*, communities(id, name)').order('created_at', { ascending: false }).limit(100),
        supabase.from('comments').select('*, posts(id, title)').order('created_at', { ascending: false }).limit(100),
        supabase.from('post_reports').select('*, posts(id, title, content), profiles!reported_by(id, full_name)').order('created_at', { ascending: false }),
        supabase.from('comment_reports').select('*, comments(id, content), posts(id, title), profiles!reported_by(id, full_name)').order('created_at', { ascending: false })
      ]);

      const communitiesData = communitiesRes.data || [];
      setUsers(usersRes.data || []);
      setCommunities(communitiesData);
      setGymRequests(gymRequestsRes.data || []);
      setCommunityReports(reportsRes.data || []);
      setPosts(postsRes.data || []);
      setComments(commentsRes.data || []);
      setPostReports(postReportsRes.data || []);
      setCommentReports(commentReportsRes.data || []);

      // Load moderators and metrics for each community
      await loadCommunityData(communitiesData, postsRes.data || [], commentsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadCommunityData = async (communitiesData, postsData, commentsData) => {
    const moderatorsMap = {};
    const metricsMap = {};
    const membersMap = {};

    for (const community of communitiesData) {
      try {
        // First, get member records without profile relationship
        const { data: membersData, error: membersError } = await supabase
          .from('community_members')
          .select('*')
          .eq('community_id', community.id);

        if (membersError) {
          console.error(`Error loading members for community ${community.id}:`, membersError);
          moderatorsMap[community.id] = [];
          membersMap[community.id] = [];
        } else {
          const allMembers = membersData || [];
          
          // Fetch profiles separately for each member
          const membersWithProfiles = await Promise.all(
            allMembers.map(async (member) => {
              try {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('id, full_name, email')
                  .eq('id', member.user_id)
                  .single();
                
                return {
                  ...member,
                  profiles: profile || null
                };
              } catch (error) {
                console.error(`Error loading profile for user ${member.user_id}:`, error);
                return {
                  ...member,
                  profiles: null
                };
              }
            })
          );
          
          const moderators = membersWithProfiles.filter(m => m.role === 'moderator' || m.role === 'admin');
          
          console.log(`Community ${community.name} (${community.id}):`, {
            totalMembers: membersWithProfiles.length,
            moderators: moderators.length
          });
          
          moderatorsMap[community.id] = moderators;
          membersMap[community.id] = membersWithProfiles;
        }
      } catch (error) {
        console.error(`Error processing community ${community.id}:`, error);
        moderatorsMap[community.id] = [];
        membersMap[community.id] = [];
      }

      // Calculate metrics
      const communityPosts = postsData.filter(p => p.community_id === community.id);
      const communityComments = commentsData.filter(c => 
        communityPosts.some(p => p.id === c.post_id)
      );
      
      const allMembers = membersMap[community.id] || [];
      const moderators = moderatorsMap[community.id] || [];
      
      metricsMap[community.id] = {
        postsCount: communityPosts.length,
        commentsCount: communityComments.length,
        membersCount: allMembers.length,
        moderatorsCount: moderators.length,
        recentActivity: communityPosts.length > 0 
          ? new Date(Math.max(...communityPosts.map(p => new Date(p.created_at).getTime())))
          : null
      };
    }

    setCommunityModerators(moderatorsMap);
    setCommunityMetrics(metricsMap);
    setCommunityMembers(membersMap);
  };

  const makeAdmin = async (userId) => {
    setConfirmationModal({
      isOpen: true,
      action: 'makeAdmin',
      data: { userId },
      title: 'Make User Admin',
      message: 'Are you sure you want to make this user an admin? They will have full administrative access.',
      variant: 'warning',
      icon: ShieldCheck,
      confirmText: 'Make Admin'
    });
  };

  const removeAdmin = async (userId) => {
    setConfirmationModal({
      isOpen: true,
      action: 'removeAdmin',
      data: { userId },
      title: 'Remove Admin Privileges',
      message: 'Are you sure you want to remove admin privileges from this user?',
      variant: 'warning',
      icon: ShieldOff,
      confirmText: 'Remove Admin'
    });
  };

  const executeMakeAdmin = async (userId) => {
    try {
      await supabase.from('profiles').update({ is_admin: true }).eq('id', userId);
      loadData();
    } catch (error) {
      console.error('Error making user admin:', error);
      alert('Failed to make user admin');
    }
  };

  const executeRemoveAdmin = async (userId) => {
    try {
      await supabase.from('profiles').update({ is_admin: false }).eq('id', userId);
      loadData();
    } catch (error) {
      console.error('Error removing admin:', error);
      alert('Failed to remove admin status');
    }
  };

  const handleViewProfile = (userId) => {
    navigate(`/profile/${userId}`);
    setOpenMenuId(null);
  };

  const handleStartChat = async (userId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id === userId) {
        alert('Cannot start chat with yourself');
        return;
      }

      const { error } = await supabase.rpc('get_or_create_direct_conversation', {
        user1_id: user.id,
        user2_id: userId
      });

      if (error) {
        console.error('Error creating conversation:', error);
        alert('Failed to start conversation');
        return;
      }

      navigate('/chat');
    } catch (err) {
      console.error('Error starting conversation:', err);
      alert('Failed to start conversation');
    } finally {
      setOpenMenuId(null);
    }
  };

  const banUser = async (userId) => {
    setConfirmationModal({
      isOpen: true,
      action: 'banUser',
      data: { userId },
      title: 'Ban User',
      message: 'Are you sure you want to ban this user? They will be unable to access the platform.',
      variant: 'danger',
      icon: Ban,
      confirmText: 'Ban User'
    });
  };

  const unbanUser = async (userId) => {
    setConfirmationModal({
      isOpen: true,
      action: 'unbanUser',
      data: { userId },
      title: 'Unban User',
      message: 'Are you sure you want to unban this user? They will be able to access the platform again.',
      variant: 'default',
      icon: CheckCircle,
      confirmText: 'Unban User'
    });
  };

  const executeBanUser = async (userId) => {
    try {
      await supabase
        .from('profiles')
        .update({ is_banned: true })
        .eq('id', userId);
      loadData();
      setOpenMenuId(null);
    } catch (error) {
      console.error('Error banning user:', error);
      alert('Failed to ban user');
    }
  };

  const executeUnbanUser = async (userId) => {
    try {
      await supabase
        .from('profiles')
        .update({ is_banned: false })
        .eq('id', userId);
      loadData();
      setOpenMenuId(null);
    } catch (error) {
      console.error('Error unbanning user:', error);
      alert('Failed to unban user');
    }
  };

  const approveGymRequest = async (requestId) => {
    const { data: request } = await supabase.from('gym_requests').select('*').eq('id', requestId).single();
    if (!request) return;
    
    setConfirmationModal({
      isOpen: true,
      action: 'approveGymRequest',
      data: { requestId, request },
      title: 'Approve Gym Request',
      message: `Are you sure you want to approve the gym request for "${request.gym_name}"? This will add it to the gyms database.`,
      variant: 'default',
      icon: CheckCircle,
      confirmText: 'Approve'
    });
  };

  const rejectGymRequest = async (requestId) => {
    setConfirmationModal({
      isOpen: true,
      action: 'rejectGymRequest',
      data: { requestId },
      title: 'Reject Gym Request',
      message: 'Are you sure you want to reject this gym request?',
      variant: 'warning',
      icon: XCircle,
      confirmText: 'Reject'
    });
  };

  const executeApproveGymRequest = async (requestId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: request } = await supabase.from('gym_requests').select('*').eq('id', requestId).single();
      if (!request) return;
      
      await supabase.from('gyms').insert({
        name: request.gym_name,
        country: request.country,
        city: request.city,
        address: request.address || '',
        phone: request.phone || null,
        email: request.email || null,
        website: request.website || null,
        description: request.description || null
      });

      await supabase.from('gym_requests').update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id
      }).eq('id', requestId);

      loadData();
    } catch (error) {
      console.error('Error approving gym request:', error);
      alert('Failed to approve gym request');
    }
  };

  const executeRejectGymRequest = async (requestId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('gym_requests').update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id
      }).eq('id', requestId);
      loadData();
    } catch (error) {
      console.error('Error rejecting gym request:', error);
      alert('Failed to reject gym request');
    }
  };

  const dismissReport = async (reportId) => {
    setConfirmationModal({
      isOpen: true,
      action: 'dismissReport',
      data: { reportId },
      title: 'Dismiss Report',
      message: 'Are you sure you want to dismiss this report? This will mark it as resolved without taking action.',
      variant: 'default',
      icon: XCircle,
      confirmText: 'Dismiss'
    });
  };

  const executeDismissReport = async (reportId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('community_reports').update({
        status: 'dismissed',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id
      }).eq('id', reportId);
      loadData();
    } catch (error) {
      console.error('Error dismissing report:', error);
      alert('Failed to dismiss report');
    }
  };

  const deleteCommunity = async (communityId, reportId) => {
    setConfirmationModal({
      isOpen: true,
      action: 'deleteCommunity',
      data: { communityId, reportId },
      title: 'Delete Community',
      message: 'Are you sure you want to delete this community? This action cannot be undone.',
      variant: 'danger',
      icon: Trash2,
      confirmText: 'Delete'
    });
  };

  const deletePost = async (postId, reportId = null) => {
    setConfirmationModal({
      isOpen: true,
      action: 'deletePost',
      data: { postId, reportId },
      title: 'Delete Post',
      message: 'Are you sure you want to delete this post? This action cannot be undone.',
      variant: 'danger',
      icon: Trash2,
      confirmText: 'Delete'
    });
  };

  const deleteComment = async (commentId, reportId = null) => {
    setConfirmationModal({
      isOpen: true,
      action: 'deleteComment',
      data: { commentId, reportId },
      title: 'Delete Comment',
      message: 'Are you sure you want to delete this comment? This action cannot be undone.',
      variant: 'danger',
      icon: Trash2,
      confirmText: 'Delete'
    });
  };

  const executeDeleteCommunity = async (communityId, reportId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('communities').delete().eq('id', communityId);
      await supabase.from('community_reports').update({
        status: 'action_taken',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        action_taken: 'community_deleted'
      }).eq('id', reportId);
      loadData();
    } catch (error) {
      console.error('Error deleting community:', error);
      alert('Failed to delete community');
    }
  };

  const executeDeletePost = async (postId, reportId = null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('posts').delete().eq('id', postId);
      if (reportId) {
        await supabase.from('post_reports').update({
          status: 'action_taken',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          action_taken: 'post_deleted'
        }).eq('id', reportId);
      }
      loadData();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  };

  const executeDeleteComment = async (commentId, reportId = null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('comments').delete().eq('id', commentId);
      if (reportId) {
        await supabase.from('comment_reports').update({
          status: 'action_taken',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          action_taken: 'comment_deleted'
        }).eq('id', reportId);
      }
      loadData();
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    }
  };

  const handlePostReport = async (reportId, action) => {
    if (action === 'dismiss') {
      setConfirmationModal({
        isOpen: true,
        action: 'dismissPostReport',
        data: { reportId },
        title: 'Dismiss Post Report',
        message: 'Are you sure you want to dismiss this post report? This will mark it as resolved without taking action.',
        variant: 'default',
        icon: XCircle,
        confirmText: 'Dismiss'
      });
    } else if (action === 'delete') {
      const { data: report } = await supabase.from('post_reports').select('post_id').eq('id', reportId).single();
      if (report) {
        deletePost(report.post_id, reportId);
        return;
      }
    }
  };

  const handleCommentReport = async (reportId, action) => {
    if (action === 'dismiss') {
      setConfirmationModal({
        isOpen: true,
        action: 'dismissCommentReport',
        data: { reportId },
        title: 'Dismiss Comment Report',
        message: 'Are you sure you want to dismiss this comment report? This will mark it as resolved without taking action.',
        variant: 'default',
        icon: XCircle,
        confirmText: 'Dismiss'
      });
    } else if (action === 'delete') {
      const { data: report } = await supabase.from('comment_reports').select('comment_id').eq('id', reportId).single();
      if (report) {
        deleteComment(report.comment_id, reportId);
        return;
      }
    }
  };

  const executeDismissPostReport = async (reportId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('post_reports').update({
        status: 'dismissed',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id
      }).eq('id', reportId);
      loadData();
    } catch (error) {
      console.error('Error dismissing post report:', error);
      alert('Failed to dismiss report');
    }
  };

  const executeDismissCommentReport = async (reportId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('comment_reports').update({
        status: 'dismissed',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id
      }).eq('id', reportId);
      loadData();
    } catch (error) {
      console.error('Error dismissing comment report:', error);
      alert('Failed to dismiss report');
    }
  };

  const filteredPosts = posts.filter(post => 
    searchQuery === '' || 
    post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.user_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredComments = comments.filter(comment =>
    searchQuery === '' ||
    comment.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    comment.user_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPostReports = postReports.filter(report =>
    searchQuery === '' ||
    report.posts?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.posts?.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.reason?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCommentReports = commentReports.filter(report =>
    searchQuery === '' ||
    report.comments?.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.reason?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    userSearchQuery === '' ||
    user.full_name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  const handleConfirmAction = () => {
    const { action, data } = confirmationModal;
    
    switch (action) {
      case 'makeAdmin':
        executeMakeAdmin(data.userId);
        break;
      case 'removeAdmin':
        executeRemoveAdmin(data.userId);
        break;
      case 'banUser':
        executeBanUser(data.userId);
        break;
      case 'unbanUser':
        executeUnbanUser(data.userId);
        break;
      case 'approveGymRequest':
        executeApproveGymRequest(data.requestId);
        break;
      case 'rejectGymRequest':
        executeRejectGymRequest(data.requestId);
        break;
      case 'dismissReport':
        executeDismissReport(data.reportId);
        break;
      case 'dismissPostReport':
        executeDismissPostReport(data.reportId);
        break;
      case 'dismissCommentReport':
        executeDismissCommentReport(data.reportId);
        break;
      case 'deleteCommunity':
        executeDeleteCommunity(data.communityId, data.reportId);
        break;
      case 'deletePost':
        executeDeletePost(data.postId, data.reportId);
        break;
      case 'deleteComment':
        executeDeleteComment(data.commentId, data.reportId);
        break;
      default:
        break;
    }
  };

  const updateCommunity = async (communityId, updates) => {
    try {
      const { error } = await supabase
        .from('communities')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', communityId);
      
      if (error) throw error;

      setCommunities(prev => prev.map(c => 
        c.id === communityId ? { ...c, ...updates } : c
      ));
      setEditingCommunity(null);
      loadData();
    } catch (error) {
      console.error('Error updating community:', error);
      alert('Failed to update community');
    }
  };

  const assignModerator = async (communityId, userId, role) => {
    try {
      const { error } = await supabase
        .from('community_members')
        .update({ role })
        .eq('community_id', communityId)
        .eq('user_id', userId);
      
      if (error) throw error;

      // Reload community data
      await loadCommunityData(communities, posts, comments);
    } catch (error) {
      console.error('Error assigning moderator:', error);
      alert('Failed to assign moderator');
    }
  };

  const removeModerator = async (communityId, userId) => {
    try {
      const { error } = await supabase
        .from('community_members')
        .update({ role: 'member' })
        .eq('community_id', communityId)
        .eq('user_id', userId);
      
      if (error) throw error;

      // Reload community data
      await loadCommunityData(communities, posts, comments);
    } catch (error) {
      console.error('Error removing moderator:', error);
      alert('Failed to remove moderator');
    }
  };

  if (isLoading) {
    return (
      <SidebarLayout currentPage="admin">
        <div className="mobile-container" style={{ paddingLeft: 0, paddingRight: 0 }}>
          <div className="mobile-section">
            <div className="bg-gray-800/50 border border-gray-700/50 p-8 text-center">
              <p className="text-gray-400">Loading...</p>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (!isAdmin) {
    return (
      <SidebarLayout currentPage="admin">
        <div className="mobile-container" style={{ paddingLeft: 0, paddingRight: 0 }}>
          <div className="mobile-section">
            <div className="bg-gray-800/50 border border-gray-700/50 p-8 text-center">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h1 className="text-lg font-semibold text-white mb-2">Access Denied</h1>
              <p className="text-sm text-gray-400 mb-6">You need admin access to view this page.</p>
              <button
                onClick={() => navigate('/communities')}
                className="px-4 py-2 bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  const stats = [
    { label: 'Users', value: users.length, icon: Users },
    { label: 'Communities', value: communities.length, icon: Settings },
    { label: 'Admins', value: users.filter(u => u.is_admin).length, icon: Shield },
    { label: 'Pending Requests', value: gymRequests.filter(r => r.status === 'pending').length, icon: MapPin },
    { label: 'Pending Reports', value: communityReports.filter(r => r.status === 'pending').length, icon: Flag },
    { label: 'Content Reports', value: (postReports.filter(r => r.status === 'pending').length + commentReports.filter(r => r.status === 'pending').length), icon: AlertCircle },
  ];

  return (
    <SidebarLayout currentPage="admin">
      <div className="mobile-container" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <div className="mobile-section" style={{ gap: 0, paddingTop: 0, paddingBottom: 0 }}>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-px">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-gray-800/50 border border-gray-700/50 p-3" style={{ borderRadius: 0 }}>
                <stat.icon className="w-4 h-4 text-gray-400 mb-2" />
                <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
                <p className="text-lg font-semibold text-white">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="bg-gray-800/50 border border-gray-700/50 flex gap-px" style={{ borderRadius: 0 }}>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-2 px-3 text-xs font-medium transition-colors ${
                activeTab === 'users'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
              }`}
              style={{ borderRadius: 0 }}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('communities')}
              className={`flex-1 py-2 px-3 text-xs font-medium transition-colors ${
                activeTab === 'communities'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
              }`}
              style={{ borderRadius: 0 }}
            >
              Communities
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-2 px-3 text-xs font-medium transition-colors ${
                activeTab === 'requests'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
              }`}
              style={{ borderRadius: 0 }}
            >
              Requests
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex-1 py-2 px-3 text-xs font-medium transition-colors ${
                activeTab === 'reports'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
              }`}
              style={{ borderRadius: 0 }}
            >
              Reports
            </button>
            <button
              onClick={() => setActiveTab('moderation')}
              className={`flex-1 py-2 px-3 text-xs font-medium transition-colors ${
                activeTab === 'moderation'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
              }`}
              style={{ borderRadius: 0 }}
            >
              Moderation
            </button>
          </div>

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="bg-gray-800/50 border border-gray-700/50" style={{ borderRadius: 0 }}>
              <div className="p-4 border-b border-gray-700/50">
                <h2 className="text-base font-semibold text-white mb-3">Users</h2>
                
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-700/50 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
                    style={{ borderRadius: 2 }}
                  />
                </div>
              </div>
              <div className="divide-y divide-gray-700/50">
                {filteredUsers.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-sm text-gray-400">No users found</p>
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <div key={user.id} className="p-4 flex items-center justify-between relative">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center border border-gray-700/50">
                          <span className="text-xs font-semibold text-indigo-300">
                            {user.full_name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white truncate">
                              {user.full_name || 'No name'}
                            </p>
                            {user.is_admin && (
                              <span className="inline-flex items-center px-1.5 py-0.5 text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20" style={{ borderRadius: 2 }}>
                                Admin
                              </span>
                            )}
                            {user.is_banned && (
                              <span className="inline-flex items-center px-1.5 py-0.5 text-xs bg-red-500/10 text-red-300 border border-red-500/20" style={{ borderRadius: 2 }}>
                                Banned
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                      </div>
                      
                      {/* 3-dot Menu */}
                      <div className="relative ml-3">
                        <button
                          onClick={(e) => {
                            const button = e.currentTarget;
                            const rect = button.getBoundingClientRect();
                            const menuHeight = 200; // Approximate menu height
                            const spaceBelow = window.innerHeight - rect.bottom;
                            const spaceAbove = rect.top;
                            const shouldFlipUp = spaceBelow < menuHeight && spaceAbove > spaceBelow;
                            
                            setMenuPosition({
                              top: shouldFlipUp ? undefined : rect.bottom + 4,
                              bottom: shouldFlipUp ? window.innerHeight - rect.top + 4 : undefined,
                              right: window.innerWidth - rect.right,
                              flipUp: shouldFlipUp
                            });
                            setOpenMenuId(openMenuId === user.id ? null : user.id);
                          }}
                          className="p-1.5 hover:bg-gray-700/50 transition-colors"
                          style={{ borderRadius: 2 }}
                        >
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                        
                        {openMenuId === user.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-[150]" 
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div 
                              className="fixed w-48 bg-gray-900 border border-gray-700/50 shadow-lg z-[200]" 
                              style={{ 
                                borderRadius: 4, 
                                top: menuPosition.flipUp ? undefined : `${menuPosition.top}px`,
                                bottom: menuPosition.flipUp ? `${menuPosition.bottom}px` : undefined,
                                right: `${menuPosition.right}px`,
                                maxHeight: 'calc(100vh - 140px)',
                                overflowY: 'auto'
                              }}
                            >
                              <div className="px-4 py-2 border-b border-gray-700/50">
                                <p className="text-[10px] text-gray-500 truncate">{user.full_name || user.email || 'Unknown User'}</p>
                              </div>
                              <button
                                onClick={() => handleViewProfile(user.id)}
                                className="w-full px-4 py-2 text-left text-xs text-gray-300 hover:bg-gray-800 transition-colors flex items-center gap-2"
                              >
                                <User className="w-3.5 h-3.5" />
                                View Profile
                              </button>
                              <button
                                onClick={() => handleStartChat(user.id)}
                                className="w-full px-4 py-2 text-left text-xs text-gray-300 hover:bg-gray-800 transition-colors flex items-center gap-2"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                Chat
                              </button>
                              <div className="border-t border-gray-700/50 my-1" />
                              {user.is_banned ? (
                                <button
                                  onClick={() => unbanUser(user.id)}
                                  className="w-full px-4 py-2 text-left text-xs text-green-400 hover:bg-gray-800 transition-colors flex items-center gap-2"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  Unban User
                                </button>
                              ) : (
                                <button
                                  onClick={() => banUser(user.id)}
                                  className="w-full px-4 py-2 text-left text-xs text-red-400 hover:bg-gray-800 transition-colors flex items-center gap-2"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  Ban User
                                </button>
                              )}
                              <div className="border-t border-gray-700/50 my-1" />
                              {user.is_admin ? (
                                <button
                                  onClick={() => {
                                    removeAdmin(user.id);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-xs text-red-400 hover:bg-gray-800 transition-colors flex items-center gap-2"
                                >
                                  <ShieldOff className="w-3.5 h-3.5" />
                                  Remove Admin
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    makeAdmin(user.id);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-xs text-indigo-400 hover:bg-gray-800 transition-colors flex items-center gap-2"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  Make Admin
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Communities Tab */}
          {activeTab === 'communities' && (
            <div className="bg-gray-800/50 border border-gray-700/50" style={{ borderRadius: 0 }}>
              <div className="p-4 border-b border-gray-700/50">
                <h2 className="text-base font-semibold text-white">Communities</h2>
              </div>
              <div className="divide-y divide-gray-700/50">
                {communities.map((community) => {
                  const metrics = communityMetrics[community.id] || {};
                  
                  return (
                    <button
                      key={community.id}
                      onClick={() => setViewingCommunity(community)}
                      className="w-full p-4 text-left hover:bg-gray-700/30 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{community.name}</p>
                          <p className="text-xs text-gray-400 truncate mt-1">
                            {community.gyms?.name ? `${community.gyms.name} - ${community.gyms.city}, ${community.gyms.country}` : 'General Community'}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-gray-500">{metrics.membersCount || 0} members</span>
                            <span className="text-xs text-gray-500">{metrics.postsCount || 0} posts</span>
                            <span className="text-xs text-gray-500">{metrics.moderatorsCount || 0} moderators</span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <BarChart3 className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Gym Requests Tab */}
          {activeTab === 'requests' && (
            <div className="bg-gray-800/50 border border-gray-700/50" style={{ borderRadius: 0 }}>
              <div className="p-4 border-b border-gray-700/50">
                <h2 className="text-base font-semibold text-white">Gym Requests</h2>
              </div>
              {gymRequests.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-sm text-gray-400">No gym requests found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-700/50">
                  {gymRequests.map((request) => (
                    <div key={request.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white mb-1">{request.gym_name}</p>
                          <p className="text-xs text-gray-400">{request.city}, {request.country}</p>
                          {request.description && (
                            <p className="text-xs text-gray-400 mt-2">{request.description}</p>
                          )}
                        </div>
                        <span className={`ml-3 px-2 py-1 text-xs ${
                          request.status === 'pending' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' :
                          request.status === 'approved' ? 'bg-green-500/10 text-green-300 border border-green-500/20' :
                          'bg-red-500/10 text-red-300 border border-red-500/20'
                        }`}
                        style={{ borderRadius: 2 }}>
                          {request.status}
                        </span>
                      </div>
                      {request.status === 'pending' && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => approveGymRequest(request.id)}
                            className="flex-1 px-3 py-1.5 text-xs bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center justify-center"
                            style={{ borderRadius: 2 }}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approve
                          </button>
                          <button
                            onClick={() => rejectGymRequest(request.id)}
                            className="flex-1 px-3 py-1.5 text-xs bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center justify-center"
                            style={{ borderRadius: 2 }}
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Reject
                          </button>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-3">
                        By {request.profiles?.full_name || 'Unknown'} • {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="bg-gray-800/50 border border-gray-700/50" style={{ borderRadius: 0 }}>
              <div className="p-4 border-b border-gray-700/50">
                <h2 className="text-base font-semibold text-white">Community Reports</h2>
              </div>
              {communityReports.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-sm text-gray-400">No community reports found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-700/50">
                  {communityReports.map((report) => (
                    <div key={report.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white mb-1">
                            {report.communities?.name || 'Unknown Community'}
                          </p>
                          {report.reason && <p className="text-xs text-gray-400 mb-1">Reason: {report.reason}</p>}
                          {report.description && (
                            <p className="text-xs text-gray-400 mt-2">{report.description}</p>
                          )}
                        </div>
                        <span className={`ml-3 px-2 py-1 text-xs ${
                          report.status === 'pending' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' :
                          report.status === 'dismissed' ? 'bg-gray-500/10 text-gray-300 border border-gray-500/20' :
                          'bg-green-500/10 text-green-300 border border-green-500/20'
                        }`}
                        style={{ borderRadius: 2 }}>
                          {report.status.replace('_', ' ')}
                        </span>
                      </div>
                      {report.status === 'pending' && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => dismissReport(report.id)}
                            className="flex-1 px-3 py-1.5 text-xs bg-gray-600 text-white hover:bg-gray-700 transition-colors"
                            style={{ borderRadius: 2 }}
                          >
                            Dismiss
                          </button>
                          <button
                            onClick={() => deleteCommunity(report.community_id, report.id)}
                            className="flex-1 px-3 py-1.5 text-xs bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center justify-center"
                            style={{ borderRadius: 2 }}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </button>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-3">
                        Reported by {report.profiles?.full_name || 'Unknown'} • {new Date(report.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Moderation Tab */}
          {activeTab === 'moderation' && (
            <div className="bg-gray-800/50 border border-gray-700/50" style={{ borderRadius: 0 }}>
              <div className="p-4 border-b border-gray-700/50">
                <h2 className="text-base font-semibold text-white mb-3">Content Moderation</h2>
                
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search posts and comments by keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-700/50 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
                    style={{ borderRadius: 2 }}
                  />
                </div>

                {/* View Toggle */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setModerationView('reports')}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                      moderationView === 'reports'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-700/50 text-gray-400 hover:text-white'
                    }`}
                    style={{ borderRadius: 2 }}
                  >
                    <AlertCircle className="w-3 h-3 inline mr-1" />
                    Reported Queue ({postReports.filter(r => r.status === 'pending').length + commentReports.filter(r => r.status === 'pending').length})
                  </button>
                  <button
                    onClick={() => setModerationView('posts')}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                      moderationView === 'posts'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-700/50 text-gray-400 hover:text-white'
                    }`}
                    style={{ borderRadius: 2 }}
                  >
                    <FileText className="w-3 h-3 inline mr-1" />
                    All Posts ({filteredPosts.length})
                  </button>
                  <button
                    onClick={() => setModerationView('comments')}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                      moderationView === 'comments'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-700/50 text-gray-400 hover:text-white'
                    }`}
                    style={{ borderRadius: 2 }}
                  >
                    <MessageSquare className="w-3 h-3 inline mr-1" />
                    All Comments ({filteredComments.length})
                  </button>
                </div>
              </div>

              {/* Reported Content Queue */}
              {moderationView === 'reports' && (
                <div>
                  {/* Post Reports */}
                  <div className="divide-y divide-gray-700/50">
                    <div className="p-3 bg-gray-900/30 border-b border-gray-700/50">
                      <p className="text-xs font-medium text-gray-400">POST REPORTS ({filteredPostReports.filter(r => r.status === 'pending').length})</p>
                    </div>
                    {filteredPostReports.filter(r => r.status === 'pending').length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-sm text-gray-400">No pending post reports</p>
                      </div>
                    ) : (
                      filteredPostReports.filter(r => r.status === 'pending').map((report) => (
                        <div key={report.id} className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white mb-1">Reported Post</p>
                              <p className="text-xs text-gray-300 mb-2 line-clamp-2">{report.posts?.title || 'Unknown Post'}</p>
                              <p className="text-xs text-gray-400 mb-2 line-clamp-2">{report.posts?.content}</p>
                              <p className="text-xs text-gray-500 mb-1">Reason: {report.reason || 'Not specified'}</p>
                              {report.description && (
                                <p className="text-xs text-gray-400 mt-1">{report.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handlePostReport(report.id, 'dismiss')}
                              className="flex-1 px-3 py-1.5 text-xs bg-gray-600 text-white hover:bg-gray-700 transition-colors"
                              style={{ borderRadius: 2 }}
                            >
                              Dismiss
                            </button>
                            <button
                              onClick={() => handlePostReport(report.id, 'delete')}
                              className="flex-1 px-3 py-1.5 text-xs bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center justify-center"
                              style={{ borderRadius: 2 }}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete Post
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Reported by {report.profiles?.full_name || 'Unknown'} • {new Date(report.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Comment Reports */}
                  <div className="divide-y divide-gray-700/50 border-t border-gray-700/50">
                    <div className="p-3 bg-gray-900/30 border-b border-gray-700/50">
                      <p className="text-xs font-medium text-gray-400">COMMENT REPORTS ({filteredCommentReports.filter(r => r.status === 'pending').length})</p>
                    </div>
                    {filteredCommentReports.filter(r => r.status === 'pending').length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-sm text-gray-400">No pending comment reports</p>
                      </div>
                    ) : (
                      filteredCommentReports.filter(r => r.status === 'pending').map((report) => (
                        <div key={report.id} className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white mb-1">Reported Comment</p>
                              <p className="text-xs text-gray-300 mb-1">Post: {report.posts?.title || 'Unknown'}</p>
                              <p className="text-xs text-gray-400 mb-2 line-clamp-3">{report.comments?.content}</p>
                              <p className="text-xs text-gray-500 mb-1">Reason: {report.reason || 'Not specified'}</p>
                              {report.description && (
                                <p className="text-xs text-gray-400 mt-1">{report.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleCommentReport(report.id, 'dismiss')}
                              className="flex-1 px-3 py-1.5 text-xs bg-gray-600 text-white hover:bg-gray-700 transition-colors"
                              style={{ borderRadius: 2 }}
                            >
                              Dismiss
                            </button>
                            <button
                              onClick={() => handleCommentReport(report.id, 'delete')}
                              className="flex-1 px-3 py-1.5 text-xs bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center justify-center"
                              style={{ borderRadius: 2 }}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete Comment
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Reported by {report.profiles?.full_name || 'Unknown'} • {new Date(report.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* All Posts View */}
              {moderationView === 'posts' && (
                <div className="divide-y divide-gray-700/50">
                  {filteredPosts.length === 0 ? (
                    <div className="p-12 text-center">
                      <p className="text-sm text-gray-400">No posts found</p>
                    </div>
                  ) : (
                    filteredPosts.map((post) => (
                      <div key={post.id} className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white mb-1">{post.title}</p>
                            <p className="text-xs text-gray-400 mb-2 line-clamp-2">{post.content}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>By {post.user_name}</span>
                              {post.communities && <span>• {post.communities.name}</span>}
                              <span>• {new Date(post.created_at).toLocaleDateString()}</span>
                              <span>• {post.like_count} likes</span>
                              <span>• {post.comment_count} comments</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => deletePost(post.id)}
                          className="mt-2 px-3 py-1 text-xs bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center"
                          style={{ borderRadius: 2 }}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete Post
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* All Comments View */}
              {moderationView === 'comments' && (
                <div className="divide-y divide-gray-700/50">
                  {filteredComments.length === 0 ? (
                    <div className="p-12 text-center">
                      <p className="text-sm text-gray-400">No comments found</p>
                    </div>
                  ) : (
                    filteredComments.map((comment) => (
                      <div key={comment.id} className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-300 mb-1">Post: {comment.posts?.title || 'Unknown'}</p>
                            <p className="text-sm text-gray-400 mb-2 line-clamp-3">{comment.content}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>By {comment.user_name}</span>
                              <span>• {new Date(comment.created_at).toLocaleDateString()}</span>
                              <span>• {comment.like_count} likes</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteComment(comment.id)}
                          className="mt-2 px-3 py-1 text-xs bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center"
                          style={{ borderRadius: 2 }}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete Comment
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal({ isOpen: false, action: null, data: null })}
        onConfirm={handleConfirmAction}
        title={confirmationModal.title}
        message={confirmationModal.message}
        confirmText={confirmationModal.confirmText || 'Confirm'}
        cancelText="Cancel"
        variant={confirmationModal.variant || 'default'}
        icon={confirmationModal.icon}
      />

      {/* Edit Community Modal */}
      {editingCommunity && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 w-full max-w-md" style={{ borderRadius: 4 }}>
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Edit Community</h3>
              <button
                onClick={() => setEditingCommunity(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                updateCommunity(editingCommunity.id, {
                  name: formData.get('name'),
                  description: formData.get('description'),
                  rules: formData.get('rules')
                });
              }}
              className="p-4 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingCommunity.name}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white text-sm focus:outline-none focus:border-indigo-500"
                  style={{ borderRadius: 2 }}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  name="description"
                  defaultValue={editingCommunity.description || ''}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                  style={{ borderRadius: 2 }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Rules</label>
                <textarea
                  name="rules"
                  defaultValue={editingCommunity.rules || ''}
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                  style={{ borderRadius: 2 }}
                  placeholder="Community guidelines and rules..."
                />
              </div>
              
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCommunity(null)}
                  className="flex-1 px-4 py-2 text-sm bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                  style={{ borderRadius: 2 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                  style={{ borderRadius: 2 }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Community Details Modal */}
      {viewingCommunity && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" style={{ borderRadius: 4 }}>
            <div className="p-4 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-white truncate">{viewingCommunity.name}</h3>
                <p className="text-xs text-gray-400 truncate mt-1">
                  {viewingCommunity.gyms?.name ? `${viewingCommunity.gyms.name} - ${viewingCommunity.gyms.city}, ${viewingCommunity.gyms.country}` : 'General Community'}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <button
                  onClick={() => {
                    setEditingCommunity(viewingCommunity);
                    setViewingCommunity(null);
                  }}
                  className="p-1.5 hover:bg-gray-700/50 transition-colors"
                  style={{ borderRadius: 2 }}
                  title="Edit Community"
                >
                  <Edit className="w-4 h-4 text-gray-400" />
                </button>
                <button
                  onClick={() => setViewingCommunity(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto flex-1 p-4 space-y-4">
              {/* Metrics Grid */}
              {(() => {
                const metrics = communityMetrics[viewingCommunity.id] || {};
                return (
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-gray-800/50 p-3 rounded border border-gray-700/50" style={{ borderRadius: 2 }}>
                      <div className="flex items-center gap-1 mb-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-400">Members</span>
                      </div>
                      <p className="text-lg font-semibold text-white">{metrics.membersCount || 0}</p>
                    </div>
                    <div className="bg-gray-800/50 p-3 rounded border border-gray-700/50" style={{ borderRadius: 2 }}>
                      <div className="flex items-center gap-1 mb-1">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-400">Posts</span>
                      </div>
                      <p className="text-lg font-semibold text-white">{metrics.postsCount || 0}</p>
                    </div>
                    <div className="bg-gray-800/50 p-3 rounded border border-gray-700/50" style={{ borderRadius: 2 }}>
                      <div className="flex items-center gap-1 mb-1">
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-400">Comments</span>
                      </div>
                      <p className="text-lg font-semibold text-white">{metrics.commentsCount || 0}</p>
                    </div>
                    <div className="bg-gray-800/50 p-3 rounded border border-gray-700/50" style={{ borderRadius: 2 }}>
                      <div className="flex items-center gap-1 mb-1">
                        <Shield className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-400">Moderators</span>
                      </div>
                      <p className="text-lg font-semibold text-white">{metrics.moderatorsCount || 0}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Recent Activity */}
              {(() => {
                const metrics = communityMetrics[viewingCommunity.id] || {};
                return metrics.recentActivity && (
                  <div className="text-xs text-gray-500">
                    Last activity: {new Date(metrics.recentActivity).toLocaleDateString()}
                  </div>
                );
              })()}

              {/* Members List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-white">Members</h4>
                  {(() => {
                    const members = communityMembers[viewingCommunity.id] || [];
                    const moderators = communityModerators[viewingCommunity.id] || [];
                    return members.length > moderators.length && (
                      <button
                        onClick={() => {
                          setAssigningModerator(viewingCommunity);
                          setViewingCommunity(null);
                        }}
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        <Shield className="w-3 h-3" />
                        Assign Moderator
                      </button>
                    );
                  })()}
                </div>
                {(() => {
                  const members = communityMembers[viewingCommunity.id] || [];
                  return members.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">No members</p>
                  ) : (
                    <div className="space-y-1 max-h-64 overflow-y-auto border border-gray-700/30 rounded p-2" style={{ borderRadius: 2 }}>
                      {members.map((member) => {
                        const isModerator = member.role === 'moderator' || member.role === 'admin';
                        return (
                          <div key={member.id} className="flex items-center justify-between p-2 bg-gray-900/30 rounded hover:bg-gray-900/50 transition-colors" style={{ borderRadius: 2 }}>
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {isModerator ? (
                                <Shield className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                              ) : (
                                <Users className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <span className="text-xs text-white truncate block">
                                  {member.profiles?.full_name || member.profiles?.email || 'Unknown'}
                                </span>
                                {member.profiles?.email && member.profiles?.full_name && (
                                  <span className="text-xs text-gray-500 truncate block">{member.profiles.email}</span>
                                )}
                              </div>
                              {isModerator && (
                                <span className="text-xs text-gray-500 flex-shrink-0 px-2 py-0.5 bg-gray-800 rounded">
                                  {member.role}
                                </span>
                              )}
                            </div>
                            {isModerator && member.role !== 'admin' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeModerator(viewingCommunity.id, member.user_id);
                                }}
                                className="text-xs text-red-400 hover:text-red-300 ml-2 flex-shrink-0"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-gray-700/50">
                <button
                  onClick={() => {
                    navigate(`/community/${viewingCommunity.id}`);
                    setViewingCommunity(null);
                  }}
                  className="flex-1 px-4 py-2 text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                  style={{ borderRadius: 2 }}
                >
                  View Community
                </button>
                <button
                  onClick={() => {
                    setEditingCommunity(viewingCommunity);
                    setViewingCommunity(null);
                  }}
                  className="flex-1 px-4 py-2 text-sm bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                  style={{ borderRadius: 2 }}
                >
                  Edit Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Moderator Modal */}
      {assigningModerator && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col" style={{ borderRadius: 4 }}>
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Assign Moderator</h3>
              <button
                onClick={() => setAssigningModerator(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-4">
              <p className="text-sm text-gray-400 mb-3">Select a member to make a moderator:</p>
              <div className="space-y-2">
                {communityMembers[assigningModerator.id]?.filter(m => m.role === 'member').map((member) => (
                  <button
                    key={member.id}
                    onClick={() => {
                      assignModerator(assigningModerator.id, member.user_id, 'moderator');
                      setAssigningModerator(null);
                    }}
                    className="w-full text-left p-3 bg-gray-800/50 border border-gray-700/50 hover:bg-gray-800 hover:border-gray-600 transition-colors"
                    style={{ borderRadius: 2 }}
                  >
                    <p className="text-sm font-medium text-white">
                      {member.profiles?.full_name || member.profiles?.email || 'Unknown User'}
                    </p>
                    {member.profiles?.email && member.profiles?.full_name && (
                      <p className="text-xs text-gray-400 mt-1">{member.profiles.email}</p>
                    )}
                  </button>
                ))}
                {(!communityMembers[assigningModerator.id] || communityMembers[assigningModerator.id].filter(m => m.role === 'member').length === 0) && (
                  <p className="text-sm text-gray-400 text-center py-4">No members available to assign as moderator</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}
