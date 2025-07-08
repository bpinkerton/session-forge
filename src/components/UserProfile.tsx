import React from 'react'
import { Button } from '@/components/ui/button'
import { ThemedButton } from '@/components/ui/themed-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft, User, Calendar, Gamepad2, Link, Camera, CheckCircle2, Upload, Trash2, ExternalLink, Unlink, Loader2, Users, Copy, UserPlus, UserCheck, UserX, Search, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'
import { InlineEditField } from '@/components/ui/inline-edit-field'
import { useInlineEdit } from '@/hooks/useInlineEdit'
import { useNavigate } from 'react-router-dom'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

interface UserProfileProps {
  onBack: () => void
}

// Saved indicator component
const SavedIndicator: React.FC<{ isVisible: boolean; text?: string; type?: 'success' | 'error' }> = ({ isVisible, text = "Saved", type = 'success' }) => {
  if (!isVisible) return null
  
  const colorClass = type === 'error' ? 'text-red-400' : 'text-green-400'
  
  return (
    <div className={`flex items-center gap-1 ${colorClass} text-xs mt-1 animate-in fade-in duration-300`}>
      <CheckCircle2 className="h-3 w-3" />
      <span>{text}</span>
    </div>
  )
}

// Helper function to format days in short format
const formatPreferredDays = (days: string[]): string => {
  const dayMap: Record<string, string> = {
    'monday': 'M',
    'tuesday': 'T',
    'wednesday': 'W',
    'thursday': 'Th',
    'friday': 'F',
    'saturday': 'S',
    'sunday': 'Su'
  }
  
  const orderedDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const sortedDays = days
    .filter(day => orderedDays.includes(day.toLowerCase()))
    .sort((a, b) => orderedDays.indexOf(a.toLowerCase()) - orderedDays.indexOf(b.toLowerCase()))
  
  return sortedDays.map(day => dayMap[day.toLowerCase()] || day).join(' ')
}

// Helper function to format medium of play
const formatMediumOfPlay = (mediums: string[]): string => {
  const mediumMap: Record<string, string> = {
    'in_person': 'In Person',
    'online': 'Online',
    'hybrid': 'Hybrid'
  }
  
  // Define consistent ordering
  const orderedMediums = ['in_person', 'online', 'hybrid']
  const sortedMediums = mediums
    .filter(medium => orderedMediums.includes(medium.toLowerCase()))
    .sort((a, b) => orderedMediums.indexOf(a.toLowerCase()) - orderedMediums.indexOf(b.toLowerCase()))
  
  return sortedMediums.map(medium => mediumMap[medium] || medium).join(', ')
}

