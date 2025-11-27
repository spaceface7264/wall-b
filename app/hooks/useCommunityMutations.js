import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

/**
 * Hook for joining a community with optimistic updates
 * @param {string} userId - User ID
 * @returns {Object} Mutation object with mutate function
 */
export function useJoinCommunity(userId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (communityId) => {
      if (!userId) {
        throw new Error('User must be logged in to join communities')
      }

      const { error } = await supabase
        .from('community_members')
        .insert({
          community_id: communityId,
          user_id: userId
        })

      if (error) {
        throw error
      }

      return communityId
    },
    onMutate: async (communityId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['communities'] })

      // Snapshot previous values
      const previousAllCommunities = queryClient.getQueryData(['communities', 'all'])
      const previousMyCommunities = queryClient.getQueryData(['communities', 'my', userId])

      // Optimistically update all communities
      queryClient.setQueryData(['communities', 'all'], (old) => {
        if (!old) return old
        return old.map(community => 
          community.id === communityId
            ? { 
                ...community, 
                member_count: (community.member_count || 0) + 1,
                is_member: true
              }
            : community
        )
      })

      // Optimistically update my communities
      queryClient.setQueryData(['communities', 'my', userId], (old) => {
        if (!old) return old
        
        // Check if already in my communities
        const exists = old.some(c => c.id === communityId)
        if (exists) return old

        // Get the community from all communities to add to my communities
        const allCommunities = queryClient.getQueryData(['communities', 'all'])
        const communityToAdd = allCommunities?.find(c => c.id === communityId)
        
        if (communityToAdd) {
          return [...old, { ...communityToAdd, is_member: true }]
        }
        
        return old
      })

      return { previousAllCommunities, previousMyCommunities }
    },
    onError: (err, communityId, context) => {
      // Rollback on error
      if (context?.previousAllCommunities) {
        queryClient.setQueryData(['communities', 'all'], context.previousAllCommunities)
      }
      if (context?.previousMyCommunities) {
        queryClient.setQueryData(['communities', 'my', userId], context.previousMyCommunities)
      }
    },
    onSuccess: (communityId) => {
      // Dispatch event to update drawer immediately
      window.dispatchEvent(new CustomEvent('communityJoined', { 
        detail: { communityId, userId } 
      }))
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['communities'] })
    },
  })
}

/**
 * Hook for leaving a community with optimistic updates
 * @param {string} userId - User ID
 * @returns {Object} Mutation object with mutate function
 */
export function useLeaveCommunity(userId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (communityId) => {
      if (!userId) {
        throw new Error('User must be logged in to leave communities')
      }

      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', userId)

      if (error) {
        throw error
      }

      return communityId
    },
    onMutate: async (communityId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['communities'] })

      // Snapshot previous values
      const previousAllCommunities = queryClient.getQueryData(['communities', 'all'])
      const previousMyCommunities = queryClient.getQueryData(['communities', 'my', userId])

      // Optimistically update all communities
      queryClient.setQueryData(['communities', 'all'], (old) => {
        if (!old) return old
        return old.map(community => 
          community.id === communityId
            ? { 
                ...community, 
                member_count: Math.max(0, (community.member_count || 0) - 1),
                is_member: false
              }
            : community
        )
      })

      // Optimistically update my communities
      queryClient.setQueryData(['communities', 'my', userId], (old) => {
        if (!old) return old
        return old.filter(community => community.id !== communityId)
      })

      return { previousAllCommunities, previousMyCommunities }
    },
    onError: (err, communityId, context) => {
      // Rollback on error
      if (context?.previousAllCommunities) {
        queryClient.setQueryData(['communities', 'all'], context.previousAllCommunities)
      }
      if (context?.previousMyCommunities) {
        queryClient.setQueryData(['communities', 'my', userId], context.previousMyCommunities)
      }
    },
    onSuccess: (communityId) => {
      // Dispatch event to update drawer immediately
      window.dispatchEvent(new CustomEvent('communityLeft', { 
        detail: { communityId, userId } 
      }))
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['communities'] })
    },
  })
}

