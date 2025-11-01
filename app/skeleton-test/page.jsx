import { useState } from 'react';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import ListSkeleton from '../components/ListSkeleton';
import PostCardSkeleton from '../components/PostCardSkeleton';
import CommunityCardSkeleton from '../components/CommunityCardSkeleton';
import ProfileSkeleton from '../components/ProfileSkeleton';
import EventCardSkeleton from '../components/EventCardSkeleton';
import ConversationListSkeleton from '../components/ConversationListSkeleton';
import Skeleton from '../components/Skeleton';

/**
 * Skeleton Test/Demo Page
 * Visit /skeleton-test to see all skeleton components in action
 */
export default function SkeletonTestPage() {
  const [delay, setDelay] = useState(2000);
  const [showLoading, setShowLoading] = useState(true);

  // Simulate data that loads after delay
  const mockData = { loaded: true };
  const { loading, data } = useDelayedLoading(mockData, { 
    delay: showLoading ? delay : 0,
    enabled: showLoading 
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Controls */}
        <div className="bg-slate-800 p-6 rounded-lg space-y-4">
          <h1 className="text-2xl font-bold mb-4">Skeleton Loading Test Page</h1>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Simulated Delay (ms): {delay}
              </label>
              <input
                type="range"
                min="0"
                max="5000"
                step="100"
                value={delay}
                onChange={(e) => setDelay(Number(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => setShowLoading(true)}
                className="px-4 py-2 bg-[#087E8B] rounded hover:bg-[#066a75]"
              >
                Start Loading
              </button>
              <button
                onClick={() => setShowLoading(false)}
                className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700"
              >
                Clear Loading
              </button>
            </div>
            
            <p className="text-sm text-gray-400">
              Current state: {loading ? 'Loading...' : 'Loaded'} | Delay: {delay}ms
            </p>
          </div>
        </div>

        {/* Post Card Skeletons */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Post Card Skeletons</h2>
          {loading ? (
            <ListSkeleton variant="post" count={3} />
          ) : (
            <div className="bg-slate-800 p-4 rounded">
              <p className="text-green-400">✓ Posts loaded!</p>
            </div>
          )}
        </section>

        {/* Community Card Skeletons */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Community Card Skeletons</h2>
          {loading ? (
            <ListSkeleton variant="community" count={4} />
          ) : (
            <div className="bg-slate-800 p-4 rounded">
              <p className="text-green-400">✓ Communities loaded!</p>
            </div>
          )}
        </section>

        {/* Event Card Skeletons */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Event Card Skeletons</h2>
          {loading ? (
            <ListSkeleton variant="event" count={2} />
          ) : (
            <div className="bg-slate-800 p-4 rounded">
              <p className="text-green-400">✓ Events loaded!</p>
            </div>
          )}
        </section>

        {/* Conversation List Skeletons */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Conversation List Skeletons</h2>
          {loading ? (
            <ConversationListSkeleton count={5} />
          ) : (
            <div className="bg-slate-800 p-4 rounded">
              <p className="text-green-400">✓ Conversations loaded!</p>
            </div>
          )}
        </section>

        {/* Profile Skeleton */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Profile Skeleton</h2>
          {loading ? (
            <ProfileSkeleton />
          ) : (
            <div className="bg-slate-800 p-4 rounded">
              <p className="text-green-400">✓ Profile loaded!</p>
            </div>
          )}
        </section>

        {/* Base Skeleton Examples */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Base Skeleton Variants</h2>
          <div className="bg-slate-800 p-6 rounded space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-2">Default</p>
              <Skeleton width={200} height={40} />
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-2">Text</p>
              <div className="space-y-2">
                <Skeleton variant="text" width="100%" />
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="60%" />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-2">Avatar</p>
              <Skeleton variant="avatar" width={64} height={64} rounded="full" />
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-2">Button</p>
              <Skeleton variant="button" width={120} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

