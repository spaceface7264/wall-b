import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Home, MapPin, MessageCircle, User, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLoginModal } from '../providers/LoginModalProvider';
import UnreadBadge from './UnreadBadge';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const [user, setUser] = useState(null);
  const { showLoginModal } = useLoginModal();

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
    // Chat feature disabled - working on feature/chat-development branch
    // {
    //   id: 'chats',
    //   label: 'Chats',
    //   icon: MessageCircle,
    //   path: '/chat'
    // },
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
    // If clicking profile and user is not logged in, show login modal
    if (path === '/profile' && !user) {
      showLoginModal({ subtitle: 'Sign in to view your profile' });
      return;
    }
    // Chat feature disabled - working on feature/chat-development branch
    // if (path === '/chat' && !user) {
    //   showLoginModal({ subtitle: 'Sign in to start conversations' });
    //   return;
    // }
    navigate(path);
  };

  return (
    <div className="bottom-nav">
      <div className="bottom-nav-container">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          const requiresAuth = (item.id === 'profile') && !user; // Chat disabled: || item.id === 'chats'
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={`bottom-nav-item ${active ? 'active' : ''}`}
              aria-label={item.label}
              title={requiresAuth ? 'Sign in required' : item.label}
            >
              <div className="bottom-nav-icon-wrapper relative">
                {requiresAuth ? (
                  <Lock className="bottom-nav-icon" />
                ) : (
                  <Icon className="bottom-nav-icon" />
                )}
                {/* Chat feature disabled - working on feature/chat-development branch */}
                {/* {item.id === 'chats' && user && (
                  <UnreadBadge userId={user.id} />
                )} */}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
