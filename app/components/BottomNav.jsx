import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Home, MapPin, MessageCircle, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import UnreadBadge from './UnreadBadge';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

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
    navigate(path);
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
              className={`flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 transition-colors duration-200 relative ${
                active
                  ? 'text-indigo-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <div className="relative">
                <Icon className={`w-6 h-6 mb-1 ${active ? 'text-indigo-400' : ''}`} />
                {item.id === 'chats' && user && (
                  <UnreadBadge userId={user.id} />
                )}
              </div>
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
