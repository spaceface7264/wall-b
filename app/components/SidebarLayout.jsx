'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { User as UserIcon, Home, Users, MessageCircle, MapPin } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
);

export default function SidebarLayout({ children, currentPage = 'dashboard' }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
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


  if (loading) {
    return (
      <div className="mobile-app mobile-safe-area flex items-center justify-center animate-fade-in" style={{ backgroundColor: '#181C21' }}>
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
    <div className="mobile-app mobile-safe-area flex flex-col animate-fade-in" style={{ backgroundColor: '#181C21' }}>
      {/* Mobile Header */}
      <div className="flex items-center justify-center p-4 border-b animate-slide-down" style={{ backgroundColor: '#1b1d21', borderColor: '#374151' }}>
        <h1 className="minimal-heading capitalize">{currentPage}</h1>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="p-4 animate-slide-up">
          {children}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="mobile-bottom-nav animate-slide-up" style={{ backgroundColor: '#1b1d21', borderTop: '1px solid #374151' }}>
        <div className="flex items-center justify-around py-2">
          <button 
            onClick={() => router.push('/dashboard')}
            className={`flex flex-col items-center gap-1 px-3 py-2 mobile-touch-target touch-feedback ${
              currentPage === 'main' 
                ? 'text-white' 
                : 'text-gray-400'
            }`}
          >
            <Home className="minimal-icon" />
            <span className="text-xs">Main</span>
          </button>
          
          <button 
            onClick={() => router.push('/profile')}
            className={`flex flex-col items-center gap-1 px-3 py-2 mobile-touch-target touch-feedback ${
              currentPage === 'profile' 
                ? 'text-white' 
                : 'text-gray-400'
            }`}
          >
            <UserIcon className="minimal-icon" />
            <span className="text-xs">Profile</span>
          </button>
          
          <button 
            onClick={() => router.push('/community')}
            className={`flex flex-col items-center gap-1 px-3 py-2 mobile-touch-target touch-feedback ${
              currentPage === 'community' 
                ? 'text-white' 
                : 'text-gray-400'
            }`}
          >
            <Users className="minimal-icon" />
            <span className="text-xs">Community</span>
          </button>
          
          <button 
            onClick={() => router.push('/chat')}
            className={`flex flex-col items-center gap-1 px-3 py-2 mobile-touch-target touch-feedback ${
              currentPage === 'chat' 
                ? 'text-white' 
                : 'text-gray-400'
            }`}
          >
            <MessageCircle className="minimal-icon" />
            <span className="text-xs">Chat</span>
          </button>
          
          <button 
            onClick={() => router.push('/gyms')}
            className={`flex flex-col items-center gap-1 px-3 py-2 mobile-touch-target touch-feedback ${
              currentPage === 'gyms' 
                ? 'text-white' 
                : 'text-gray-400'
            }`}
          >
            <MapPin className="minimal-icon" />
            <span className="text-xs">Gyms</span>
          </button>
        </div>
      </div>
    </div>
  );
}
