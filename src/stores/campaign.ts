import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { requestCache } from '@/utils/requestCache'
import { getCurrentUser, requireAuth } from '@/utils/getCurrentUser'
import type { Campaign, CampaignFull, CampaignCharacter, CampaignMemberWithProfile } from '@/types'

interface CampaignState {
  campaigns: Campaign[]
  currentCampaign: CampaignFull | null
  userRole: 'dm' | 'player' | 'observer' | null
  loading: boolean
  error: string | null
  lastCampaignsFetched: number | null
  cacheTimeout: number
  
  // Campaign actions
  fetchUserCampaigns: () => Promise<void>
  createCampaign: (campaign: Partial<Campaign>) => Promise<Campaign | null>
  updateCampaign: (id: string, updates: Partial<Campaign>) => Promise<void>
  deactivateCampaign: (id: string) => Promise<{ success: boolean, error?: string }>
  restoreCampaign: (id: string) => Promise<{ success: boolean, error?: string }>
  
  // Campaign member actions
  joinCampaign: (campaignId: string, role?: 'player' | 'observer') => Promise<void>
  addMember: (campaignId: string, userId: string, role: 'dm' | 'player' | 'observer') => Promise<void>
  removeMember: (campaignId: string, userId: string) => Promise<void>
  updateMemberRole: (campaignId: string, userId: string, role: 'dm' | 'player' | 'observer') => Promise<void>
  
  // Character-campaign actions
  addCharacterToCampaign: (campaignId: string, characterId: string) => Promise<void>
  removeCharacterFromCampaign: (campaignId: string, characterId: string) => Promise<void>
  updateCharacterStatus: (campaignId: string, characterId: string, status: 'alive' | 'dead' | 'retired' | 'npc', isActive?: boolean) => Promise<void>
  
  // Utility actions
  setCurrentCampaign: (campaign: CampaignFull | null) => void
  fetchCampaignFull: (campaignId: string) => Promise<void>
  getUserRoleInCampaign: (campaignId: string) => 'dm' | 'player' | 'observer' | null
  validateCurrentCampaignAccess: () => Promise<boolean>
  getAllMembersWithDM: () => CampaignMemberWithProfile[]
  clearError: () => void
}

