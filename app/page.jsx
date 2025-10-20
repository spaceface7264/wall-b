'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // User is authenticated, redirect to community
          router.push('/community');
        } else {
          // User is not authenticated, redirect to community (which will handle auth)
          router.push('/community');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        // On error, still redirect to community
        router.push('/community');
      }
    };

    checkAuthAndRedirect();
  }, [router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
        <p className="text-white">Loading...</p>
      </div>
    </div>
  );
}