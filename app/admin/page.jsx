import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Users, Shield, Settings, MapPin, Flag, CheckCircle, XCircle, Clock, Trash2, MessageSquare, FileText, Search, AlertCircle, MoreVertical, User, MessageCircle, Ban, ShieldCheck, ShieldOff, AlertTriangle, Edit, BarChart3, X, Download, Filter, Calendar, Activity, Star, Eye, EyeOff, ExternalLink, Sparkles, Lightbulb, Bug } from 'lucide-react';
import SidebarLayout from '../components/SidebarLayout';
import ConfirmationModal from '../components/ConfirmationModal';
import { useToast } from '../providers/ToastProvider';

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
  const [activeTab, setActiveTab] = useState('overview');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [openCommunityMenuId, setOpenCommunityMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0, flipUp: false });
  const [communityMenuPosition, setCommunityMenuPosition] = useState({ top: 0, right: 0, flipUp: false });
  const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, action: null, data: null });
  const [editingCommunity, setEditingCommunity] = useState(null);
  const [originalCommunityData, setOriginalCommunityData] = useState(null);
  const [pendingCommunityChanges, setPendingCommunityChanges] = useState(null);
  const [showCommunityChangesConfirmation, setShowCommunityChangesConfirmation] = useState(false);
  const [isUpdatingCommunity, setIsUpdatingCommunity] = useState(false);
  const [assigningModerator, setAssigningModerator] = useState(null);
  const [viewingCommunity, setViewingCommunity] = useState(null);
  const [communityModerators, setCommunityModerators] = useState({});
  const [communityMetrics, setCommunityMetrics] = useState({});
  const [communityMembers, setCommunityMembers] = useState({});
  
  // Community Management State
  const [communitySearchQuery, setCommunitySearchQuery] = useState('');
  const [selectedCommunities, setSelectedCommunities] = useState(new Set());
  const [communityFilters, setCommunityFilters] = useState({ type: '', dateFrom: '', dateTo: '', hasGym: '', status: '' });
  const [showCommunityFilters, setShowCommunityFilters] = useState(false);
  
  // Enhanced User Management State
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [userActivity, setUserActivity] = useState({ posts: [], comments: [] });
  const [loadingUserActivity, setLoadingUserActivity] = useState(false);
  const [dateFilter, setDateFilter] = useState({ type: 'registration', from: '', to: '' }); // 'registration' or 'lastActive'
  const [statusFilter, setStatusFilter] = useState([]); // Array of statuses: 'admin', 'banned', 'moderator', 'regular'
  const [userModeratorStatus, setUserModeratorStatus] = useState({}); // Map of userId -> isModerator
  const [showFilters, setShowFilters] = useState(false);
  
  // Gym Request Bulk Actions State
  const [selectedGymRequests, setSelectedGymRequests] = useState(new Set());
  
  // Gyms Management State
  const [gyms, setGyms] = useState([]);
  const [gymMetrics, setGymMetrics] = useState({});
  const [gymSearchQuery, setGymSearchQuery] = useState('');
  const [viewingGym, setViewingGym] = useState(null);
  const [editingGym, setEditingGym] = useState(null);
  const [selectedGyms, setSelectedGyms] = useState(new Set());
  const [gymFilters, setGymFilters] = useState({ country: '', city: '', dateFrom: '', dateTo: '', visibility: '' });
  const [showGymFilters, setShowGymFilters] = useState(false);
  const [openGymMenuId, setOpenGymMenuId] = useState(null);
  const [gymMenuPosition, setGymMenuPosition] = useState({ top: 0, right: 0, flipUp: false });
  
  // Feedback Management State
  const [feedback, setFeedback] = useState([]);
  const [feedbackSearchQuery, setFeedbackSearchQuery] = useState('');
  const [feedbackFilters, setFeedbackFilters] = useState({ type: '', status: '', priority: '' });
  const [showFeedbackFilters, setShowFeedbackFilters] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(new Set());
  const [viewingFeedback, setViewingFeedback] = useState(null);
  const [editingFeedback, setEditingFeedback] = useState(null);
  
  const navigate = useNavigate();
  const { showToast } = useToast();

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
        commentReportsRes,
        gymsRes,
        feedbackRes
      ] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('communities').select('*, gyms(name, city, country)').order('created_at', { ascending: false }),
        supabase.from('gym_requests').select('*, profiles(full_name, email)').order('created_at', { ascending: false }),
        supabase.from('community_reports').select('*, communities(id, name)').order('created_at', { ascending: false }),
        supabase.from('posts').select('*, communities(id, name)').order('created_at', { ascending: false }).limit(100),
        supabase.from('comments').select('*, posts(id, title)').order('created_at', { ascending: false }).limit(100),
        supabase.from('post_reports').select('*, posts(id, title, content), profiles!reported_by(id, full_name)').order('created_at', { ascending: false }),
        supabase.from('comment_reports').select('*, comments(id, content), posts(id, title), profiles!reported_by(id, full_name)').order('created_at', { ascending: false }),
        supabase.from('gyms').select('*').order('created_at', { ascending: false }),
        supabase.from('feedback').select('*').order('created_at', { ascending: false })
      ]);

      // Check for errors in each response
      if (usersRes.error) console.error('Error loading users:', usersRes.error);
      if (communitiesRes.error) console.error('Error loading communities:', communitiesRes.error);
      if (gymRequestsRes.error) console.error('Error loading gym requests:', gymRequestsRes.error);
      if (reportsRes.error) {
        console.error('Error loading community reports:', reportsRes.error);
        console.error('Community reports error details:', JSON.stringify(reportsRes.error, null, 2));
      }
      if (postsRes.error) console.error('Error loading posts:', postsRes.error);
      if (commentsRes.error) console.error('Error loading comments:', commentsRes.error);
      if (postReportsRes.error) console.error('Error loading post reports:', postReportsRes.error);
      if (commentReportsRes.error) console.error('Error loading comment reports:', commentReportsRes.error);
      if (gymsRes.error) console.error('Error loading gyms:', gymsRes.error);
      if (feedbackRes.error) console.error('Error loading feedback:', feedbackRes.error);

      const communitiesData = communitiesRes.data || [];
      const usersData = usersRes.data || [];
      setUsers(usersData);
      setCommunities(communitiesData);
      setGymRequests(gymRequestsRes.data || []);

      // Load moderator status for all users
      const userIds = usersData.map(u => u.id);
      if (userIds.length > 0) {
        const { data: membersData } = await supabase
          .from('community_members')
          .select('user_id, role')
          .in('user_id', userIds);
        
        const moderatorMap = {};
        membersData?.forEach(member => {
          if (member.role === 'moderator' || member.role === 'admin') {
            moderatorMap[member.user_id] = true;
          }
        });
        setUserModeratorStatus(moderatorMap);
      }
      
      // Enrich community reports with reporter profiles
      const reportsData = reportsRes.data || [];
      if (reportsData.length > 0) {
        const reporterIds = [...new Set(reportsData.map(r => r.reported_by))];
        const { data: reporterProfiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', reporterIds);
        
        const profilesMap = new Map(reporterProfiles?.map(p => [p.id, p]) || []);
        const enrichedReports = reportsData.map(report => ({
          ...report,
          profiles: profilesMap.get(report.reported_by) || null
        }));
        setCommunityReports(enrichedReports);
        console.log('Loaded community reports:', enrichedReports.length, enrichedReports);
      } else {
        setCommunityReports([]);
        console.log('Loaded community reports: 0 (no reports found or table does not exist)');
      }
      
      setPosts(postsRes.data || []);
      setComments(commentsRes.data || []);
      setPostReports(postReportsRes.data || []);
      setCommentReports(commentReportsRes.data || []);
      setGyms(gymsRes.data || []);
      setFeedback(feedbackRes.data || []);

      // Load moderators and metrics for each community
      await loadCommunityData(communitiesData, postsRes.data || [], commentsRes.data || []);
      
      // Load gym metrics
      await loadGymMetrics(gymsRes.data || []);
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

  const loadGymMetrics = async (gymsData) => {
    const metricsMap = {};

    if (!gymsData || gymsData.length === 0) {
      setGymMetrics({});
      return;
    }

    const gymIds = gymsData.map(g => g.id);

    try {
      // Fetch reviews for all gyms
      const { data: reviewsData } = await supabase
        .from('gym_reviews')
        .select('gym_id, rating')
        .in('gym_id', gymIds);

      // Fetch favorites count for all gyms
      const { data: favoritesData } = await supabase
        .from('user_favorite_gyms')
        .select('gym_id')
        .in('gym_id', gymIds);

      // Fetch communities count for all gyms
      const { data: communitiesData } = await supabase
        .from('communities')
        .select('gym_id')
        .in('gym_id', gymIds);

      // Calculate metrics for each gym
      gymsData.forEach(gym => {
        const reviews = reviewsData?.filter(r => r.gym_id === gym.id) || [];
        const avgRating = reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : null;

        const favoritesCount = favoritesData?.filter(f => f.gym_id === gym.id).length || 0;
        const communitiesCount = communitiesData?.filter(c => c.gym_id === gym.id).length || 0;

        metricsMap[gym.id] = {
          reviewsCount: reviews.length,
          avgRating: avgRating,
          favoritesCount: favoritesCount,
          communitiesCount: communitiesCount
        };
      });

      setGymMetrics(metricsMap);
    } catch (error) {
      console.error('Error loading gym metrics:', error);
      setGymMetrics({});
    }
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
      
      // Clean description to remove rating metadata if present
      let cleanDescription = request.description || null;
      if (cleanDescription) {
        // Remove metadata note pattern: [Source: Google Places | Rating: ... | Ratings: ...]
        cleanDescription = cleanDescription.replace(/\n\n\[Source:.*?\]/gi, '').trim();
        if (cleanDescription === '') cleanDescription = null;
      }

      await supabase.from('gyms').insert({
        name: request.gym_name,
        country: request.country,
        city: request.city,
        address: request.address || '',
        phone: request.phone || null,
        email: request.email || null,
        website: request.website || null,
        description: cleanDescription,
        facilities: request.facilities && Array.isArray(request.facilities) && request.facilities.length > 0 
          ? request.facilities 
          : [],
        google_rating: request.google_rating || null,
        google_ratings_count: request.google_ratings_count || null
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

  // Bulk approve gym requests
  const bulkApproveGymRequests = () => {
    if (selectedGymRequests.size === 0) return;

    const pendingRequests = gymRequests.filter(r => 
      r.status === 'pending' && selectedGymRequests.has(r.id)
    );

    setConfirmationModal({
      isOpen: true,
      action: 'bulkApproveGymRequests',
      data: { requestIds: Array.from(selectedGymRequests) },
      title: 'Bulk Approve Gym Requests',
      message: `Are you sure you want to approve ${pendingRequests.length} gym request(s)? They will be added to the gyms database.`,
      variant: 'default',
      icon: CheckCircle,
      confirmText: `Approve ${pendingRequests.length} Requests`
    });
  };

  const executeBulkApproveGymRequests = async (requestIds) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get all pending requests that are selected
      const { data: requests } = await supabase
        .from('gym_requests')
        .select('*')
        .in('id', requestIds)
        .eq('status', 'pending');

      if (!requests || requests.length === 0) {
        showToast('error', 'No Requests', 'No pending requests found to approve');
        setSelectedGymRequests(new Set());
        return;
      }

      // Create gyms from requests
      const gymsToInsert = requests.map(request => {
        // Clean description to remove rating metadata if present
        let cleanDescription = request.description || null;
        if (cleanDescription) {
          // Remove metadata note pattern: [Source: Google Places | Rating: ... | Ratings: ...]
          cleanDescription = cleanDescription.replace(/\n\n\[Source:.*?\]/gi, '').trim();
          if (cleanDescription === '') cleanDescription = null;
        }

        return {
          name: request.gym_name,
          country: request.country,
          city: request.city,
          address: request.address || '',
          phone: request.phone || null,
          email: request.email || null,
          website: request.website || null,
          description: cleanDescription,
          facilities: request.facilities && Array.isArray(request.facilities) && request.facilities.length > 0 
            ? request.facilities 
            : [],
          google_rating: request.google_rating || null,
          google_ratings_count: request.google_ratings_count || null
        };
      });

      // Insert gyms
      const { error: insertError } = await supabase
        .from('gyms')
        .insert(gymsToInsert);

      if (insertError) {
        console.error('Error inserting gyms:', insertError);
        showToast('error', 'Error', `Failed to create gyms: ${insertError.message}`);
        return;
      }

      // Update requests to approved
      const { error: updateError } = await supabase
        .from('gym_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id
        })
        .in('id', requestIds);

      if (updateError) {
        console.error('Error updating requests:', updateError);
        showToast('error', 'Error', `Failed to update requests: ${updateError.message}`);
        return;
      }

      showToast('success', 'Approved', `Successfully approved ${requests.length} gym request(s)`);
      setSelectedGymRequests(new Set());
      loadData();
    } catch (error) {
      console.error('Error bulk approving gym requests:', error);
      showToast('error', 'Error', 'Failed to bulk approve gym requests');
    }
  };

  // Toggle select all gym requests
  const toggleSelectAllGymRequests = () => {
    const pendingRequests = gymRequests.filter(r => r.status === 'pending');
    if (selectedGymRequests.size === pendingRequests.length) {
      setSelectedGymRequests(new Set());
    } else {
      setSelectedGymRequests(new Set(pendingRequests.map(r => r.id)));
    }
  };

  // Toggle individual gym request selection
  const toggleGymRequestSelection = (requestId) => {
    const newSelected = new Set(selectedGymRequests);
    if (newSelected.has(requestId)) {
      newSelected.delete(requestId);
    } else {
      newSelected.add(requestId);
    }
    setSelectedGymRequests(newSelected);
  };

  // Gym Management Functions
  const deleteGym = async (gymId) => {
    const gym = gyms.find(g => g.id === gymId);
    setConfirmationModal({
      isOpen: true,
      action: 'deleteGym',
      data: { gymId },
      title: 'Delete Gym',
      message: `Are you sure you want to delete "${gym?.name}"? This action cannot be undone and will also delete all associated reviews, images, and favorites.`,
      variant: 'danger',
      icon: Trash2,
      confirmText: 'Delete'
    });
  };

  const executeDeleteGym = async (gymId) => {
    try {
      const { error } = await supabase
        .from('gyms')
        .delete()
        .eq('id', gymId);

      if (error) throw error;

      showToast('success', 'Deleted', 'Gym deleted successfully');
      setOpenGymMenuId(null);
      loadData();
    } catch (error) {
      console.error('Error deleting gym:', error);
      showToast('error', 'Error', 'Failed to delete gym');
    }
  };

  const hideGym = async (gymId) => {
    try {
      const { error } = await supabase
        .from('gyms')
        .update({ is_hidden: true })
        .eq('id', gymId);

      if (error) throw error;

      showToast('success', 'Hidden', 'Gym hidden from public listing');
      setOpenGymMenuId(null);
      loadData();
    } catch (error) {
      console.error('Error hiding gym:', error);
      showToast('error', 'Error', 'Failed to hide gym');
    }
  };

  const showGym = async (gymId) => {
    try {
      const { error } = await supabase
        .from('gyms')
        .update({ is_hidden: false })
        .eq('id', gymId);

      if (error) throw error;

      showToast('success', 'Shown', 'Gym is now visible in public listing');
      setOpenGymMenuId(null);
      loadData();
    } catch (error) {
      console.error('Error showing gym:', error);
      showToast('error', 'Error', 'Failed to show gym');
    }
  };

  const executeUpdateGym = async (gymId, updates) => {
    try {
      const { error } = await supabase
        .from('gyms')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', gymId);

      if (error) throw error;

      showToast('success', 'Updated', 'Gym updated successfully');
      setEditingGym(null);
      loadData();
    } catch (error) {
      console.error('Error updating gym:', error);
      showToast('error', 'Error', 'Failed to update gym');
    }
  };

  const bulkDeleteGyms = () => {
    if (selectedGyms.size === 0) return;

    setConfirmationModal({
      isOpen: true,
      action: 'bulkDeleteGyms',
      data: { gymIds: Array.from(selectedGyms) },
      title: 'Bulk Delete Gyms',
      message: `Are you sure you want to delete ${selectedGyms.size} gym(s)? This action cannot be undone.`,
      variant: 'danger',
      icon: Trash2,
      confirmText: `Delete ${selectedGyms.size} Gyms`
    });
  };

  const executeBulkDeleteGyms = async (gymIds) => {
    try {
      const { error } = await supabase
        .from('gyms')
        .delete()
        .in('id', gymIds);

      if (error) throw error;

      showToast('success', 'Deleted', `Successfully deleted ${gymIds.length} gym(s)`);
      setSelectedGyms(new Set());
      loadData();
    } catch (error) {
      console.error('Error bulk deleting gyms:', error);
      showToast('error', 'Error', 'Failed to bulk delete gyms');
    }
  };

  const bulkToggleGymVisibility = (hide) => {
    if (selectedGyms.size === 0) return;

    const action = hide ? 'bulkHideGyms' : 'bulkShowGyms';
    const title = hide ? 'Bulk Hide Gyms' : 'Bulk Show Gyms';
    const message = hide 
      ? `Are you sure you want to hide ${selectedGyms.size} gym(s) from public listing?`
      : `Are you sure you want to show ${selectedGyms.size} gym(s) in public listing?`;

    setConfirmationModal({
      isOpen: true,
      action,
      data: { gymIds: Array.from(selectedGyms), hide },
      title,
      message,
      variant: 'default',
      icon: hide ? EyeOff : Eye,
      confirmText: `${hide ? 'Hide' : 'Show'} ${selectedGyms.size} Gyms`
    });
  };

  const executeBulkToggleGymVisibility = async (gymIds, hide) => {
    try {
      const { error } = await supabase
        .from('gyms')
        .update({ is_hidden: hide })
        .in('id', gymIds);

      if (error) throw error;

      showToast('success', hide ? 'Hidden' : 'Shown', `Successfully ${hide ? 'hid' : 'showed'} ${gymIds.length} gym(s)`);
      setSelectedGyms(new Set());
      loadData();
    } catch (error) {
      console.error('Error bulk toggling gym visibility:', error);
      showToast('error', 'Error', 'Failed to update gym visibility');
    }
  };

  const exportGyms = (gymsToExport = null) => {
    const gymsData = gymsToExport || filteredGyms;
    
    if (gymsData.length === 0) {
      showToast('warning', 'No Data', 'No gyms to export');
      return;
    }

    const headers = ['Name', 'Country', 'City', 'Address', 'Phone', 'Email', 'Website', 'Description', 'Single Entry Price', 'Membership Price', 'Price Range (Legacy)', 'Difficulty Levels', 'Facilities', 'Opening Hours', 'Google Rating', 'Google Ratings Count', 'Reviews Count', 'Avg Rating', 'Favorites Count', 'Communities Count', 'Created At', 'Updated At', 'Latitude', 'Longitude'];
    
    const rows = gymsData.map(gym => {
      const metrics = gymMetrics[gym.id] || {};
      return [
        gym.name || '',
        gym.country || '',
        gym.city || '',
        gym.address || '',
        gym.phone || '',
        gym.email || '',
        gym.website || '',
        gym.description || '',
        gym.single_entry_price || '',
        gym.membership_price || '',
        gym.price_range || '',
        (gym.difficulty_levels || []).join('; '),
        Array.isArray(gym.facilities) ? gym.facilities.join('; ') : '',
        typeof gym.opening_hours === 'object' ? JSON.stringify(gym.opening_hours) : '',
        gym.google_rating || '',
        gym.google_ratings_count || '',
        metrics.reviewsCount || 0,
        metrics.avgRating ? metrics.avgRating.toFixed(2) : '',
        metrics.favoritesCount || 0,
        metrics.communitiesCount || 0,
        gym.created_at || '',
        gym.updated_at || '',
        gym.latitude || '',
        gym.longitude || ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `gyms_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('success', 'Exported', `Exported ${gymsData.length} gym(s) to CSV`);
  };

  const handleSelectGym = (gymId) => {
    const newSelected = new Set(selectedGyms);
    if (newSelected.has(gymId)) {
      newSelected.delete(gymId);
    } else {
      newSelected.add(gymId);
    }
    setSelectedGyms(newSelected);
  };

  const handleSelectAllGyms = () => {
    const filtered = getFilteredGyms();
    if (selectedGyms.size === filtered.length && filtered.length > 0) {
      setSelectedGyms(new Set());
    } else {
      setSelectedGyms(new Set(filtered.map(g => g.id)));
    }
  };

  const getFilteredGyms = () => {
    let filtered = [...gyms];

    // Search filter
    if (gymSearchQuery) {
      const query = gymSearchQuery.toLowerCase();
      filtered = filtered.filter(gym =>
        gym.name?.toLowerCase().includes(query) ||
        gym.city?.toLowerCase().includes(query) ||
        gym.country?.toLowerCase().includes(query) ||
        gym.address?.toLowerCase().includes(query)
      );
    }

    // Country filter
    if (gymFilters.country) {
      filtered = filtered.filter(gym => gym.country === gymFilters.country);
    }

    // City filter
    if (gymFilters.city) {
      filtered = filtered.filter(gym => gym.city === gymFilters.city);
    }

    // Date range filter
    if (gymFilters.dateFrom) {
      filtered = filtered.filter(gym => {
        const gymDate = new Date(gym.created_at);
        return gymDate >= new Date(gymFilters.dateFrom);
      });
    }

    if (gymFilters.dateTo) {
      filtered = filtered.filter(gym => {
        const gymDate = new Date(gym.created_at);
        const toDate = new Date(gymFilters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        return gymDate <= toDate;
      });
    }

    // Visibility filter (hidden/visible)
    if (gymFilters.visibility === 'hidden') {
      filtered = filtered.filter(gym => gym.is_hidden === true);
    } else if (gymFilters.visibility === 'visible') {
      filtered = filtered.filter(gym => !gym.is_hidden);
    }
    // If visibility is empty string '', show all gyms

    return filtered;
  };

  const filteredGyms = getFilteredGyms();

  // Community Management Functions
  const getFilteredCommunities = () => {
    let filtered = [...communities];

    // Search filter
    if (communitySearchQuery) {
      const query = communitySearchQuery.toLowerCase();
      filtered = filtered.filter(community =>
        community.name?.toLowerCase().includes(query) ||
        community.description?.toLowerCase().includes(query) ||
        community.gyms?.name?.toLowerCase().includes(query) ||
        community.gyms?.city?.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (communityFilters.type) {
      filtered = filtered.filter(community => community.community_type === communityFilters.type);
    }

    // Gym association filter
    if (communityFilters.hasGym === 'with_gym') {
      filtered = filtered.filter(community => community.gym_id !== null);
    } else if (communityFilters.hasGym === 'without_gym') {
      filtered = filtered.filter(community => community.gym_id === null);
    }

    // Date range filter
    if (communityFilters.dateFrom) {
      filtered = filtered.filter(community => {
        const communityDate = new Date(community.created_at);
        return communityDate >= new Date(communityFilters.dateFrom);
      });
    }

    if (communityFilters.dateTo) {
      filtered = filtered.filter(community => {
        const communityDate = new Date(community.created_at);
        const toDate = new Date(communityFilters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        return communityDate <= toDate;
      });
    }

    // Status filter (active/suspended)
    if (communityFilters.status === 'suspended') {
      filtered = filtered.filter(community => community.is_active === false);
    } else if (communityFilters.status === 'active') {
      filtered = filtered.filter(community => community.is_active !== false);
    }
    // If status is empty string '', show all communities

    return filtered;
  };

  const filteredCommunities = getFilteredCommunities();

  // Feedback Management Functions
  const getFilteredFeedback = () => {
    let filtered = [...feedback];

    // Search filter
    if (feedbackSearchQuery) {
      const query = feedbackSearchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.title?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.user_name?.toLowerCase().includes(query) ||
        item.user_email?.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (feedbackFilters.type) {
      filtered = filtered.filter(item => item.type === feedbackFilters.type);
    }

    // Status filter
    if (feedbackFilters.status) {
      filtered = filtered.filter(item => item.status === feedbackFilters.status);
    }

    // Priority filter
    if (feedbackFilters.priority) {
      filtered = filtered.filter(item => item.priority === feedbackFilters.priority);
    }

    return filtered;
  };

  const filteredFeedback = getFilteredFeedback();

  const handleUpdateFeedbackStatus = async (feedbackId, status, priority = null, adminResponse = null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const updateData = {
        status,
        updated_at: new Date().toISOString()
      };

      if (priority !== null) {
        updateData.priority = priority;
      }

      if (adminResponse !== null) {
        updateData.admin_response = adminResponse;
        updateData.admin_user_id = user?.id;
      }

      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('feedback')
        .update(updateData)
        .eq('id', feedbackId);

      if (error) throw error;

      showToast('success', 'Feedback Updated', `Feedback status updated to ${status}`);
      loadData();
      setEditingFeedback(null);
    } catch (error) {
      console.error('Error updating feedback:', error);
      showToast('error', 'Error', 'Failed to update feedback');
    }
  };

  const handleSelectFeedback = (feedbackId) => {
    setSelectedFeedback(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(feedbackId)) {
        newSelected.delete(feedbackId);
      } else {
        newSelected.add(feedbackId);
      }
      return newSelected;
    });
  };

  const handleSelectAllFeedback = () => {
    const filtered = getFilteredFeedback();
    if (selectedFeedback.size === filtered.length && filtered.length > 0) {
      setSelectedFeedback(new Set());
    } else {
      setSelectedFeedback(new Set(filtered.map(f => f.id)));
    }
  };

  const handleSelectCommunity = (communityId) => {
    setSelectedCommunities(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(communityId)) {
        newSelected.delete(communityId);
      } else {
        newSelected.add(communityId);
      }
      return newSelected;
    });
  };

  const handleSelectAllCommunities = () => {
    const filtered = getFilteredCommunities();
    if (selectedCommunities.size === filtered.length && filtered.length > 0) {
      setSelectedCommunities(new Set());
    } else {
      setSelectedCommunities(new Set(filtered.map(c => c.id)));
    }
  };

  const deleteCommunityFromList = async (communityId) => {
    const community = communities.find(c => c.id === communityId);
    setConfirmationModal({
      isOpen: true,
      action: 'deleteCommunityFromList',
      data: { communityId },
      title: 'Delete Community',
      message: `Are you sure you want to delete "${community?.name}"? This action cannot be undone and will also delete all associated posts, comments, and members.`,
      variant: 'danger',
      icon: Trash2,
      confirmText: 'Delete'
    });
  };

  const executeDeleteCommunityFromList = async (communityId) => {
    try {
      // First verify admin status
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast('error', 'Error', 'You must be logged in');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error checking admin status:', profileError);
        showToast('error', 'Error', 'Failed to verify admin status');
        return;
      }

      if (!profile?.is_admin) {
        showToast('error', 'Permission Denied', 'You must be an admin to delete communities');
        return;
      }

      const { data, error } = await supabase
        .from('communities')
        .delete()
        .eq('id', communityId)
        .select();

      if (error) {
        console.error('Error deleting community:', error);
        let errorMessage = 'Failed to delete community';
        if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('policy')) {
          errorMessage = 'Permission denied. Please ensure the RLS policy allows admins to delete communities. Run the SQL script: fix-community-suspend-policy.sql';
        } else if (error.message) {
          errorMessage += `: ${error.message}`;
        }
        showToast('error', 'Error', errorMessage);
        return;
      }

      // Check if the community was actually deleted
      if (!data || data.length === 0) {
        showToast('warning', 'Not Found', 'Community not found or already deleted');
        setOpenCommunityMenuId(null);
        loadData();
        return;
      }

      showToast('success', 'Deleted', 'Community deleted successfully');
      setOpenCommunityMenuId(null);
      loadData();
    } catch (error) {
      console.error('Error deleting community:', error);
      showToast('error', 'Error', `Failed to delete community: ${error.message || 'Unknown error'}`);
    }
  };

  const bulkDeleteCommunities = () => {
    if (selectedCommunities.size === 0) return;

    setConfirmationModal({
      isOpen: true,
      action: 'bulkDeleteCommunities',
      data: { communityIds: Array.from(selectedCommunities) },
      title: 'Bulk Delete Communities',
      message: `Are you sure you want to delete ${selectedCommunities.size} community/communities? This action cannot be undone.`,
      variant: 'danger',
      icon: Trash2,
      confirmText: `Delete ${selectedCommunities.size} Communities`
    });
  };

  const executeBulkDeleteCommunities = async (communityIds) => {
    try {
      // First verify admin status
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast('error', 'Error', 'You must be logged in');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error checking admin status:', profileError);
        showToast('error', 'Error', 'Failed to verify admin status');
        return;
      }

      if (!profile?.is_admin) {
        showToast('error', 'Permission Denied', 'You must be an admin to delete communities');
        return;
      }

      const { data, error } = await supabase
        .from('communities')
        .delete()
        .in('id', communityIds)
        .select();

      if (error) {
        console.error('Error bulk deleting communities:', error);
        let errorMessage = 'Failed to delete communities';
        if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('policy')) {
          errorMessage = 'Permission denied. Please ensure the RLS policy allows admins to delete communities. Run the SQL script: fix-community-suspend-policy.sql';
        } else if (error.message) {
          errorMessage += `: ${error.message}`;
        }
        showToast('error', 'Error', errorMessage);
        return;
      }

      const deletedCount = data ? data.length : 0;
      if (deletedCount === 0) {
        showToast('warning', 'Not Found', 'No communities were deleted. They may not exist or you may not have permission.');
        setSelectedCommunities(new Set());
        loadData();
        return;
      }

      showToast('success', 'Deleted', `Successfully deleted ${deletedCount} community/communities`);
      setSelectedCommunities(new Set());
      loadData();
    } catch (error) {
      console.error('Error bulk deleting communities:', error);
      showToast('error', 'Error', `Failed to bulk delete communities: ${error.message || 'Unknown error'}`);
    }
  };

  const suspendCommunity = async (communityId) => {
    try {
      // First verify admin status
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast('error', 'Error', 'You must be logged in');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error checking admin status:', profileError);
        showToast('error', 'Error', 'Failed to verify admin status');
        return;
      }

      if (!profile?.is_admin) {
        showToast('error', 'Permission Denied', 'You must be an admin to suspend communities');
        return;
      }

      console.log('Attempting to suspend community:', communityId);
      const { data, error } = await supabase
        .from('communities')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', communityId)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        
        let errorMessage = 'Failed to suspend community';
        if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('policy')) {
          errorMessage = 'Permission denied. Please ensure the RLS policy allows admins to update communities. Run the SQL script: fix-community-suspend-policy.sql';
        } else if (error.message) {
          errorMessage += `: ${error.message}`;
        }
        
        showToast('error', 'Error', errorMessage);
        return;
      }

      console.log('Successfully suspended community:', data);
      showToast('success', 'Suspended', 'Community suspended successfully');
      setOpenCommunityMenuId(null);
      loadData();
    } catch (error) {
      console.error('Error suspending community:', error);
      showToast('error', 'Error', `Failed to suspend community: ${error.message || 'Unknown error'}`);
    }
  };

  const unsuspendCommunity = async (communityId) => {
    try {
      // First verify admin status
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast('error', 'Error', 'You must be logged in');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error checking admin status:', profileError);
        showToast('error', 'Error', 'Failed to verify admin status');
        return;
      }

      if (!profile?.is_admin) {
        showToast('error', 'Permission Denied', 'You must be an admin to unsuspend communities');
        return;
      }

      console.log('Attempting to unsuspend community:', communityId);
      const { data, error } = await supabase
        .from('communities')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('id', communityId)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        
        let errorMessage = 'Failed to unsuspend community';
        if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('policy')) {
          errorMessage = 'Permission denied. Please ensure the RLS policy allows admins to update communities. Run the SQL script: fix-community-suspend-policy.sql';
        } else if (error.message) {
          errorMessage += `: ${error.message}`;
        }
        
        showToast('error', 'Error', errorMessage);
        return;
      }

      console.log('Successfully unsuspended community:', data);
      showToast('success', 'Unsuspended', 'Community unsuspended successfully');
      setOpenCommunityMenuId(null);
      loadData();
    } catch (error) {
      console.error('Error unsuspending community:', error);
      showToast('error', 'Error', `Failed to unsuspend community: ${error.message || 'Unknown error'}`);
    }
  };

  const bulkToggleCommunityStatus = (suspend) => {
    if (selectedCommunities.size === 0) return;

    const action = suspend ? 'bulkSuspendCommunities' : 'bulkUnsuspendCommunities';
    const title = suspend ? 'Bulk Suspend Communities' : 'Bulk Unsuspend Communities';
    const message = suspend 
      ? `Are you sure you want to suspend ${selectedCommunities.size} community/communities? They will be hidden from public view.`
      : `Are you sure you want to unsuspend ${selectedCommunities.size} community/communities? They will be visible in public view.`;

    setConfirmationModal({
      isOpen: true,
      action,
      data: { communityIds: Array.from(selectedCommunities) },
      title,
      message,
      variant: suspend ? 'danger' : 'default',
      icon: suspend ? AlertCircle : CheckCircle,
      confirmText: suspend ? `Suspend ${selectedCommunities.size} Communities` : `Unsuspend ${selectedCommunities.size} Communities`
    });
  };

  const executeBulkToggleCommunityStatus = async (communityIds, suspend) => {
    try {
      // First verify admin status
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast('error', 'Error', 'You must be logged in');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error checking admin status:', profileError);
        showToast('error', 'Error', 'Failed to verify admin status');
        return;
      }

      if (!profile?.is_admin) {
        showToast('error', 'Permission Denied', 'You must be an admin to suspend/unsuspend communities');
        return;
      }

      // Check current status of communities before updating
      const { data: currentCommunities, error: fetchError } = await supabase
        .from('communities')
        .select('id, is_active')
        .in('id', communityIds);

      if (fetchError) {
        console.error('Error fetching community status:', fetchError);
        showToast('error', 'Error', 'Failed to check community status');
        return;
      }

      // Filter communities based on what actually needs to change
      const targetStatus = !suspend; // true if unsuspending, false if suspending
      const communitiesToUpdate = currentCommunities.filter(
        community => community.is_active !== targetStatus
      );

      if (communitiesToUpdate.length === 0) {
        const message = suspend 
          ? 'Selected communities are already suspended'
          : 'Selected communities are already active';
        showToast('warning', 'No Changes Needed', message);
        setSelectedCommunities(new Set());
        return;
      }

      const idsToUpdate = communitiesToUpdate.map(c => c.id);

      console.log(`Attempting to ${suspend ? 'suspend' : 'unsuspend'} ${idsToUpdate.length} communities:`, idsToUpdate);
      const { error } = await supabase
        .from('communities')
        .update({ 
          is_active: targetStatus,
          updated_at: new Date().toISOString()
        })
        .in('id', idsToUpdate)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        
        let errorMessage = `Failed to ${suspend ? 'suspend' : 'unsuspend'} communities`;
        if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('policy')) {
          errorMessage = 'Permission denied. Please ensure the RLS policy allows admins to update communities. Run the SQL script: fix-community-suspend-policy.sql';
        } else if (error.message) {
          errorMessage += `: ${error.message}`;
        }
        
        showToast('error', 'Error', errorMessage);
        return;
      }

      // At this point, update was successful, so all idsToUpdate were updated
      const updatedCount = idsToUpdate.length;
      const skippedCount = communityIds.length - idsToUpdate.length;
      let successMessage = `Successfully ${suspend ? 'suspended' : 'unsuspended'} ${updatedCount} community/communities`;
      if (skippedCount > 0) {
        successMessage += ` (${skippedCount} already ${suspend ? 'suspended' : 'active'}, skipped)`;
      }

      showToast('success', suspend ? 'Suspended' : 'Unsuspended', successMessage);
      setSelectedCommunities(new Set());
      loadData();
    } catch (error) {
      console.error('Error bulk toggling community status:', error);
      showToast('error', 'Error', `Failed to ${suspend ? 'suspend' : 'unsuspend'} communities: ${error.message || 'Unknown error'}`);
    }
  };

  const exportCommunities = (communitiesToExport = null) => {
    const communitiesData = communitiesToExport || filteredCommunities;
    
    if (communitiesData.length === 0) {
      showToast('warning', 'No Data', 'No communities to export');
      return;
    }

    const headers = ['Name', 'Description', 'Type', 'Gym Name', 'Gym City', 'Gym Country', 'Member Count', 'Posts Count', 'Moderators Count', 'Rules', 'Status', 'Created At', 'Updated At'];
    
    const rows = communitiesData.map(community => {
      const metrics = communityMetrics[community.id] || {};
      return [
        community.name || '',
        community.description || '',
        community.community_type || '',
        community.gyms?.name || '',
        community.gyms?.city || '',
        community.gyms?.country || '',
        metrics.membersCount || 0,
        metrics.postsCount || 0,
        metrics.moderatorsCount || 0,
        community.rules || '',
        community.is_active === false ? 'Suspended' : 'Active',
        new Date(community.created_at).toLocaleString(),
        community.updated_at ? new Date(community.updated_at).toLocaleString() : ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `communities_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('success', 'Exported', `Exported ${communitiesData.length} community/communities`);
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
      // First verify admin status
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast('error', 'Error', 'You must be logged in');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error checking admin status:', profileError);
        showToast('error', 'Error', 'Failed to verify admin status');
        return;
      }

      if (!profile?.is_admin) {
        showToast('error', 'Permission Denied', 'You must be an admin to delete communities');
        return;
      }

      const { data, error: deleteError } = await supabase
        .from('communities')
        .delete()
        .eq('id', communityId)
        .select();

      if (deleteError) {
        console.error('Error deleting community:', deleteError);
        let errorMessage = 'Failed to delete community';
        if (deleteError.code === '42501' || deleteError.message?.includes('permission denied') || deleteError.message?.includes('policy')) {
          errorMessage = 'Permission denied. Please ensure the RLS policy allows admins to delete communities. Run the SQL script: fix-community-suspend-policy.sql';
        } else if (deleteError.message) {
          errorMessage += `: ${deleteError.message}`;
        }
        showToast('error', 'Error', errorMessage);
        return;
      }

      // Check if the community was actually deleted
      if (!data || data.length === 0) {
        showToast('warning', 'Not Found', 'Community not found or already deleted');
        if (reportId) {
          // Still try to update the report
          await supabase.from('community_reports').update({
            status: 'action_taken',
            reviewed_at: new Date().toISOString(),
            reviewed_by: user.id,
            action_taken: 'community_deleted'
          }).eq('id', reportId);
        }
        loadData();
        return;
      }

      if (reportId) {
        const { error: reportError } = await supabase
          .from('community_reports')
          .update({
            status: 'action_taken',
            reviewed_at: new Date().toISOString(),
            reviewed_by: user.id,
            action_taken: 'community_deleted'
          })
          .eq('id', reportId);

        if (reportError) {
          console.error('Error updating report:', reportError);
          // Don't fail the whole operation if report update fails
        }
      }

      showToast('success', 'Deleted', 'Community deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting community:', error);
      showToast('error', 'Error', `Failed to delete community: ${error.message || 'Unknown error'}`);
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

  // Enhanced filtering with consolidated date and status filters
  const filteredUsers = users.filter(user => {
    // Text search filter
    const matchesSearch = userSearchQuery === '' || 
      user.full_name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(userSearchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Status filter
    if (statusFilter.length > 0) {
      const userStatuses = [];
      if (user.is_admin) userStatuses.push('admin');
      if (user.is_banned) userStatuses.push('banned');
      if (userModeratorStatus[user.id]) userStatuses.push('moderator');
      if (!user.is_admin && !user.is_banned && !userModeratorStatus[user.id]) userStatuses.push('regular');
      
      const hasMatchingStatus = statusFilter.some(status => userStatuses.includes(status));
      if (!hasMatchingStatus) return false;
    }
    
    // Consolidated date filter (registration or last active)
    if (dateFilter.from || dateFilter.to) {
      let dateToCheck;
      if (dateFilter.type === 'registration') {
        dateToCheck = new Date(user.created_at);
      } else {
        dateToCheck = user.last_active_at ? new Date(user.last_active_at) : new Date(user.created_at);
      }
      
      if (dateFilter.from) {
        const fromDate = new Date(dateFilter.from);
        if (dateToCheck < fromDate) return false;
      }
      if (dateFilter.to) {
        const toDate = new Date(dateFilter.to);
        toDate.setHours(23, 59, 59, 999); // Include entire day
        if (dateToCheck > toDate) return false;
      }
    }
    
    return true;
  });

  // Bulk action handlers
  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const handleSelectUser = (userId) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleBulkBan = () => {
    if (selectedUsers.size === 0) return;
    setConfirmationModal({
      isOpen: true,
      action: 'bulkBan',
      data: { userIds: Array.from(selectedUsers) },
      title: 'Ban Multiple Users',
      message: `Are you sure you want to ban ${selectedUsers.size} user(s)? They will be unable to access the platform.`,
      variant: 'danger',
      icon: Ban,
      confirmText: `Ban ${selectedUsers.size} Users`
    });
  };

  const handleBulkDelete = () => {
    if (selectedUsers.size === 0) return;
    setConfirmationModal({
      isOpen: true,
      action: 'bulkDelete',
      data: { userIds: Array.from(selectedUsers) },
      title: 'Delete Multiple Users',
      message: `Are you sure you want to permanently delete ${selectedUsers.size} user(s)? This action cannot be undone.`,
      variant: 'danger',
      icon: Trash2,
      confirmText: `Delete ${selectedUsers.size} Users`
    });
  };

  const executeBulkBan = async (userIds) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: true })
        .in('id', userIds);
      
      if (error) throw error;
      
      showToast('success', 'Users Banned', `${userIds.length} user(s) have been banned.`);
      setSelectedUsers(new Set());
      loadData();
    } catch (error) {
      console.error('Error bulk banning users:', error);
      showToast('error', 'Error', 'Failed to ban users.');
    }
  };

  const executeBulkDelete = async (userIds) => {
    try {
      // Delete from auth.users (cascades to profiles)
      for (const userId of userIds) {
        const { error } = await supabase.auth.admin.deleteUser(userId);
        if (error) {
          console.error(`Error deleting user ${userId}:`, error);
        }
      }
      
      showToast('success', 'Users Deleted', `${userIds.length} user(s) have been deleted.`);
      setSelectedUsers(new Set());
      loadData();
    } catch (error) {
      console.error('Error bulk deleting users:', error);
      showToast('error', 'Error', 'Failed to delete users.');
    }
  };

  const loadUserActivity = async (userId) => {
    setLoadingUserActivity(true);
    try {
      const [postsRes, commentsRes] = await Promise.all([
        supabase
          .from('posts')
          .select('*, communities(id, name)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('comments')
          .select('*, posts(id, title)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50)
      ]);

      setUserActivity({
        posts: postsRes.data || [],
        comments: commentsRes.data || []
      });
    } catch (error) {
      console.error('Error loading user activity:', error);
      showToast('error', 'Error', 'Failed to load user activity.');
    } finally {
      setLoadingUserActivity(false);
    }
  };

  const handleViewUserDetails = async (user) => {
    setViewingUser(user);
    await loadUserActivity(user.id);
  };

  const handleEditUser = (user) => {
    setEditingUser({ ...user });
    setOpenMenuId(null);
  };

  const handleUpdateUser = async (userData) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: userData.full_name,
          email: userData.email,
          bio: userData.bio,
          company: userData.company,
          role: userData.role,
          climbing_grade: userData.climbing_grade,
          years_climbing: userData.years_climbing,
          favorite_style: userData.favorite_style,
          instagram_url: userData.instagram_url,
          twitter_url: userData.twitter_url,
          website_url: userData.website_url,
          show_email: userData.show_email,
          show_activity: userData.show_activity,
          allow_direct_messages: userData.allow_direct_messages,
          updated_at: new Date().toISOString()
        })
        .eq('id', userData.id);

      if (error) throw error;

      showToast('success', 'User Updated', 'User profile has been updated successfully.');
      setEditingUser(null);
      loadData();
    } catch (error) {
      console.error('Error updating user:', error);
      showToast('error', 'Error', 'Failed to update user profile.');
    }
  };

  const exportUserData = () => {
    const csvRows = [];
    
    // Header row
    csvRows.push([
      'ID',
      'Full Name',
      'Email',
      'Registration Date',
      'Last Active',
      'Posts',
      'Comments',
      'Is Admin',
      'Is Banned'
    ].join(','));

    // Data rows
    filteredUsers.forEach(user => {
      csvRows.push([
        user.id,
        `"${user.full_name || ''}"`,
        `"${user.email || ''}"`,
        user.created_at ? new Date(user.created_at).toLocaleDateString() : '',
        user.last_active_at ? new Date(user.last_active_at).toLocaleDateString() : '',
        user.posts_count || 0,
        user.comments_count || 0,
        user.is_admin ? 'Yes' : 'No',
        user.is_banned ? 'Yes' : 'No'
      ].join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('success', 'Export Complete', 'User data has been exported to CSV.');
  };

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
      case 'bulkBan':
        executeBulkBan(data.userIds);
        break;
      case 'bulkDelete':
        executeBulkDelete(data.userIds);
        break;
      case 'approveGymRequest':
        executeApproveGymRequest(data.requestId);
        break;
      case 'rejectGymRequest':
        executeRejectGymRequest(data.requestId);
        break;
      case 'bulkApproveGymRequests':
        executeBulkApproveGymRequests(data.requestIds);
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
      case 'deleteCommunityFromList':
        executeDeleteCommunityFromList(data.communityId);
        break;
      case 'bulkDeleteCommunities':
        executeBulkDeleteCommunities(data.communityIds);
        break;
      case 'bulkSuspendCommunities':
        executeBulkToggleCommunityStatus(data.communityIds, true);
        break;
      case 'bulkUnsuspendCommunities':
        executeBulkToggleCommunityStatus(data.communityIds, false);
        break;
      case 'deletePost':
        executeDeletePost(data.postId, data.reportId);
        break;
      case 'deleteComment':
        executeDeleteComment(data.commentId, data.reportId);
        break;
      case 'deleteGym':
        executeDeleteGym(data.gymId);
        break;
      case 'bulkDeleteGyms':
        executeBulkDeleteGyms(data.gymIds);
        break;
      case 'bulkHideGyms':
        executeBulkToggleGymVisibility(data.gymIds, true);
        break;
      case 'bulkShowGyms':
        executeBulkToggleGymVisibility(data.gymIds, false);
        break;
      default:
        break;
    }
  };

  const calculateCommunityChanges = (originalData, newData) => {
    const changes = [];
    
    // Compare name
    const oldName = (originalData.name || '').trim();
    const newName = (newData.name || '').trim();
    if (oldName !== newName) {
      changes.push({
        field: 'Name',
        oldValue: oldName || '(empty)',
        newValue: newName || '(empty)'
      });
    }
    
    // Compare description
    const oldDescription = (originalData.description || '').trim();
    const newDescription = (newData.description || '').trim();
    if (oldDescription !== newDescription) {
      changes.push({
        field: 'Description',
        oldValue: oldDescription || '(empty)',
        newValue: newDescription || '(empty)'
      });
    }
    
    // Compare rules
    const oldRules = (originalData.rules || '').trim();
    const newRules = (newData.rules || '').trim();
    if (oldRules !== newRules) {
      changes.push({
        field: 'Rules',
        oldValue: oldRules || '(empty)',
        newValue: newRules || '(empty)'
      });
    }
    
    return changes;
  };

  const updateCommunity = async (updates) => {
    if (!editingCommunity || isUpdatingCommunity) return false;
    
    setIsUpdatingCommunity(true);
    try {
      console.log('Updating community with data:', updates);
      console.log('Community ID:', editingCommunity.id);

      // Do the update without select to avoid 406 errors
      // Note: Requires RLS policy that allows admins to update communities
      // Run sql-scripts/add-community-update-policy.sql in Supabase SQL Editor
      const { error } = await supabase
        .from('communities')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingCommunity.id);
      
      if (error) {
        console.error('Supabase error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        let errorMessage = 'Failed to update community';
        
        if (error.message) {
          errorMessage += `: ${error.message}`;
        } else if (error.details) {
          errorMessage += `: ${error.details}`;
        } else if (error.code) {
          errorMessage += ` (${error.code})`;
        }
        
        showToast('error', 'Error', errorMessage);
        setIsUpdatingCommunity(false);
        return false;
      }

      console.log('Community update successful');

      // Update local state immediately
      setCommunities(prev => prev.map(c => 
        c.id === editingCommunity.id ? { ...c, ...updates } : c
      ));
      
      // Close modal and reset states
      setEditingCommunity(null);
      setOriginalCommunityData(null);
      setShowCommunityChangesConfirmation(false);
      setPendingCommunityChanges(null);

      // Reload data to ensure we have the latest state from database
      await loadData();
      
      showToast('success', 'Success', 'Community updated successfully');
      setIsUpdatingCommunity(false);
      return true;
    } catch (error) {
      console.error('Error updating community:', error);
      console.error('Error stack:', error.stack);
      showToast('error', 'Error', `Something went wrong: ${error.message}`);
      setIsUpdatingCommunity(false);
      return false;
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
              <h1 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Access Denied</h1>
              <p className="text-sm text-gray-400 mb-6">You need admin access to view this page.</p>
              <button
                onClick={() => navigate('/communities')}
                className="px-4 py-2 bg-[#087E8B] text-white text-sm hover:bg-[#066a75] transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout currentPage="admin">
      <div className="mobile-container" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <div className="mobile-section" style={{ gap: 0, paddingTop: 0, paddingBottom: 0 }}>
          {/* Tabs */}
          <div className="bg-gray-800/50 border border-gray-700/50 flex gap-px overflow-x-auto" style={{ borderRadius: 0 }}>
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-shrink-0 py-2 px-3 text-xs font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-[#087E8B] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
              }`}
              style={{ borderRadius: 0 }}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-shrink-0 py-2 px-3 text-xs font-medium transition-colors ${
                activeTab === 'users'
                  ? 'bg-[#087E8B] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
              }`}
              style={{ borderRadius: 0 }}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('communities')}
              className={`flex-shrink-0 py-2 px-3 text-xs font-medium transition-colors ${
                activeTab === 'communities'
                  ? 'bg-[#087E8B] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
              }`}
              style={{ borderRadius: 0 }}
            >
              Communities
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-shrink-0 py-2 px-3 text-xs font-medium transition-colors ${
                activeTab === 'requests'
                  ? 'bg-[#087E8B] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
              }`}
              style={{ borderRadius: 0 }}
            >
              Requests
            </button>
            <button
              onClick={() => setActiveTab('gyms')}
              className={`flex-shrink-0 py-2 px-3 text-xs font-medium transition-colors ${
                activeTab === 'gyms'
                  ? 'bg-[#087E8B] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
              }`}
              style={{ borderRadius: 0 }}
            >
              Gyms
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex-shrink-0 py-2 px-3 text-xs font-medium transition-colors ${
                activeTab === 'reports'
                  ? 'bg-[#087E8B] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
              }`}
              style={{ borderRadius: 0 }}
            >
              Reports
            </button>
            <button
              onClick={() => setActiveTab('moderation')}
              className={`flex-shrink-0 py-2 px-3 text-xs font-medium transition-colors ${
                activeTab === 'moderation'
                  ? 'bg-[#087E8B] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
              }`}
              style={{ borderRadius: 0 }}
            >
              Moderation
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`flex-shrink-0 py-2 px-3 text-xs font-medium transition-colors ${
                activeTab === 'feedback'
                  ? 'bg-[#087E8B] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
              }`}
              style={{ borderRadius: 0 }}
            >
              Feedback
              {feedback.filter(f => f.status === 'open').length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full">
                  {feedback.filter(f => f.status === 'open').length}
                </span>
              )}
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="bg-gray-800/50 border border-gray-700/50" style={{ borderRadius: 0 }}>
              <div className="p-4 border-b border-gray-700/50">
                <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Dashboard Overview</h2>
              </div>
              <div className="p-4 space-y-4">
                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <button
                    onClick={() => setActiveTab('users')}
                    className="bg-gray-900/50 p-4 border border-gray-700/50 hover:bg-gray-900/70 transition-colors text-left"
                    style={{ borderRadius: 2 }}
                  >
                    <Users className="w-5 h-5 text-gray-400 mb-2" />
                    <p className="text-xs text-gray-400 mb-1">Total Users</p>
                    <p className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{users.length}</p>
                  </button>
                  <button
                    onClick={() => setActiveTab('communities')}
                    className="bg-gray-900/50 p-4 border border-gray-700/50 hover:bg-gray-900/70 transition-colors text-left"
                    style={{ borderRadius: 2 }}
                  >
                    <Settings className="w-5 h-5 text-gray-400 mb-2" />
                    <p className="text-xs text-gray-400 mb-1">Communities</p>
                    <p className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{communities.length}</p>
                  </button>
                  <button
                    onClick={() => setActiveTab('gyms')}
                    className="bg-gray-900/50 p-4 border border-gray-700/50 hover:bg-gray-900/70 transition-colors text-left"
                    style={{ borderRadius: 2 }}
                  >
                    <MapPin className="w-5 h-5 text-blue-400 mb-2" />
                    <p className="text-xs text-gray-400 mb-1">Total Gyms</p>
                    <p className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{gyms.length}</p>
                  </button>
                  <button
                    onClick={() => setActiveTab('users')}
                    className="bg-gray-900/50 p-4 border border-gray-700/50 hover:bg-gray-900/70 transition-colors text-left"
                    style={{ borderRadius: 2 }}
                  >
                    <Shield className="w-5 h-5 text-amber-400 mb-2" />
                    <p className="text-xs text-gray-400 mb-1">Admins</p>
                    <p className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{users.filter(u => u.is_admin).length}</p>
                  </button>
                  <button
                    onClick={() => setActiveTab('requests')}
                    className="bg-gray-900/50 p-4 border border-gray-700/50 hover:bg-gray-900/70 transition-colors text-left"
                    style={{ borderRadius: 2 }}
                  >
                    <MapPin className="w-5 h-5 text-gray-400 mb-2" />
                    <p className="text-xs text-gray-400 mb-1">Pending Requests</p>
                    <p className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{gymRequests.filter(r => r.status === 'pending').length}</p>
                  </button>
                  <button
                    onClick={() => setActiveTab('reports')}
                    className="bg-gray-900/50 p-4 border border-gray-700/50 hover:bg-gray-900/70 transition-colors text-left"
                    style={{ borderRadius: 2 }}
                  >
                    <Flag className="w-5 h-5 text-gray-400 mb-2" />
                    <p className="text-xs text-gray-400 mb-1">Pending Reports</p>
                    <p className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{communityReports.filter(r => r.status === 'pending').length}</p>
                  </button>
                  <button
                    onClick={() => setActiveTab('moderation')}
                    className="bg-gray-900/50 p-4 border border-gray-700/50 hover:bg-gray-900/70 transition-colors text-left"
                    style={{ borderRadius: 2 }}
                  >
                    <AlertCircle className="w-5 h-5 text-red-400 mb-2" />
                    <p className="text-xs text-gray-400 mb-1">Content Reports</p>
                    <p className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {postReports.filter(r => r.status === 'pending').length + commentReports.filter(r => r.status === 'pending').length}
                    </p>
                  </button>
                  <button
                    onClick={() => setActiveTab('feedback')}
                    className="bg-gray-900/50 p-4 border border-gray-700/50 hover:bg-gray-900/70 transition-colors text-left"
                    style={{ borderRadius: 2 }}
                  >
                    <MessageSquare className="w-5 h-5 text-[#087E8B] mb-2" />
                    <p className="text-xs text-gray-400 mb-1">Open Feedback</p>
                    <p className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {feedback.filter(f => f.status === 'open').length}
                    </p>
                  </button>
                </div>

                {/* Activity Summary */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Activity</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-900/50 p-3 border border-gray-700/50" style={{ borderRadius: 2 }}>
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-400">Total Posts</span>
                      </div>
                      <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{posts.length}+</p>
                    </div>
                    <div className="bg-gray-900/50 p-3 border border-gray-700/50" style={{ borderRadius: 2 }}>
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-400">Total Comments</span>
                      </div>
                      <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{comments.length}+</p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setActiveTab('users')}
                      className="p-3 bg-gray-900/50 border border-gray-700/50 hover:bg-gray-900/70 transition-colors text-left"
                      style={{ borderRadius: 2 }}
                    >
                      <Users className="w-4 h-4 text-[#087E8B] mb-1" />
                      <p className="text-xs text-white font-medium">Manage Users</p>
                      <p className="text-xs text-gray-400 mt-1">View and manage all users</p>
                    </button>
                    <button
                      onClick={() => setActiveTab('moderation')}
                      className="p-3 bg-gray-900/50 border border-gray-700/50 hover:bg-gray-900/70 transition-colors text-left"
                      style={{ borderRadius: 2 }}
                    >
                      <AlertCircle className="w-4 h-4 text-red-400 mb-1" />
                      <p className="text-xs text-white font-medium">Review Reports</p>
                      <p className="text-xs text-gray-400 mt-1">Handle pending reports</p>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="bg-gray-800/50 border border-gray-700/50" style={{ borderRadius: 0 }}>
              <div className="p-4 border-b border-gray-700/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Users</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={exportUserData}
                      className="px-3 py-1.5 text-xs bg-gray-700/50 text-gray-300 hover:bg-gray-700 transition-colors flex items-center gap-1.5"
                      style={{ borderRadius: 2 }}
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export
                    </button>
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`px-3 py-1.5 text-xs transition-colors flex items-center gap-1.5 ${
                        showFilters ? 'bg-[#087E8B] text-white' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                      }`}
                      style={{ borderRadius: 2 }}
                    >
                      <Filter className="w-3.5 h-3.5" />
                      Filters
                    </button>
                  </div>
                </div>
                
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-700/50 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#087E8B]/50"
                    style={{ borderRadius: 2 }}
                  />
                </div>

                {/* Filters */}
                {showFilters && (
                  <div className="space-y-4 pt-3 border-t border-gray-700/50">
                    {/* Status Filter */}
                    <div>
                      <label className="text-xs text-gray-400 mb-2 block">Filter by Status</label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 'admin', label: 'Admin', activeClass: 'bg-amber-600 text-white', inactiveClass: 'bg-gray-700/50 text-gray-300 hover:bg-gray-700' },
                          { value: 'banned', label: 'Banned', activeClass: 'bg-red-600 text-white', inactiveClass: 'bg-gray-700/50 text-gray-300 hover:bg-gray-700' },
                          { value: 'moderator', label: 'Moderator', activeClass: 'bg-indigo-600 text-white', inactiveClass: 'bg-gray-700/50 text-gray-300 hover:bg-gray-700' },
                          { value: 'regular', label: 'Regular', activeClass: 'bg-gray-600 text-white', inactiveClass: 'bg-gray-700/50 text-gray-300 hover:bg-gray-700' }
                        ].map((status) => (
                          <button
                            key={status.value}
                            onClick={() => {
                              const newFilter = statusFilter.includes(status.value)
                                ? statusFilter.filter(s => s !== status.value)
                                : [...statusFilter, status.value];
                              setStatusFilter(newFilter);
                            }}
                            className={`px-3 py-1.5 text-xs transition-colors flex items-center gap-1.5 ${
                              statusFilter.includes(status.value)
                                ? status.activeClass
                                : status.inactiveClass
                            }`}
                            style={{ borderRadius: 2 }}
                          >
                            {statusFilter.includes(status.value) && (
                              <CheckCircle className="w-3 h-3" />
                            )}
                            {status.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Consolidated Date Filter */}
                    <div>
                      <label className="text-xs text-gray-400 mb-2 block">Date Filter</label>
                      <div className="flex gap-2 mb-2">
                        <button
                          onClick={() => setDateFilter({ ...dateFilter, type: 'registration' })}
                          className={`px-3 py-1.5 text-xs transition-colors ${
                            dateFilter.type === 'registration'
                              ? 'bg-[#087E8B] text-white'
                              : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                          }`}
                          style={{ borderRadius: 2 }}
                        >
                          Registration Date
                        </button>
                        <button
                          onClick={() => setDateFilter({ ...dateFilter, type: 'lastActive' })}
                          className={`px-3 py-1.5 text-xs transition-colors ${
                            dateFilter.type === 'lastActive'
                              ? 'bg-[#087E8B] text-white'
                              : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                          }`}
                          style={{ borderRadius: 2 }}
                        >
                          Last Active Date
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">From</label>
                          <input
                            type="date"
                            value={dateFilter.from}
                            onChange={(e) => setDateFilter({ ...dateFilter, from: e.target.value })}
                            className="w-full px-3 py-1.5 bg-gray-900/50 border border-gray-700/50 text-white text-xs focus:outline-none focus:border-[#087E8B]/50"
                            style={{ borderRadius: 2 }}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">To</label>
                          <input
                            type="date"
                            value={dateFilter.to}
                            onChange={(e) => setDateFilter({ ...dateFilter, to: e.target.value })}
                            className="w-full px-3 py-1.5 bg-gray-900/50 border border-gray-700/50 text-white text-xs focus:outline-none focus:border-[#087E8B]/50"
                            style={{ borderRadius: 2 }}
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setDateFilter({ type: 'registration', from: '', to: '' });
                        setStatusFilter([]);
                      }}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}

                {/* Bulk Actions Bar */}
                {selectedUsers.size > 0 && (
                  <div className="flex items-center justify-between p-3 bg-gray-900/30 border border-gray-700/50 rounded" style={{ borderRadius: 2 }}>
                    <span className="text-xs text-gray-300">{selectedUsers.size} user(s) selected</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleBulkBan}
                        className="px-3 py-1 text-xs bg-red-600 text-white hover:bg-red-700 transition-colors"
                        style={{ borderRadius: 2 }}
                      >
                        Ban Selected
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        className="px-3 py-1 text-xs bg-red-600 text-white hover:bg-red-700 transition-colors"
                        style={{ borderRadius: 2 }}
                      >
                        Delete Selected
                      </button>
                      <button
                        onClick={() => setSelectedUsers(new Set())}
                        className="px-3 py-1 text-xs bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                        style={{ borderRadius: 2 }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="divide-y divide-gray-700/50">
                {filteredUsers.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-sm text-gray-400">No users found</p>
                  </div>
                ) : (
                  <>
                    {/* Select All */}
                    <div className="p-3 border-b border-gray-700/50">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                          onChange={handleSelectAll}
                        />
                        <span className="text-xs text-gray-400">Select All ({filteredUsers.length})</span>
                      </label>
                    </div>

                    {filteredUsers.map((user) => (
                      <div key={user.id} className="p-4 flex items-center justify-between relative">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(user.id)}
                            onChange={() => handleSelectUser(user.id)}
                          />
                          <div className="w-8 h-8 bg-[#087E8B]/20 rounded-full flex items-center justify-center border border-gray-700/50 flex-shrink-0">
                            <span className="text-xs font-semibold text-[#087E8B]">
                              {user.full_name?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
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
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-gray-500">Joined {new Date(user.created_at).toLocaleDateString()}</span>
                              {user.last_active_at && (
                                <span className="text-xs text-gray-500">Active {new Date(user.last_active_at).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* 3-dot Menu */}
                        <div className="relative ml-3">
                          <button
                            onClick={(e) => {
                              const button = e.currentTarget;
                              const rect = button.getBoundingClientRect();
                              const menuHeight = 250;
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
                                  onClick={() => {
                                    handleViewUserDetails(user);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-800 transition-colors flex items-center gap-2"
                                  style={{ fontSize: '11px' }}
                                >
                                  <Activity className="w-3.5 h-3.5" />
                                  View Details & Activity
                                </button>
                                <button
                                  onClick={() => {
                                    handleEditUser(user);
                                  }}
                                  className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-800 transition-colors flex items-center gap-2"
                                  style={{ fontSize: '11px' }}
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  Edit Profile
                                </button>
                                <button
                                  onClick={() => {
                                    handleViewProfile(user.id);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-800 transition-colors flex items-center gap-2"
                                  style={{ fontSize: '11px' }}
                                >
                                  <User className="w-3.5 h-3.5" />
                                  View Public Profile
                                </button>
                                <button
                                  onClick={() => {
                                    handleStartChat(user.id);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-800 transition-colors flex items-center gap-2"
                                  style={{ fontSize: '11px' }}
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  Chat
                                </button>
                                <div className="border-t border-gray-700/50 my-1" />
                                {user.is_banned ? (
                                  <button
                                    onClick={() => {
                                      unbanUser(user.id);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-green-400 hover:bg-gray-800 transition-colors flex items-center gap-2"
                                    style={{ fontSize: '11px' }}
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                    Unban User
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      banUser(user.id);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-800 transition-colors flex items-center gap-2"
                                    style={{ fontSize: '11px' }}
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
                                    className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-800 transition-colors flex items-center gap-2"
                                    style={{ fontSize: '11px' }}
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
                                    className="w-full px-4 py-2 text-left text-indigo-400 hover:bg-gray-800 transition-colors flex items-center gap-2"
                                    style={{ fontSize: '11px' }}
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
                    ))}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Communities Tab */}
          {activeTab === 'communities' && (
            <div className="bg-gray-800/50 border border-gray-700/50" style={{ borderRadius: 0 }}>
              <div className="p-4 border-b border-gray-700/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Communities
                    <span className="ml-2 text-xs text-gray-400">({filteredCommunities.length})</span>
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => exportCommunities()}
                      className="px-3 py-1.5 text-xs bg-gray-700/50 text-gray-300 hover:bg-gray-700 transition-colors flex items-center gap-1.5"
                      style={{ borderRadius: 2 }}
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export
                    </button>
                    <button
                      onClick={() => setShowCommunityFilters(!showCommunityFilters)}
                      className={`px-3 py-1.5 text-xs transition-colors flex items-center gap-1.5 ${
                        showCommunityFilters ? 'bg-[#087E8B] text-white' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                      }`}
                      style={{ borderRadius: 2 }}
                    >
                      <Filter className="w-3.5 h-3.5" />
                      Filters
                    </button>
                  </div>
                </div>
                
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search communities by name, description, or gym..."
                    value={communitySearchQuery}
                    onChange={(e) => setCommunitySearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-700/50 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#087E8B]/50"
                    style={{ borderRadius: 2 }}
                  />
                </div>

                {/* Filters */}
                {showCommunityFilters && (
                  <div className="space-y-4 pt-3 border-t border-gray-700/50">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Type</label>
                        <select
                          value={communityFilters.type}
                          onChange={(e) => setCommunityFilters({ ...communityFilters, type: e.target.value })}
                          className="w-full px-3 py-1.5 bg-gray-900/50 border border-gray-700/50 text-white text-xs focus:outline-none focus:border-[#087E8B]/50"
                          style={{ borderRadius: 2 }}
                        >
                          <option value="">All Types</option>
                          <option value="gym">Gym Communities</option>
                          <option value="general">General Communities</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Gym Association</label>
                        <select
                          value={communityFilters.hasGym}
                          onChange={(e) => setCommunityFilters({ ...communityFilters, hasGym: e.target.value })}
                          className="w-full px-3 py-1.5 bg-gray-900/50 border border-gray-700/50 text-white text-xs focus:outline-none focus:border-[#087E8B]/50"
                          style={{ borderRadius: 2 }}
                        >
                          <option value="">All Communities</option>
                          <option value="with_gym">With Gym</option>
                          <option value="without_gym">Without Gym</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-2 block">Created Date Range</label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">From</label>
                          <input
                            type="date"
                            value={communityFilters.dateFrom}
                            onChange={(e) => setCommunityFilters({ ...communityFilters, dateFrom: e.target.value })}
                            className="w-full px-3 py-1.5 bg-gray-900/50 border border-gray-700/50 text-white text-xs focus:outline-none focus:border-[#087E8B]/50"
                            style={{ borderRadius: 2 }}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">To</label>
                          <input
                            type="date"
                            value={communityFilters.dateTo}
                            onChange={(e) => setCommunityFilters({ ...communityFilters, dateTo: e.target.value })}
                            className="w-full px-3 py-1.5 bg-gray-900/50 border border-gray-700/50 text-white text-xs focus:outline-none focus:border-[#087E8B]/50"
                            style={{ borderRadius: 2 }}
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Status</label>
                      <select
                        value={communityFilters.status}
                        onChange={(e) => setCommunityFilters({ ...communityFilters, status: e.target.value })}
                        className="w-full px-3 py-1.5 bg-gray-900/50 border border-gray-700/50 text-white text-xs focus:outline-none focus:border-[#087E8B]/50"
                        style={{ borderRadius: 2 }}
                      >
                        <option value="">All Statuses</option>
                        <option value="active">Active Only</option>
                        <option value="suspended">Suspended Only</option>
                      </select>
                    </div>
                    <button
                      onClick={() => setCommunityFilters({ type: '', dateFrom: '', dateTo: '', hasGym: '', status: '' })}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}

                {/* Bulk Actions Bar */}
                {selectedCommunities.size > 0 && (
                  <div className="flex items-center justify-between p-3 bg-gray-900/30 border border-gray-700/50" style={{ borderRadius: 2 }}>
                    <span className="text-xs text-gray-300">{selectedCommunities.size} community/communities selected</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => bulkToggleCommunityStatus(false)}
                        className="px-3 py-1 text-xs bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center gap-1.5"
                        style={{ borderRadius: 2 }}
                      >
                        <CheckCircle className="w-3 h-3" />
                        Unsuspend
                      </button>
                      <button
                        onClick={() => bulkToggleCommunityStatus(true)}
                        className="px-3 py-1 text-xs bg-amber-600 text-white hover:bg-amber-700 transition-colors flex items-center gap-1.5"
                        style={{ borderRadius: 2 }}
                      >
                        <AlertCircle className="w-3 h-3" />
                        Suspend
                      </button>
                      <button
                        onClick={bulkDeleteCommunities}
                        className="px-3 py-1 text-xs bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-1.5"
                        style={{ borderRadius: 2 }}
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                      <button
                        onClick={() => exportCommunities(filteredCommunities.filter(c => selectedCommunities.has(c.id)))}
                        className="px-3 py-1 text-xs bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors flex items-center gap-1.5"
                        style={{ borderRadius: 2 }}
                      >
                        <Download className="w-3 h-3" />
                        Export Selected
                      </button>
                      <button
                        onClick={() => setSelectedCommunities(new Set())}
                        className="px-3 py-1 text-xs bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                        style={{ borderRadius: 2 }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {filteredCommunities.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-sm text-gray-400">No communities found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-700/50">
                  {/* Select All */}
                  <div className="p-3 border-b border-gray-700/50">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCommunities.size === filteredCommunities.length && filteredCommunities.length > 0}
                        onChange={handleSelectAllCommunities}
                        className="w-4 h-4 rounded border-gray-600 cursor-pointer"
                        style={{ accentColor: '#087E8B' }}
                      />
                      <span className="text-xs text-gray-400">Select All ({filteredCommunities.length})</span>
                    </label>
                  </div>

                  {filteredCommunities.map((community) => {
                    const metrics = communityMetrics[community.id] || {};
                    const isGymCommunity = community.gym_id !== null;
                    const communityType = community.community_type || 'gym';
                    
                    return (
                      <div key={community.id} className="p-4 flex items-start justify-between relative">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={selectedCommunities.has(community.id)}
                            onChange={() => handleSelectCommunity(community.id)}
                            className="mt-1 w-4 h-4 rounded border-gray-600 cursor-pointer flex-shrink-0"
                            style={{ accentColor: '#087E8B' }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                                {community.name}
                              </p>
                              {communityType === 'general' && (
                                <span className="inline-flex items-center px-2 py-0.5 text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 flex-shrink-0" style={{ borderRadius: 2 }}>
                                  General
                                </span>
                              )}
                              {isGymCommunity && (
                                <span className="inline-flex items-center px-2 py-0.5 text-xs bg-green-500/20 text-green-300 border border-green-500/30 flex-shrink-0" style={{ borderRadius: 2 }}>
                                  Gym
                                </span>
                              )}
                            </div>
                            {community.description && (
                              <p className="text-xs text-gray-400 truncate mb-1">{community.description}</p>
                            )}
                            <p className="text-xs text-gray-400">
                              {community.gyms?.name ? `${community.gyms.name} - ${community.gyms.city}, ${community.gyms.country}` : 'General Community'}
                            </p>

                            {/* Statistics */}
                            <div className="flex flex-wrap items-center gap-4 mt-3">
                              <span className="text-xs text-gray-400">👥 {metrics.membersCount || 0} members</span>
                              <span className="text-xs text-gray-400">📝 {metrics.postsCount || 0} posts</span>
                              {metrics.moderatorsCount > 0 && (
                                <span className="text-xs text-gray-400">🛡️ {metrics.moderatorsCount} moderators</span>
                              )}
                            </div>

                            {/* Metadata & Indicators */}
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                              <span className="text-xs text-gray-500">
                                Created {new Date(community.created_at).toLocaleDateString()}
                              </span>
                              {community.updated_at && community.updated_at !== community.created_at && (
                                <span className="text-xs text-gray-500">
                                  Updated {new Date(community.updated_at).toLocaleDateString()}
                                </span>
                              )}
                              {community.rules && (
                                <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20" style={{ borderRadius: 2 }}>
                                  Rules
                                </span>
                              )}
                              {community.is_active === false && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-red-500/10 text-red-300 border border-red-500/20" style={{ borderRadius: 2 }}>
                                  <AlertCircle className="w-3 h-3" />
                                  Suspended
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* 3-dot Menu */}
                        <div className="relative ml-3">
                          <button
                            onClick={(e) => {
                              const button = e.currentTarget;
                              const rect = button.getBoundingClientRect();
                              const menuHeight = 300;
                              const spaceBelow = window.innerHeight - rect.bottom;
                              const spaceAbove = rect.top;
                              const shouldFlipUp = spaceBelow < menuHeight && spaceAbove > spaceBelow;
                              
                              setCommunityMenuPosition({
                                top: shouldFlipUp ? undefined : rect.bottom + 4,
                                bottom: shouldFlipUp ? window.innerHeight - rect.top + 4 : undefined,
                                right: window.innerWidth - rect.right,
                                flipUp: shouldFlipUp
                              });
                              setOpenCommunityMenuId(openCommunityMenuId === community.id ? null : community.id);
                            }}
                            className="p-1.5 hover:bg-gray-700/50 transition-colors"
                            style={{ borderRadius: 2 }}
                          >
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </button>
                          
                          {openCommunityMenuId === community.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-[150]" 
                                onClick={() => setOpenCommunityMenuId(null)}
                              />
                              <div 
                                className="fixed w-48 bg-gray-900 border border-gray-700/50 shadow-lg z-[200]" 
                                style={{ 
                                  borderRadius: 4, 
                                  top: communityMenuPosition.flipUp ? undefined : `${communityMenuPosition.top}px`,
                                  bottom: communityMenuPosition.flipUp ? `${communityMenuPosition.bottom}px` : undefined,
                                  right: `${communityMenuPosition.right}px`,
                                  maxHeight: 'calc(100vh - 140px)',
                                  overflowY: 'auto'
                                }}
                              >
                                <div className="px-4 py-2 border-b border-gray-700/50">
                                  <p className="text-[10px] text-gray-500 truncate">{community.name || 'Unknown Community'}</p>
                                </div>
                                <button
                                  onClick={() => {
                                    setViewingCommunity(community);
                                    setOpenCommunityMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-800 transition-colors flex items-center gap-2"
                                  style={{ fontSize: '11px' }}
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  View Details
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingCommunity(community);
                                    setOpenCommunityMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-800 transition-colors flex items-center gap-2"
                                  style={{ fontSize: '11px' }}
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  Edit Community
                                </button>
                                <button
                                  onClick={() => {
                                    navigate(`/community/${community.id}`);
                                    setOpenCommunityMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-800 transition-colors flex items-center gap-2"
                                  style={{ fontSize: '11px' }}
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  View Public Page
                                </button>
                                <div className="border-t border-gray-700/50 my-1" />
                                {community.is_active === false ? (
                                  <button
                                    onClick={() => {
                                      unsuspendCommunity(community.id);
                                      setOpenCommunityMenuId(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-green-400 hover:bg-gray-800 transition-colors flex items-center gap-2"
                                    style={{ fontSize: '11px' }}
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Unsuspend Community
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      suspendCommunity(community.id);
                                      setOpenCommunityMenuId(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-amber-400 hover:bg-gray-800 transition-colors flex items-center gap-2"
                                    style={{ fontSize: '11px' }}
                                  >
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    Suspend Community
                                  </button>
                                )}
                                <div className="border-t border-gray-700/50 my-1" />
                                <button
                                  onClick={() => {
                                    deleteCommunityFromList(community.id);
                                    setOpenCommunityMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-800 transition-colors flex items-center gap-2"
                                  style={{ fontSize: '11px' }}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Delete Community
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Gym Requests Tab */}
          {activeTab === 'requests' && (
            <div className="bg-gray-800/50 border border-gray-700/50" style={{ borderRadius: 0 }}>
              <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
                <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Gym Requests</h2>
                <button
                  onClick={() => navigate('/gyms/request')}
                  className="px-3 py-1.5 text-xs bg-[#087E8B] text-white hover:bg-[#066a75] transition-colors flex items-center gap-1.5"
                  style={{ borderRadius: 2 }}
                >
                  <MapPin className="w-3 h-3" />
                  Create Gym
                </button>
              </div>
              
              {/* Bulk Actions Bar */}
              {gymRequests.length > 0 && gymRequests.some(r => r.status === 'pending') && (
                <div className="p-3 border-b border-gray-700/50 bg-gray-800/30 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={gymRequests.filter(r => r.status === 'pending').length > 0 && 
                                 selectedGymRequests.size === gymRequests.filter(r => r.status === 'pending').length}
                        onChange={toggleSelectAllGymRequests}
                        className="w-4 h-4 rounded border-gray-600 cursor-pointer"
                        style={{ accentColor: '#087E8B' }}
                      />
                      <span className="text-xs text-gray-300">Select All</span>
                    </label>
                    {selectedGymRequests.size > 0 && (
                      <span className="text-xs text-gray-400">
                        {selectedGymRequests.size} selected
                      </span>
                    )}
                  </div>
                  {selectedGymRequests.size > 0 && (
                    <button
                      onClick={bulkApproveGymRequests}
                      className="px-3 py-1.5 text-xs bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center gap-1.5"
                      style={{ borderRadius: 2 }}
                    >
                      <CheckCircle className="w-3 h-3" />
                      Bulk Approve ({selectedGymRequests.size})
                    </button>
                  )}
                </div>
              )}

              {gymRequests.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-sm text-gray-400">No gym requests found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-700/50">
                  {gymRequests.map((request) => (
                    <div key={request.id} className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        {request.status === 'pending' && (
                          <input
                            type="checkbox"
                            checked={selectedGymRequests.has(request.id)}
                            onChange={() => toggleGymRequestSelection(request.id)}
                            className="mt-1 w-4 h-4 rounded border-gray-600 cursor-pointer flex-shrink-0"
                            style={{ accentColor: '#087E8B' }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{request.gym_name}</p>
                            <span className={`ml-3 px-2 py-1 text-xs flex-shrink-0 ${
                              request.status === 'pending' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' :
                              request.status === 'approved' ? 'bg-green-500/10 text-green-300 border border-green-500/20' :
                              'bg-red-500/10 text-red-300 border border-red-500/20'
                            }`}
                            style={{ borderRadius: 2 }}>
                              {request.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">{request.city}, {request.country}</p>
                          {request.description && (
                            <p className="text-xs text-gray-400 mt-2 line-clamp-2">{request.description}</p>
                          )}
                        </div>
                      </div>
                      {request.status === 'pending' && (
                        <div className="flex gap-2 mt-3 ml-7">
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
                      <p className="text-xs text-gray-500 mt-3 ml-7">
                        By {request.profiles?.full_name || 'Unknown'} • {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Gyms Tab */}
          {activeTab === 'gyms' && (
            <div className="bg-gray-800/50 border border-gray-700/50" style={{ borderRadius: 0 }}>
              <div className="p-4 border-b border-gray-700/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Gyms
                    <span className="ml-2 text-xs text-gray-400">({filteredGyms.length})</span>
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => exportGyms()}
                      className="px-3 py-1.5 text-xs bg-gray-700/50 text-gray-300 hover:bg-gray-700 transition-colors flex items-center gap-1.5"
                      style={{ borderRadius: 2 }}
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export
                    </button>
                    <button
                      onClick={() => setShowGymFilters(!showGymFilters)}
                      className={`px-3 py-1.5 text-xs transition-colors flex items-center gap-1.5 ${
                        showGymFilters ? 'bg-[#087E8B] text-white' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                      }`}
                      style={{ borderRadius: 2 }}
                    >
                      <Filter className="w-3.5 h-3.5" />
                      Filters
                    </button>
                  </div>
                </div>
                
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search gyms by name, city, country, or address..."
                    value={gymSearchQuery}
                    onChange={(e) => setGymSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-700/50 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#087E8B]/50"
                    style={{ borderRadius: 2 }}
                  />
                </div>

                {/* Filters */}
                {showGymFilters && (
                  <div className="space-y-4 pt-3 border-t border-gray-700/50">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Country</label>
                        <select
                          value={gymFilters.country}
                          onChange={(e) => setGymFilters({ ...gymFilters, country: e.target.value })}
                          className="w-full px-3 py-1.5 bg-gray-900/50 border border-gray-700/50 text-white text-xs focus:outline-none focus:border-[#087E8B]/50"
                          style={{ borderRadius: 2 }}
                        >
                          <option value="">All Countries</option>
                          {[...new Set(gyms.map(g => g.country).filter(Boolean))].sort().map(country => (
                            <option key={country} value={country}>{country}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">City</label>
                        <select
                          value={gymFilters.city}
                          onChange={(e) => setGymFilters({ ...gymFilters, city: e.target.value })}
                          className="w-full px-3 py-1.5 bg-gray-900/50 border border-gray-700/50 text-white text-xs focus:outline-none focus:border-[#087E8B]/50"
                          style={{ borderRadius: 2 }}
                        >
                          <option value="">All Cities</option>
                          {[...new Set(
                            gyms
                              .filter(g => !gymFilters.country || g.country === gymFilters.country)
                              .map(g => g.city)
                              .filter(Boolean)
                          )].sort().map(city => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Visibility</label>
                      <select
                        value={gymFilters.visibility}
                        onChange={(e) => setGymFilters({ ...gymFilters, visibility: e.target.value })}
                        className="w-full px-3 py-1.5 bg-gray-900/50 border border-gray-700/50 text-white text-xs focus:outline-none focus:border-[#087E8B]/50"
                        style={{ borderRadius: 2 }}
                      >
                        <option value="">All Gyms</option>
                        <option value="visible">Visible Only</option>
                        <option value="hidden">Hidden Only</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-2 block">Created Date Range</label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">From</label>
                          <input
                            type="date"
                            value={gymFilters.dateFrom}
                            onChange={(e) => setGymFilters({ ...gymFilters, dateFrom: e.target.value })}
                            className="w-full px-3 py-1.5 bg-gray-900/50 border border-gray-700/50 text-white text-xs focus:outline-none focus:border-[#087E8B]/50"
                            style={{ borderRadius: 2 }}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">To</label>
                          <input
                            type="date"
                            value={gymFilters.dateTo}
                            onChange={(e) => setGymFilters({ ...gymFilters, dateTo: e.target.value })}
                            className="w-full px-3 py-1.5 bg-gray-900/50 border border-gray-700/50 text-white text-xs focus:outline-none focus:border-[#087E8B]/50"
                            style={{ borderRadius: 2 }}
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setGymFilters({ country: '', city: '', dateFrom: '', dateTo: '', visibility: '' })}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}

                {/* Bulk Actions Bar */}
                {selectedGyms.size > 0 && (
                  <div className="flex items-center justify-between p-3 bg-gray-900/30 border border-gray-700/50" style={{ borderRadius: 2 }}>
                    <span className="text-xs text-gray-300">{selectedGyms.size} gym(s) selected</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => bulkToggleGymVisibility(false)}
                        className="px-3 py-1 text-xs bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center gap-1.5"
                        style={{ borderRadius: 2 }}
                      >
                        <Eye className="w-3 h-3" />
                        Show
                      </button>
                      <button
                        onClick={() => bulkToggleGymVisibility(true)}
                        className="px-3 py-1 text-xs bg-gray-600 text-white hover:bg-gray-700 transition-colors flex items-center gap-1.5"
                        style={{ borderRadius: 2 }}
                      >
                        <EyeOff className="w-3 h-3" />
                        Hide
                      </button>
                      <button
                        onClick={bulkDeleteGyms}
                        className="px-3 py-1 text-xs bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-1.5"
                        style={{ borderRadius: 2 }}
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                      <button
                        onClick={() => exportGyms(filteredGyms.filter(g => selectedGyms.has(g.id)))}
                        className="px-3 py-1 text-xs bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors flex items-center gap-1.5"
                        style={{ borderRadius: 2 }}
                      >
                        <Download className="w-3 h-3" />
                        Export Selected
                      </button>
                      <button
                        onClick={() => setSelectedGyms(new Set())}
                        className="px-3 py-1 text-xs bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                        style={{ borderRadius: 2 }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {filteredGyms.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-sm text-gray-400">No gyms found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-700/50">
                  {/* Select All */}
                  <div className="p-3 border-b border-gray-700/50">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedGyms.size === filteredGyms.length && filteredGyms.length > 0}
                        onChange={handleSelectAllGyms}
                        className="w-4 h-4 rounded border-gray-600 cursor-pointer"
                        style={{ accentColor: '#087E8B' }}
                      />
                      <span className="text-xs text-gray-400">Select All ({filteredGyms.length})</span>
                    </label>
                  </div>

                  {filteredGyms.map((gym) => {
                    const metrics = gymMetrics[gym.id] || {};
                    const hasImage = !!gym.image_url;
                    const hasCoordinates = !!(gym.latitude && gym.longitude);
                    const hasDescription = !!gym.description;
                    
                    return (
                      <div key={gym.id} className="p-4 flex items-start justify-between relative">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={selectedGyms.has(gym.id)}
                            onChange={() => handleSelectGym(gym.id)}
                            className="mt-1 w-4 h-4 rounded border-gray-600 cursor-pointer flex-shrink-0"
                            style={{ accentColor: '#087E8B' }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                                {gym.name}
                              </p>
                              {gym.is_hidden && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 flex-shrink-0" style={{ borderRadius: 2 }}>
                                  <EyeOff className="w-3 h-3" />
                                  Hidden
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400">{gym.city}, {gym.country}</p>
                            {gym.address && <p className="text-xs text-gray-500 mt-1">{gym.address}</p>}
                            
                            {/* Contact Info */}
                            {(gym.phone || gym.email || gym.website) && (
                              <div className="flex flex-wrap items-center gap-3 mt-2">
                                {gym.phone && (
                                  <span className="text-xs text-gray-400">📞 {gym.phone}</span>
                                )}
                                {gym.email && (
                                  <span className="text-xs text-gray-400">✉️ {gym.email}</span>
                                )}
                                {gym.website && (
                                  <a 
                                    href={gym.website} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-[#087E8B] hover:underline flex items-center gap-1"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Website
                                  </a>
                                )}
                              </div>
                            )}

                            {/* Statistics */}
                            <div className="flex flex-wrap items-center gap-4 mt-3">
                              {metrics.reviewsCount > 0 && (
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-yellow-400" />
                                  <span className="text-xs text-gray-400">
                                    {metrics.avgRating?.toFixed(1)} ({metrics.reviewsCount})
                                  </span>
                                </div>
                              )}
                              {gym.google_rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-orange-400" />
                                  <span className="text-xs text-gray-400">
                                    Google: {gym.google_rating.toFixed(1)}
                                    {gym.google_ratings_count && ` (${gym.google_ratings_count})`}
                                  </span>
                                </div>
                              )}
                              {metrics.favoritesCount > 0 && (
                                <span className="text-xs text-gray-400">❤️ {metrics.favoritesCount} favorites</span>
                              )}
                              {metrics.communitiesCount > 0 && (
                                <span className="text-xs text-gray-400">👥 {metrics.communitiesCount} communities</span>
                              )}
                            </div>

                            {/* Metadata & Indicators */}
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                              <span className="text-xs text-gray-500">
                                Created {new Date(gym.created_at).toLocaleDateString()}
                              </span>
                              {gym.updated_at && gym.updated_at !== gym.created_at && (
                                <span className="text-xs text-gray-500">
                                  Updated {new Date(gym.updated_at).toLocaleDateString()}
                                </span>
                              )}
                              <div className="flex items-center gap-2">
                                {hasImage && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/20" style={{ borderRadius: 2 }}>
                                    Image
                                  </span>
                                )}
                                {hasCoordinates && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] bg-green-500/10 text-green-300 border border-green-500/20" style={{ borderRadius: 2 }}>
                                    Location
                                  </span>
                                )}
                                {hasDescription && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20" style={{ borderRadius: 2 }}>
                                    Description
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* 3-dot Menu */}
                        <div className="relative ml-3">
                          <button
                            onClick={(e) => {
                              const button = e.currentTarget;
                              const rect = button.getBoundingClientRect();
                              const menuHeight = 300;
                              const spaceBelow = window.innerHeight - rect.bottom;
                              const spaceAbove = rect.top;
                              const shouldFlipUp = spaceBelow < menuHeight && spaceAbove > spaceBelow;
                              
                              setGymMenuPosition({
                                top: shouldFlipUp ? undefined : rect.bottom + 4,
                                bottom: shouldFlipUp ? window.innerHeight - rect.top + 4 : undefined,
                                right: window.innerWidth - rect.right,
                                flipUp: shouldFlipUp
                              });
                              setOpenGymMenuId(openGymMenuId === gym.id ? null : gym.id);
                            }}
                            className="p-1.5 hover:bg-gray-700/50 transition-colors"
                            style={{ borderRadius: 2 }}
                          >
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </button>
                          
                          {openGymMenuId === gym.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-[150]" 
                                onClick={() => setOpenGymMenuId(null)}
                              />
                              <div 
                                className="fixed w-48 bg-gray-900 border border-gray-700/50 shadow-lg z-[200]" 
                                style={{ 
                                  borderRadius: 4, 
                                  top: gymMenuPosition.flipUp ? undefined : `${gymMenuPosition.top}px`,
                                  bottom: gymMenuPosition.flipUp ? `${gymMenuPosition.bottom}px` : undefined,
                                  right: `${gymMenuPosition.right}px`,
                                  maxHeight: 'calc(100vh - 140px)',
                                  overflowY: 'auto'
                                }}
                              >
                                <div className="px-4 py-2 border-b border-gray-700/50">
                                  <p className="text-[10px] text-gray-500 truncate">{gym.name || 'Unknown Gym'}</p>
                                </div>
                                <button
                                  onClick={() => {
                                    setViewingGym(gym);
                                    setOpenGymMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-800 transition-colors flex items-center gap-2"
                                  style={{ fontSize: '11px' }}
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  View Details
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingGym(gym);
                                    setOpenGymMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-800 transition-colors flex items-center gap-2"
                                  style={{ fontSize: '11px' }}
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  Edit Gym
                                </button>
                                <button
                                  onClick={() => {
                                    navigate(`/gyms/${gym.id}`);
                                    setOpenGymMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-800 transition-colors flex items-center gap-2"
                                  style={{ fontSize: '11px' }}
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  View Public Page
                                </button>
                                <div className="border-t border-gray-700/50 my-1" />
                                {gym.is_hidden ? (
                                  <button
                                    onClick={() => {
                                      showGym(gym.id);
                                    }}
                                    className="w-full px-4 py-2 text-left text-green-400 hover:bg-gray-800 transition-colors flex items-center gap-2"
                                    style={{ fontSize: '11px' }}
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    Show Gym
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      hideGym(gym.id);
                                    }}
                                    className="w-full px-4 py-2 text-left text-gray-400 hover:bg-gray-800 transition-colors flex items-center gap-2"
                                    style={{ fontSize: '11px' }}
                                  >
                                    <EyeOff className="w-3.5 h-3.5" />
                                    Hide Gym
                                  </button>
                                )}
                                <div className="border-t border-gray-700/50 my-1" />
                                <button
                                  onClick={() => {
                                    deleteGym(gym.id);
                                    setOpenGymMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-800 transition-colors flex items-center gap-2"
                                  style={{ fontSize: '11px' }}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Delete Gym
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="bg-gray-800/50 border border-gray-700/50" style={{ borderRadius: 0 }}>
              <div className="p-4 border-b border-gray-700/50">
                <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Community Reports</h2>
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
                          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
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
                <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Content Moderation</h2>
                
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search posts and comments by keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-700/50 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#087E8B]/50"
                    style={{ borderRadius: 2 }}
                  />
                </div>

                {/* View Toggle */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setModerationView('reports')}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                      moderationView === 'reports'
                        ? 'bg-[#087E8B] text-white'
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
                        ? 'bg-[#087E8B] text-white'
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
                        ? 'bg-[#087E8B] text-white'
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
                              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Reported Post</p>
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
                              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Reported Comment</p>
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
                            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{post.title}</p>
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

          {/* Feedback Tab */}
          {activeTab === 'feedback' && (
            <div className="bg-gray-800/50 border border-gray-700/50" style={{ borderRadius: 0 }}>
              <div className="p-4 border-b border-gray-700/50 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Feedback Management
                  </h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setShowFeedbackFilters(!showFeedbackFilters)}
                      className="px-3 py-1.5 text-xs bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors flex items-center gap-1"
                      style={{ borderRadius: 2 }}
                    >
                      <Filter className="w-3 h-3" />
                      Filters
                    </button>
                  </div>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={feedbackSearchQuery}
                    onChange={(e) => setFeedbackSearchQuery(e.target.value)}
                    placeholder="Search feedback..."
                    className="w-full pl-8 pr-3 py-2 bg-gray-900/50 border border-gray-700/50 text-white text-sm focus:outline-none focus:border-[#087E8B]"
                    style={{ borderRadius: 2 }}
                  />
                </div>

                {/* Filters */}
                {showFeedbackFilters && (
                  <div className="grid grid-cols-3 gap-3 p-3 bg-gray-900/30 border border-gray-700/50" style={{ borderRadius: 2 }}>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Type</label>
                      <select
                        value={feedbackFilters.type}
                        onChange={(e) => setFeedbackFilters({ ...feedbackFilters, type: e.target.value })}
                        className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 text-white text-xs focus:outline-none focus:border-[#087E8B]"
                        style={{ borderRadius: 2 }}
                      >
                        <option value="">All Types</option>
                        <option value="bug">Bug Report</option>
                        <option value="feature">Feature Request</option>
                        <option value="improvement">Improvement</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Status</label>
                      <select
                        value={feedbackFilters.status}
                        onChange={(e) => setFeedbackFilters({ ...feedbackFilters, status: e.target.value })}
                        className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 text-white text-xs focus:outline-none focus:border-[#087E8B]"
                        style={{ borderRadius: 2 }}
                      >
                        <option value="">All Status</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Priority</label>
                      <select
                        value={feedbackFilters.priority}
                        onChange={(e) => setFeedbackFilters({ ...feedbackFilters, priority: e.target.value })}
                        className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 text-white text-xs focus:outline-none focus:border-[#087E8B]"
                        style={{ borderRadius: 2 }}
                      >
                        <option value="">All Priorities</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div className="col-span-3 flex justify-end">
                      <button
                        onClick={() => {
                          setFeedbackFilters({ type: '', status: '', priority: '' });
                          setFeedbackSearchQuery('');
                        }}
                        className="px-3 py-1 text-xs bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                        style={{ borderRadius: 2 }}
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-gray-900/50 p-2 border border-gray-700/50" style={{ borderRadius: 2 }}>
                    <p className="text-xs text-gray-400">Total</p>
                    <p className="text-lg font-semibold text-white">{feedback.length}</p>
                  </div>
                  <div className="bg-gray-900/50 p-2 border border-gray-700/50" style={{ borderRadius: 2 }}>
                    <p className="text-xs text-gray-400">Open</p>
                    <p className="text-lg font-semibold text-yellow-400">{feedback.filter(f => f.status === 'open').length}</p>
                  </div>
                  <div className="bg-gray-900/50 p-2 border border-gray-700/50" style={{ borderRadius: 2 }}>
                    <p className="text-xs text-gray-400">In Progress</p>
                    <p className="text-lg font-semibold text-blue-400">{feedback.filter(f => f.status === 'in_progress').length}</p>
                  </div>
                  <div className="bg-gray-900/50 p-2 border border-gray-700/50" style={{ borderRadius: 2 }}>
                    <p className="text-xs text-gray-400">Resolved</p>
                    <p className="text-lg font-semibold text-green-400">{feedback.filter(f => f.status === 'resolved').length}</p>
                  </div>
                </div>
              </div>

              {/* Feedback List */}
              <div className="divide-y divide-gray-700/50">
                {filteredFeedback.length === 0 ? (
                  <div className="p-12 text-center">
                    <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-sm text-gray-400">No feedback found</p>
                  </div>
                ) : (
                  <>
                    {/* Select All */}
                    <div className="p-3 border-b border-gray-700/50">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedFeedback.size === filteredFeedback.length && filteredFeedback.length > 0}
                          onChange={handleSelectAllFeedback}
                          className="w-4 h-4 rounded border-gray-600 cursor-pointer"
                          style={{ accentColor: '#087E8B' }}
                        />
                        <span className="text-xs text-gray-400">Select All ({filteredFeedback.length})</span>
                      </label>
                    </div>

                    {filteredFeedback.map((item) => {
                      const statusColors = {
                        open: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
                        in_progress: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                        resolved: 'bg-green-500/20 text-green-300 border-green-500/30',
                        closed: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
                      };

                      const priorityColors = {
                        low: 'bg-gray-500/20 text-gray-300',
                        medium: 'bg-blue-500/20 text-blue-300',
                        high: 'bg-orange-500/20 text-orange-300',
                        urgent: 'bg-red-500/20 text-red-300',
                      };

                      const typeIcons = {
                        bug: AlertCircle,
                        feature: Sparkles,
                        improvement: Lightbulb,
                        other: MessageSquare,
                      };

                      const TypeIcon = typeIcons[item.type] || MessageSquare;

                      return (
                        <div key={item.id} className="p-4 hover:bg-gray-800/30 transition-colors">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={selectedFeedback.has(item.id)}
                              onChange={() => handleSelectFeedback(item.id)}
                              className="mt-1 w-4 h-4 rounded border-gray-600 cursor-pointer flex-shrink-0"
                              style={{ accentColor: '#087E8B' }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <TypeIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  <h3 className="text-sm font-medium text-white truncate">{item.title}</h3>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className={`px-2 py-0.5 text-xs border ${statusColors[item.status] || statusColors.open}`} style={{ borderRadius: 2 }}>
                                    {item.status.replace('_', ' ')}
                                  </span>
                                  <span className={`px-2 py-0.5 text-xs ${priorityColors[item.priority] || priorityColors.medium}`} style={{ borderRadius: 2 }}>
                                    {item.priority}
                                  </span>
                                </div>
                              </div>

                              <p className="text-xs text-gray-400 mb-2 line-clamp-2">{item.description}</p>

                              <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-gray-500">
                                <div className="flex items-center gap-3">
                                  <span>{item.user_name || 'Anonymous'}</span>
                                  {item.user_email && <span>• {item.user_email}</span>}
                                  <span>• {new Date(item.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setViewingFeedback(item)}
                                    className="px-2 py-1 text-xs bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                                    style={{ borderRadius: 2 }}
                                  >
                                    View
                                  </button>
                                  <button
                                    onClick={() => setEditingFeedback(item)}
                                    className="px-2 py-1 text-xs bg-[#087E8B] text-white hover:bg-[#066a75] transition-colors"
                                    style={{ borderRadius: 2 }}
                                  >
                                    Edit
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* View Feedback Modal */}
      {viewingFeedback && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" style={{ borderRadius: 4 }}>
            <div className="p-4 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{viewingFeedback.title}</h3>
                <p className="text-xs text-gray-400 mt-1">{viewingFeedback.user_name || 'Anonymous'} • {new Date(viewingFeedback.created_at).toLocaleDateString()}</p>
              </div>
              <button
                onClick={() => setViewingFeedback(null)}
                className="text-gray-400 hover:text-white ml-4"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-4 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Type</label>
                  <p className="text-sm text-white capitalize">{viewingFeedback.type}</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Status</label>
                  <p className="text-sm text-white capitalize">{viewingFeedback.status.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Priority</label>
                  <p className="text-sm text-white capitalize">{viewingFeedback.priority}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Description</label>
                <p className="text-sm text-white whitespace-pre-wrap">{viewingFeedback.description}</p>
              </div>

              {viewingFeedback.page_url && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Page URL</label>
                  <a href={viewingFeedback.page_url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#087E8B] hover:underline flex items-center gap-1">
                    {viewingFeedback.page_url} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {viewingFeedback.admin_response && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Admin Response</label>
                  <p className="text-sm text-white whitespace-pre-wrap">{viewingFeedback.admin_response}</p>
                </div>
              )}

              {viewingFeedback.resolved_at && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Resolved At</label>
                  <p className="text-sm text-white">{new Date(viewingFeedback.resolved_at).toLocaleString()}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 p-4 border-t border-gray-700 flex-shrink-0">
              <button
                onClick={() => {
                  setEditingFeedback(viewingFeedback);
                  setViewingFeedback(null);
                }}
                className="flex-1 px-4 py-2 bg-[#087E8B] text-white hover:bg-[#066a75] transition-colors"
                style={{ borderRadius: 2 }}
              >
                Edit Feedback
              </button>
              <button
                onClick={() => setViewingFeedback(null)}
                className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                style={{ borderRadius: 2 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Feedback Modal */}
      {editingFeedback && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" style={{ borderRadius: 4 }}>
            <div className="p-4 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Edit Feedback</h3>
              <button
                onClick={() => setEditingFeedback(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Status *</label>
                  <select
                    value={editingFeedback.status}
                    onChange={(e) => setEditingFeedback({ ...editingFeedback, status: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-[#087E8B]"
                    style={{ borderRadius: 2 }}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Priority *</label>
                  <select
                    value={editingFeedback.priority}
                    onChange={(e) => setEditingFeedback({ ...editingFeedback, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-[#087E8B]"
                    style={{ borderRadius: 2 }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Admin Response</label>
                <textarea
                  value={editingFeedback.admin_response || ''}
                  onChange={(e) => setEditingFeedback({ ...editingFeedback, admin_response: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-[#087E8B]"
                  style={{ borderRadius: 2 }}
                  rows={4}
                  placeholder="Add a response to the user..."
                />
              </div>

              <div className="bg-gray-800/50 p-3 border border-gray-700 rounded" style={{ borderRadius: 2 }}>
                <p className="text-xs text-gray-400 mb-1">Original Feedback</p>
                <p className="text-sm text-white mb-2">{editingFeedback.title}</p>
                <p className="text-xs text-gray-300 whitespace-pre-wrap">{editingFeedback.description}</p>
              </div>
            </div>

            <div className="flex gap-2 p-4 border-t border-gray-700 flex-shrink-0">
              <button
                onClick={() => setEditingFeedback(null)}
                className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                style={{ borderRadius: 2 }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateFeedbackStatus(
                  editingFeedback.id,
                  editingFeedback.status,
                  editingFeedback.priority,
                  editingFeedback.admin_response || null
                )}
                className="flex-1 px-4 py-2 bg-[#087E8B] text-white hover:bg-[#066a75] transition-colors"
                style={{ borderRadius: 2 }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Community Changes Confirmation Modal */}
      {showCommunityChangesConfirmation && pendingCommunityChanges && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" style={{ borderRadius: 4 }}>
            <div className="p-4 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Confirm Changes</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Please review the changes before saving
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCommunityChangesConfirmation(false);
                  setPendingCommunityChanges(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {pendingCommunityChanges.changes.map((change, idx) => (
                  <div key={idx} className="bg-gray-800/50 border border-gray-700 rounded p-3" style={{ borderRadius: 4 }}>
                    <div className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{change.field}</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-start gap-2">
                        <span className="text-red-400 font-medium flex-shrink-0">From:</span>
                        <span className="text-gray-300 break-words">{change.oldValue}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-green-400 font-medium flex-shrink-0">To:</span>
                        <span className="text-gray-300 break-words">{change.newValue}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t border-gray-700 flex-shrink-0">
              <button
                onClick={() => {
                  setShowCommunityChangesConfirmation(false);
                  setPendingCommunityChanges(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (pendingCommunityChanges?.data && !isUpdatingCommunity) {
                    const success = await updateCommunity(pendingCommunityChanges.data);
                    if (success) {
                      setShowCommunityChangesConfirmation(false);
                      setPendingCommunityChanges(null);
                    }
                  }
                }}
                disabled={isUpdatingCommunity}
                className="flex-1 px-4 py-2 bg-[#087E8B] text-white rounded hover:bg-[#066a75] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdatingCommunity ? 'Saving...' : 'Confirm & Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Community Modal */}
      {editingCommunity && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 w-full max-w-md" style={{ borderRadius: 4 }}>
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Edit Community</h3>
              <button
                onClick={() => {
                  setEditingCommunity(null);
                  setOriginalCommunityData(null);
                  setPendingCommunityChanges(null);
                  setShowCommunityChangesConfirmation(false);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                const formData = new FormData(e.target);
                  const newData = {
                    name: formData.get('name') || '',
                    description: formData.get('description') || '',
                    rules: formData.get('rules') || ''
                  };

                  // Calculate changes and show confirmation
                  const changes = calculateCommunityChanges(originalCommunityData, newData);
                  
                  if (changes.length === 0) {
                    showToast('info', 'No Changes', 'No changes were made.');
                    return;
                  }

                  // Store pending changes and show confirmation
                  setPendingCommunityChanges({ data: newData, changes });
                  setShowCommunityChangesConfirmation(true);
                } catch (error) {
                  console.error('Error in form submission:', error);
                  showToast('error', 'Error', 'Failed to process changes. Please try again.');
                  setShowCommunityChangesConfirmation(false);
                  setPendingCommunityChanges(null);
                }
              }}
              className="p-4 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingCommunity.name}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white text-sm focus:outline-none focus:border-[#087E8B]"
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
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white text-sm focus:outline-none focus:border-[#087E8B] resize-none"
                  style={{ borderRadius: 2 }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Rules</label>
                <textarea
                  name="rules"
                  defaultValue={editingCommunity.rules || ''}
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white text-sm focus:outline-none focus:border-[#087E8B] resize-none"
                  style={{ borderRadius: 2 }}
                  placeholder="Community guidelines and rules..."
                />
              </div>
              
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingCommunity(null);
                    setOriginalCommunityData(null);
                    setPendingCommunityChanges(null);
                    setShowCommunityChangesConfirmation(false);
                  }}
                  className="flex-1 px-4 py-2 text-sm bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                  style={{ borderRadius: 2 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm bg-[#087E8B] text-white hover:bg-[#066a75] transition-colors"
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
                <h3 className="text-lg font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{viewingCommunity.name}</h3>
                <p className="text-xs text-gray-400 truncate mt-1">
                  {viewingCommunity.gyms?.name ? `${viewingCommunity.gyms.name} - ${viewingCommunity.gyms.city}, ${viewingCommunity.gyms.country}` : 'General Community'}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <button
                  onClick={() => {
                    setEditingCommunity(viewingCommunity);
                    setOriginalCommunityData({ ...viewingCommunity });
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
                      <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{metrics.membersCount || 0}</p>
                    </div>
                    <div className="bg-gray-800/50 p-3 rounded border border-gray-700/50" style={{ borderRadius: 2 }}>
                      <div className="flex items-center gap-1 mb-1">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-400">Posts</span>
                      </div>
                      <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{metrics.postsCount || 0}</p>
                    </div>
                    <div className="bg-gray-800/50 p-3 rounded border border-gray-700/50" style={{ borderRadius: 2 }}>
                      <div className="flex items-center gap-1 mb-1">
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-400">Comments</span>
                      </div>
                      <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{metrics.commentsCount || 0}</p>
                    </div>
                    <div className="bg-gray-800/50 p-3 rounded border border-gray-700/50" style={{ borderRadius: 2 }}>
                      <div className="flex items-center gap-1 mb-1">
                        <Shield className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-400">Moderators</span>
                      </div>
                      <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{metrics.moderatorsCount || 0}</p>
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
                  <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Members</h4>
                  {(() => {
                    const members = communityMembers[viewingCommunity.id] || [];
                    const moderators = communityModerators[viewingCommunity.id] || [];
                    return members.length > moderators.length && (
                      <button
                        onClick={() => {
                          setAssigningModerator(viewingCommunity);
                          setViewingCommunity(null);
                        }}
                        className="text-xs text-[#087E8B] hover:text-[#087E8B] flex items-center gap-1"
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
                                <Shield className="w-3.5 h-3.5 text-[#087E8B] flex-shrink-0" />
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
                  className="flex-1 px-4 py-2 text-sm bg-[#087E8B] text-white hover:bg-[#066a75] transition-colors"
                  style={{ borderRadius: 2 }}
                >
                  View Community
                </button>
                <button
                  onClick={() => {
                    setEditingCommunity(viewingCommunity);
                    setOriginalCommunityData({ ...viewingCommunity });
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
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Assign Moderator</h3>
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
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
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

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" style={{ borderRadius: 4 }}>
            <div className="p-4 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Edit User Profile</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editingUser.full_name || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 text-white text-sm focus:outline-none focus:border-[#087E8B]/50"
                    style={{ borderRadius: 2 }}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingUser.email || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 text-white text-sm focus:outline-none focus:border-[#087E8B]/50"
                    style={{ borderRadius: 2 }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Bio</label>
                <textarea
                  value={editingUser.bio || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, bio: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 text-white text-sm focus:outline-none focus:border-[#087E8B]/50"
                  style={{ borderRadius: 2 }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Company</label>
                  <input
                    type="text"
                    value={editingUser.company || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, company: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 text-white text-sm focus:outline-none focus:border-[#087E8B]/50"
                    style={{ borderRadius: 2 }}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Role</label>
                  <input
                    type="text"
                    value={editingUser.role || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 text-white text-sm focus:outline-none focus:border-[#087E8B]/50"
                    style={{ borderRadius: 2 }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Climbing Grade</label>
                  <input
                    type="text"
                    value={editingUser.climbing_grade || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, climbing_grade: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 text-white text-sm focus:outline-none focus:border-[#087E8B]/50"
                    style={{ borderRadius: 2 }}
                    placeholder="e.g., 5.12a"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Years Climbing</label>
                  <input
                    type="number"
                    value={editingUser.years_climbing || 0}
                    onChange={(e) => setEditingUser({ ...editingUser, years_climbing: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 text-white text-sm focus:outline-none focus:border-[#087E8B]/50"
                    style={{ borderRadius: 2 }}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Favorite Style</label>
                  <input
                    type="text"
                    value={editingUser.favorite_style || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, favorite_style: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 text-white text-sm focus:outline-none focus:border-[#087E8B]/50"
                    style={{ borderRadius: 2 }}
                    placeholder="e.g., bouldering"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Instagram URL</label>
                  <input
                    type="url"
                    value={editingUser.instagram_url || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, instagram_url: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 text-white text-sm focus:outline-none focus:border-[#087E8B]/50"
                    style={{ borderRadius: 2 }}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Twitter URL</label>
                  <input
                    type="url"
                    value={editingUser.twitter_url || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, twitter_url: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 text-white text-sm focus:outline-none focus:border-[#087E8B]/50"
                    style={{ borderRadius: 2 }}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Website URL</label>
                  <input
                    type="url"
                    value={editingUser.website_url || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, website_url: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 text-white text-sm focus:outline-none focus:border-[#087E8B]/50"
                    style={{ borderRadius: 2 }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingUser.show_email || false}
                    onChange={(e) => setEditingUser({ ...editingUser, show_email: e.target.checked })}
                  />
                  <span className="text-xs text-gray-400">Show Email</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingUser.show_activity || false}
                    onChange={(e) => setEditingUser({ ...editingUser, show_activity: e.target.checked })}
                  />
                  <span className="text-xs text-gray-400">Show Activity</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingUser.allow_direct_messages || false}
                    onChange={(e) => setEditingUser({ ...editingUser, allow_direct_messages: e.target.checked })}
                  />
                  <span className="text-xs text-gray-400">Allow Direct Messages</span>
                </label>
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-700/50">
                <button
                  onClick={() => handleUpdateUser(editingUser)}
                  className="flex-1 px-4 py-2 text-sm bg-[#087E8B] text-white hover:bg-[#066a75] transition-colors"
                  style={{ borderRadius: 2 }}
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingUser(null)}
                  className="flex-1 px-4 py-2 text-sm bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                  style={{ borderRadius: 2 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View User Details Modal */}
      {viewingUser && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" style={{ borderRadius: 4 }}>
            <div className="p-4 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{viewingUser.full_name || 'Unknown User'}</h3>
                <p className="text-xs text-gray-400 mt-1">{viewingUser.email}</p>
              </div>
              <button
                onClick={() => {
                  setViewingUser(null);
                  setUserActivity({ posts: [], comments: [] });
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-4 space-y-4">
              {/* User Stats */}
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-gray-800/50 p-3 rounded border border-gray-700/50" style={{ borderRadius: 2 }}>
                  <div className="flex items-center gap-1 mb-1">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-400">Posts</span>
                  </div>
                  <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{viewingUser.posts_count || 0}</p>
                </div>
                <div className="bg-gray-800/50 p-3 rounded border border-gray-700/50" style={{ borderRadius: 2 }}>
                  <div className="flex items-center gap-1 mb-1">
                    <MessageSquare className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-400">Comments</span>
                  </div>
                  <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{viewingUser.comments_count || 0}</p>
                </div>
                <div className="bg-gray-800/50 p-3 rounded border border-gray-700/50" style={{ borderRadius: 2 }}>
                  <div className="flex items-center gap-1 mb-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-400">Joined</span>
                  </div>
                  <p className="text-xs font-semibold text-white">
                    {new Date(viewingUser.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-gray-800/50 p-3 rounded border border-gray-700/50" style={{ borderRadius: 2 }}>
                  <div className="flex items-center gap-1 mb-1">
                    <Activity className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-400">Last Active</span>
                  </div>
                  <p className="text-xs font-semibold text-white">
                    {viewingUser.last_active_at ? new Date(viewingUser.last_active_at).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>

              {/* User Posts */}
              <div>
                <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Recent Posts ({userActivity.posts.length})</h4>
                {loadingUserActivity ? (
                  <p className="text-xs text-gray-400 text-center py-4">Loading posts...</p>
                ) : userActivity.posts.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No posts</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-700/30 rounded p-2" style={{ borderRadius: 2 }}>
                    {userActivity.posts.map((post) => (
                      <div key={post.id} className="p-2 bg-gray-900/30 rounded hover:bg-gray-900/50 transition-colors" style={{ borderRadius: 2 }}>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-white truncate flex-1">{post.title}</p>
                          <span className="text-xs text-gray-500 ml-2">
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {post.communities && (
                          <p className="text-xs text-gray-500 mt-1">in {post.communities.name}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* User Comments */}
              <div>
                <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Recent Comments ({userActivity.comments.length})</h4>
                {loadingUserActivity ? (
                  <p className="text-xs text-gray-400 text-center py-4">Loading comments...</p>
                ) : userActivity.comments.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No comments</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-700/30 rounded p-2" style={{ borderRadius: 2 }}>
                    {userActivity.comments.map((comment) => (
                      <div key={comment.id} className="p-2 bg-gray-900/30 rounded hover:bg-gray-900/50 transition-colors" style={{ borderRadius: 2 }}>
                        <p className="text-xs text-white line-clamp-2">{comment.content}</p>
                        {comment.posts && (
                          <p className="text-xs text-gray-500 mt-1">on "{comment.posts.title}"</p>
                        )}
                        <span className="text-xs text-gray-500">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-gray-700/50">
                <button
                  onClick={() => {
                    handleEditUser(viewingUser);
                    setViewingUser(null);
                  }}
                  className="flex-1 px-4 py-2 text-sm bg-[#087E8B] text-white hover:bg-[#066a75] transition-colors"
                  style={{ borderRadius: 2 }}
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => {
                    handleViewProfile(viewingUser.id);
                    setViewingUser(null);
                  }}
                  className="flex-1 px-4 py-2 text-sm bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                  style={{ borderRadius: 2 }}
                >
                  View Public Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Gym Modal */}
      {viewingGym && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" style={{ borderRadius: 4 }}>
            <div className="p-4 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{viewingGym.name}</h3>
                <p className="text-xs text-gray-400 mt-1">{viewingGym.city}, {viewingGym.country}</p>
              </div>
              <button
                onClick={() => setViewingGym(null)}
                className="text-gray-400 hover:text-white ml-4"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-4 space-y-4">
              {viewingGym.image_url && (
                <img src={viewingGym.image_url} alt={viewingGym.name} className="w-full h-48 object-cover rounded" style={{ borderRadius: 2 }} />
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Address</label>
                  <p className="text-sm text-white">{viewingGym.address}</p>
                </div>
                {viewingGym.phone && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Phone</label>
                    <p className="text-sm text-white">{viewingGym.phone}</p>
                  </div>
                )}
                {viewingGym.email && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Email</label>
                    <p className="text-sm text-white">{viewingGym.email}</p>
                  </div>
                )}
                {viewingGym.website && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Website</label>
                    <a href={viewingGym.website} target="_blank" rel="noopener noreferrer" className="text-sm text-[#087E8B] hover:underline flex items-center gap-1">
                      {viewingGym.website} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {viewingGym.single_entry_price && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Single Entry Price</label>
                    <p className="text-sm text-white">{viewingGym.single_entry_price}</p>
                  </div>
                )}
                {viewingGym.membership_price && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Membership Price</label>
                    <p className="text-sm text-white">{viewingGym.membership_price}</p>
                  </div>
                )}
                {!viewingGym.single_entry_price && !viewingGym.membership_price && viewingGym.price_range && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Price Range (Legacy)</label>
                    <p className="text-sm text-white">{viewingGym.price_range}</p>
                  </div>
                )}
                {(viewingGym.latitude && viewingGym.longitude) && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Location</label>
                    <p className="text-xs text-white">{viewingGym.latitude.toFixed(6)}, {viewingGym.longitude.toFixed(6)}</p>
                  </div>
                )}
              </div>

              {viewingGym.description && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Description</label>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{viewingGym.description}</p>
                </div>
              )}

              {Array.isArray(viewingGym.facilities) && viewingGym.facilities.length > 0 && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Facilities</label>
                  <div className="flex flex-wrap gap-2">
                    {viewingGym.facilities.map((facility, idx) => (
                      <span key={idx} className="px-2 py-1 text-xs bg-gray-800 text-gray-300" style={{ borderRadius: 2 }}>
                        {facility}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(viewingGym.difficulty_levels) && viewingGym.difficulty_levels.length > 0 && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Difficulty Levels</label>
                  <div className="flex flex-wrap gap-2">
                    {viewingGym.difficulty_levels.map((level, idx) => (
                      <span key={idx} className="px-2 py-1 text-xs bg-gray-800 text-gray-300" style={{ borderRadius: 2 }}>
                        {level}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {viewingGym.opening_hours && typeof viewingGym.opening_hours === 'object' && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Opening Hours</label>
                  <div className="space-y-1">
                    {Object.entries(viewingGym.opening_hours).map(([day, hours]) => (
                      <div key={day} className="flex justify-between text-xs text-gray-300">
                        <span className="capitalize">{day}:</span>
                        <span>{hours || 'Closed'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Statistics */}
              <div className="border-t border-gray-700/50 pt-4">
                <label className="block text-xs text-gray-400 mb-2">Statistics</label>
                <div className="grid grid-cols-2 gap-4">
                  {(gymMetrics[viewingGym.id]?.reviewsCount > 0) && (
                    <div>
                      <p className="text-xs text-gray-400">Reviews</p>
                      <p className="text-sm text-white">
                        {gymMetrics[viewingGym.id].avgRating?.toFixed(1)} ⭐ ({gymMetrics[viewingGym.id].reviewsCount})
                      </p>
                    </div>
                  )}
                  {gymMetrics[viewingGym.id]?.favoritesCount > 0 && (
                    <div>
                      <p className="text-xs text-gray-400">Favorites</p>
                      <p className="text-sm text-white">{gymMetrics[viewingGym.id].favoritesCount}</p>
                    </div>
                  )}
                  {gymMetrics[viewingGym.id]?.communitiesCount > 0 && (
                    <div>
                      <p className="text-xs text-gray-400">Communities</p>
                      <p className="text-sm text-white">{gymMetrics[viewingGym.id].communitiesCount}</p>
                    </div>
                  )}
                  {viewingGym.google_rating && (
                    <div>
                      <p className="text-xs text-gray-400">Google Rating</p>
                      <p className="text-sm text-white">
                        {viewingGym.google_rating.toFixed(1)} ⭐
                        {viewingGym.google_ratings_count && ` (${viewingGym.google_ratings_count})`}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-xs text-gray-500 pt-2 border-t border-gray-700/50">
                Created: {new Date(viewingGym.created_at).toLocaleString()} • 
                Updated: {new Date(viewingGym.updated_at).toLocaleString()}
                {viewingGym.is_hidden && (
                  <span className="ml-2 text-amber-400">• Hidden from public</span>
                )}
              </div>
            </div>

            <div className="flex gap-2 p-4 border-t border-gray-700/50">
              <button
                onClick={() => {
                  setEditingGym(viewingGym);
                  setViewingGym(null);
                }}
                className="flex-1 px-4 py-2 text-sm bg-[#087E8B] text-white hover:bg-[#066a75] transition-colors"
                style={{ borderRadius: 2 }}
              >
                Edit Gym
              </button>
              <button
                onClick={() => {
                  navigate(`/gyms/${viewingGym.id}`);
                  setViewingGym(null);
                }}
                className="flex-1 px-4 py-2 text-sm bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                style={{ borderRadius: 2 }}
              >
                View Public Page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Gym Modal */}
      {editingGym && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" style={{ borderRadius: 4 }}>
            <div className="p-4 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Edit Gym</h3>
              <button
                onClick={() => setEditingGym(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-4 space-y-4">
              <EditGymForm gym={editingGym} onSave={(updates) => { executeUpdateGym(editingGym.id, updates); }} onCancel={() => setEditingGym(null)} />
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}

// Edit Gym Form Component
function EditGymForm({ gym, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: gym.name || '',
    country: gym.country || '',
    city: gym.city || '',
    address: gym.address || '',
    phone: gym.phone || '',
    email: gym.email || '',
    website: gym.website || '',
    description: gym.description || '',
    single_entry_price: gym.single_entry_price || '',
    membership_price: gym.membership_price || '',
    price_range: gym.price_range || '', // Keep for backward compatibility
    image_url: gym.image_url || '',
    latitude: gym.latitude || '',
    longitude: gym.longitude || '',
    is_hidden: gym.is_hidden || false,
    facilities: Array.isArray(gym.facilities) ? [...gym.facilities] : [],
    difficulty_levels: Array.isArray(gym.difficulty_levels) ? [...gym.difficulty_levels] : [],
    opening_hours: typeof gym.opening_hours === 'object' ? { ...gym.opening_hours } : {}
  });

  const [newFacility, setNewFacility] = useState('');
  const [newDifficulty, setNewDifficulty] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const updates = {
      ...formData,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      facilities: formData.facilities,
      difficulty_levels: formData.difficulty_levels,
      opening_hours: formData.opening_hours
    };
    onSave(updates);
  };

  const addFacility = () => {
    if (newFacility.trim()) {
      setFormData({
        ...formData,
        facilities: [...formData.facilities, newFacility.trim()]
      });
      setNewFacility('');
    }
  };

  const removeFacility = (index) => {
    setFormData({
      ...formData,
      facilities: formData.facilities.filter((_, i) => i !== index)
    });
  };

  const addDifficulty = () => {
    if (newDifficulty.trim()) {
      setFormData({
        ...formData,
        difficulty_levels: [...formData.difficulty_levels, newDifficulty.trim()]
      });
      setNewDifficulty('');
    }
  };

  const removeDifficulty = (index) => {
    setFormData({
      ...formData,
      difficulty_levels: formData.difficulty_levels.filter((_, i) => i !== index)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-[#087E8B]"
            style={{ borderRadius: 2 }}
            required
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Country *</label>
          <input
            type="text"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-[#087E8B]"
            style={{ borderRadius: 2 }}
            required
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">City *</label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-[#087E8B]"
            style={{ borderRadius: 2 }}
            required
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Address *</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-[#087E8B]"
            style={{ borderRadius: 2 }}
            required
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Phone</label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-[#087E8B]"
            style={{ borderRadius: 2 }}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-[#087E8B]"
            style={{ borderRadius: 2 }}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Website</label>
          <input
            type="url"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-[#087E8B]"
            style={{ borderRadius: 2 }}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Single Entry Price</label>
          <input
            type="text"
            value={formData.single_entry_price}
            onChange={(e) => setFormData({ ...formData, single_entry_price: e.target.value })}
            placeholder="e.g., $20, €15-25"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-[#087E8B]"
            style={{ borderRadius: 2 }}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Membership Price</label>
          <input
            type="text"
            value={formData.membership_price}
            onChange={(e) => setFormData({ ...formData, membership_price: e.target.value })}
            placeholder="e.g., $80/month, €50/month"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-[#087E8B]"
            style={{ borderRadius: 2 }}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Latitude</label>
          <input
            type="number"
            step="any"
            value={formData.latitude}
            onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-[#087E8B]"
            style={{ borderRadius: 2 }}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Longitude</label>
          <input
            type="number"
            step="any"
            value={formData.longitude}
            onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-[#087E8B]"
            style={{ borderRadius: 2 }}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Image URL</label>
          <input
            type="url"
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-[#087E8B]"
            style={{ borderRadius: 2 }}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-[#087E8B]"
          style={{ borderRadius: 2 }}
        />
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-2">Facilities</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.facilities.map((facility, idx) => (
            <span key={idx} className="px-2 py-1 text-xs bg-gray-800 text-gray-300 flex items-center gap-1" style={{ borderRadius: 2 }}>
              {facility}
              <button type="button" onClick={() => removeFacility(idx)} className="text-red-400 hover:text-red-300">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newFacility}
            onChange={(e) => setNewFacility(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFacility())}
            placeholder="Add facility"
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-[#087E8B]"
            style={{ borderRadius: 2 }}
          />
          <button type="button" onClick={addFacility} className="px-3 py-2 bg-gray-700 text-white text-sm hover:bg-gray-600" style={{ borderRadius: 2 }}>
            Add
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-2">Difficulty Levels</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.difficulty_levels.map((level, idx) => (
            <span key={idx} className="px-2 py-1 text-xs bg-gray-800 text-gray-300 flex items-center gap-1" style={{ borderRadius: 2 }}>
              {level}
              <button type="button" onClick={() => removeDifficulty(idx)} className="text-red-400 hover:text-red-300">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newDifficulty}
            onChange={(e) => setNewDifficulty(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDifficulty())}
            placeholder="Add difficulty level"
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-[#087E8B]"
            style={{ borderRadius: 2 }}
          />
          <button type="button" onClick={addDifficulty} className="px-3 py-2 bg-gray-700 text-white text-sm hover:bg-gray-600" style={{ borderRadius: 2 }}>
            Add
          </button>
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.is_hidden}
            onChange={(e) => setFormData({ ...formData, is_hidden: e.target.checked })}
            className="w-4 h-4 rounded border-gray-600"
            style={{ accentColor: '#087E8B' }}
          />
          <span className="text-xs text-gray-400">Hide from public listing</span>
        </label>
      </div>

      <div className="flex gap-2 pt-4 border-t border-gray-700/50">
        <button
          type="submit"
          className="flex-1 px-4 py-2 text-sm bg-[#087E8B] text-white hover:bg-[#066a75] transition-colors"
          style={{ borderRadius: 2 }}
        >
          Save Changes
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 text-sm bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
          style={{ borderRadius: 2 }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
