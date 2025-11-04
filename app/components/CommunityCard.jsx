import React, { useState, useRef, useEffect } from 'react';
import { Users, MessageSquare, Check, MoreVertical, LogOut, Flag, MapPin } from 'lucide-react';

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
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);
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
    return '#087E8B'; // Default accent color
  };
  
  const handleCardClick = (e) => {
    // Don't navigate if clicking on buttons or menu - stop propagation so wrapper doesn't handle it
    if (e.target.closest('button') || e.target.closest('[role="menu"]')) {
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

  const handleLeave = () => {
    setShowMenu(false);
    if (onLeave) {
      onLeave(community.id);
    }
  };

  const handleReport = () => {
    setShowMenu(false);
    if (onReport) {
      onReport(community.id);
    }
  };

  return (
    <div 
      className="touch-feedback transition-all duration-200 relative w-full cursor-pointer"
      onClick={handleCardClick}
    >
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              {/* Community Title - Own Line */}
              <h3 className="mobile-subheading truncate mb-1">{community.name}</h3>
              
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
            
            {/* Action Buttons - 3-Dot Menu */}
            <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {/* 3-Dot Menu */}
              <div className="relative flex-shrink-0" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1.5 rounded-md transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                aria-label="More options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-1 rounded-lg shadow-lg z-50"
                  style={{ 
                    minWidth: '160px',
                    backgroundColor: 'var(--bg-surface)', 
                    border: '1px solid var(--border-color)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {isMember && (
                    <button
                      onClick={handleLeave}
                      disabled={leaving}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      style={{ 
                        fontSize: '11px',
                        color: '#ef4444'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      role="menuitem"
                    >
                      <LogOut className="w-3.5 h-3.5" style={{ flexShrink: 0 }} />
                      <span>{leaving ? 'Leaving...' : 'Leave Community'}</span>
                    </button>
                  )}
                  <button
                    onClick={handleReport}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors whitespace-nowrap"
                      style={{ 
                        fontSize: '11px',
                        color: 'var(--text-secondary)'
                      }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    role="menuitem"
                  >
                    <Flag className="w-3.5 h-3.5" style={{ flexShrink: 0 }} />
                    <span>Report</span>
                  </button>
                </div>
              )}
              </div>
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