export const UserProfile: React.FC<UserProfileProps> = ({ onBack }) => {
  const navigate = useNavigate()
  const { user, signInWithGoogle, signInWithDiscord, signInWithTwitch } = useAuthStore()
  const { 
    profile, 
    ttrpgSystems, 
    playStyles, 
    friendsPage,
    friendsLoading,
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
    regenerateFriendCode,
    copyFriendCodeUrl,
    setError,
    _initAuthListener,
    fetchFriends,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend
  } = useProfileStore()
  
  const [activeTab, setActiveTab] = React.useState<'general' | 'accounts' | 'preferences' | 'systems' | 'social'>(() => {
    // Check if we should start on a specific tab (from navigation or OAuth return)
    const savedTab = sessionStorage.getItem('profileActiveTab')
    if (savedTab === 'accounts') {
      sessionStorage.removeItem('profileActiveTab') // Clear after reading
      return 'accounts'
    }
    if (savedTab === 'social') {
      sessionStorage.removeItem('profileActiveTab') // Clear after reading
      return 'social'
    }
    return 'general'
  })
  const [pendingChanges, setPendingChanges] = React.useState<Partial<Record<string, unknown>>>({})
  const [pendingSystemIds, setPendingSystemIds] = React.useState<string[]>([])
  const [pendingStyleIds, setPendingStyleIds] = React.useState<string[]>([])
  const [showOAuthOptions, setShowOAuthOptions] = React.useState(false)
  const [disconnectConfirm, setDisconnectConfirm] = React.useState<string | null>(null)
  const [hasDisconnected, setHasDisconnected] = React.useState(false)
  const [regenerating, setRegenerating] = React.useState(false)
  const [savedField, setSavedField] = React.useState<string | null>(null)
  const [friendCodeInput, setFriendCodeInput] = React.useState('')
  const [friendsSearch, setFriendsSearch] = React.useState('')
  const [currentFriendsPage, setCurrentFriendsPage] = React.useState(1)
  const [friendRequestStatus, setFriendRequestStatus] = React.useState<{ type: 'success' | 'error', message: string } | null>(null)
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
        
        // Show saved indicator
        setSavedField(field)
      }
    }
  })

  // Load profile and lookup tables on mount
  React.useEffect(() => {
    fetchProfile()
    fetchLookupTables()
    fetchFriends()
    _initAuthListener()
  }, [fetchProfile, fetchLookupTables, fetchFriends, _initAuthListener])

  // Auto-clear friend request status after 3 seconds
  React.useEffect(() => {
    if (friendRequestStatus) {
      const timer = setTimeout(() => setFriendRequestStatus(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [friendRequestStatus])

  // Periodic polling for friends updates (only when Social tab is active)
  React.useEffect(() => {
    if (activeTab !== 'social') return

    // Poll every 30 seconds for new friend invites and status changes
    const pollInterval = setInterval(() => {
      // Only poll if not currently loading and have a current page
      if (!friendsLoading && friendsPage) {
        fetchFriends(friendsPage.currentPage, friendsSearch)
      }
    }, 30000) // 30 seconds

    return () => clearInterval(pollInterval)
  }, [activeTab, friendsLoading, friendsPage, friendsSearch, fetchFriends])

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
    
    // Show saved indicator for this field
    setSavedField(field)
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


  // Auto-clear saved field indicator after 3 seconds
  React.useEffect(() => {
    if (savedField) {
      const timer = setTimeout(() => setSavedField(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [savedField])

  const handleSystemToggle = (systemId: string) => {
    const newSystemIds = pendingSystemIds.includes(systemId)
      ? pendingSystemIds.filter(id => id !== systemId)
      : [...pendingSystemIds, systemId]
    
    // Update local state immediately for UI responsiveness
    setPendingSystemIds(newSystemIds)
    
    // Debounce the save
    debouncedSaveSystems(newSystemIds)
    
    // Show saved indicator
    setSavedField('ttrpg_systems')
  }

  const handlePlayStyleToggle = (styleId: string) => {
    const newStyleIds = pendingStyleIds.includes(styleId)
      ? pendingStyleIds.filter(id => id !== styleId)
      : [...pendingStyleIds, styleId]
    
    // Update local state immediately for UI responsiveness
    setPendingStyleIds(newStyleIds)
    
    // Debounce the save
    debouncedSaveStyles(newStyleIds)
    
    // Show saved indicator
    setSavedField('play_styles')
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
    setSavedField('preferred_days')
  }

  const handleMediumOfPlayToggle = (medium: string) => {
    if (!profile) return
    const currentMediums = profile.scheduling_preferences?.medium_of_play || []
    const newPreferences = {
      ...profile.scheduling_preferences,
      medium_of_play: currentMediums.includes(medium)
        ? currentMediums.filter(m => m !== medium)
        : [...currentMediums, medium]
    }
    handleFieldUpdate('scheduling_preferences', newPreferences)
    setSavedField('medium_of_play')
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

  const handleSendFriendRequest = async () => {
    if (!friendCodeInput.trim()) return

    try {
      await sendFriendRequest(friendCodeInput.trim())
      setFriendCodeInput('')
      setFriendRequestStatus({ type: 'success', message: 'Friend request sent!' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send friend request'
      let displayMessage = message
      if (message === 'User not found') {
        displayMessage = 'Friend code not found'
      } else if (message === 'Friendship request already exists') {
        displayMessage = 'Already friends or request sent'
      }
      setFriendRequestStatus({ type: 'error', message: displayMessage })
    }
  }

  const handleFriendsSearch = React.useCallback(
    React.useMemo(() => {
      let timeoutId: NodeJS.Timeout
      return (searchTerm: string) => {
        setFriendsSearch(searchTerm)
        setCurrentFriendsPage(1) // Reset to first page when searching
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          // Only search if term is 2+ characters or empty (to show all)
          if (searchTerm.length >= 2 || searchTerm.length === 0) {
            fetchFriends(1, searchTerm)
          }
        }, 400) // Increased debounce for better performance
      }
    }, [fetchFriends]),
    [fetchFriends]
  )

  const handlePageChange = (page: number) => {
    setCurrentFriendsPage(page)
    fetchFriends(page, friendsSearch)
  }

  const handleRefreshFriends = () => {
    const currentPage = friendsPage?.currentPage || 1
    fetchFriends(currentPage, friendsSearch)
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
                <SavedIndicator isVisible={savedField === 'display_name'} />
                
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
                <SavedIndicator isVisible={savedField === 'about_me'} />

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
                  <SavedIndicator isVisible={savedField === 'experience_level'} />
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
                <SavedIndicator isVisible={savedField === 'dm_experience'} />
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
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <ThemedButton 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={saving}
                        className="w-full sm:w-auto"
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Upload Picture
                      </ThemedButton>
                      {profile?.profile_picture_url && (
                        <ThemedButton 
                          variant="destructive"
                          onClick={deleteProfilePicture}
                          disabled={saving}
                          className="w-full sm:w-auto"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </ThemedButton>
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
                              <ThemedButton 
                                onClick={() => handleOAuthAvatarSelect(provider)}
                                disabled={saving}
                                className="w-full sm:w-auto"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Use Avatar
                              </ThemedButton>
                            )}
                            <ThemedButton 
                              variant="destructive"
                              onClick={() => handleDisconnectClick(provider)}
                              disabled={saving}
                              className="w-full sm:w-auto"
                            >
                              <Unlink className="h-3 w-3 mr-1" />
                              Disconnect
                            </ThemedButton>
                          </>
                        ) : (
                          <ThemedButton 
                            onClick={() => {
                              setHasDisconnected(false) // Reset flag when manually connecting
                              providerInfo.signIn()
                            }}
                            disabled={saving}
                            className="w-full sm:w-auto"
                          >
                            <Link className="h-3 w-3 mr-1" />
                            Connect
                          </ThemedButton>
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
                  {profile.scheduling_preferences?.preferred_days?.length > 0 && (
                    <span className="ml-2 text-purple-400 font-normal">
                      ({formatPreferredDays(profile.scheduling_preferences.preferred_days)})
                    </span>
                  )}
                </label>
                <Input
                  type="number"
                  value={profile.preferred_session_length || ''}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '') {
                      handleFieldUpdate('preferred_session_length', null)
                    } else {
                      const numValue = parseInt(value)
                      if (!isNaN(numValue) && numValue > 0) {
                        handleFieldUpdate('preferred_session_length', numValue)
                      }
                    }
                  }}
                  placeholder="240"
                  className="bg-transparent border-purple-500/30 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 text-white placeholder:text-purple-400 transition-colors"
                />
                <SavedIndicator isVisible={savedField === 'preferred_session_length'} />
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
                <SavedIndicator isVisible={savedField === 'preferred_days'} />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">
                  Medium of Play
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['in_person', 'online', 'hybrid'].map((medium) => (
                    <button
                      key={medium}
                      onClick={() => handleMediumOfPlayToggle(medium)}
                      className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                        profile.scheduling_preferences?.medium_of_play?.includes(medium)
                          ? 'bg-purple-600 text-white'
                          : 'bg-black/20 border border-purple-500/30 text-purple-200 hover:bg-purple-600/20'
                      }`}
                    >
                      {medium === 'in_person' ? 'In Person' : medium === 'online' ? 'Online' : 'Hybrid'}
                    </button>
                  ))}
                </div>
                <SavedIndicator isVisible={savedField === 'medium_of_play'} />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">
                  Play Style Preferences
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {playStyles
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((style) => (
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
                <SavedIndicator isVisible={savedField === 'play_styles'} />
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
                {ttrpgSystems
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((system) => (
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
                        .sort((a, b) => a.sort_order - b.sort_order)
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
                <SavedIndicator isVisible={savedField === 'ttrpg_systems'} />
              </div>
            </CardContent>
          </Card>
        )
      }

      case 'social': {
        const handleCopyFriendCode = (e: React.MouseEvent) => {
          e.stopPropagation()
          navigator.clipboard.writeText(profile?.friend_code || '')
          setSavedField('friend_code')
        }

        const handleCopyUrl = (e: React.MouseEvent) => {
          e.stopPropagation()
          copyFriendCodeUrl()
          setSavedField('profile_url')
        }

        const handleRegenerateFriendCode = async () => {
          setRegenerating(true)
          try {
            const newCode = await regenerateFriendCode()
            if (newCode) {
              // Code was successfully regenerated
            }
          } finally {
            setRegenerating(false)
          }
        }


        const profileUrl = profile?.friend_code 
          ? `${window.location.origin}/user/${profile.friend_code}`
          : ''

        return (
          <div className="space-y-6">
            {/* Profile Sharing */}
            <Card className="bg-app-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center text-white">
                      <ExternalLink className="h-5 w-5 mr-2 text-purple-400" />
                      Profile Sharing
                    </CardTitle>
                    <CardDescription className="text-purple-300 mt-1">
                      Share your profile with other players
                    </CardDescription>
                  </div>
                  <div className="ml-4">
                    <label className="block text-xs font-medium text-purple-400 mb-1">
                      Visibility
                    </label>
                    <select
                      value={profile?.privacy_settings?.profile_visibility || 'public'}
                      onChange={(e) => {
                        const visibility = e.target.value as 'public' | 'friends_only' | 'private'
                        const newPrivacySettings = {
                          ...profile?.privacy_settings,
                          profile_visibility: visibility
                        }
                        handleFieldUpdate('privacy_settings', newPrivacySettings)
                      }}
                      className="bg-black/20 border border-purple-500/30 rounded-md px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-purple-400 transition-colors"
                    >
                      <option value="public">Public</option>
                      <option value="friends_only">Friends Only</option>
                      <option value="private">Private</option>
                    </select>
                    <SavedIndicator isVisible={savedField === 'privacy_settings'} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Profile URL and Friend Code - Responsive Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Profile URL */}
                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-2">
                      Public Profile URL
                    </label>
                    <div 
                      className="p-2.5 bg-black/20 border border-purple-500/30 rounded-lg text-purple-200 text-sm cursor-pointer hover:bg-black/30 transition-colors flex items-center justify-between"
                      onClick={handleCopyUrl}
                      title="Click to copy"
                    >
                      <span className="flex-1 mr-2 truncate">{profileUrl}</span>
                      <Copy className="h-3.5 w-3.5 text-purple-400 flex-shrink-0" />
                    </div>
                    <SavedIndicator isVisible={savedField === 'profile_url'} text="Copied to clipboard" />
                  </div>

                  {/* Friend Code */}
                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-2">
                      Friend Code
                    </label>
                    <div className="flex items-center gap-2">
                      <div 
                        className="flex-1 p-2.5 bg-black/20 border border-purple-500/30 rounded-lg font-mono text-sm lg:text-base text-white tracking-wider cursor-pointer hover:bg-black/30 transition-colors flex items-center justify-between"
                        onClick={handleCopyFriendCode}
                        title="Click to copy"
                      >
                        <span>{profile?.friend_code || 'Loading...'}</span>
                        <Copy className="h-3.5 w-3.5 text-purple-400" />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRegenerateFriendCode}
                        disabled={regenerating}
                        title="Generate new friend code"
                        className="px-2.5 text-purple-400 hover:text-purple-300 hover:bg-purple-600/20 border-purple-500/30"
                      >
                        {regenerating ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          'New'
                        )}
                      </Button>
                    </div>
                    <SavedIndicator isVisible={savedField === 'friend_code'} text="Copied to clipboard" />
                  </div>
                </div>

                {/* Preview Link */}
                {profileUrl && (
                  <div className="pt-2">
                    <Button
                      asChild
                      variant="ghost"
                      className="text-purple-300 hover:text-purple-200 hover:bg-purple-600/10 w-full"
                    >
                      <a 
                        href={profileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Preview Your Public Profile
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Friends Management */}
            <Card className="bg-app-card">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Users className="h-5 w-5 mr-2 text-purple-400" />
                  Friends
                </CardTitle>
                <CardDescription className="text-purple-300">
                  Manage your friends and connections
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Friend */}
                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">
                    Add Friend by Code
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={friendCodeInput}
                      onChange={(e) => setFriendCodeInput(e.target.value.toUpperCase())}
                      placeholder="Enter friend code"
                      className="bg-black/20 border-purple-500/30 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 text-white placeholder:text-purple-400"
                      maxLength={8}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSendFriendRequest()
                        }
                      }}
                    />
                    <ThemedButton 
                      onClick={handleSendFriendRequest}
                      disabled={!friendCodeInput.trim() || saving}
                      className="whitespace-nowrap"
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Add Friend
                    </ThemedButton>
                  </div>
                  <SavedIndicator 
                    isVisible={!!friendRequestStatus} 
                    text={friendRequestStatus?.message} 
                    type={friendRequestStatus?.type}
                  />
                </div>

                {/* Friends List */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-purple-300">Your Friends</h4>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-purple-400">
                        {friendsPage?.totalCount || 0} total
                      </div>
                      <button
                        onClick={handleRefreshFriends}
                        disabled={friendsLoading}
                        className="h-6 w-6 flex items-center justify-center rounded bg-black/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/20 disabled:opacity-50 transition-colors"
                        title="Refresh friends list"
                      >
                        <RefreshCw className={`h-3 w-3 ${friendsLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Search */}
                  <div className="mb-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400" />
                      <Input
                        value={friendsSearch}
                        onChange={(e) => handleFriendsSearch(e.target.value)}
                        placeholder="Search friends by name or code (min 2 characters)..."
                        className="pl-10 bg-black/20 border-purple-500/30 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 text-white placeholder:text-purple-400"
                      />
                    </div>
                  </div>

                  {friendsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                      <span className="ml-2 text-purple-400">Loading friends...</span>
                    </div>
                  ) : !friendsPage || friendsPage.friends.length === 0 ? (
                    <div className="text-center py-8 text-purple-400">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">
                        {friendsSearch ? 'No friends found matching your search' : 'No friends yet!'}
                      </p>
                      <p className="text-xs mt-1 opacity-75">
                        {friendsSearch ? 'Try adjusting your search terms' : 'Add friends using their friend codes above.'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {friendsPage.friends.map((friend) => (
                        <div
                          key={friend.friendship_id}
                          className="flex items-center justify-between p-3 bg-black/20 border border-purple-500/20 rounded-lg cursor-pointer hover:bg-purple-600/10 transition-colors"
                          onClick={() => {
                            navigate(`/user/${friend.friend_code}?returnTo=profile`)
                          }}
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center overflow-hidden">
                              {friend.profile_picture_url ? (
                                <img 
                                  src={friend.profile_picture_url} 
                                  alt="Profile" 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="h-4 w-4 text-white" />
                              )}
                            </div>
                            <div>
                              <div className="text-white text-sm font-medium">
                                {friend.display_name || 'Anonymous Player'}
                              </div>
                              <div className="text-xs text-purple-400 font-mono">
                                {friend.friend_code}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {/* Status indicator */}
                            <div className={`text-xs px-2 py-1 rounded ${
                              friend.status === 'accepted' 
                                ? 'bg-green-500/20 text-green-400' 
                                : friend.status === 'pending' && friend.is_requester
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : 'bg-blue-500/20 text-blue-400'
                            }`}>
                              {friend.status === 'accepted' 
                                ? 'Friend' 
                                : friend.status === 'pending' && friend.is_requester
                                  ? 'Sent'
                                  : 'Pending'
                              }
                            </div>

                            {/* Action buttons */}
                            {friend.status === 'pending' && !friend.is_requester && (
                              <div className="flex space-x-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    acceptFriendRequest(friend.friendship_id)
                                  }}
                                  className="h-7 w-7 flex items-center justify-center rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                                  title="Accept friend request"
                                >
                                  <UserCheck className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    declineFriendRequest(friend.friendship_id)
                                  }}
                                  className="h-7 w-7 flex items-center justify-center rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                  title="Decline friend request"
                                >
                                  <UserX className="h-3 w-3" />
                                </button>
                              </div>
                            )}

                            {(friend.status === 'accepted' || (friend.status === 'pending' && friend.is_requester)) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeFriend(friend.friendship_id)
                                }}
                                className="h-7 w-7 flex items-center justify-center rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                title={friend.status === 'accepted' ? 'Remove friend' : 'Cancel friend request'}
                              >
                                <UserX className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        ))}
                      </div>

                      {/* Pagination */}
                      {friendsPage.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-purple-500/20">
                          <div className="text-xs text-purple-400">
                            Page {friendsPage.currentPage} of {friendsPage.totalPages}
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handlePageChange(friendsPage.currentPage - 1)}
                              disabled={!friendsPage.hasPreviousPage}
                              className="h-8 w-8 flex items-center justify-center rounded bg-black/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            
                            {/* Page numbers */}
                            {Array.from({ length: Math.min(5, friendsPage.totalPages) }, (_, i) => {
                              const pageNum = Math.max(1, Math.min(
                                friendsPage.totalPages - 4,
                                friendsPage.currentPage - 2
                              )) + i
                              if (pageNum > friendsPage.totalPages) return null
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => handlePageChange(pageNum)}
                                  className={`h-8 w-8 flex items-center justify-center rounded text-xs transition-colors ${
                                    pageNum === friendsPage.currentPage
                                      ? 'bg-purple-600 text-white'
                                      : 'bg-black/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/20'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              )
                            })}
                            
                            <button
                              onClick={() => handlePageChange(friendsPage.currentPage + 1)}
                              disabled={!friendsPage.hasNextPage}
                              className="h-8 w-8 flex items-center justify-center rounded bg-black/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
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
          <Button variant="ghost" onClick={onBack} className="text-purple-300 hover:text-purple-200 hover:bg-purple-600/10">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-white">User Profile</h1>
        </div>
        <div className="flex items-center space-x-2">
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-black/20 backdrop-blur-sm border border-purple-500/20 rounded-lg p-1">
        {[
          { id: 'general', label: 'General', shortLabel: 'General', icon: User },
          { id: 'accounts', label: 'Accounts', shortLabel: 'Accounts', icon: Link },
          { id: 'preferences', label: 'Preferences', shortLabel: 'Prefs', icon: Calendar },
          { id: 'systems', label: 'TTRPG Systems', shortLabel: 'TTRPG', icon: Gamepad2 },
          { id: 'social', label: 'Social', shortLabel: 'Social', icon: Users }
        ].map(({ id, label, shortLabel, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as 'general' | 'accounts' | 'preferences' | 'systems' | 'social')}
            className={`flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex-1 min-w-0 ${
              activeTab === id
                ? 'bg-purple-600 text-white'
                : 'text-purple-300 hover:text-purple-200 hover:bg-purple-600/20'
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