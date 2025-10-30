/**
 * Base Skeleton Component
 * Provides shimmer animation and base styling for loading states
 */

export default function Skeleton({ 
  className = '', 
  width, 
  height, 
  rounded = 'minimal',
  variant = 'default' // 'default', 'text', 'avatar', 'button'
}) {
  const baseClasses = 'bg-slate-700/50 animate-pulse';
  
  const variantClasses = {
    default: '',
    text: 'h-4',
    avatar: 'rounded-full',
    button: 'h-10 rounded-button'
  };

  const roundedClasses = {
    none: '',
    minimal: 'rounded',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full'
  };

  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${roundedClasses[rounded]} ${className} relative overflow-hidden`}
      style={style}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
    </div>
  );
}

// CSS for shimmer animation (add to globals.css)
// @keyframes shimmer {
//   0% { transform: translateX(-100%); }
//   100% { transform: translateX(100%); }
// }

