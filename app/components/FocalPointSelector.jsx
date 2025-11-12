import { useState, useRef, useEffect } from 'react';
import { X, Move } from 'lucide-react';

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
  const [isDragging, setIsDragging] = useState(false);
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const indicatorRef = useRef(null);

  useEffect(() => {
    setLocalFocalX(focalX);
    setLocalFocalY(focalY);
  }, [focalX, focalY]);

  const updateFocalPoint = (clientX, clientY) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;

    // Clamp values between 0 and 1
    const clampedX = Math.max(0, Math.min(1, x));
    const clampedY = Math.max(0, Math.min(1, y));

    setLocalFocalX(clampedX);
    setLocalFocalY(clampedY);
    
    if (onFocalPointChange) {
      onFocalPointChange(clampedX, clampedY);
    }
  };

  const handleImageClick = (e) => {
    if (isDragging) return; // Don't update on click if we just finished dragging
    updateFocalPoint(e.clientX, e.clientY);
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    // Update position immediately on touch start
    if (e.touches && e.touches[0]) {
      updateFocalPoint(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      updateFocalPoint(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleTouchMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      if (e.touches && e.touches[0]) {
        updateFocalPoint(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging]);

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
            <h3 className="text-lg font-semibold text-white">Adjust Image Position</h3>
            <p className="text-sm text-gray-400 mt-1">
              Click or drag the focal point indicator to adjust the image position. This point will be prioritized when the image is cropped or resized.
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
              
              {/* Focal Point Indicator - Draggable */}
              <div
                ref={indicatorRef}
                className="absolute cursor-move select-none touch-none"
                style={{
                  left: `${localFocalX * 100}%`,
                  top: `${localFocalY * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  width: '40px',
                  height: '40px',
                  border: `3px solid ${isDragging ? 'var(--accent-blue-hover)' : 'var(--accent-blue)'}`,
                  borderRadius: '50%',
                  backgroundColor: isDragging ? 'rgba(8, 126, 139, 0.5)' : 'rgba(8, 126, 139, 0.3)',
                  boxShadow: '0 0 0 2px rgba(0, 0, 0, 0.5)',
                  transition: isDragging ? 'none' : 'all 0.2s ease',
                  zIndex: 10
                }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                title="Drag to adjust position"
              >
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    borderRadius: '50%',
                    backgroundColor: isDragging ? 'var(--accent-blue-hover)' : 'var(--accent-blue)',
                    width: '12px',
                    height: '12px',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)'
                  }}
                />
                {isDragging && (
                  <Move 
                    className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 text-accent-blue w-4 h-4"
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8))' }}
                  />
                )}
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
            className="flex-1 px-4 py-2 bg-accent-blue text-white rounded hover:bg-accent-blue-hover transition-colors"
          >
            Save Focal Point
          </button>
        </div>
      </div>
    </div>
  );
}

