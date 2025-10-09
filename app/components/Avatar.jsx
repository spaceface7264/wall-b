'use client'

import { User as UserIcon } from 'lucide-react';

export default function Avatar({ 
  src, 
  alt = 'Avatar', 
  size = 'md', 
  name = '', 
  showOnline = false,
  showRing = false,
  loading = false,
  className = '',
  onClick
}) {
  const sizeClasses = {
    sm: 'avatar-sm',
    md: 'avatar-md', 
    lg: 'avatar-lg',
    xl: 'avatar-xl',
    '2xl': 'avatar-2xl'
  };

  const getInitials = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const avatarClasses = [
    'avatar',
    sizeClasses[size] || sizeClasses.md,
    showOnline ? 'avatar-online' : '',
    showRing ? 'avatar-ring' : '',
    loading ? 'avatar-loading' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={avatarClasses} onClick={onClick}>
      {src ? (
        <img 
          src={src} 
          alt={alt}
          onError={(e) => {
            // Fallback to placeholder if image fails to load
            e.target.style.display = 'none';
            e.target.nextElementSibling.style.display = 'flex';
          }}
        />
      ) : null}
      
      <div 
        className="avatar-placeholder"
        style={{ display: src ? 'none' : 'flex' }}
      >
        {name ? getInitials(name) : <UserIcon className="minimal-icon" />}
      </div>
    </div>
  );
}

