import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Search, UserPlus, CheckCircle, XCircle, Clock, User } from 'lucide-react';
import { useToast } from '../providers/ToastProvider';

export default function JoinRequestsList({ communityId, communityName = 'Community', userCommunityRole = null, onRequestProcessed }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending'); // 'pending', 'approved', 'rejected', 'all'
  const [processingRequest, setProcessingRequest] = useState(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    if (communityId) {
      loadRequests();
    }
  }, [communityId, filterStatus]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('community_join_requests')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            nickname,
            handle,
            avatar_url
          ),
          responder:responded_by (
            id,
            full_name,
            nickname
          )
        `)
        .eq('community_id', communityId)
        .order('requested_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading join requests:', error);
        setRequests([]);
        return;
      }

      setRequests(data || []);
    } catch (error) {
      console.error('Error loading join requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId, userId) => {
    if (processingRequest) return;

    setProcessingRequest(requestId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast('error', 'Error', 'You must be logged in');
        return;
      }

      // Update request status
      const { error: updateError } = await supabase
        .from('community_join_requests')
        .update({
          status: 'approved',
          responded_at: new Date().toISOString(),
          responded_by: user.id
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Add user to community members
      const { error: joinError } = await supabase
        .from('community_members')
        .insert({
          community_id: communityId,
          user_id: userId,
          role: 'member'
        });

      if (joinError && joinError.code !== '23505') { // Ignore duplicate key error
        throw joinError;
      }

      showToast('success', 'Request Approved', 'User has been added to the community');
      await loadRequests();
      if (onRequestProcessed) {
        onRequestProcessed();
      }
    } catch (error) {
      console.error('Error approving request:', error);
      showToast('error', 'Error', 'Failed to approve request');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleReject = async (requestId) => {
    if (processingRequest) return;

    setProcessingRequest(requestId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast('error', 'Error', 'You must be logged in');
        return;
      }

      const { error } = await supabase
        .from('community_join_requests')
        .update({
          status: 'rejected',
          responded_at: new Date().toISOString(),
          responded_by: user.id
        })
        .eq('id', requestId);

      if (error) throw error;

      showToast('success', 'Request Rejected', 'Join request has been rejected');
      await loadRequests();
      if (onRequestProcessed) {
        onRequestProcessed();
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      showToast('error', 'Error', 'Failed to reject request');
    } finally {
      setProcessingRequest(null);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const filteredRequests = requests.filter(request => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    const profile = request.profiles;
    const searchableText = [
      profile?.full_name || '',
      profile?.nickname || '',
      profile?.handle || '',
      request.message || ''
    ].join(' ').toLowerCase();
    return searchableText.includes(searchLower);
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search requests..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-[#00d4ff]"
            disabled
          />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 bg-gray-800 rounded animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search requests..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-[#2663EB]"
        />
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            filterStatus === 'all'
              ? 'bg-[#2663EB] text-white'
              : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
          }`}
        >
          All ({requests.length})
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1 ${
            filterStatus === 'pending'
              ? 'bg-[#2663EB] text-white'
              : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Pending {pendingCount > 0 && `(${pendingCount})`}
        </button>
        <button
          onClick={() => setFilterStatus('approved')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1 ${
            filterStatus === 'approved'
              ? 'bg-green-600 text-white'
              : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          Approved ({approvedCount})
        </button>
        <button
          onClick={() => setFilterStatus('rejected')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1 ${
            filterStatus === 'rejected'
              ? 'bg-red-600 text-white'
              : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          Rejected ({rejectedCount})
        </button>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-12">
          <UserPlus className="w-16 h-16 text-gray-500 mx-auto mb-4 opacity-50" />
          <p className="text-gray-300 mb-2 font-medium">
            {searchTerm ? 'No requests found' : `No ${filterStatus === 'all' ? '' : filterStatus} requests`}
          </p>
          <p className="text-gray-500 text-sm">
            {searchTerm ? 'Try a different search term' : 'Join requests will appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredRequests.map((request) => {
            const profile = request.profiles;
            const displayName = profile?.nickname || profile?.full_name || 'Unknown User';
            const responder = request.responder;
            const responderName = responder?.nickname || responder?.full_name || 'Admin';

            return (
              <div
                key={request.id}
                className="flex items-center gap-3 p-3 bg-gray-800 rounded hover:bg-gray-700 transition-colors"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={displayName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-[#2663EB] rounded-full flex items-center justify-center text-white font-medium text-sm">
                      {getInitials(displayName)}
                    </div>
                  )}
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border-2 border-gray-800 ${
                    request.status === 'pending' ? 'bg-yellow-500' :
                    request.status === 'approved' ? 'bg-green-500' :
                    'bg-red-500'
                  }`}>
                    {request.status === 'pending' ? (
                      <Clock className="w-2.5 h-2.5 text-white" />
                    ) : request.status === 'approved' ? (
                      <CheckCircle className="w-2.5 h-2.5 text-white" />
                    ) : (
                      <XCircle className="w-2.5 h-2.5 text-white" />
                    )}
                  </div>
                </div>

                {/* Request Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <button
                      onClick={() => navigate(`/profile/${request.user_id}`)}
                      className="font-medium text-white hover:text-[#2663EB] transition-colors truncate text-left"
                    >
                      {displayName}
                    </button>
                    {request.status !== 'pending' && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        request.status === 'approved' 
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {request.status === 'approved' ? 'Approved' : 'Rejected'}
                      </span>
                    )}
                  </div>
                  {profile?.handle && (
                    <p className="text-sm text-gray-400 truncate">
                      @{profile.handle}
                    </p>
                  )}
                  {request.message && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      "{request.message}"
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-gray-500">
                      Requested {formatDate(request.requested_at)}
                    </p>
                    {request.responded_at && (
                      <p className="text-xs text-gray-500">
                        by {responderName} {formatDate(request.responded_at)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {request.status === 'pending' && (userCommunityRole === 'admin' || userCommunityRole === 'moderator') && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleApprove(request.id, request.user_id)}
                      disabled={processingRequest === request.id}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      disabled={processingRequest === request.id}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

