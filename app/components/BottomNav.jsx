'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Home, MapPin, MessageCircle, User } from 'lucide-react';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      path: '/community'
    },
    {
      id: 'gyms',
      label: 'Gyms',
      icon: MapPin,
      path: '/gyms'
    },
    {
      id: 'chats',
      label: 'Chats',
      icon: MessageCircle,
      path: '/chat'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      path: '/profile'
    }
  ];

  const isActive = (path) => {
    if (path === '/community') {
      return pathname === '/community' || pathname.startsWith('/community/');
    }
    return pathname.startsWith(path);
  };

  const handleNavigation = (path) => {
    if (path === '/community') {
      sessionStorage.setItem('fromHomeButton', 'true');
    }
    router.push(path);
  };

  return (
    <div className="bottom-nav">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={`flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 transition-colors duration-200 ${
                active
                  ? 'text-indigo-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Icon className={`w-6 h-6 mb-1 ${active ? 'text-indigo-400' : ''}`} />
              <span className={`text-xs font-medium truncate ${
                active ? 'text-indigo-400' : 'text-gray-400'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
