import Skeleton from './Skeleton';

export default function AdminSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton width={150} height={32} rounded="md" />
        <Skeleton width={100} height={36} variant="button" />
      </div>

      {/* Tab navigation */}
      <div className="flex gap-2 border-b border-gray-700/50 pb-2">
        <Skeleton width={100} height={36} rounded="md" />
        <Skeleton width={120} height={36} rounded="md" />
        <Skeleton width={140} height={36} rounded="md" />
      </div>

      {/* Table/List skeleton */}
      <div className="space-y-3">
        {/* Table header */}
        <div className="grid grid-cols-4 gap-4 pb-2 border-b border-gray-700/50">
          <Skeleton width="80%" height={16} />
          <Skeleton width="60%" height={16} />
          <Skeleton width="70%" height={16} />
          <Skeleton width="50%" height={16} />
        </div>

        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="grid grid-cols-4 gap-4 py-3 border-b border-gray-700/30">
            <div className="flex items-center gap-2">
              <Skeleton variant="avatar" width={32} height={32} rounded="full" />
              <Skeleton width="70%" height={16} />
            </div>
            <Skeleton width="80%" height={14} />
            <Skeleton width="60%" height={14} />
            <Skeleton width={80} height={28} rounded="md" />
          </div>
        ))}
      </div>
    </div>
  );
}

