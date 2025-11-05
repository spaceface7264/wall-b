import { useState } from 'react';
import { AlertTriangle, Lock } from 'lucide-react';
import AgeVerificationModal from './AgeVerificationModal';

export default function AgeGate({ content, requiredAge = 18 }) {
  const [showAgeModal, setShowAgeModal] = useState(false);

  return (
    <>
      <div className="relative">
        {/* Blurred content */}
        <div className="blur-md select-none pointer-events-none opacity-30">
          {content}
        </div>

        {/* Age gate overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/95 backdrop-blur-sm">
          <div className="text-center p-6 max-w-md">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Lock className="w-8 h-8 text-orange-400" />
              <h3 className="text-lg font-semibold text-white">Age Restricted Content</h3>
            </div>
            <p className="text-sm text-gray-300 mb-2">
              You must be {requiredAge} years or older to view this content.
            </p>
            <p className="text-xs text-gray-400 mb-6">
              Please verify your age to continue.
            </p>
            <button
              onClick={() => setShowAgeModal(true)}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              <AlertTriangle className="w-4 h-4" />
              Verify Age
            </button>
          </div>
        </div>
      </div>

      {showAgeModal && (
        <AgeVerificationModal
          isOpen={showAgeModal}
          onClose={(verified) => {
            setShowAgeModal(false);
            if (verified) {
              // Reload page or update state to show content
              window.location.reload();
            }
          }}
          requiredAge={requiredAge}
        />
      )}
    </>
  );
}
