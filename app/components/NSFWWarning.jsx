import { AlertTriangle } from 'lucide-react';

/**
 * NSFWWarning Component
 * NSFW content is not allowed on this platform - always blocks content
 */
export default function NSFWWarning({ content, children, onReveal }) {
  // NSFW content is completely blocked - always show blocking message
  return (
    <div className="relative">
      {/* Hidden content */}
      <div className="blur-md select-none pointer-events-none opacity-30">
        {children}
      </div>

      {/* Blocking overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-gray-900/95 backdrop-blur-sm">
        <div className="text-center p-6 max-w-md">
          <div className="flex items-center justify-center gap-2 mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
            <h3 className="text-lg font-semibold text-white">Content Not Available</h3>
          </div>
          <p className="text-sm text-gray-300 mb-2">
            This content has been flagged as inappropriate and is not available on this platform.
          </p>
          <p className="text-xs text-gray-400">
            Our platform does not allow NSFW or inappropriate content.
          </p>
        </div>
      </div>
    </div>
  );
}
