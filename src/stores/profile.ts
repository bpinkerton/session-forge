import { create } from 'zustand'
import { supabase, uploadProfilePicture, deleteProfilePicture, validateImageFile } from '@/lib/supabase'
import { requestCache } from '@/utils/requestCache'
import { requireAuth } from '@/utils/getCurrentUser'
import type { UserProfile, UserProfileWithAccounts, TTRPGSystem, PlayStyle } from '@/types'

interface ProfileState {
  profile: UserProfileWithAccounts | null
  ttrpgSystems: TTRPGSystem[]
  playStyles: PlayStyle[]
  loading: boolean
  saving: boolean
  error: string | null
  lastSaved: Date | null
  lastFetched: number | null
  cacheTimeout: number
  
  // Actions
  fetchProfile: () => Promise<void>
  fetchLookupTables: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  updateProfileField: (field: keyof UserProfile, value: unknown) => void
  updateTTRPGSystems: (systemIds: string[]) => Promise<void>
  updatePlayStyles: (styleIds: string[]) => Promise<void>
  uploadProfilePicture: (file: File) => Promise<void>
  deleteProfilePicture: () => Promise<void>
  useOAuthAvatar: (provider: 'google' | 'discord' | 'twitch') => Promise<void>
  disconnectAccount: (provider: 'google' | 'discord' | 'twitch') => Promise<void>
  manuallyLinkOAuthAccount: () => Promise<void>
  linkSpecificOAuthAccount: (provider: 'google' | 'discord' | 'twitch') => Promise<void>
  setSaving: (saving: boolean) => void
  setError: (error: string | null) => void
  _initAuthListener: () => void
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  ttrpgSystems: [],
  playStyles: [],
  loading: false,
  saving: false,
  error: null,
  lastSaved: null,
  lastFetched: null,
  cacheTimeout: 300000, // 5 minutes

  // Listen to auth state changes and refresh profile when user signs in with OAuth
  _initAuthListener: () => {
    let debounceTimeout: NodeJS.Timeout
    
    supabase.auth.onAuthStateChange(async (event, session) => {
      // Clear any existing timeout
      if (debounceTimeout) clearTimeout(debounceTimeout)
      
      if (event === 'SIGNED_IN' && session?.user) {
        // Debounce to prevent multiple rapid calls
        debounceTimeout = setTimeout(async () => {
          const hasOAuthIdentities = session.user.identities?.some(identity => 
            ['google', 'discord', 'twitch'].includes(identity.provider)
          )
          
          if (hasOAuthIdentities) {
            await get().manuallyLinkOAuthAccount()
          }
          await get().fetchProfile()
        }, 1500) // Single delay instead of multiple
      } else if (event === 'SIGNED_OUT') {
        // Clear all caches on sign out
        requestCache.clear()
        set({ 
          profile: null,
          ttrpgSystems: [],
          playStyles: [],
          error: null,
          lastSaved: null,
          lastFetched: null
        })
      }
    })
  },

