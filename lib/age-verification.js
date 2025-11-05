/**
 * Age Verification Library
 * Functions for verifying user age and checking age requirements
 */

import { supabase } from './supabase';

/**
 * Verify user age (simple checkbox confirmation)
 * @param {boolean} ageConfirmed - Whether user confirmed they are 16+
 * @param {Date} dateOfBirth - Optional date of birth for strict verification
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function verifyAge(ageConfirmed, dateOfBirth = null) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    if (!ageConfirmed) {
      return { success: false, error: 'Age confirmation required' };
    }

    // Calculate age if date of birth is provided
    let age = null;
    if (dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      // Verify user is at least 16 years old
      if (age < 16) {
        return { success: false, error: 'You must be 16 years or older to use this platform.' };
      }
    }

    const updateData = {
      age_verified: true,
      age_verification_method: dateOfBirth ? 'document' : 'manual',
      age_verification_date: new Date().toISOString()
    };

    if (dateOfBirth) {
      updateData.date_of_birth = dateOfBirth.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id);

    if (error) throw error;

    return { success: true, age: age };
  } catch (error) {
    console.error('Error verifying age:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if user is age verified
 * @param {string} userId - User ID (optional, will use current user if not provided)
 * @returns {Promise<boolean>}
 */
export async function isAgeVerified(userId = null) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const targetUserId = userId || user?.id;

    if (!targetUserId) return false;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('age_verified')
      .eq('id', targetUserId)
      .single();

    if (error || !profile) return false;

    return profile.age_verified === true;
  } catch (error) {
    console.error('Error checking age verification:', error);
    return false;
  }
}

/**
 * Get user's age (if date of birth is available)
 * @param {string} userId - User ID (optional, will use current user if not provided)
 * @returns {Promise<number|null>}
 */
export async function getUserAge(userId = null) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const targetUserId = userId || user?.id;

    if (!targetUserId) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('date_of_birth')
      .eq('id', targetUserId)
      .single();

    if (error || !profile || !profile.date_of_birth) return null;

    const today = new Date();
    const birthDate = new Date(profile.date_of_birth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  } catch (error) {
    console.error('Error getting user age:', error);
    return null;
  }
}

/**
 * Check if user meets community age requirement
 * @param {string} communityId - Community ID
 * @param {string} userId - User ID (optional, will use current user if not provided)
 * @returns {Promise<{meets: boolean, required: number, actual?: number}>}
 */
export async function checkCommunityAgeRequirement(communityId, userId = null) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const targetUserId = userId || user?.id;

    if (!targetUserId) {
      return { meets: false, required: 16, actual: null };
    }

    // Get community age requirement
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('minimum_age_required')
      .eq('id', communityId)
      .single();

    if (communityError || !community) {
      return { meets: false, required: 16, actual: null };
    }

    // Minimum age is always 16
    const requiredAge = Math.max(community.minimum_age_required || 16, 16);

    // Get user's age verification status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('age_verified, date_of_birth')
      .eq('id', targetUserId)
      .single();

    if (profileError || !profile) {
      return { meets: false, required: requiredAge, actual: null };
    }

    // If user is not age verified, they don't meet requirement
    if (!profile.age_verified) {
      return { meets: false, required: requiredAge, actual: null };
    }

    // If date of birth is available, calculate actual age
    let actualAge = null;
    if (profile.date_of_birth) {
      const today = new Date();
      const birthDate = new Date(profile.date_of_birth);
      actualAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        actualAge--;
      }
    }

    // If we have actual age, check it
    if (actualAge !== null) {
      return {
        meets: actualAge >= requiredAge,
        required: requiredAge,
        actual: actualAge
      };
    }

    // If no date of birth but age is verified, assume they meet requirement
    // (they confirmed they are old enough)
    return {
      meets: true,
      required: requiredAge,
      actual: null
    };
  } catch (error) {
    console.error('Error checking community age requirement:', error);
    return { meets: false, required: 16, actual: null };
  }
}
