import { useNavigate } from 'react-router-dom';
import {
  Users,
  MessageCircle,
  MapPin,
  Plus,
  Search,
  Calendar,
  Heart,
  Globe,
  Building,
  UserPlus,
  Compass
} from 'lucide-react';

export default function EmptyState({
  icon: Icon = MessageCircle,
  title,
  description,
  actionLabel,
  actionPath,
  onAction,
  variant = 'default',
  iconSize = 48
}) {
  const navigate = useNavigate();

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (actionPath) {
      navigate(actionPath);
    }
  };

  const iconColorClass = {
    default: 'text-gray-400',
    primary: 'text-[#087E8B]',
    success: 'text-green-400',
    warning: 'text-amber-400',
    muted: 'text-gray-500'
  }[variant] || 'text-gray-400';

  const iconBgClass = {
    default: 'bg-gray-800/50',
    primary: 'bg-[#087E8B]/10',
    success: 'bg-green-500/10',
    warning: 'bg-amber-500/10',
    muted: 'bg-gray-800/30'
  }[variant] || 'bg-gray-800/50';

  return (
    <div className="mobile-card">
      <div className="minimal-flex-center py-12">
        <div className="text-center max-w-sm mx-auto">
          {/* Icon */}
          <div className={`${iconBgClass} w-20 h-20 rounded-full minimal-flex-center mx-auto mb-6`}>
            <Icon className={iconColorClass} size={iconSize} />
          </div>

          {/* Title */}
          <h3 className="mobile-subheading mb-2">{title}</h3>

          {/* Description */}
          {description && (
            <p className="mobile-text-sm text-gray-400 mb-6 leading-relaxed">
              {description}
            </p>
          )}

          {/* Action Button */}
          {(actionLabel && (actionPath || onAction)) && (
            <button
              onClick={handleAction}
              className="mobile-btn-primary minimal-flex gap-2 mx-auto"
            >
              <Plus className="minimal-icon" />
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Pre-configured empty states for common scenarios
export function EmptyCommunities({ onCreateClick, onExploreClick }) {
  return (
    <div style={{ padding: '40px 16px', textAlign: 'center' }}>
      <div className="text-center max-w-sm mx-auto">
        {/* Icon */}
        <div className="bg-gray-800/50 w-16 h-16 rounded-full minimal-flex-center mx-auto mb-4">
          <Globe className="text-[#087E8B]" size={32} />
        </div>

        {/* Title */}
        <h3 className="mobile-subheading mb-2">No Communities Yet</h3>

        {/* Description */}
        <p className="mobile-text-sm text-gray-400 mb-4 leading-relaxed">
          Communities are where climbers connect, share beta, and plan sessions together. Start your journey by joining or creating a community!
        </p>

        {/* Action Button */}
        {onCreateClick && (
          <button
            onClick={onCreateClick}
            className="mobile-btn-primary minimal-flex gap-2 mx-auto"
          >
            <Plus className="minimal-icon" />
            Create Community
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyPosts({ onCreateClick, isMember = false }) {
  return (
    <div style={{ padding: '40px 16px', textAlign: 'center' }}>
      <div className="text-center max-w-sm mx-auto">
        {/* Icon */}
        <div className="bg-gray-800/50 w-16 h-16 rounded-full minimal-flex-center mx-auto mb-4">
          <MessageCircle className="text-gray-400" size={32} />
        </div>

        {/* Title */}
        <h3 className="mobile-subheading mb-2">No posts yet</h3>

        {/* Description */}
        <p className="mobile-text-sm text-gray-400 mb-4 leading-relaxed">
          {isMember
          ? "Be the first to share something! Post about your latest climb, ask a question, or share some beta."
            : "Join this community to see posts and engage with members!"}
        </p>
      </div>
    </div>
  );
}

export function EmptyMembers() {
  return (
    <EmptyState
      icon={Users}
      title="No members yet"
      description="This community is just getting started. Be one of the first members!"
      variant="default"
    />
  );
}

export function EmptyEvents({ onCreateClick, isMember = false }) {
  return (
    <EmptyState
      icon={Calendar}
      title="No events scheduled"
      description={
        isMember
          ? "Plan a group climbing session, competition, or workshop. Create an event to bring members together!"
          : "This community hasn't scheduled any events yet. Join to see upcoming events!"
      }
      actionLabel={isMember ? "Create Event" : undefined}
      onAction={isMember ? onCreateClick : undefined}
      variant={isMember ? "primary" : "default"}
    />
  );
}

export function EmptyGyms({ onRequestClick }) {
  return (
    <div style={{ padding: '40px 16px', textAlign: 'center' }}>
      <div className="text-center max-w-sm mx-auto">
        {/* Icon */}
        <div className="bg-gray-800/50 w-16 h-16 rounded-full minimal-flex-center mx-auto mb-4">
          <MapPin className="text-gray-400" size={32} />
        </div>

        {/* Title */}
        <h3 className="mobile-subheading mb-2">No gyms found</h3>

        {/* Description */}
        <p className="mobile-text-sm text-gray-400 mb-4 leading-relaxed">
          We couldn't find any gyms matching your search. Try adjusting your filters or request to add a gym if it's missing.
        </p>
      </div>
    </div>
  );
}

export function EmptySearch({ searchTerm, onClearSearch }) {
  return (
    <EmptyState
      icon={Search}
      title={`No results for "${searchTerm}"`}
      description="Try different keywords, check your spelling, or clear filters to see more results."
      actionLabel="Clear Search"
      onAction={onClearSearch}
      variant="default"
    />
  );
}

export function EmptyComments({ onCreateClick }) {
  return (
    <EmptyState
      icon={MessageCircle}
      title="No comments yet"
      description="Be the first to share your thoughts! Start a conversation by leaving a comment."
      actionLabel="Add Comment"
      onAction={onCreateClick}
      variant="primary"
      iconSize={32}
    />
  );
}

export function EmptyProfileCommunities() {
  return (
    <EmptyState
      icon={Compass}
      title="Not part of any communities yet"
      description="Join communities to connect with climbers, share experiences, and discover new climbing spots."
      actionLabel="Explore Communities"
      actionPath="/communities"
      variant="primary"
      iconSize={40}
    />
  );
}

export function EmptyFavoriteGyms({ onExploreClick }) {
  return (
    <EmptyState
      icon={Heart}
      title="No favorite gyms yet"
      description="Save your favorite climbing gyms for quick access. Tap the heart icon on any gym to add it to your favorites."
      actionLabel="Explore Gyms"
      onAction={onExploreClick}
      variant="primary"
    />
  );
}

