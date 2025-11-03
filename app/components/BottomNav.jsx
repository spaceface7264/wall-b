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
      path: '/home'
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
    if (path === '/home') {
      return pathname === '/home';
    }
    if (path === '/communities') {
      return pathname === '/communities' || pathname.startsWith('/community/');
    }
    return pathname.startsWith(path);
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="bottom-nav">
      <div className="bottom-nav-container">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={`bottom-nav-item ${active ? 'active' : ''}`}
              aria-label={item.label}
            >
              <div className="bottom-nav-icon-wrapper">
                <Icon className="bottom-nav-icon" />
                {item.id === 'chats' && user && (
                  <UnreadBadge userId={user.id} />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
