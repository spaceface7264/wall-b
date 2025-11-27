import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { enrichCommunitiesWithActualCounts } from '../../lib/community-utils'

/**
 * Hook to fetch all communities
 * @param {boolean} isAdmin - Whether the user is an admin (affects filtering)
 * @returns {Object} React Query result with communities data
 */
export function useCommunities(isAdmin = false) {
  return useQuery({
    queryKey: ['communities', 'all', isAdmin],
    queryFn: async () => {
      // First try with gyms relation
      let query = supabase
        .from('communities')
        .select(`
          *,
          gyms (
            name,
            city,
            country,
            address,
            image_url
          )
        `)
      
      // Only filter suspended communities if user is not admin
      if (!isAdmin) {
        query = query.eq('is_active', true)
      }
      
      query = query.order('created_at', { ascending: false })
      
      let { data, error } = await query

      // If that fails (e.g., RLS issue with gyms), try without gyms relation
      if (error) {
        console.warn('Error loading communities with gyms relation:', error)
        
        let fallbackQuery = supabase
          .from('communities')
          .select('*')
        
        if (!isAdmin) {
          fallbackQuery = fallbackQuery.eq('is_active', true)
        }
        
        const fallbackResult = await fallbackQuery.order('created_at', { ascending: false })
        
        if (fallbackResult.error) {
          throw fallbackResult.error
        }
        
        data = fallbackResult.data
        
        // Fetch gym data separately for communities that have gym_id
        if (data && data.length > 0) {
          const gymIds = data
            .map(c => c.gym_id)
            .filter(Boolean)
            .filter((id, index, self) => self.indexOf(id) === index)
          
          if (gymIds.length > 0) {
            const { data: gymsData } = await supabase
              .from('gyms')
              .select('id, name, city, country, address, image_url')
              .in('id', gymIds)
            
            const gymsMap = {}
            if (gymsData) {
              gymsData.forEach(gym => {
                gymsMap[gym.id] = gym
              })
            }
            
            // Attach gym data to communities
            data = data.map(community => ({
              ...community,
              gyms: community.gym_id && gymsMap[community.gym_id] 
                ? [gymsMap[community.gym_id]] 
                : undefined
            }))
          }
        }
      }

      // Enrich with actual member counts
      const enrichedCommunities = await enrichCommunitiesWithActualCounts(data || [])
      
      return enrichedCommunities
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - communities don't change often
  })
}

