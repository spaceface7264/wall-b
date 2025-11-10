import React from 'react';
import { Users, MessageSquare, MapPin, Lock, Globe } from 'lucide-react';

const CommunityCard = React.memo(function CommunityCard({
  community,
  isMember = false,
  onJoin,
  onLeave,
  onReport,
  onOpen,
  joining = false,
  leaving = false
}) {
  // Get gym data - Supabase returns nested relations as arrays
  // If gyms is an array, get the first element; otherwise use it directly if it's an object
  const gymData = community.gyms 
    ? (Array.isArray(community.gyms) ? community.gyms[0] : community.gyms)
    : null;
  
  // Debug: Log gym data for communities with gym_id
  if (community.gym_id) {
    console.log('🔍 CommunityCard DEBUG:', {
      communityName: community.name,
      gym_id: community.gym_id,
      gyms: community.gyms,
      gymData: gymData,
      hasGymName: !!gymData?.name,
      gymName: gymData?.name
    });
  }
  
  // Get tags from community tags or post tags
  const tags = community.tags || [];
  
  // Post count (might come from query)
  const postCount = community.post_count || community.posts_count || 0;
  
  // Check if community is connected to a gym
  const gym = gymData;
  const isGymCommunity = (gym && gym.name) || community.gym_id || community.community_type === 'gym';
  
  // Get tag colors if available
  const getTagColor = (tag) => {
    if (community.tag_colors && community.tag_colors[tag]) {
      return community.tag_colors[tag];
    }
    return 'var(--accent-blue)'; // Default accent color
  };
  
  const handleCardClick = (e) => {
    // Don't navigate if clicking on buttons - stop propagation so wrapper doesn't handle it
    if (e.target.closest('button')) {
      e.stopPropagation();
      return;
    }
    // For normal clicks, let the event bubble to the wrapper which handles navigation
  };

  const handleJoin = (e) => {
    e.stopPropagation();
    if (onJoin) {
      onJoin(community.id);
    }
  };

  return (
    <div 
      className="touch-feedback transition-all duration-200 relative w-full cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Privacy Indicator - Top Right */}
      {community.is_private !== undefined && (
        <div className="absolute top-0 right-0 z-10" onClick={(e) => e.stopPropagation()}>
          {community.is_private ? (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <Lock className="w-3 h-3" style={{ color: '#ef4444' }} />
              <span className="text-xs font-medium" style={{ color: '#ef4444' }}>Private</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(59, 131, 246, 0.1)', border: '1px solid rgba(59, 131, 246, 0.3)' }}>
              <Globe className="w-3 h-3" style={{ color: '#3b82f6' }} />
              <span className="text-xs font-medium" style={{ color: '#3b82f6' }}>Public</span>
            </div>
          )}
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              {/* Community Title */}
              <div className="mb-1">
                <h3 className="mobile-subheading truncate">{community.name}</h3>
              </div>
              
              {/* City and Gym - Below Title */}
              {gym && (gym.city || gym.name) && (
                <div className="flex items-center gap-1.5 flex-wrap" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {gym.city && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" style={{ width: '12px', height: '12px', color: 'var(--text-muted)' }} />
                      <span className="truncate" title={gym.city} style={{ color: 'var(--text-secondary)' }}>{gym.city}</span>
                    </div>
                  )}
                  {gym.city && gym.name && (
                    <span className="flex-shrink-0" style={{ color: 'var(--text-subtle)' }}>·</span>
                  )}
                  {gym.name && (
                    <span className="truncate" title={gym.name} style={{ color: 'var(--text-secondary)' }}>{gym.name}</span>
                  )}
                </div>
              )}
            </div>
          </div>
          <p className="mobile-text-xs line-clamp-2 mb-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {community.description}
          </p>
          
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{community.member_count || 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{postCount || 0}</span>
            </div>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="minimal-flex flex-wrap gap-1 mt-2">
              {tags.slice(0, 3).map((tag, index) => (
                <span 
                  key={index} 
                  className="mobile-text-xs px-2 py-1 rounded"
                  style={{ 
                    fontSize: '10px',
                    backgroundColor: `${getTagColor(tag)}20`,
                    border: `1px solid ${getTagColor(tag)}40`,
                    color: getTagColor(tag)
                  }}
                >
                  #{tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span 
                  className="mobile-text-xs px-2 py-1 rounded"
                  style={{ 
                    fontSize: '10px', 
                    backgroundColor: 'var(--hover-bg)',
                    color: 'var(--text-muted)'
                  }}
                >
                  +{tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default CommunityCard;
