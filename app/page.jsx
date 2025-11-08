import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import LandingPage from './components/LandingPage';

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // User is logged in, redirect to home page
        navigate('/home');
      }
    };
    checkSession();
  }, [navigate]);

  return <LandingPage />;
}