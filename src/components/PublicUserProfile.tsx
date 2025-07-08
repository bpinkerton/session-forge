import React from 'react'
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Clock, GamepadIcon, Users, ArrowLeft, ExternalLink, UserPlus, UserCheck, UserX } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import type { UserProfileWithAccounts } from '@/types'

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
  
  return sortedMediums.map(medium => mediumMap[medium.toLowerCase()] || medium).join(', ')
}


export const PublicUserProfile: React.FC = () => {
  const { friendCode } = useParams<{ friendCode: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, loading: authLoading, initialize } = useAuthStore()
  
  // Get return destination from URL params
  const searchParams = new URLSearchParams(location.search)
  const returnTo = searchParams.get('returnTo')
  const [profile, setProfile] = React.useState<UserProfileWithAccounts | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [friendshipStatus, setFriendshipStatus] = React.useState<{
    exists: boolean
    status: 'pending' | 'accepted'
    isRequester: boolean
    friendshipId?: string
  } | null>(null)
  const [sendingRequest, setSendingRequest] = React.useState(false)

  // Initialize auth state
  React.useEffect(() => {
    initialize()
  }, [initialize])

  // Friend action handlers
  const handleSendFriendRequest = async () => {
    if (!user || !profile) return
    
    setSendingRequest(true)
    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          requester_id: user.id,
          addressee_id: profile.user_id,
          status: 'pending'
        })

      if (error) throw error

      // Update friendship status locally
      setFriendshipStatus({
        exists: true,
        status: 'pending',
        isRequester: true,
        friendshipId: undefined // We could fetch the ID, but it's not needed for display
      })
    } catch (error) {
      console.error('Error sending friend request:', error)
    } finally {
      setSendingRequest(false)
    }
  }

  const handleAcceptFriendRequest = async () => {
    if (!friendshipStatus?.friendshipId) return

    setSendingRequest(true)
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipStatus.friendshipId)

      if (error) throw error

      setFriendshipStatus(prev => prev ? { ...prev, status: 'accepted' } : null)
    } catch (error) {
      console.error('Error accepting friend request:', error)
    } finally {
      setSendingRequest(false)
    }
  }

  const handleDeclineFriendRequest = async () => {
    if (!friendshipStatus?.friendshipId) return

    setSendingRequest(true)
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipStatus.friendshipId)

      if (error) throw error

      setFriendshipStatus({ exists: false, status: 'pending', isRequester: false })
    } catch (error) {
      console.error('Error declining friend request:', error)
    } finally {
      setSendingRequest(false)
    }
  }

  React.useEffect(() => {
    const fetchPublicProfile = async () => {
      if (!friendCode) {
        setError('No friend code provided')
        setLoading(false)
        return
      }

      // Wait for auth to be initialized before proceeding
      if (authLoading) {
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Fetch profile by friend code
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('friend_code', friendCode.toUpperCase())
          .single()

        if (profileError) {
          if (profileError.code === 'PGRST116') {
            setError('Profile not found')
          } else {
            throw profileError
          }
          return
        }

        // Check privacy settings
        if (profileData.privacy_settings?.profile_visibility === 'private') {
          setError('This profile is private')
          return
        }

        // Check friendship status if user is logged in
        let friendshipData = null
        if (user) {
          const { data: friendships, error: friendshipError } = await supabase
            .from('friendships')
            .select('id, status, requester_id, addressee_id')
            .or(`and(requester_id.eq.${user.id},addressee_id.eq.${profileData.user_id}),and(requester_id.eq.${profileData.user_id},addressee_id.eq.${user.id})`)

          if (!friendshipError && friendships && friendships.length > 0) {
            const friendship = friendships[0]
            friendshipData = {
              exists: true,
              status: friendship.status as 'pending' | 'accepted',
              isRequester: friendship.requester_id === user.id,
              friendshipId: friendship.id
            }
          } else {
            friendshipData = { exists: false, status: 'pending' as const, isRequester: false }
          }
          setFriendshipStatus(friendshipData)
        }

        // Check friends-only visibility
        if (profileData.privacy_settings?.profile_visibility === 'friends_only') {
          // If user is not logged in, deny access
          if (!user) {
            setError('This profile is only visible to friends')
            return
          }

          // If no accepted friendship found, deny access
          if (!friendshipData?.exists || friendshipData.status !== 'accepted') {
            setError('This profile is only visible to friends')
            return
          }
        }

        // Fetch related data using the user_id from the profile
        const [userSystemsResponse, userStylesResponse] = await Promise.all([
          // User's TTRPG systems
          supabase
            .from('user_ttrpg_systems')
            .select(`
              *,
              system:ttrpg_systems (*)
            `)
            .eq('user_id', profileData.user_id),
          // User's play styles
          supabase
            .from('user_play_styles')
            .select(`
              *,
              style:play_styles (*)
            `)
            .eq('user_id', profileData.user_id)
        ])

        // System and style data not needed for public profile display

        // Combine all data into the profile object
        setProfile({
          ...profileData,
          connected_accounts: [],
          ttrpg_systems: userSystemsResponse.data || [],
          play_styles: userStylesResponse.data || []
        } as UserProfileWithAccounts)
      } catch (err) {
        console.error('Error fetching public profile:', err)
        setError('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    fetchPublicProfile()
  }, [friendCode, authLoading, user])

  if (loading) {
    return (
      <div className="min-h-screen bg-app-gradient flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-app-gradient flex items-center justify-center">
        <div className="text-center">
          <Card className="bg-app-card max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-center gap-2">
                <User className="h-6 w-6" />
                Profile Not Found
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-purple-300">
                {error || 'The profile you\'re looking for could not be found.'}
              </p>
              <Button asChild>
                <Link to="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go to SessionForge
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const userSystems = profile.ttrpg_systems?.filter(us => us.system) || []
  const userStyles = profile.play_styles?.filter(ups => ups.style) || []

  return (
    <div className="min-h-screen bg-app-gradient">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => {
                if (returnTo === 'profile') {
                  // Navigate to home with profile view parameter
                  navigate('/?view=profile')
                } else {
                  navigate('/')
                }
              }}
              className="text-purple-300 hover:text-purple-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {returnTo === 'profile' ? 'Back to Profile' : 'SessionForge'}
            </Button>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">
              {profile.display_name || 'Anonymous Player'}
            </h1>
          </div>
        </div>

        <div className="space-y-8">
          {/* Main Profile Card */}
          <Card className="bg-app-card">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-start gap-6 relative">
                {/* Friendship Status/Actions - Top Right */}
                {user && user.id !== profile.user_id && (
                  <div className="absolute top-0 right-0">
                    {!friendshipStatus?.exists ? (
                      // No friendship - show Add Friend button
                      <Button
                        onClick={handleSendFriendRequest}
                        disabled={sendingRequest}
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                        {sendingRequest ? 'Sending...' : 'Add Friend'}
                      </Button>
                    ) : friendshipStatus.status === 'accepted' ? (
                      // Already friends
                      <div className="flex items-center gap-1 text-green-400 bg-green-500/10 px-2 py-1 rounded text-sm">
                        <UserCheck className="h-3 w-3" />
                        <span className="font-medium">Friends</span>
                      </div>
                    ) : friendshipStatus.isRequester ? (
                      // You sent a request
                      <div className="flex items-center gap-1 text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded text-sm">
                        <Clock className="h-3 w-3" />
                        <span className="font-medium">Request Sent</span>
                      </div>
                    ) : (
                      // You received a request
                      <div className="flex flex-col gap-2">
                        <div className="text-purple-300 text-xs text-center">Friend request</div>
                        <div className="flex gap-1">
                          <Button
                            onClick={handleAcceptFriendRequest}
                            disabled={sendingRequest}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 h-7"
                          >
                            <UserCheck className="h-3 w-3" />
                          </Button>
                          <Button
                            onClick={handleDeclineFriendRequest}
                            disabled={sendingRequest}
                            size="sm"
                            variant="outline"
                            className="text-red-400 border-red-400/30 hover:bg-red-400/10 px-2 py-1 h-7"
                          >
                            <UserX className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {profile.profile_picture_url && (
                  <img
                    src={profile.profile_picture_url}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-2 border-purple-500/30"
                  />
                )}
                <div className="flex-1">
                  <CardTitle className="text-white text-xl mb-2">
                    {profile.display_name || 'Anonymous Player'}
                  </CardTitle>
                  {profile.about_me && (
                    <p className="text-purple-200 leading-relaxed mb-4">
                      {profile.about_me}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm">
                    {profile.experience_level && (
                      <div className="flex items-center gap-2 text-purple-300">
                        <User className="h-4 w-4" />
                        <span className="capitalize">{profile.experience_level} Player</span>
                      </div>
                    )}
                    {profile.dm_experience && (
                      <div className="flex items-center gap-2 text-purple-300">
                        <Users className="h-4 w-4" />
                        <span>Dungeon Master</span>
                      </div>
                    )}
                    {profile.preferred_session_length && (
                      <div className="flex items-center gap-2 text-purple-300">
                        <Clock className="h-4 w-4" />
                        <span>
                          {Math.floor(profile.preferred_session_length / 60)}h sessions
                          {profile.scheduling_preferences?.preferred_days?.length && profile.scheduling_preferences.preferred_days.length > 0 && (
                            <> • {formatPreferredDays(profile.scheduling_preferences.preferred_days)}</>
                          )}
                          {profile.scheduling_preferences?.medium_of_play?.length && profile.scheduling_preferences.medium_of_play.length > 0 && (
                            <> • {formatMediumOfPlay(profile.scheduling_preferences.medium_of_play)}</>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* TTRPG Systems */}
          {userSystems.length > 0 && (
            <Card className="bg-app-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <GamepadIcon className="h-5 w-5" />
                  Game Systems
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {userSystems
                    .sort((a, b) => (a.system?.sort_order || 0) - (b.system?.sort_order || 0))
                    .map((userSystem) => (
                    <div
                      key={userSystem.system_id}
                      className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10 border border-purple-500/20"
                    >
                      <div>
                        <div className="text-purple-200 font-medium">
                          {userSystem.system?.name}
                        </div>
                        {userSystem.experience_level && (
                          <div className="text-sm text-purple-400 capitalize">
                            {userSystem.experience_level.replace('_', ' ')}
                          </div>
                        )}
                      </div>
                      {userSystem.is_favorite && (
                        <div className="text-yellow-400">★</div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Play Styles */}
          {userStyles.length > 0 && (
            <Card className="bg-app-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Play Style Preferences
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-3">
                  {userStyles
                    .sort((a, b) => (a.style?.sort_order || 0) - (b.style?.sort_order || 0))
                    .map((userStyle) => {
                    const intensity = userStyle.preference_level || 3
                    const intensityColors = {
                      1: 'bg-red-500/20 border-red-500/30 text-red-300',
                      2: 'bg-orange-500/20 border-orange-500/30 text-orange-300',
                      3: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300',
                      4: 'bg-green-500/20 border-green-500/30 text-green-300',
                      5: 'bg-blue-500/20 border-blue-500/30 text-blue-300'
                    } as const
                    
                    return (
                      <div
                        key={userStyle.style_id}
                        className={`p-3 rounded-lg border ${intensityColors[intensity as keyof typeof intensityColors] || intensityColors[3]}`}
                      >
                        <div className="font-medium">
                          {userStyle.style?.name}
                        </div>
                        {userStyle.style?.description && (
                          <div className="text-sm opacity-80 mt-1">
                            {userStyle.style.description}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Call to Action - Only show if user is not logged in and auth has loaded */}
          {!authLoading && !user && (
            <Card className="bg-app-card">
              <CardContent className="text-center py-8">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Want to create your own profile?
                </h3>
                <p className="text-purple-300 mb-4">
                  Join SessionForge to connect with other D&D players and manage your campaigns.
                </p>
                <Button asChild>
                  <Link to="/">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Get Started with SessionForge
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}