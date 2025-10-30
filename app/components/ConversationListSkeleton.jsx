import Skeleton from './Skeleton';

export default function ConversationListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
          {/* Avatar */}
          <Skeleton variant="avatar" width={48} height={48} rounded="full" />
          
          {/* Content */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton width="60%" height={16} />
              <Skeleton width={50} height={12} />
            </div>
            <Skeleton width="80%" height={14} />
          </div>
        </div>
      ))}
    </div>
  );
}

