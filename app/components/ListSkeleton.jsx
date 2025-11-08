import PostCardSkeleton from './PostCardSkeleton';
import CommunityCardSkeleton from './CommunityCardSkeleton';
import EventCardSkeleton from './EventCardSkeleton';
import ConversationListSkeleton from './ConversationListSkeleton';
import GymCardSkeleton from './GymCardSkeleton';

/**
 * ListSkeleton - Renders multiple skeleton items
 * @param {string} variant - 'post', 'community', 'event', 'conversation', 'gym', or 'custom'
 * @param {number} count - Number of skeleton items to render
 * @param {React.Component} SkeletonComponent - Custom skeleton component to use
 * @param {object} skeletonProps - Props to pass to each skeleton item
 */
export default function ListSkeleton({ 
  variant = 'post', 
  count = 3,
  SkeletonComponent,
  skeletonProps = {}
}) {
  // Choose the skeleton component based on variant
  let Component = SkeletonComponent;
  if (!Component) {
    switch (variant) {
      case 'post':
        Component = PostCardSkeleton;
        break;
      case 'community':
        Component = CommunityCardSkeleton;
        break;
      case 'event':
        Component = EventCardSkeleton;
        break;
      case 'gym':
        Component = GymCardSkeleton;
        break;
      case 'conversation':
        // ConversationListSkeleton handles its own count
        return <ConversationListSkeleton count={count} />;
      default:
        Component = PostCardSkeleton;
    }
  }

  // Generate array of skeleton items
  const skeletons = [];
  for (let i = 0; i < count; i++) {
    skeletons.push(
      <Component 
        key={i} 
        {...skeletonProps}
      />
    );
  }

  return (
    <div className="space-y-4">
      {skeletons}
    </div>
  );
}

