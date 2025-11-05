import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function NSFWToggle({ value, onChange, disabled = false }) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="relative">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={value || false}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-orange-600 focus:ring-orange-600 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-400" />
          <span className="text-sm text-gray-300">Mark as NSFW</span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowInfo(!showInfo);
            }}
            className="text-gray-400 hover:text-gray-300 transition-colors"
            onMouseEnter={() => setShowInfo(true)}
            onMouseLeave={() => setShowInfo(false)}
          >
            <span className="text-xs">ℹ️</span>
          </button>
        </div>
      </label>

      {showInfo && (
        <div className="absolute left-0 top-full mt-2 p-3 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 w-64">
          <div className="flex items-start justify-between mb-2">
            <p className="text-xs font-medium text-gray-300">NSFW Content</p>
            <button
              onClick={() => setShowInfo(false)}
              className="text-gray-400 hover:text-gray-300"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="text-xs text-gray-400">
            Marking content as NSFW will blur it for users who haven't verified their age or enabled NSFW content in their settings.
          </p>
        </div>
      )}
    </div>
  );
}
