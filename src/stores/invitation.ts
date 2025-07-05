import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { requireAuth } from '@/utils/getCurrentUser'
import type { CampaignInvitation, InvitationUse, Campaign } from '@/types'

interface InvitationState {
  invitations: CampaignInvitation[]
  invitationUses: InvitationUse[]
  loading: boolean
  error: string | null
  
  // DM actions - managing invitations
  fetchCampaignInvitations: (campaignId: string) => Promise<void>
  createInvitation: (campaignId: string, options?: { maxUses?: number, expiresInDays?: number }) => Promise<CampaignInvitation | null>
  updateInvitation: (invitationId: string, updates: Partial<CampaignInvitation>) => Promise<void>
  deactivateInvitation: (invitationId: string) => Promise<void>
  
  // Player actions - joining via invitation
  validateInviteCode: (code: string) => Promise<{ valid: boolean, campaign?: Campaign, error?: string }>
  joinViaInviteCode: (code: string) => Promise<{ success: boolean, campaign?: Campaign, error?: string }>
  
  // Utility actions
  clearError: () => void
}

export const useInvitationStore = create<InvitationState>((set) => ({
  invitations: [],
  invitationUses: [],
  loading: false,
  error: null,

  fetchCampaignInvitations: async (campaignId: string) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('campaign_invitations')
        .select(`
          *,
          invitation_uses(*)
        `)
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      set({ 
        invitations: data || [],
        loading: false 
      })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  createInvitation: async (campaignId: string, options = {}) => {
    set({ loading: true, error: null })
    try {
      const user = requireAuth()

      // Generate expiration date if specified
      const expiresAt = options.expiresInDays 
        ? new Date(Date.now() + (options.expiresInDays * 24 * 60 * 60 * 1000)).toISOString()
        : null

      // Call the database function to generate a unique code
      const { data: codeResult, error: codeError } = await supabase
        .rpc('generate_invite_code')

      if (codeError) throw codeError

      // Create the invitation
      const { data, error } = await supabase
        .from('campaign_invitations')
        .insert({
          campaign_id: campaignId,
          invite_code: codeResult,
          created_by: user.id,
          max_uses: options.maxUses || null,
          expires_at: expiresAt
        })
        .select()
        .single()

      if (error) throw error

      // Add to local state
      set(state => ({
        invitations: [data, ...state.invitations],
        loading: false
      }))

      return data
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
      return null
    }
  },

  updateInvitation: async (invitationId: string, updates: Partial<CampaignInvitation>) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('campaign_invitations')
        .update(updates)
        .eq('id', invitationId)
        .select()
        .single()

      if (error) throw error

      // Update local state
      set(state => ({
        invitations: state.invitations.map(invitation => 
          invitation.id === invitationId ? { ...invitation, ...data } : invitation
        ),
        loading: false
      }))
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  deactivateInvitation: async (invitationId: string) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('campaign_invitations')
        .update({ is_active: false })
        .eq('id', invitationId)

      if (error) throw error

      // Update local state
      set(state => ({
        invitations: state.invitations.map(invitation => 
          invitation.id === invitationId ? { ...invitation, is_active: false } : invitation
        ),
        loading: false
      }))
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  validateInviteCode: async (code: string) => {
    try {
      const { data, error } = await supabase
        .from('campaign_invitations')
        .select(`
          *,
          campaign:campaigns(*)
        `)
        .eq('invite_code', code.toUpperCase())
        .eq('is_active', true)
        .single()

      if (error || !data) {
        return { valid: false, error: 'Invalid or expired invitation code' }
      }

      // Check if expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return { valid: false, error: 'This invitation has expired' }
      }

      // Check if max uses reached
      if (data.max_uses !== null && data.current_uses >= data.max_uses) {
        return { valid: false, error: 'This invitation has reached its maximum uses' }
      }

      return { 
        valid: true, 
        campaign: data.campaign as Campaign 
      }
    } catch (error) {
      return { valid: false, error: 'Failed to validate invitation code' }
    }
  },

  joinViaInviteCode: async (code: string) => {
    set({ loading: true, error: null })
    try {
      const user = requireAuth()

      // Use the database function to handle the join process
      const { data, error } = await supabase
        .rpc('use_invitation', {
          code: code.toUpperCase(),
          user_id: user.id
        })

      if (error) throw error

      const result = data as { success: boolean, campaign?: Campaign, error?: string }
      
      set({ loading: false })
      
      if (!result.success) {
        set({ error: result.error || 'Failed to join campaign' })
      }

      return result
    } catch (error) {
      const errorMessage = (error as Error).message
      set({ error: errorMessage, loading: false })
      return { success: false, error: errorMessage }
    }
  },

  clearError: () => {
    set({ error: null })
  }
}))

// Helper function to generate invite URL
export const generateInviteUrl = (inviteCode: string, baseUrl: string = window.location.origin): string => {
  return `${baseUrl}/join/${inviteCode}`
}

// Helper function to copy invite URL to clipboard
export const copyInviteUrl = async (inviteCode: string): Promise<boolean> => {
  try {
    const url = generateInviteUrl(inviteCode)
    await navigator.clipboard.writeText(url)
    return true
  } catch (error) {
    console.error('Failed to copy invite URL:', error)
    return false
  }
}