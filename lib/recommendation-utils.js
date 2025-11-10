import { supabase } from './supabase';
import { enrichCommunitiesWithActualCounts } from './community-utils';
import { calculateDistance } from './geolocation';

/**
 * Gets recommended communities based on user intent
 * @param {string} userId - User ID
 * @param {string[]} userIntent - Array of user intent values
 * @param {Object} location - Optional location object with latitude and longitude
 * @param {number} limit - Maximum number of communities to return (default: 8)
 * @returns {Promise<Array>} Recommended communities
 */
export async function getRecommendedCommunities(userId, userIntent, location = null, limit = 8) {
  if (!userId || !userIntent || userIntent.length === 0) {
    return [];
  }

  try {
    // Get communities user is already a member of to exclude them
    const { data: userMemberships } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', userId);

    const excludedCommunityIds = userMemberships?.map(m => m.community_id) || [];

    // Start with all active communities
    let query = supabase
      .from('communities')
      .select(`
        *,
        gyms (
          name,
          city,
          country,
          address,
          image_url,
          latitude,
          longitude
        )
      `)
      .eq('is_active', true);

    const { data: allCommunities, error } = await query;

    if (error) {
      console.error('Error fetching communities:', error);
      return [];
    }

    // Filter out communities user is already a member of and suspended communities
    const communities = (excludedCommunityIds.length > 0
      ? (allCommunities || []).filter(c => !excludedCommunityIds.includes(c.id))
      : (allCommunities || [])).filter(c => c.is_active !== false);

    if (!communities || communities.length === 0) {
      return [];
    }

    // Score communities based on user intent
    const scoredCommunities = communities.map(community => {
      let score = 0;

      // Match based on user intent
      if (userIntent.includes('join_communities')) {
        score += 5; // High priority if user wants to join communities
      }

      if (userIntent.includes('find_partners')) {
        // Prefer communities with more members (better for finding partners)
        score += Math.min(community.member_count || 0, 50) / 10;
      }

      if (userIntent.includes('learn_techniques')) {
        // Prefer communities with more posts (likely to have more content)
        score += Math.min(community.post_count || 0, 30) / 10;
      }

      if (userIntent.includes('find_events')) {
        // Prefer communities with gyms (more likely to have events)
        if (community.gym_id || (community.gyms && community.gyms.length > 0)) {
          score += 3;
        }
      }

      // Location-based scoring if location is provided
      if (location && community.gyms && community.gyms.length > 0) {
        const gym = Array.isArray(community.gyms) ? community.gyms[0] : community.gyms;
        if (gym.latitude && gym.longitude) {
          const distance = calculateDistance(
            location.latitude,
            location.longitude,
            gym.latitude,
            gym.longitude
          );
          // Prefer closer communities (within 50km gets bonus points)
          if (distance <= 50) {
            score += (50 - distance) / 10; // Closer = higher score
          }
        }
      }

      return {
        ...community,
        recommendationScore: score
      };
    });

    // Sort by score and limit results
    const recommended = scoredCommunities
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, limit);

    // Enrich with actual member counts
    const enriched = await enrichCommunitiesWithActualCounts(recommended);

    return enriched;
  } catch (error) {
    console.error('Error getting recommended communities:', error);
    return [];
  }
}

/**
 * Gets recommended gyms based on user intent and location
 * @param {string} userId - User ID
 * @param {string[]} userIntent - Array of user intent values
 * @param {Object} location - Optional location object with latitude and longitude
 * @param {number} limit - Maximum number of gyms to return (default: 8)
 * @returns {Promise<Array>} Recommended gyms
 */
export async function getRecommendedGyms(userId, userIntent, location = null, limit = 8) {
  if (!userId || !userIntent || userIntent.length === 0) {
    return [];
  }

  try {
    // Check if user wants to discover gyms
    if (!userIntent.includes('discover_gyms')) {
      // If not interested in discovering gyms, return empty or reduce priority
      // But still return some results if location is available
      if (!location) {
        return [];
      }
    }

    // Get user's favorite gyms to potentially prioritize or exclude
    const { data: favoriteGyms } = await supabase
      .from('favorite_gyms')
      .select('gym_id')
      .eq('user_id', userId);

    const favoriteGymIds = favoriteGyms?.map(f => f.gym_id) || [];

    // Fetch all visible gyms (non-hidden)
    let query = supabase
      .from('gyms')
      .select(`
        *,
        communities(gym_id)
      `)
      .eq('is_hidden', false);

    const { data: gyms, error } = await query;

    if (error) {
      console.error('Error fetching gyms:', error);
      return [];
    }

    if (!gyms || gyms.length === 0) {
      return [];
    }

    // Process community count from Supabase relation query
    const processedGyms = gyms.map(gym => {
      let communityCount = 0;
      if (gym.communities && Array.isArray(gym.communities)) {
        // Count communities associated with this gym
        communityCount = gym.communities.length;
      }
      return {
        ...gym,
        community_count: communityCount
      };
    });

    // Score gyms based on user intent and location
    const scoredGyms = processedGyms.map(gym => {
      let score = 0;

      // Base score for discover_gyms intent
      if (userIntent.includes('discover_gyms')) {
        score += 10;
      }

      // Location-based scoring (highest priority if location is available)
      if (location && gym.latitude && gym.longitude) {
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          gym.latitude,
          gym.longitude
        );
        
        // Prefer nearby gyms (within 50km)
        if (distance <= 50) {
          score += 20 - (distance / 5); // Much higher score for closer gyms
        } else if (distance <= 100) {
          score += 5 - (distance / 20); // Lower score for farther gyms
        }
      }

      // Boost score for gyms with good facilities (indicator of quality)
      if (gym.facilities && Array.isArray(gym.facilities) && gym.facilities.length > 0) {
        score += Math.min(gym.facilities.length, 10);
      }

      // Slight preference for gyms not already favorited (to discover new ones)
      if (!favoriteGymIds.includes(gym.id)) {
        score += 1;
      }

      return {
        ...gym,
        recommendationScore: score,
        distance_km: location && gym.latitude && gym.longitude
          ? calculateDistance(location.latitude, location.longitude, gym.latitude, gym.longitude)
          : null
      };
    });

    // Sort by score (if location available, also consider distance as secondary sort)
    const recommended = scoredGyms.sort((a, b) => {
      // Primary sort by score
      if (b.recommendationScore !== a.recommendationScore) {
        return b.recommendationScore - a.recommendationScore;
      }
      // Secondary sort by distance if available
      if (location && a.distance_km !== null && b.distance_km !== null) {
        return a.distance_km - b.distance_km;
      }
      return 0;
    }).slice(0, limit);

    return recommended;
  } catch (error) {
    console.error('Error getting recommended gyms:', error);
    return [];
  }
}

