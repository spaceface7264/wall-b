import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

export default function FocalPointSelector({
  imageUrl,
  focalX = 0.5,
  focalY = 0.5,
  onFocalPointChange,
  onClose,
  aspectRatio = null // Optional: 'square', 'wide', 'portrait' for preview
}) {
  const [localFocalX, setLocalFocalX] = useState(focalX);
  const [localFocalY, setLocalFocalY] = useState(focalY);
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    setLocalFocalX(focalX);
    setLocalFocalY(focalY);
  }, [focalX, focalY]);

  const handleImageClick = (e) => {
    if (!imageRef.current || !containerRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Clamp values between 0 and 1
    const clampedX = Math.max(0, Math.min(1, x));
    const clampedY = Math.max(0, Math.min(1, y));

    setLocalFocalX(clampedX);
    setLocalFocalY(clampedY);
    
    if (onFocalPointChange) {
      onFocalPointChange(clampedX, clampedY);
    }
  };

  const handleSave = () => {
    if (onFocalPointChange) {
      onFocalPointChange(localFocalX, localFocalY);
    }
    if (onClose) {
      onClose();
    }
  };

  if (!imageUrl) return null;

  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" style={{ borderRadius: 4 }}>
        <div className="p-4 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-white">Set Image Focal Point</h3>
            <p className="text-sm text-gray-400 mt-1">
              Click on the image to set the focal point. This point will be prioritized when the image is cropped or resized.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {/* Main Image with Focal Point Indicator */}
            <div
              ref={containerRef}
              className="relative bg-gray-800 rounded border border-gray-700 overflow-hidden"
              style={{ borderRadius: 4 }}
            >
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Set focal point"
                onClick={handleImageClick}
                className="w-full h-auto cursor-crosshair"
                style={{
                  objectFit: 'contain',
                  maxHeight: '60vh',
                  display: 'block'
                }}
              />
              
              {/* Focal Point Indicator */}
              <div
                className="absolute pointer-events-none"
                style={{
                  left: `${localFocalX * 100}%`,
                  top: `${localFocalY * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  width: '40px',
                  height: '40px',
                  border: '3px solid #00d4ff',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(8, 126, 139, 0.3)',
                  boxShadow: '0 0 0 2px rgba(0, 0, 0, 0.5)'
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    borderRadius: '50%',
                    backgroundColor: '#00d4ff',
                    width: '12px',
                    height: '12px',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              </div>
            </div>

            {/* Preview at Different Aspect Ratios */}
            {aspectRatio && (
              <div>
                <p className="text-sm text-gray-400 mb-2">Preview:</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Square</p>
                    <div className="w-full aspect-square bg-gray-800 rounded border border-gray-700 overflow-hidden" style={{ borderRadius: 4 }}>
                      <img
                        src={imageUrl}
                        alt="Square preview"
                        className="w-full h-full"
                        style={{
                          objectFit: 'cover',
                          objectPosition: `${localFocalX * 100}% ${localFocalY * 100}%`
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Wide</p>
                    <div className="w-full aspect-video bg-gray-800 rounded border border-gray-700 overflow-hidden" style={{ borderRadius: 4 }}>
                      <img
                        src={imageUrl}
                        alt="Wide preview"
                        className="w-full h-full"
                        style={{
                          objectFit: 'cover',
                          objectPosition: `${localFocalX * 100}% ${localFocalY * 100}%`
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Tall</p>
                    <div className="w-full" style={{ aspectRatio: '3/4' }}>
                      <div className="w-full h-full bg-gray-800 rounded border border-gray-700 overflow-hidden" style={{ borderRadius: 4 }}>
                        <img
                          src={imageUrl}
                          alt="Tall preview"
                          className="w-full h-full"
                          style={{
                            objectFit: 'cover',
                            objectPosition: `${localFocalX * 100}% ${localFocalY * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t border-gray-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-[#00d4ff] text-white rounded hover:bg-[#00b8e6] transition-colors"
          >
            Save Focal Point
          </button>
        </div>
      </div>
    </div>
  );
}

