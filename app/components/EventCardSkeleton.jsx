import Skeleton from './Skeleton';

export default function EventCardSkeleton() {
  return (
    <div className="mobile-card">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <Skeleton width="70%" height={20} />
            <Skeleton width="50%" height={14} />
          </div>
          <Skeleton width={80} height={24} rounded="md" />
        </div>

        {/* Date/Time */}
        <div className="flex items-center gap-2">
          <Skeleton width={16} height={16} rounded="md" />
          <Skeleton width={150} height={14} />
        </div>

        {/* Location */}
        <div className="flex items-center gap-2">
          <Skeleton width={16} height={16} rounded="md" />
          <Skeleton width={120} height={14} />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Skeleton width="100%" height={14} />
          <Skeleton width="85%" height={14} />
        </div>

        {/* RSVP Section */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
          <div className="flex items-center gap-2">
            <Skeleton variant="avatar" width={24} height={24} rounded="full" />
            <Skeleton variant="avatar" width={24} height={24} rounded="full" />
            <Skeleton variant="avatar" width={24} height={24} rounded="full" />
            <Skeleton width={40} height={14} />
          </div>
          <Skeleton width={80} height={32} rounded="md" />
        </div>
      </div>
    </div>
  );
}

