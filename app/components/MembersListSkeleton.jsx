import Skeleton from './Skeleton';

export default function MembersListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
          {/* Avatar */}
          <Skeleton variant="avatar" width={48} height={48} rounded="full" />
          
          {/* Name and info */}
          <div className="flex-1 space-y-2">
            <Skeleton width="60%" height={16} />
            <Skeleton width="40%" height={12} />
          </div>
          
          {/* Optional badge */}
          {i % 3 === 0 && (
            <Skeleton width={60} height={24} rounded="md" />
          )}
        </div>
      ))}
    </div>
  );
}

