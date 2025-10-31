import { supabase } from './supabase';

/**
 * Enriches community data with actual member counts from community_members table
 * This ensures member_count is always accurate when displaying
 * 
 * @param {Array} communities - Array of community objects
 * @returns {Promise<Array>} Communities with updated member_count
 */
export async function enrichCommunitiesWithActualCounts(communities) {
  if (!communities || communities.length === 0) {
    return communities;
  }

  try {
    const communityIds = communities.map(c => c.id).filter(Boolean);
    
    if (communityIds.length === 0) {
      return communities;
    }

    // Get actual member counts for all communities in one query
    const { data: memberCounts, error } = await supabase
      .from('community_members')
      .select('community_id')
      .in('community_id', communityIds);

    if (error) {
      console.warn('Could not fetch actual member counts, using stored values:', error);
      return communities; // Fall back to stored member_count
    }

    // Count members per community
    const countsByCommunity = {};
    memberCounts?.forEach(({ community_id }) => {
      countsByCommunity[community_id] = (countsByCommunity[community_id] || 0) + 1;
    });

    // Get post counts for all communities
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('community_id, tag')
      .in('community_id', communityIds)
      .not('community_id', 'is', null);

    if (postsError) {
      console.warn('Could not fetch post counts:', postsError);
    }

    // Count posts per community and collect unique tags
    const postCountsByCommunity = {};
    const tagsByCommunity = {};
    
    posts?.forEach(({ community_id, tag }) => {
      if (community_id) {
        postCountsByCommunity[community_id] = (postCountsByCommunity[community_id] || 0) + 1;
        if (tag && tag !== 'general') {
          if (!tagsByCommunity[community_id]) {
            tagsByCommunity[community_id] = new Set();
          }
          tagsByCommunity[community_id].add(tag);
        }
      }
    });

    // Enrich communities with actual counts, post counts, and tags
    // Preserve all existing properties including nested relations (gyms, etc.)
    return communities.map(community => {
      const enriched = {
        ...community, // This preserves gyms and all other properties
        member_count: countsByCommunity[community.id] ?? 0,
        post_count: postCountsByCommunity[community.id] ?? 0,
        tags: tagsByCommunity[community.id] ? Array.from(tagsByCommunity[community.id]).slice(0, 5) : []
      };
      
      // Debug: log if community has gym_id but no gyms data after enrichment
      if (community.gym_id && !enriched.gyms) {
        console.warn('Community has gym_id but no gyms data after enrichment:', {
          id: community.id,
          name: community.name,
          gym_id: community.gym_id,
          original_gyms: community.gyms
        });
      }
      
      return enriched;
    });
  } catch (error) {
    console.warn('Error enriching communities with actual counts:', error);
    return communities; // Fall back to stored member_count
  }
}

/**
 * Gets the actual member count for a single community
 * 
 * @param {string} communityId - Community ID
 * @returns {Promise<number>} Actual member count
 */
export async function getActualMemberCount(communityId) {
  if (!communityId) return 0;

  try {
    const { count, error } = await supabase
      .from('community_members')
      .select('*', { count: 'exact', head: true })
      .eq('community_id', communityId);

    if (error) {
      console.warn('Could not fetch actual member count:', error);
      return 0;
    }

    return count ?? 0;
  } catch (error) {
    console.warn('Error getting actual member count:', error);
    return 0;
  }
}

