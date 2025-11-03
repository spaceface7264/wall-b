import Skeleton from './Skeleton';

export default function ConversationMessageSkeleton({ count = 5 }) {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: count }).map((_, i) => {
        // Alternate between sent and received messages
        const isSent = i % 3 !== 0;
        
        return (
          <div
            key={i}
            className={`flex gap-3 ${isSent ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <Skeleton variant="avatar" width={36} height={36} rounded="full" />
            
            {/* Message bubble */}
            <div className={`flex-1 max-w-[70%] ${isSent ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              {/* Sender name (only for received) */}
              {!isSent && (
                <Skeleton width={80} height={12} rounded="md" />
              )}
              
              {/* Message content */}
              <div className={`p-3 rounded-lg ${
                isSent ? 'bg-[#087E8B]/20' : 'bg-slate-700/50'
              }`}>
                <Skeleton width={`${60 + (i * 10) % 40}%`} height={16} className="mb-1" />
                <Skeleton width={`${50 + (i * 15) % 35}%`} height={16} />
              </div>
              
              {/* Timestamp */}
              <Skeleton width={60} height={10} rounded="md" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

