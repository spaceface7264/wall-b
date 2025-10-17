import React from 'react';
import { Users, Star } from 'lucide-react';

const CommunityCard = React.memo(function CommunityCard({
  community,
  isMember = false,
  onLeave,
  onOpen,
  leaving = false
}) {
  return (
    <div 
      className="mobile-card cursor-pointer touch-feedback hover:border-indigo-500/50 transition-all duration-200"
      onClick={() => onOpen(community.id)}
    >
      <div className="minimal-flex">
        <div className="flex-1 min-w-0">
          <h3 className="mobile-subheading truncate mb-2">{community.name}</h3>
          <p className="mobile-text-xs text-gray-300 line-clamp-2 mb-3 leading-relaxed">
            {community.description}
          </p>
          <div className="minimal-flex mobile-text-xs text-gray-400">
            <Users className="minimal-icon mr-1.5 flex-shrink-0" />
            <span className="font-medium">{community.member_count} members</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3 ml-3">
          {isMember && (
            <div className="minimal-flex mobile-text-xs text-green-400 bg-green-900/20 px-2 py-1 rounded-full">
              <Star className="minimal-icon mr-1" />
              <span>Member</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default CommunityCard;
