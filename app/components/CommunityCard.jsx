import { Users, MapPin, ChevronRight, UserPlus, Star } from 'lucide-react';

export default function CommunityCard({ 
  community, 
  isMember = false, 
  onJoin, 
  onLeave, 
  onOpen, 
  joining = false,
  showJoinButton = true 
}) {
  return (
    <div 
      className="mobile-card card-interactive card-glow animate-fade-in"
      onClick={() => onOpen(community.id)}
    >
      <div className="minimal-flex">
        <div className="w-12 h-12 bg-gray-700 rounded-lg minimal-flex-center mr-3 flex-shrink-0">
          {community.gyms?.image_url ? (
            <img 
              src={community.gyms.image_url} 
              alt={community.gyms.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <Users className="minimal-icon text-gray-300" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="mobile-subheading truncate">{community.name}</h3>
          <div className="minimal-flex mobile-text-xs text-gray-400 mb-1">
            <MapPin className="minimal-icon mr-1" />
            <span>{community.gyms?.city}, {community.gyms?.country}</span>
          </div>
          <p className="mobile-text-xs text-gray-300 line-clamp-2 mb-2">
            {community.description}
          </p>
          <div className="minimal-flex mobile-text-xs text-gray-400">
            <Users className="minimal-icon mr-1" />
            <span>{community.member_count} members</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <ChevronRight className="minimal-icon text-gray-400" />
          {showJoinButton && (
            isMember ? (
              <div className="minimal-flex mobile-text-xs text-green-400">
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
                className="mobile-btn-primary text-xs disabled:opacity-50"
              >
                {joining ? 'Joining...' : 'Join'}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
