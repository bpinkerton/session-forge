import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft, User, Calendar, Gamepad2, Link, Camera, CheckCircle2, Upload, Trash2, ExternalLink, Unlink, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'
import { InlineEditField } from '@/components/ui/inline-edit-field'
import { useInlineEdit } from '@/hooks/useInlineEdit'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

interface UserProfileProps {
  onBack: () => void
}

export const UserProfile: React.FC<UserProfileProps> = ({ onBack }) => {
  const { user, signInWithGoogle, signInWithDiscord, signInWithTwitch } = useAuthStore()
  const { 
    profile, 
    ttrpgSystems, 
    playStyles, 
    loading, 
    saving, 
    lastSaved, 
    error,
    fetchProfile, 
    fetchLookupTables,
    updateProfile, 
    updateProfileField,
    updateTTRPGSystems,
    updatePlayStyles,
    uploadProfilePicture,
    deleteProfilePicture,
    disconnectAccount,
    manuallyLinkOAuthAccount,
    linkSpecificOAuthAccount,
    setError,
    _initAuthListener
  } = useProfileStore()
  
  const [activeTab, setActiveTab] = React.useState<'general' | 'accounts' | 'preferences' | 'systems'>(() => {
    // Check if we should start on accounts tab (from OAuth return)
    const savedTab = sessionStorage.getItem('profileActiveTab')
    if (savedTab === 'accounts') {
      sessionStorage.removeItem('profileActiveTab') // Clear after reading
      return 'accounts'
    }
    return 'general'
  })
  const [pendingChanges, setPendingChanges] = React.useState<Partial<Record<string, unknown>>>({})
  const [pendingSystemIds, setPendingSystemIds] = React.useState<string[]>([])
  const [pendingStyleIds, setPendingStyleIds] = React.useState<string[]>([])
  const [showOAuthOptions, setShowOAuthOptions] = React.useState(false)
  const [disconnectConfirm, setDisconnectConfirm] = React.useState<string | null>(null)
  const [hasDisconnected, setHasDisconnected] = React.useState(false)
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const systemsSaveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const stylesSaveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Inline editing hook
  const inlineEdit = useInlineEdit({
    onSave: (field: string, value: string) => {
      if (field === 'about_me' || field === 'display_name') {
        updateProfileField(field as 'about_me' | 'display_name', value)
        
        const updates = { [field]: value }
        debouncedSave(updates)
      }
    }
  })

  // Load profile and lookup tables on mount
  React.useEffect(() => {
    fetchProfile()
    fetchLookupTables()
    _initAuthListener()
  }, [fetchProfile, fetchLookupTables, _initAuthListener])

  // Auto-link OAuth accounts ONLY when coming from OAuth return (not on regular tab visits)
  React.useEffect(() => {
    const shouldAutoLink = activeTab === 'accounts' && 
                          !hasDisconnected &&
                          sessionStorage.getItem('oauth_auto_link') === 'true'
    
    if (shouldAutoLink) {
      // Get the specific provider that was just connected
      const provider = sessionStorage.getItem('oauth_provider') as 'google' | 'discord' | 'twitch' | null
      
      // Clear the flags so it only happens once
      sessionStorage.removeItem('oauth_auto_link')
      sessionStorage.removeItem('oauth_provider')
      
      // Delay to ensure profile is loaded, then link only the specific provider
      setTimeout(() => {
        if (provider) {
          linkSpecificOAuthAccount(provider)
        } else {
          // Fallback to general linking if no specific provider
          manuallyLinkOAuthAccount()
        }
      }, 500)
    }
  }, [activeTab, hasDisconnected, linkSpecificOAuthAccount, manuallyLinkOAuthAccount])

  // Auto-save logic
  const debouncedSave = React.useCallback((updates: Partial<Record<string, unknown>>) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(() => {
      updateProfile(updates)
      setPendingChanges({})
    }, 1500) // 1.5 second delay
  }, [updateProfile])

  const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  
  // Get the IDs of selected systems and styles (computed values, not used directly)

  // Handle field updates with auto-save
  const handleFieldUpdate = React.useCallback((field: string, value: unknown) => {
    updateProfileField(field as 'about_me' | 'display_name', value)
    
    const updates = { ...pendingChanges, [field]: value }
    setPendingChanges(updates)
    debouncedSave(updates)
  }, [pendingChanges, updateProfileField, debouncedSave])

  // Initialize pending state when profile loads
  React.useEffect(() => {
    if (profile && profile.id) {
      const systemIds = profile.ttrpg_systems?.map(s => s.system_id) || []
      const styleIds = profile.play_styles?.map(s => s.style_id) || []
      setPendingSystemIds(systemIds)
      setPendingStyleIds(styleIds)
    }
  }, [profile?.id]) // Only reset when profile ID changes

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      if (systemsSaveTimeoutRef.current) {
        clearTimeout(systemsSaveTimeoutRef.current)
      }
      if (stylesSaveTimeoutRef.current) {
        clearTimeout(stylesSaveTimeoutRef.current)
      }
    }
  }, [])

  // Debounced save for TTRPG systems
  const debouncedSaveSystems = React.useCallback((systemIds: string[]) => {
    if (systemsSaveTimeoutRef.current) {
      clearTimeout(systemsSaveTimeoutRef.current)
    }

    systemsSaveTimeoutRef.current = setTimeout(() => {
      updateTTRPGSystems(systemIds)
    }, 1500)
  }, [updateTTRPGSystems])

  // Debounced save for play styles
  const debouncedSaveStyles = React.useCallback((styleIds: string[]) => {
    if (stylesSaveTimeoutRef.current) {
      clearTimeout(stylesSaveTimeoutRef.current)
    }

    stylesSaveTimeoutRef.current = setTimeout(() => {
      updatePlayStyles(styleIds)
    }, 1500)
  }, [updatePlayStyles])

  const handleSystemToggle = (systemId: string) => {
    const newSystemIds = pendingSystemIds.includes(systemId)
      ? pendingSystemIds.filter(id => id !== systemId)
      : [...pendingSystemIds, systemId]
    
    // Update local state immediately for UI responsiveness
    setPendingSystemIds(newSystemIds)
    
    // Debounce the save
    debouncedSaveSystems(newSystemIds)
  }

  const handlePlayStyleToggle = (styleId: string) => {
    const newStyleIds = pendingStyleIds.includes(styleId)
      ? pendingStyleIds.filter(id => id !== styleId)
      : [...pendingStyleIds, styleId]
    
    // Update local state immediately for UI responsiveness
    setPendingStyleIds(newStyleIds)
    
    // Debounce the save
    debouncedSaveStyles(newStyleIds)
  }

  const handleDayToggle = (day: string) => {
    if (!profile) return
    const newPreferences = {
      ...profile.scheduling_preferences,
      preferred_days: profile.scheduling_preferences?.preferred_days?.includes(day)
        ? profile.scheduling_preferences.preferred_days.filter(d => d !== day)
        : [...(profile.scheduling_preferences?.preferred_days || []), day]
    }
    handleFieldUpdate('scheduling_preferences', newPreferences)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    uploadProfilePicture(file)
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleOAuthAvatarSelect = (provider: 'google' | 'discord' | 'twitch') => {
    // Call the store function directly, not the hook
    const profileStore = useProfileStore.getState()
    profileStore.useOAuthAvatar(provider)
    setShowOAuthOptions(false)
  }

  const getAvatarUrl = () => {
    if (profile?.profile_picture_url) {
      return profile.profile_picture_url
    }
    return null
  }

  const getConnectedAccountAvatar = (provider: 'google' | 'discord' | 'twitch') => {
    return profile?.connected_accounts.find(acc => acc.provider === provider)?.provider_avatar_url
  }


  const handleDisconnectClick = (provider: 'google' | 'discord' | 'twitch') => {
    setDisconnectConfirm(provider)
  }

  const handleDisconnectConfirm = () => {
    if (disconnectConfirm) {
      disconnectAccount(disconnectConfirm as 'google' | 'discord' | 'twitch')
      setDisconnectConfirm(null)
      setHasDisconnected(true) // Prevent auto-linking after manual disconnection
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center text-purple-200">
        Failed to load profile. Please try again.
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <Card className="bg-app-card">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <User className="h-5 w-5 mr-2 text-purple-400" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InlineEditField
                  field="display_name"
                  label="Display Name"
                  value={profile.display_name || ''}
                  placeholder="How you'd like to be known"
                  editingField={inlineEdit.editingField}
                  tempValue={inlineEdit.tempValue}
                  onStartEditing={inlineEdit.startEditing}
                  onTempValueChange={inlineEdit.setTempValue}
                  onKeyDown={inlineEdit.handleKeyDown}
                  onBlur={inlineEdit.handleBlur}
                />
                
                <InlineEditField
                  field="about_me"
                  label="About Me"
                  value={profile.about_me || ''}
                  placeholder="Tell others about your D&D experience, favorite characters, or what you're looking for in a campaign..."
                  isTextarea={true}
                  editingField={inlineEdit.editingField}
                  tempValue={inlineEdit.tempValue}
                  onStartEditing={inlineEdit.startEditing}
                  onTempValueChange={inlineEdit.setTempValue}
                  onKeyDown={inlineEdit.handleKeyDown}
                  onBlur={inlineEdit.handleBlur}
                />

                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-1">
                    Experience Level
                  </label>
                  <select
                    value={profile.experience_level || 'intermediate'}
                    onChange={(e) => handleFieldUpdate('experience_level', e.target.value)}
                    className="w-full px-3 py-2 bg-transparent border border-purple-500/30 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-purple-400 transition-colors"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="dm-experience"
                    checked={profile.dm_experience || false}
                    onChange={(e) => handleFieldUpdate('dm_experience', e.target.checked)}
                    className="w-4 h-4 text-purple-600 bg-transparent border-purple-500/30 rounded focus:ring-1 focus:ring-purple-400"
                  />
                  <label htmlFor="dm-experience" className="text-sm font-medium text-purple-300">
                    I have experience as a Dungeon Master
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-app-card">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Camera className="h-5 w-5 mr-2 text-purple-400" />
                  Profile Picture
                </CardTitle>
                <CardDescription className="text-purple-300">
                  Upload a profile picture or use one from your connected accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setError(null)}
                      className="text-red-400 hover:text-red-300 mt-1"
                    >
                      Dismiss
                    </Button>
                  </div>
                )}
                
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center overflow-hidden">
                    {getAvatarUrl() ? (
                      <img 
                        src={getAvatarUrl()!} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-white" />
                    )}
                  </div>
                  <div className="flex flex-col space-y-2">
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={saving}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Upload Picture
                      </Button>
                      {profile?.profile_picture_url && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={deleteProfilePicture}
                          disabled={saving}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>
                    
                    {profile?.connected_accounts.some(acc => acc.provider_avatar_url) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowOAuthOptions(!showOAuthOptions)}
                        className="text-purple-400 hover:text-purple-300 justify-start"
                      >
                        Use account avatar
                      </Button>
                    )}
                    
                    {showOAuthOptions && (
                      <div className="space-y-2 p-2 bg-black/20 rounded-lg border border-purple-500/20">
                        {['google', 'discord', 'twitch'].map(provider => {
                          const avatarUrl = getConnectedAccountAvatar(provider as 'google' | 'discord' | 'twitch')
                          if (!avatarUrl) return null
                          
                          return (
                            <button
                              key={provider}
                              onClick={() => handleOAuthAvatarSelect(provider as 'google' | 'discord' | 'twitch')}
                              className="flex items-center space-x-2 w-full p-2 hover:bg-purple-600/20 rounded text-left"
                            >
                              <img 
                                src={avatarUrl} 
                                alt={`${provider} avatar`} 
                                className="w-8 h-8 rounded-full"
                              />
                              <span className="text-white capitalize">{provider}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                <p className="text-xs text-purple-400 mt-2">
                  Supported formats: JPEG, PNG, GIF, WebP (max 5MB)
                </p>
              </CardContent>
            </Card>
          </div>
        )

      case 'accounts': {
        const getProviderInfo = (provider: 'google' | 'discord' | 'twitch') => {
          const providers = {
            google: { name: 'Google', color: 'bg-white', signIn: signInWithGoogle },
            discord: { name: 'Discord', color: 'bg-[#5865F2]', signIn: signInWithDiscord },
            twitch: { name: 'Twitch', color: 'bg-[#9146FF]', signIn: signInWithTwitch }
          }
          return providers[provider]
        }

        const renderProviderIcon = (provider: 'google' | 'discord' | 'twitch', isConnected: boolean, avatarUrl?: string) => {
          if (isConnected && avatarUrl) {
            return (
              <img 
                src={avatarUrl} 
                alt={`${provider} avatar`}
                className="w-8 h-8 rounded-full"
              />
            )
          }

          const providerInfo = getProviderInfo(provider)
          
          // Brand-specific icons when not connected
          if (provider === 'google') {
            return (
              <div className={`w-8 h-8 ${providerInfo.color} rounded flex items-center justify-center p-1`}>
                <svg viewBox="0 0 24 24" className="w-6 h-6">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
            )
          }
          
          if (provider === 'discord') {
            return (
              <div className={`w-8 h-8 ${providerInfo.color} rounded flex items-center justify-center p-1`}>
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </div>
            )
          }
          
          if (provider === 'twitch') {
            return (
              <div className={`w-8 h-8 ${providerInfo.color} rounded flex items-center justify-center p-1`}>
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                </svg>
              </div>
            )
          }
        }

        const connectedProviders = profile?.connected_accounts?.map(acc => acc.provider) || []
        const allProviders: ('google' | 'discord' | 'twitch')[] = ['google', 'discord', 'twitch']
        
        
        return (
          <Card className="bg-app-card">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Link className="h-5 w-5 mr-2 text-purple-400" />
                Connected Accounts
              </CardTitle>
              <CardDescription className="text-purple-300">
                Manage your connected social accounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-purple-200">
                <p className="text-sm">Current email: <span className="text-white">{user?.email}</span></p>
              </div>
              
              <div className="space-y-3">
                {allProviders.map(provider => {
                  const providerInfo = getProviderInfo(provider)
                  const connectedAccount = profile?.connected_accounts?.find(acc => acc.provider === provider)
                  const isConnected = !!connectedAccount
                  
                  return (
                    <div key={provider} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-black/20 rounded-lg border border-purple-500/20 space-y-3 sm:space-y-0">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        {renderProviderIcon(provider, isConnected, connectedAccount?.provider_avatar_url || undefined)}
                        <div className="min-w-0 flex-1">
                          <p className="text-white text-sm font-medium">{providerInfo.name}</p>
                          {isConnected ? (
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                              {connectedAccount.provider_username && (
                                <p className="text-purple-300 text-xs truncate">{connectedAccount.provider_username}</p>
                              )}
                              <span className="text-green-400 text-xs">Connected</span>
                              {profile?.profile_picture_url === connectedAccount.provider_avatar_url && (
                                <span className="text-purple-400 text-xs">(Profile Picture)</span>
                              )}
                            </div>
                          ) : (
                            <p className="text-purple-400 text-xs">Not connected</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 flex-shrink-0">
                        {isConnected ? (
                          <>
                            {connectedAccount?.provider_avatar_url && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleOAuthAvatarSelect(provider)}
                                disabled={saving}
                                className="text-purple-400 hover:text-purple-300 w-full sm:w-auto"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                <span className="hidden sm:inline">Use Avatar</span>
                                <span className="sm:hidden">Use</span>
                              </Button>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDisconnectClick(provider)}
                              disabled={saving}
                              className="text-red-400 hover:text-red-300 w-full sm:w-auto"
                            >
                              <Unlink className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">Disconnect</span>
                              <span className="sm:hidden">Remove</span>
                            </Button>
                          </>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setHasDisconnected(false) // Reset flag when manually connecting
                              providerInfo.signIn()
                            }}
                            disabled={saving}
                            className="text-purple-400 hover:text-purple-300 w-full sm:w-auto"
                          >
                            <Link className="h-3 w-3 mr-1" />
                            Connect
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {connectedProviders.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-purple-400 text-sm">No accounts connected yet</p>
                  <p className="text-purple-500 text-xs mt-1">Connect accounts to use their profile pictures and link your gaming identities</p>
                </div>
              )}
            </CardContent>
          </Card>
        )
      }

      case 'preferences': {
        return (
          <Card className="bg-app-card">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Calendar className="h-5 w-5 mr-2 text-purple-400" />
                Scheduling Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">
                  Preferred Session Length (minutes)
                </label>
                <Input
                  type="number"
                  value={profile.preferred_session_length || 240}
                  onChange={(e) => handleFieldUpdate('preferred_session_length', parseInt(e.target.value) || 240)}
                  className="bg-transparent border-purple-500/30 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 text-white placeholder:text-purple-400 transition-colors"
                />
                <p className="text-xs text-purple-400 mt-1">
                  Currently set to {Math.floor((profile.preferred_session_length || 240) / 60)} hours {(profile.preferred_session_length || 240) % 60} minutes
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">
                  Preferred Days
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {weekDays.map((day) => (
                    <button
                      key={day}
                      onClick={() => handleDayToggle(day)}
                      className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                        profile.scheduling_preferences?.preferred_days?.includes(day)
                          ? 'bg-purple-600 text-white'
                          : 'bg-black/20 border border-purple-500/30 text-purple-200 hover:bg-purple-600/20'
                      }`}
                    >
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">
                  Play Style Preferences
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {playStyles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => handlePlayStyleToggle(style.id)}
                      className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                        pendingStyleIds.includes(style.id)
                          ? 'bg-purple-600 text-white'
                          : 'bg-black/20 border border-purple-500/30 text-purple-200 hover:bg-purple-600/20'
                      }`}
                    >
                      {style.name}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      }

      case 'systems': {
        return (
          <Card className="bg-app-card">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Gamepad2 className="h-5 w-5 mr-2 text-purple-400" />
                TTRPG Systems & Interests
              </CardTitle>
              <CardDescription className="text-purple-300">
                Select the tabletop RPG systems you know or want to learn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ttrpgSystems.map((system) => (
                  <button
                    key={system.id}
                    onClick={() => handleSystemToggle(system.id)}
                    className={`px-3 py-3 rounded text-sm font-medium transition-colors min-h-[44px] text-left ${
                      pendingSystemIds.includes(system.id)
                        ? 'bg-purple-600 text-white'
                        : 'bg-black/20 border border-purple-500/30 text-purple-200 hover:bg-purple-600/20'
                    }`}
                    title={system.name}
                  >
                    <span className="truncate block">{system.name}</span>
                  </button>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-purple-600/10 rounded-lg border border-purple-500/20">
                <h4 className="text-sm font-medium text-purple-200 mb-2">Selected Systems:</h4>
                <div className="text-purple-300 text-sm">
                  {pendingSystemIds.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {ttrpgSystems
                        .filter(s => pendingSystemIds.includes(s.id))
                        .map(s => (
                          <span key={s.id} className="px-2 py-1 bg-purple-600/20 rounded text-xs">
                            {s.name}
                          </span>
                        ))
                      }
                    </div>
                  ) : (
                    <p>No systems selected yet</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      }

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack} className="text-purple-300 hover:text-purple-100">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-white">User Profile</h1>
        </div>
        <div className="flex items-center space-x-2">
          {saving && (
            <div className="flex items-center text-purple-300">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              <span className="text-sm">Saving...</span>
            </div>
          )}
          {!saving && lastSaved && (
            <div className="flex items-center text-green-400">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              <span className="text-sm">Saved</span>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-black/20 backdrop-blur-sm border border-purple-500/20 rounded-lg p-1">
        {[
          { id: 'general', label: 'General', shortLabel: 'General', icon: User },
          { id: 'accounts', label: 'Accounts', shortLabel: 'Accounts', icon: Link },
          { id: 'preferences', label: 'Preferences', shortLabel: 'Prefs', icon: Calendar },
          { id: 'systems', label: 'TTRPG Systems', shortLabel: 'TTRPG', icon: Gamepad2 }
        ].map(({ id, label, shortLabel, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as 'general' | 'accounts' | 'preferences' | 'systems')}
            className={`flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex-1 min-w-0 ${
              activeTab === id
                ? 'bg-purple-600 text-white'
                : 'text-purple-300 hover:text-purple-100 hover:bg-purple-600/20'
            }`}
            title={label}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline truncate">{label}</span>
            <span className="sm:hidden truncate">{shortLabel}</span>
          </button>
        ))}
      </div>

      {renderTabContent()}

      <ConfirmationDialog
        open={!!disconnectConfirm}
        onConfirm={handleDisconnectConfirm}
        onCancel={() => setDisconnectConfirm(null)}
        title={`Disconnect ${disconnectConfirm ? disconnectConfirm.charAt(0).toUpperCase() + disconnectConfirm.slice(1) : ''} Account?`}
        description={`This will remove the connection to your ${disconnectConfirm} account`}
        confirmText="Disconnect"
        variant="destructive"
        loading={saving}
      >
        {disconnectConfirm && (
          <div className="space-y-3">
            <p className="text-sm text-purple-300">This will:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-purple-400">
              <li>Remove access to this account's profile picture</li>
              <li>Clear your current profile picture if it's from this account</li>
              <li>Delete the username and avatar from this provider</li>
            </ul>
            <p className="text-yellow-400 text-xs">
              ⚠️ You can reconnect later, but you'll need to go through the OAuth flow again.
            </p>
          </div>
        )}
      </ConfirmationDialog>
    </div>
  )
}