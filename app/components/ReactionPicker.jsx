import { useState, useRef, useEffect } from 'react';

const REACTIONS = [
  { emoji: '👍', label: 'Like' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '💪', label: 'Strong' },
  { emoji: '🎉', label: 'Celebrate' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '😡', label: 'Angry' }
];

export default function ReactionPicker({ 
  onReaction, 
  onClose, 
  position = { x: 0, y: 0 },
  currentReactions = []
}) {
  const [selectedReaction, setSelectedReaction] = useState(null);
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleReactionClick = (reaction) => {
    setSelectedReaction(reaction);
    if (onReaction) {
      onReaction(reaction.emoji);
    }
    // Close after a short delay to show selection
    setTimeout(() => {
      onClose();
    }, 150);
  };

  const getReactionCount = (emoji) => {
    return currentReactions.filter(r => r.reaction_type === emoji).length;
  };

  return (
    <div
      ref={pickerRef}
      className="reaction-picker"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        bottom: `${window.innerHeight - position.y + 10}px`,
        zIndex: 50
      }}
    >
      {REACTIONS.map((reaction) => {
        const count = getReactionCount(reaction.emoji);
        const isSelected = selectedReaction?.emoji === reaction.emoji;
        
        return (
          <button
            key={reaction.emoji}
            onClick={() => handleReactionClick(reaction)}
            className={`reaction-picker button ${isSelected ? 'selected' : ''}`}
            title={reaction.label}
            style={{
              backgroundColor: isSelected ? '#00d4ff' : '#374151',
              transform: isSelected ? 'scale(1.1)' : 'scale(1)',
              position: 'relative'
            }}
          >
            <span className="text-lg">{reaction.emoji}</span>
            {count > 0 && (
              <span 
                className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                style={{ fontSize: '10px' }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

