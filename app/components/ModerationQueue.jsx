import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertTriangle, User, MessageSquare, FileText, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function ModerationQueue({ onAction }) {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // 'pending', 'in_review', 'resolved', 'all'
  const [priorityFilter, setPriorityFilter] = useState('all'); // 'all', 'low', 'medium', 'high', 'urgent'

  useEffect(() => {
    loadQueue();
  }, [filter, priorityFilter]);

  const loadQueue = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('moderation_queue')
        .select(`
          *,
          flagged_by_profile:profiles!moderation_queue_flagged_by_fkey (
            id,
            nickname,
            full_name
          ),
          assigned_to_profile:profiles!moderation_queue_assigned_to_fkey (
            id,
            nickname,
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      if (priorityFilter !== 'all') {
        query = query.eq('priority', priorityFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setQueue(data || []);
    } catch (error) {
      console.error('Error loading moderation queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const getContentIcon = (contentType) => {
    switch (contentType) {
      case 'post':
        return FileText;
      case 'comment':
        return MessageSquare;
      case 'community':
        return Users;
      default:
        return AlertTriangle;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-400';
      case 'high':
        return 'text-orange-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'in_review':
        return 'bg-blue-500/20 text-blue-400';
      case 'resolved':
        return 'bg-green-500/20 text-green-400';
      case 'dismissed':
        return 'bg-gray-500/20 text-gray-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-[#00d4ff] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="in_review">In Review</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
          >
            <option value="all">All</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Queue List */}
      {queue.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No items in moderation queue</p>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map((item) => {
            const ContentIcon = getContentIcon(item.content_type);
            return (
              <div
                key={item.id}
                className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors cursor-pointer"
                onClick={() => onAction && onAction(item)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <ContentIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-white capitalize">
                        {item.content_type}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                      <span className={`text-xs font-medium ${getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{item.reason}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>ID: {item.content_id.substring(0, 8)}...</span>
                      {item.flagged_by_profile && (
                        <span>Flagged by: {item.flagged_by_profile.nickname || item.flagged_by_profile.full_name}</span>
                      )}
                      {item.assigned_to_profile && (
                        <span>Assigned to: {item.assigned_to_profile.nickname || item.assigned_to_profile.full_name}</span>
                      )}
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