export const useCampaignStore = create<CampaignState>((set, get) => ({
  campaigns: [],
  currentCampaign: null,
  userRole: null,
  loading: false,
  error: null,
  lastCampaignsFetched: null,
  cacheTimeout: 300000, // 5 minutes

  fetchUserCampaigns: async () => {
    const { lastCampaignsFetched, cacheTimeout, campaigns } = get()
    const now = Date.now()
    
    // Skip fetch if recently cached and campaigns exist
    if (campaigns.length > 0 && lastCampaignsFetched && (now - lastCampaignsFetched) < cacheTimeout) {
      return
    }
    
    set({ loading: true, error: null })
    try {
      const user = requireAuth()

      const cacheKey = `user-campaigns:${user.id}`
      
      const campaignsData = await requestCache.get(cacheKey, async () => {
        // Get campaigns where user is DM
        const { data: dmCampaigns, error: dmError } = await supabase
          .from('campaigns')
          .select('*')
          .eq('dm_user_id', user.id)
          .eq('is_active', true)

        if (dmError) throw dmError

        // Get campaigns where user is a member  
        const { data: membershipData, error: memberError } = await supabase
          .from('campaign_members')
          .select(`
            campaign_id,
            campaigns!inner(*)
          `)
          .eq('user_id', user.id)
          .eq('campaigns.is_active', true)

        if (memberError) throw memberError

        // Extract campaigns from membership data
        const memberCampaigns = membershipData?.map((m: { campaigns: Campaign }) => m.campaigns).filter(Boolean) || []

        // Combine and deduplicate
        const allCampaigns = [...(dmCampaigns || []), ...memberCampaigns]
        const uniqueCampaigns = allCampaigns.filter((campaign, index, self) => 
          index === self.findIndex(c => c.id === campaign.id)
        )
        
        return uniqueCampaigns
      })

      set({ 
        campaigns: campaignsData,
        lastCampaignsFetched: now,
        loading: false 
      })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  createCampaign: async (campaign: Partial<Campaign>) => {
    set({ loading: true, error: null })
    try {
      // Create the campaign
      const { data: newCampaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert(campaign)
        .select()
        .single()

      if (campaignError) throw campaignError

      // Add creator as DM
      const { error: memberError } = await supabase
        .from('campaign_members')
        .insert({
          campaign_id: newCampaign.id,
          user_id: campaign.dm_user_id,
          role: 'dm'
        })

      if (memberError) throw memberError

      // Invalidate cache and add to local state
      requestCache.invalidatePattern(/^user-campaigns:/)
      set(state => ({
        campaigns: [newCampaign, ...state.campaigns],
        lastCampaignsFetched: null, // Force refresh next time
        loading: false
      }))
      
      return newCampaign
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
      return null
    }
  },

  updateCampaign: async (id: string, updates: Partial<Campaign>) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Update local state
      set(state => ({
        campaigns: state.campaigns.map(campaign => 
          campaign.id === id ? { ...campaign, ...data } : campaign
        ),
        currentCampaign: state.currentCampaign?.id === id 
          ? { ...state.currentCampaign, ...data }
          : state.currentCampaign,
        loading: false
      }))
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  deactivateCampaign: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .rpc('soft_delete_campaign', { campaign_id: id })

      if (error) throw error

      const result = data as { success: boolean, error?: string, campaign_name?: string }
      
      if (result.success) {
        // Remove from local state (since we only show active campaigns)
        set(state => ({
          campaigns: state.campaigns.filter(campaign => campaign.id !== id),
          currentCampaign: state.currentCampaign?.id === id ? null : state.currentCampaign,
          loading: false
        }))
        return { success: true }
      } else {
        set({ error: result.error || 'Failed to deactivate campaign', loading: false })
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMessage = (error as Error).message
      console.error('Error deactivating campaign:', errorMessage)
      set({ error: errorMessage, loading: false })
      return { success: false, error: errorMessage }
    }
  },

  restoreCampaign: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .rpc('restore_campaign', { campaign_id: id })

      if (error) throw error

      const result = data as { success: boolean, error?: string, campaign_name?: string }
      
      if (result.success) {
        // Refresh campaigns list to include the restored campaign
        await get().fetchUserCampaigns()
        return { success: true }
      } else {
        set({ error: result.error || 'Failed to restore campaign', loading: false })
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMessage = (error as Error).message
      set({ error: errorMessage, loading: false })
      return { success: false, error: errorMessage }
    }
  },

  joinCampaign: async (campaignId: string, role = 'player' as 'player' | 'observer') => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('campaign_members')
        .insert({
          campaign_id: campaignId,
          role
        })

      if (error) throw error
      set({ loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  addMember: async (campaignId: string, userId: string, role: 'dm' | 'player' | 'observer') => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('campaign_members')
        .insert({
          campaign_id: campaignId,
          user_id: userId,
          role
        })
        .select()
        .single()

      if (error) throw error

      // Update current campaign if it matches
      set(state => ({
        currentCampaign: state.currentCampaign?.id === campaignId
          ? {
              ...state.currentCampaign,
              members: [...state.currentCampaign.members, data]
            }
          : state.currentCampaign,
        loading: false
      }))
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  removeMember: async (campaignId: string, userId: string) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('campaign_members')
        .delete()
        .eq('campaign_id', campaignId)
        .eq('user_id', userId)

      if (error) throw error

      // Update current campaign if it matches
      set(state => ({
        currentCampaign: state.currentCampaign?.id === campaignId
          ? {
              ...state.currentCampaign,
              members: state.currentCampaign.members.filter(member => member.user_id !== userId)
            }
          : state.currentCampaign,
        loading: false
      }))
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  updateMemberRole: async (campaignId: string, userId: string, role: 'dm' | 'player' | 'observer') => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('campaign_members')
        .update({ role })
        .eq('campaign_id', campaignId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error

      // Update current campaign if it matches
      set(state => ({
        currentCampaign: state.currentCampaign?.id === campaignId
          ? {
              ...state.currentCampaign,
              members: state.currentCampaign.members.map(member => 
                member.user_id === userId ? { ...member, ...data } : member
              )
            }
          : state.currentCampaign,
        loading: false
      }))
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  addCharacterToCampaign: async (campaignId: string, characterId: string) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('campaign_characters')
        .insert({
          campaign_id: campaignId,
          character_id: characterId
        })
        .select(`
          *,
          character:characters(*)
        `)
        .single()

      if (error) throw error

      // Update current campaign if it matches
      set(state => ({
        currentCampaign: state.currentCampaign?.id === campaignId
          ? {
              ...state.currentCampaign,
              characters: [...state.currentCampaign.characters, data]
            }
          : state.currentCampaign,
        loading: false
      }))
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  removeCharacterFromCampaign: async (campaignId: string, characterId: string) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('campaign_characters')
        .delete()
        .eq('campaign_id', campaignId)
        .eq('character_id', characterId)

      if (error) throw error

      // Update current campaign if it matches
      set(state => ({
        currentCampaign: state.currentCampaign?.id === campaignId
          ? {
              ...state.currentCampaign,
              characters: state.currentCampaign.characters.filter(
                char => char.character_id !== characterId
              )
            }
          : state.currentCampaign,
        loading: false
      }))
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  updateCharacterStatus: async (campaignId: string, characterId: string, status: 'alive' | 'dead' | 'retired' | 'npc', isActive?: boolean) => {
    set({ loading: true, error: null })
    try {
      const updates: Partial<CampaignCharacter> = { status }
      if (isActive !== undefined) updates.is_active = isActive

      const { data, error } = await supabase
        .from('campaign_characters')
        .update(updates)
        .eq('campaign_id', campaignId)
        .eq('character_id', characterId)
        .select()
        .single()

      if (error) throw error

      // Update current campaign if it matches
      set(state => ({
        currentCampaign: state.currentCampaign?.id === campaignId
          ? {
              ...state.currentCampaign,
              characters: state.currentCampaign.characters.map(char => 
                char.character_id === characterId ? { ...char, ...data } : char
              )
            }
          : state.currentCampaign,
        loading: false
      }))
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  fetchCampaignFull: async (campaignId: string) => {
    set({ loading: true, error: null })
    try {
      // Get current user
      const user = requireAuth()

      // Fetch campaign with members and characters (force fresh data with timestamp)
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select(`
          *,
          members:campaign_members(*),
          characters:campaign_characters(
            *,
            character:characters(*)
          )
        `)
        .eq('id', campaignId)
        .eq('is_active', true)
        .single()

      if (campaignError) throw campaignError

      // Fetch DM profile separately
      let dmProfile = null
      if (campaign.dm_user_id) {
        const { data: dmProfileData, error: dmProfileError } = await supabase
          .from('user_profiles')
          .select('user_id, display_name, profile_picture_url')
          .eq('user_id', campaign.dm_user_id)
          .single()
        
        if (!dmProfileError) {
          dmProfile = dmProfileData
        }
      }

      // Fetch member profiles separately
      let membersWithProfiles = campaign.members || []
      if (campaign.members && campaign.members.length > 0) {
        const memberUserIds = campaign.members.map((member: { user_id: string }) => member.user_id)
        
        const { data: memberProfiles, error: memberProfilesError } = await supabase
          .from('user_profiles')
          .select('user_id, display_name, profile_picture_url')
          .in('user_id', memberUserIds)
        
        if (!memberProfilesError && memberProfiles) {
          // Attach profiles to members
          membersWithProfiles = campaign.members.map((member: { user_id: string }) => ({
            ...member,
            user_profile: memberProfiles.find(profile => profile.user_id === member.user_id)
          }))
        }
      }

      // Add DM profile and enhanced members to campaign
      const campaignWithProfiles = {
        ...campaign,
        dm_profile: dmProfile,
        members: membersWithProfiles
      }

      // Determine user role in this campaign
      let userRole: 'dm' | 'player' | 'observer' | null = null
      
      // Check if user is the DM
      if (campaignWithProfiles.dm_user_id === user.id) {
        userRole = 'dm'
      } else {
        // Check if user is a member
        const userMember = campaignWithProfiles.members?.find((member: { user_id: string; role: string }) => member.user_id === user.id)
        userRole = userMember?.role || null
      }

      // If user has no role in this campaign, they've been removed or don't have access
      if (userRole === null) {
        set({
          currentCampaign: null,
          userRole: null,
          loading: false,
          error: 'You no longer have access to this campaign'
        })
        throw new Error('You no longer have access to this campaign')
      }

      set({
        currentCampaign: campaignWithProfiles,
        userRole,
        loading: false
      })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  getUserRoleInCampaign: (campaignId: string) => {
    const { currentCampaign, userRole } = get()
    if (!currentCampaign || currentCampaign.id !== campaignId) return null
    
    return userRole
  },

  setCurrentCampaign: (campaign: CampaignFull | null) => {
    set({ currentCampaign: campaign })
  },

  clearError: () => {
    set({ error: null })
  },

  getAllMembersWithDM: () => {
    const { currentCampaign } = get()
    if (!currentCampaign) return []

    const allMembers: CampaignMemberWithProfile[] = [...(currentCampaign.members || [])]

    // Add DM as a member if they have a profile and aren't already in the members list
    if (currentCampaign.dm_profile && !allMembers.some(m => m.user_id === currentCampaign.dm_user_id)) {
      const dmAsMember = {
        id: `dm-${currentCampaign.dm_user_id}`,
        user_id: currentCampaign.dm_user_id,
        campaign_id: currentCampaign.id,
        role: 'dm' as const,
        joined_at: currentCampaign.created_at,
        user_profile: currentCampaign.dm_profile
      }
      allMembers.unshift(dmAsMember) // Put DM first
    }

    return allMembers
  },

  // Check if user still has access to current campaign
  validateCurrentCampaignAccess: async () => {
    const { currentCampaign } = get()
    if (!currentCampaign) return true

    try {
      const user = getCurrentUser()
      if (!user) return false

      // Check if user is still DM or member of this campaign
      const { data: campaign, error } = await supabase
        .from('campaigns')
        .select(`
          id,
          dm_user_id,
          members:campaign_members!inner(user_id)
        `)
        .eq('id', currentCampaign.id)
        .eq('is_active', true)
        .single()

      if (error) return false

      // Check if user is DM
      if (campaign.dm_user_id === user.id) return true

      // Check if user is a member
      const isMember = campaign.members?.some((member: { user_id: string }) => member.user_id === user.id)
      return isMember || false
    } catch {
      return false
    }
  }
}))

// Helper function to check if user is DM of a campaign
export const isUserDM = (campaign: CampaignFull | null, userId: string): boolean => {
  if (!campaign) return false
  return campaign.dm_user_id === userId || 
         campaign.members.some(member => member.user_id === userId && member.role === 'dm')
}