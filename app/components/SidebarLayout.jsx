'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { User as UserIcon, Home, Users, MessageCircle, MapPin, Menu, X, LogOut } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
);

export default function SidebarLayout({ children, currentPage = 'dashboard' }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (mounted) {
          setUser(user);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting user:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [loading, user, router]);

  // Ripple effect function
  const createRipple = (event) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    const ripple = document.createElement('span');
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');
    
    button.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  const navigateToPage = (page) => {
    router.push(`/${page}`);
    closeDrawer();
  };


  if (loading) {
    return (
      <div className="mobile-app mobile-safe-area flex items-center justify-center animate-fade-in" style={{ backgroundColor: '#252526' }}>
        <div className="text-center animate-bounce-in">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="minimal-text">Loading Wall-B...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="mobile-app mobile-safe-area">
      {/* Mobile Header */}
      <div className="mobile-header">
        <button 
          onClick={toggleDrawer}
          onMouseDown={createRipple}
          className="mobile-touch-target ripple-effect"
        >
          <div className={`mobile-hamburger ${drawerOpen ? 'open' : ''}`}>
            <div className="mobile-hamburger-line"></div>
            <div className="mobile-hamburger-line"></div>
            <div className="mobile-hamburger-line"></div>
          </div>
        </button>
        
        <h1 className="mobile-header-title capitalize">{currentPage}</h1>
        
        <div className="mobile-header-actions">
          {/* Add any header actions here */}
        </div>
      </div>

      {/* Drawer Overlay */}
      {drawerOpen && (
        <div 
          className="mobile-drawer-overlay open"
          onClick={closeDrawer}
        />
      )}

      {/* Drawer */}
      <div className={`mobile-drawer ${drawerOpen ? 'open' : ''}`}>
        {/* Drawer Header */}
        <div className="mobile-drawer-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-medium">
                {user?.user_metadata?.full_name || user?.email || 'User'}
              </h3>
              <p className="text-gray-400 text-sm">
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Drawer Navigation */}
        <div className="mobile-drawer-nav">
          <button
            onClick={() => navigateToPage('dashboard')}
            onMouseDown={createRipple}
            className={`mobile-drawer-item ripple-effect ${
              currentPage === 'dashboard' ? 'active' : ''
            }`}
          >
            <Home className="mobile-drawer-icon" />
            <span className="mobile-drawer-text">Dashboard</span>
          </button>

          <button
            onClick={() => navigateToPage('profile')}
            onMouseDown={createRipple}
            className={`mobile-drawer-item ripple-effect ${
              currentPage === 'profile' ? 'active' : ''
            }`}
          >
            <UserIcon className="mobile-drawer-icon" />
            <span className="mobile-drawer-text">Profile</span>
          </button>

          <button
            onClick={() => navigateToPage('community')}
            onMouseDown={createRipple}
            className={`mobile-drawer-item ripple-effect ${
              currentPage === 'community' ? 'active' : ''
            }`}
          >
            <Users className="mobile-drawer-icon" />
            <span className="mobile-drawer-text">Community</span>
          </button>

          <button
            onClick={() => navigateToPage('chat')}
            onMouseDown={createRipple}
            className={`mobile-drawer-item ripple-effect ${
              currentPage === 'chat' ? 'active' : ''
            }`}
          >
            <MessageCircle className="mobile-drawer-icon" />
            <span className="mobile-drawer-text">Chat</span>
          </button>

          <button
            onClick={() => navigateToPage('gyms')}
            onMouseDown={createRipple}
            className={`mobile-drawer-item ripple-effect ${
              currentPage === 'gyms' ? 'active' : ''
            }`}
          >
            <MapPin className="mobile-drawer-icon" />
            <span className="mobile-drawer-text">Gyms</span>
          </button>
        </div>

        {/* Drawer Footer */}
        <div className="mobile-drawer-footer">
          <button
            onClick={handleLogout}
            onMouseDown={createRipple}
            className="mobile-drawer-item ripple-effect text-red-400 hover:text-red-300"
          >
            <LogOut className="mobile-drawer-icon" />
            <span className="mobile-drawer-text">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mobile-content">
        <div className="p-comfortable">
          {children}
        </div>
      </div>
    </div>
  );
}
