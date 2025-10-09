import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Play } from 'lucide-react';

export default function MediaGallery({ 
  media = [], 
  onClose,
  startIndex = 0,
  showFullscreen = true
}) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [showModal, setShowModal] = useState(false);

  if (!media || media.length === 0) return null;

  const currentMedia = media[currentIndex];

  const nextMedia = () => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
  };

  const prevMedia = () => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  const openModal = () => {
    if (showFullscreen) {
      setShowModal(true);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    if (onClose) onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') prevMedia();
    if (e.key === 'ArrowRight') nextMedia();
  };

  if (media.length === 1) {
    return (
      <div className="media-gallery">
        <div 
          className="relative cursor-pointer group"
          onClick={openModal}
        >
          <img
            src={currentMedia.media_url}
            alt={currentMedia.caption || 'Media'}
            className="w-full h-48 object-cover rounded-lg"
          />
          {currentMedia.media_type === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg">
              <Play className="w-8 h-8 text-white" />
            </div>
          )}
          {currentMedia.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 rounded-b-lg">
              <p className="text-sm truncate">{currentMedia.caption}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="media-gallery">
        <div 
          className="relative cursor-pointer group"
          onClick={openModal}
        >
          <img
            src={currentMedia.media_url}
            alt={currentMedia.caption || 'Media'}
            className="w-full h-48 object-cover rounded-lg"
          />
          {currentMedia.media_type === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg">
              <Play className="w-8 h-8 text-white" />
            </div>
          )}
          {currentMedia.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 rounded-b-lg">
              <p className="text-sm truncate">{currentMedia.caption}</p>
            </div>
          )}
          
          {/* Navigation arrows */}
          {media.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevMedia();
                }}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextMedia();
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
          
          {/* Media counter */}
          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
            {currentIndex + 1} / {media.length}
          </div>
        </div>
        
        {/* Thumbnail strip */}
        {media.length > 1 && (
          <div className="flex gap-2 mt-2 overflow-x-auto">
            {media.map((item, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                  index === currentIndex 
                    ? 'border-blue-500' 
                    : 'border-transparent hover:border-gray-500'
                }`}
              >
                <img
                  src={item.media_url}
                  alt={item.caption || `Media ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 minimal-flex-center z-50"
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full mx-4">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="relative">
              {currentMedia.media_type === 'video' ? (
                <video
                  src={currentMedia.media_url}
                  controls
                  className="w-full h-auto max-h-[80vh] rounded-lg"
                  autoPlay
                />
              ) : (
                <img
                  src={currentMedia.media_url}
                  alt={currentMedia.caption || 'Media'}
                  className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                />
              )}
              
              {currentMedia.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 rounded-b-lg">
                  <p className="text-sm">{currentMedia.caption}</p>
                </div>
              )}
            </div>
            
            {/* Navigation in modal */}
            {media.length > 1 && (
              <>
                <button
                  onClick={prevMedia}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextMedia}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

