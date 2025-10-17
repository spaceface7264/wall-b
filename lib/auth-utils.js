import { supabase } from './supabase';

// Helper function to safely get user with error handling
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log('Auth error (non-critical):', error.message);
      return null;
    }
    
    return user;
  } catch (error) {
    console.log('Auth error (non-critical):', error.message);
    return null;
  }
};

// Helper function to safely get session with error handling
export const getCurrentSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('Session error (non-critical):', error.message);
      return null;
    }
    
    return session;
  } catch (error) {
    console.log('Session error (non-critical):', error.message);
    return null;
  }
};

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  const user = await getCurrentUser();
  return !!user;
};
