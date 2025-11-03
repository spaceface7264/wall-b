import Skeleton from './Skeleton';
import { Users } from 'lucide-react';

export default function CommunityCardSkeleton() {
  return (
    <div className="mobile-card">
      <div className="minimal-flex">
        <div className="flex-1 min-w-0 space-y-3">
          {/* Title */}
          <Skeleton width="70%" height={20} />
          
          {/* Description */}
          <div className="space-y-2">
            <Skeleton width="100%" height={14} />
            <Skeleton width="85%" height={14} />
          </div>
          
          {/* Member count */}
          <div className="flex items-center gap-2">
            <div className="opacity-50">
              <Users className="w-4 h-4 text-gray-400" />
            </div>
            <Skeleton width={80} height={14} />
          </div>
        </div>
      </div>
    </div>
  );
}

