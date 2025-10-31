import Skeleton from './Skeleton';

export default function UserListSkeleton({ count = 6 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/30 transition-colors">
          {/* Avatar */}
          <Skeleton variant="avatar" width={40} height={40} rounded="full" />
          
          {/* Name */}
          <div className="flex-1">
            <Skeleton width="60%" height={16} />
          </div>
          
          {/* Checkbox or icon */}
          {i % 2 === 0 && (
            <Skeleton width={20} height={20} rounded="md" />
          )}
        </div>
      ))}
    </div>
  );
}

