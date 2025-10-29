

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, X, User } from 'lucide-react';

export default function EventRSVPList({ eventId, isOpen, onClose }) {
  const [rsvps, setRsvps] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && eventId) {
      loadRSVPs();
    }
  }, [isOpen, eventId]);

  const loadRSVPs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('event_rsvps')
        .select(`
          *,
          profiles!user_id (
            full_name,
            avatar_url
          )
        `)
        .eq('event_id', eventId)
        .order('rsvp_at', { ascending: false });

      if (error) {
        console.error('Error loading RSVPs:', error);
        return;
      }

      setRsvps(data || []);
    } catch (error) {
      console.error('Error loading RSVPs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'going':
        return 'text-green-400 bg-green-900/20';
      case 'interested':
        return 'text-yellow-400 bg-yellow-900/20';
      case 'cant_go':
        return 'text-red-400 bg-red-900/20';
      default:
        return 'text-gray-400 bg-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'going':
        return 'Going';
      case 'interested':
        return 'Interested';
      case 'cant_go':
        return "Can't Go";
      default:
        return 'Unknown';
    }
  };

  const groupRSVPsByStatus = () => {
    const grouped = {
      going: [],
      interested: [],
      cant_go: []
    };

    rsvps.forEach(rsvp => {
      if (grouped[rsvp.status]) {
        grouped[rsvp.status].push(rsvp);
      }
    });

    return grouped;
  };

  if (!isOpen) return null;

  const groupedRSVPs = groupRSVPsByStatus();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-semibold text-white">RSVPs</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : rsvps.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No RSVPs yet</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Going */}
              {groupedRSVPs.going.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-green-400 mb-2">
                    Going ({groupedRSVPs.going.length})
                  </h4>
                  <div className="space-y-2">
                    {groupedRSVPs.going.map(rsvp => (
                      <div key={rsvp.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-800">
                        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                          {rsvp.profiles?.avatar_url ? (
                            <img
                              src={rsvp.profiles.avatar_url}
                              alt={rsvp.profiles.full_name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">
                            {rsvp.profiles?.full_name || 'Unknown User'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(rsvp.rsvp_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${getStatusColor(rsvp.status)}`}>
                          {getStatusText(rsvp.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interested */}
              {groupedRSVPs.interested.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-yellow-400 mb-2">
                    Interested ({groupedRSVPs.interested.length})
                  </h4>
                  <div className="space-y-2">
                    {groupedRSVPs.interested.map(rsvp => (
                      <div key={rsvp.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-800">
                        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                          {rsvp.profiles?.avatar_url ? (
                            <img
                              src={rsvp.profiles.avatar_url}
                              alt={rsvp.profiles.full_name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">
                            {rsvp.profiles?.full_name || 'Unknown User'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(rsvp.rsvp_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${getStatusColor(rsvp.status)}`}>
                          {getStatusText(rsvp.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Can't Go */}
              {groupedRSVPs.cant_go.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-red-400 mb-2">
                    Can't Go ({groupedRSVPs.cant_go.length})
                  </h4>
                  <div className="space-y-2">
                    {groupedRSVPs.cant_go.map(rsvp => (
                      <div key={rsvp.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-800">
                        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                          {rsvp.profiles?.avatar_url ? (
                            <img
                              src={rsvp.profiles.avatar_url}
                              alt={rsvp.profiles.full_name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">
                            {rsvp.profiles?.full_name || 'Unknown User'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(rsvp.rsvp_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${getStatusColor(rsvp.status)}`}>
                          {getStatusText(rsvp.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


