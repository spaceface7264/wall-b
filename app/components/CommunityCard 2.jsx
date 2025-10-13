import React from 'react';
import { Users, MapPin, Star } from 'lucide-react';

const CommunityCard = React.memo(function CommunityCard({
  community,
  isMember = false,
  onJoin,
  onOpen,
  joining = false,
  showJoinButton = true
}) {
  return (
    <div
      className="mobile-card cursor-pointer touch-feedback hover:border-indigo-500/50 transition-all duration-200"
      onClick={() => onOpen(community.id)}
      style={{ padding: '20px', marginBottom: '16px', position: 'relative' }}
    >
      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="mobile-subheading truncate" style={{ marginBottom: '12px' }}>{community.name}</h3>

          <div className="minimal-flex mobile-text-xs text-gray-400" style={{ marginBottom: '12px' }}>
            <MapPin className="minimal-icon flex-shrink-0" style={{ marginRight: '10px' }} />
            <span className="truncate">{community.gyms?.city}, {community.gyms?.country}</span>
          </div>

          <p className="mobile-text-xs text-gray-300 line-clamp-2" style={{ lineHeight: '1.7' }}>
            {community.description}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', flexShrink: 0 }}>
          <div className="minimal-flex mobile-text-xs text-gray-400">
            <span className="font-medium">{community.member_count}</span>
          </div>

          {showJoinButton && (
            <div style={{ display: 'flex', alignItems: 'flex-end', flexShrink: 0 }}>
              {isMember ? (
                <div className="minimal-flex mobile-text-xs text-green-400 bg-green-900/20 px-3 py-1.5 rounded-lg">
                  <Star className="minimal-icon mr-1" />
                  <span>Member</span>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onJoin(community.id);
                  }}
                  disabled={joining}
                  style={{
                    background: 'transparent',
                    border: '1px solid #4b5563',
                    color: '#9ca3af',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    cursor: joining ? 'not-allowed' : 'pointer',
                    opacity: joining ? 0.5 : 1,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => !joining && (e.currentTarget.style.borderColor = '#818cf8', e.currentTarget.style.color = '#818cf8')}
                  onMouseLeave={(e) => !joining && (e.currentTarget.style.borderColor = '#4b5563', e.currentTarget.style.color = '#9ca3af')}
                >
                  {joining ? 'Joining...' : 'Join'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default CommunityCard;