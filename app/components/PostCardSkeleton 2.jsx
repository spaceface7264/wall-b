import Skeleton from './Skeleton';

export default function PostCardSkeleton({ compact = false }) {
  return (
    <div className="mobile-card">
      {/* Header: Avatar + Name + Time */}
      <div className="minimal-flex mb-4">
        <Skeleton variant="avatar" width={40} height={40} rounded="full" />
        <div className="flex-1 ml-3 space-y-2">
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={12} />
        </div>
        {!compact && <Skeleton width={24} height={24} rounded="md" />}
      </div>

      {/* Content */}
      {!compact && (
        <>
          <div className="space-y-2 mb-4">
            <Skeleton width="100%" height={16} />
            <Skeleton width="95%" height={16} />
            <Skeleton width="80%" height={16} />
          </div>

          {/* Tags */}
          <div className="flex gap-2 mb-4">
            <Skeleton width={60} height={24} rounded="md" />
            <Skeleton width={80} height={24} rounded="md" />
          </div>

          {/* Media placeholder */}
          <Skeleton width="100%" height={200} rounded="lg" className="mb-4" />
        </>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Skeleton width={20} height={20} rounded="md" />
            <Skeleton width={30} height={16} />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton width={20} height={20} rounded="md" />
            <Skeleton width={30} height={16} />
          </div>
        </div>
        <Skeleton width={20} height={20} rounded="md" />
      </div>
    </div>
  );
}