  fetchProfile: async () => {
    const { lastFetched, cacheTimeout, profile } = get()
    const now = Date.now()
    
    // Skip fetch if recently cached and profile exists
    if (profile && lastFetched && (now - lastFetched) < cacheTimeout) {
      return
    }
    
    set({ loading: true, error: null })
    
    try {
      const user = requireAuth()
      
      const cacheKey = `profile:${user.id}`
      
      const profileData = await requestCache.get(cacheKey, async () => {
        // First check if profile exists, create if needed
        const { error: checkError } = await supabase
          .from('user_profiles')
          .select('user_id')
          .eq('user_id', user.id)
          .single()
        
        if (checkError && checkError.code === 'PGRST116') {
          await supabase
            .from('user_profiles')
            .insert({ user_id: user.id })
        }
        
        // Fetch all profile data in parallel for efficiency
        const [
          { data: profile, error: profileError },
          { data: connectedAccounts },
          { data: userSystems },
          { data: userStyles }
        ] = await Promise.all([
          supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single(),
          supabase
            .from('connected_accounts')
            .select('*')
            .eq('user_id', user.id),
          supabase
            .from('user_ttrpg_systems')
            .select(`*, system:ttrpg_systems(*)`)
            .eq('user_id', user.id),
          supabase
            .from('user_play_styles')
            .select(`*, style:play_styles(*)`)
            .eq('user_id', user.id)
        ])
        
        if (profileError) throw profileError
        
        return {
          ...profile,
          connected_accounts: connectedAccounts || [],
          ttrpg_systems: userSystems || [],
          play_styles: userStyles || []
        } as UserProfileWithAccounts
      })
      
      set({ 
        profile: profileData,
        lastFetched: now,
        loading: false 
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
      set({ error: 'Failed to load profile', loading: false })
    }
  },

  fetchLookupTables: async () => {
    const { ttrpgSystems, playStyles } = get()
    
    // Skip if already loaded
    if (ttrpgSystems.length > 0 && playStyles.length > 0) {
      return
    }
    
    try {
      const cacheKey = 'lookup-tables'
      
      const lookupData = await requestCache.get(cacheKey, async () => {
        const [systemsResponse, stylesResponse] = await Promise.all([
          supabase
            .from('ttrpg_systems')
            .select('*')
            .eq('is_active', true)
            .order('sort_order'),
          supabase
            .from('play_styles')
            .select('*')
            .order('sort_order')
        ])
        
        if (systemsResponse.error) throw systemsResponse.error
        if (stylesResponse.error) throw stylesResponse.error
        
        return {
          systems: systemsResponse.data || [],
          styles: stylesResponse.data || []
        }
      })
      
      set({
        ttrpgSystems: lookupData.systems,
        playStyles: lookupData.styles
      })
    } catch (error) {
      console.error('Error fetching lookup tables:', error)
    }
  },

  updateProfile: async (updates: Partial<UserProfile>) => {
    const { profile } = get()
    if (!profile) return

    set({ saving: true, error: null })

    try {
      const user = requireAuth()
      
      // Update profile
      const { error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
      
      if (error) throw error
      
      // Invalidate cache for this user
      requestCache.invalidate(`profile:${user.id}`)
      
      // Update local state
      set({ 
        profile: { 
          ...profile, 
          ...updates,
          updated_at: new Date().toISOString()
        } as UserProfileWithAccounts,
        saving: false, 
        lastSaved: new Date() 
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      set({ error: 'Failed to save profile', saving: false })
    }
  },

  updateProfileField: (field: keyof UserProfile, value: unknown) => {
    const { profile } = get()
    if (!profile) return

    // Update the field locally
    const updatedProfile = { ...profile, [field]: value } as UserProfileWithAccounts
    set({ profile: updatedProfile })
  },

  updateTTRPGSystems: async (systemIds: string[]) => {
    set({ saving: true, error: null })
    
    try {
      const user = requireAuth()
      
      // Delete existing systems
      await supabase
        .from('user_ttrpg_systems')
        .delete()
        .eq('user_id', user.id)
      
      // Insert new systems
      if (systemIds.length > 0) {
        const { error } = await supabase
          .from('user_ttrpg_systems')
          .insert(
            systemIds.map(systemId => ({
              user_id: user.id,
              system_id: systemId
            }))
          )
        
        if (error) throw error
      }
      
      // Update local state with new systems
      const { profile } = get()
      if (profile) {
        // Fetch the updated systems with joined data
        const { data: updatedSystems } = await supabase
          .from('user_ttrpg_systems')
          .select(`
            *,
            system:ttrpg_systems (*)
          `)
          .eq('user_id', user.id)
        
        set({ 
          profile: {
            ...profile,
            ttrpg_systems: updatedSystems || []
          } as UserProfileWithAccounts,
          saving: false, 
          lastSaved: new Date() 
        })
      } else {
        set({ saving: false, lastSaved: new Date() })
      }
    } catch (error) {
      console.error('Error updating TTRPG systems:', error)
      set({ error: 'Failed to save TTRPG systems', saving: false })
    }
  },

  updatePlayStyles: async (styleIds: string[]) => {
    set({ saving: true, error: null })
    
    try {
      const user = requireAuth()
      
      // Delete existing styles
      await supabase
        .from('user_play_styles')
        .delete()
        .eq('user_id', user.id)
      
      // Insert new styles
      if (styleIds.length > 0) {
        const { error } = await supabase
          .from('user_play_styles')
          .insert(
            styleIds.map(styleId => ({
              user_id: user.id,
              style_id: styleId
            }))
          )
        
        if (error) throw error
      }
      
      // Update local state with new styles
      const { profile } = get()
      if (profile) {
        // Fetch the updated styles with joined data
        const { data: updatedStyles } = await supabase
          .from('user_play_styles')
          .select(`
            *,
            style:play_styles (*)
          `)
          .eq('user_id', user.id)
        
        set({ 
          profile: {
            ...profile,
            play_styles: updatedStyles || []
          } as UserProfileWithAccounts,
          saving: false, 
          lastSaved: new Date() 
        })
      } else {
        set({ saving: false, lastSaved: new Date() })
      }
    } catch (error) {
      console.error('Error updating play styles:', error)
      set({ error: 'Failed to save play styles', saving: false })
    }
  },

  uploadProfilePicture: async (file: File) => {
    const { profile } = get()
    if (!profile) return

    // Validate file
    const validationError = validateImageFile(file)
    if (validationError) {
      set({ error: validationError })
      return
    }

    set({ saving: true, error: null })

    try {
      const user = requireAuth()

      // Delete old profile picture if exists
      if (profile.profile_picture_url) {
        try {
          const oldPath = profile.profile_picture_url.split('/').pop()
          if (oldPath) {
            await deleteProfilePicture(oldPath)
          }
        } catch (error) {
          console.warn('Failed to delete old profile picture:', error)
        }
      }

      // Upload new profile picture
      const { publicUrl } = await uploadProfilePicture(file, user.id)

      // Update profile with new URL
      const { error } = await supabase
        .from('user_profiles')
        .update({
          profile_picture_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (error) throw error

      // Update local state
      set({
        profile: {
          ...profile,
          profile_picture_url: publicUrl,
          updated_at: new Date().toISOString()
        } as UserProfileWithAccounts,
        saving: false,
        lastSaved: new Date()
      })
    } catch (error) {
      console.error('Error uploading profile picture:', error)
      set({ error: 'Failed to upload profile picture', saving: false })
    }
  },

  deleteProfilePicture: async () => {
    const { profile } = get()
    if (!profile || !profile.profile_picture_url) return

    set({ saving: true, error: null })

    try {
      const user = requireAuth()

      // Delete from storage
      const filePath = profile.profile_picture_url.split('/').pop()
      if (filePath) {
        await deleteProfilePicture(filePath)
      }

      // Update profile to remove URL
      const { error } = await supabase
        .from('user_profiles')
        .update({
          profile_picture_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (error) throw error

      // Update local state
      set({
        profile: {
          ...profile,
          profile_picture_url: null,
          updated_at: new Date().toISOString()
        } as UserProfileWithAccounts,
        saving: false,
        lastSaved: new Date()
      })
    } catch (error) {
      console.error('Error deleting profile picture:', error)
      set({ error: 'Failed to delete profile picture', saving: false })
    }
  },

  useOAuthAvatar: async (provider: 'google' | 'discord' | 'twitch') => {
    const { profile } = get()
    if (!profile) return

    set({ saving: true, error: null })

    try {
      const user = requireAuth()

      // Find the connected account for this provider
      const connectedAccount = profile.connected_accounts.find(
        account => account.provider === provider
      )

      if (!connectedAccount?.provider_avatar_url) {
        throw new Error(`No avatar available from ${provider}`)
      }

      // Delete old profile picture if exists and it's not already an OAuth avatar
      if (profile.profile_picture_url && !profile.profile_picture_url.includes('googleusercontent.com') && 
          !profile.profile_picture_url.includes('cdn.discordapp.com') && 
          !profile.profile_picture_url.includes('static-cdn.jtvnw.net')) {
        try {
          const oldPath = profile.profile_picture_url.split('/').pop()
          if (oldPath) {
            await deleteProfilePicture(oldPath)
          }
        } catch (error) {
          console.warn('Failed to delete old profile picture:', error)
        }
      }

      // Update profile with OAuth avatar URL
      const { error } = await supabase
        .from('user_profiles')
        .update({
          profile_picture_url: connectedAccount.provider_avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (error) throw error

      // Update local state
      set({
        profile: {
          ...profile,
          profile_picture_url: connectedAccount.provider_avatar_url,
          updated_at: new Date().toISOString()
        } as UserProfileWithAccounts,
        saving: false,
        lastSaved: new Date()
      })
    } catch (error) {
      console.error('Error using OAuth avatar:', error)
      set({ error: 'Failed to use OAuth avatar', saving: false })
    }
  },

  disconnectAccount: async (provider: 'google' | 'discord' | 'twitch') => {
    const { profile } = get()
    if (!profile) return

    set({ saving: true, error: null })

    try {
      const user = requireAuth()

      // Find the connected account
      const connectedAccount = profile.connected_accounts.find(
        account => account.provider === provider
      )

      if (!connectedAccount) {
        throw new Error(`No ${provider} account connected`)
      }

      // Remove from database
      const { error } = await supabase
        .from('connected_accounts')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', provider)

      if (error) throw error

      // If current profile picture is from this account, clear it
      if (profile.profile_picture_url === connectedAccount.provider_avatar_url) {
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            profile_picture_url: null,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)

        if (updateError) {
          console.error('Error clearing profile picture:', updateError)
        }
      }

      // Update local state
      set({
        profile: {
          ...profile,
          connected_accounts: profile.connected_accounts.filter(
            account => account.provider !== provider
          ),
          profile_picture_url: profile.profile_picture_url === connectedAccount.provider_avatar_url 
            ? null 
            : profile.profile_picture_url,
          updated_at: new Date().toISOString()
        } as UserProfileWithAccounts,
        saving: false,
        lastSaved: new Date()
      })
    } catch (error) {
      console.error('Error disconnecting account:', error)
      set({ error: 'Failed to disconnect account', saving: false })
    }
  },

  manuallyLinkOAuthAccount: async () => {
    try {
      const user = requireAuth()


      // Check if user has OAuth identities that aren't in connected_accounts
      const oauthIdentities = user.identities?.filter(identity => 
        ['google', 'discord', 'twitch'].includes(identity.provider)
      )

      if (!oauthIdentities || oauthIdentities.length === 0) {
        return
      }

      // For each OAuth identity, create a connected account if it doesn't exist
      for (const identity of oauthIdentities) {
        const { data: existingAccount } = await supabase
          .from('connected_accounts')
          .select('id')
          .eq('user_id', user.id)
          .eq('provider', identity.provider)
          .single()

        if (!existingAccount) {
          // Extract data from identity
          const identityData = identity.identity_data || {}
          
          const { error } = await supabase
            .from('connected_accounts')
            .insert({
              user_id: user.id,
              provider: identity.provider,
              provider_user_id: identity.id,
              provider_username: identityData.name || identityData.user_name || identityData.preferred_username || null,
              provider_avatar_url: identityData.avatar_url || identityData.picture || null,
              is_primary: false,
              connected_at: new Date().toISOString(),
              last_used_at: new Date().toISOString()
            })

          if (error) {
            console.error('Error creating connected account:', error)
          }
        }
      }

      // Refresh profile to show new connected accounts
      await get().fetchProfile()
    } catch (error) {
      console.error('Error manually linking OAuth accounts:', error)
      set({ error: 'Failed to link OAuth accounts' })
    }
  },

  linkSpecificOAuthAccount: async (targetProvider: 'google' | 'discord' | 'twitch') => {
    try {
      const user = requireAuth()


      // Find the specific OAuth identity for this provider
      const oauthIdentity = user.identities?.find(identity => 
        identity.provider === targetProvider
      )

      if (!oauthIdentity) {
        return
      }

      // Check if connected account already exists
      const { data: existingAccount } = await supabase
        .from('connected_accounts')
        .select('id')
        .eq('user_id', user.id)
        .eq('provider', targetProvider)
        .single()

      if (!existingAccount) {
        // Extract data from identity
        const identityData = oauthIdentity.identity_data || {}
        
        const { error } = await supabase
          .from('connected_accounts')
          .insert({
            user_id: user.id,
            provider: targetProvider,
            provider_user_id: oauthIdentity.id,
            provider_username: identityData.name || identityData.user_name || identityData.preferred_username || null,
            provider_avatar_url: identityData.avatar_url || identityData.picture || null,
            is_primary: false,
            connected_at: new Date().toISOString(),
            last_used_at: new Date().toISOString()
          })

        if (error) {
          console.error('Error creating connected account:', error)
        }
      }

      // Refresh profile to show new connected account
      await get().fetchProfile()
    } catch (error) {
      console.error('Error linking specific OAuth account:', error)
      set({ error: 'Failed to link OAuth account' })
    }
  },

  setSaving: (saving: boolean) => set({ saving }),
  setError: (error: string | null) => set({ error })
}))