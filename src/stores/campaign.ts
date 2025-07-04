import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Campaign, CampaignMember, CampaignFull, Character, CampaignCharacter } from '@/types'

interface CampaignState {
  campaigns: Campaign[]
  currentCampaign: CampaignFull | null
  userRole: 'dm' | 'player' | 'observer' | null
  loading: boolean
  error: string | null
  
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
  clearError: () => void
}

export const useCampaignStore = create<CampaignState>((set, get) => ({
  campaigns: [],
  currentCampaign: null,
  userRole: null,
  loading: false,
  error: null,

  fetchUserCampaigns: async () => {
    set({ loading: true, error: null })
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      // Fetch active campaigns where user is the DM
      const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('dm_user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ campaigns: campaigns || [], loading: false })
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

      // Add to local state
      set(state => ({
        campaigns: [newCampaign, ...state.campaigns],
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
    console.log('Store: deactivateCampaign called with id:', id)
    set({ loading: true, error: null })
    try {
      console.log('Store: Calling supabase RPC soft_delete_campaign')
      const { data, error } = await supabase
        .rpc('soft_delete_campaign', { campaign_id: id })

      console.log('Store: RPC response:', { data, error })

      if (error) throw error

      const result = data as { success: boolean, error?: string, campaign_name?: string }
      
      if (result.success) {
        console.log('Store: Deactivation successful, updating local state')
        // Remove from local state (since we only show active campaigns)
        set(state => ({
          campaigns: state.campaigns.filter(campaign => campaign.id !== id),
          currentCampaign: state.currentCampaign?.id === id ? null : state.currentCampaign,
          loading: false
        }))
        return { success: true }
      } else {
        console.log('Store: Deactivation failed:', result.error)
        set({ error: result.error || 'Failed to deactivate campaign', loading: false })
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMessage = (error as Error).message
      console.log('Store: Exception during deactivation:', errorMessage)
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      // Fetch campaign with members and characters
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
        .single()

      if (campaignError) throw campaignError

      // Determine user role in this campaign
      let userRole: 'dm' | 'player' | 'observer' | null = null
      
      // Check if user is the DM
      if (campaign.dm_user_id === user.id) {
        userRole = 'dm'
      } else {
        // Check if user is a member
        const userMember = campaign.members?.find(member => member.user_id === user.id)
        userRole = userMember?.role || null
      }

      set({
        currentCampaign: campaign,
        userRole,
        loading: false
      })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  getUserRoleInCampaign: (campaignId: string) => {
    const { currentCampaign } = get()
    if (!currentCampaign || currentCampaign.id !== campaignId) return null
    
    const userMember = currentCampaign.members.find(
      member => member.user_id === supabase.auth.getUser().then(u => u.data.user?.id)
    )
    
    return userMember?.role || null
  },

  setCurrentCampaign: (campaign: CampaignFull | null) => {
    set({ currentCampaign: campaign })
  },

  clearError: () => {
    set({ error: null })
  }
}))

// Helper function to check if user is DM of a campaign
export const isUserDM = (campaign: CampaignFull | null, userId: string): boolean => {
  if (!campaign) return false
  return campaign.dm_user_id === userId || 
         campaign.members.some(member => member.user_id === userId && member.role === 'dm')
}