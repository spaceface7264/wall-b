import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { enrichCommunitiesWithActualCounts } from '../../lib/community-utils'

/**
 * Hook to fetch user's joined communities
 * @param {string} userId - User ID
 * @param {boolean} isAdmin - Whether the user is an admin
 * @returns {Object} React Query result with user's communities
 */
export function useMyCommunities(userId, isAdmin = false) {
  return useQuery({
    queryKey: ['communities', 'my', userId, isAdmin],
    queryFn: async () => {
      if (!userId) return []

      // Try with nested gyms relation first
      let { data, error } = await supabase
        .from('community_members')
        .select(`
          community_id,
          communities (
            id,
            name,
            description,
            community_type,
            member_count,
            created_at,
            gym_id,
            is_private,
            is_active,
            gyms (
              name,
              city,
              country,
              image_url
            )
          )
        `)
        .eq('user_id', userId)

      // If nested query fails, fetch communities separately
      if (error) {
        console.warn('Error loading my communities with nested gyms:', error)
        
        const { data: membersData, error: membersError } = await supabase
          .from('community_members')
          .select('community_id')
          .eq('user_id', userId)

        if (membersError) {
          throw membersError
        }

        const communityIds = membersData?.map(m => m.community_id).filter(Boolean) || []
        if (communityIds.length === 0) {
          return []
        }

        const { data: communitiesData, error: communitiesError } = await supabase
          .from('communities')
          .select('id, name, description, community_type, member_count, created_at, gym_id, is_active, is_private')
          .in('id', communityIds)

        if (communitiesError) {
          throw communitiesError
        }
        
        // Filter out suspended communities for non-admins
        const filteredCommunitiesData = isAdmin 
          ? communitiesData 
          : (communitiesData || []).filter(c => c.is_active !== false)

        data = filteredCommunitiesData?.map(c => ({ community_id: c.id, communities: c })) || []
        
        // Fetch gym data separately
        const gymIds = communitiesData
          ?.map(c => c.gym_id)
          .filter(Boolean)
          .filter((id, index, self) => self.indexOf(id) === index) || []
        
        if (gymIds.length > 0) {
          // Try batch query first
          const { data: gymsData, error: gymsError } = await supabase
            .from('gyms')
            .select('id, name, city, country, image_url')
            .in('id', gymIds)
          
          if (gymsError) {
            // Fallback: fetch gyms individually
            const gymsMap = {}
            for (const gymId of gymIds) {
              try {
                const { data: gymData } = await supabase
                  .from('gyms')
                  .select('id, name, city, country, image_url')
                  .eq('id', gymId)
                  .single()
                
                if (gymData) {
                  gymsMap[gymData.id] = gymData
                }
              } catch (err) {
                console.warn('Failed to fetch gym', gymId, err)
              }
            }
            
            // Attach gym data to communities
            data = data.map(item => {
              const gym = item.communities.gym_id && gymsMap[item.communities.gym_id] 
                ? gymsMap[item.communities.gym_id] 
                : null
              return {
                ...item,
                communities: {
                  ...item.communities,
                  gyms: gym ? [gym] : undefined
                }
              }
            })
          } else if (gymsData) {
            // Batch query succeeded
            const gymsMap = {}
            gymsData.forEach(gym => {
              gymsMap[gym.id] = gym
            })
            
            // Attach gym data to communities
            data = data.map(item => {
              const gym = item.communities.gym_id && gymsMap[item.communities.gym_id] 
                ? gymsMap[item.communities.gym_id] 
                : null
              return {
                ...item,
                communities: {
                  ...item.communities,
                  gyms: gym ? [gym] : undefined
                }
              }
            })
          }
        }
      }

      const myCommunitiesList = data?.map(item => item.communities).filter(Boolean) || []
      
      // Filter out suspended communities for non-admins
      const activeMyCommunities = isAdmin 
        ? myCommunitiesList 
        : myCommunitiesList.filter(c => c.is_active !== false)
      
      // Enrich with actual member counts
      const enrichedMyCommunities = await enrichCommunitiesWithActualCounts(activeMyCommunities)
      
      return enrichedMyCommunities
    },
    enabled: !!userId, // Only run if userId exists
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

