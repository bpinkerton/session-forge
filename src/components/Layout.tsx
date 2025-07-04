import React from 'react'
import { useAuthStore } from '@/stores/auth'
import { useCampaignStore } from '@/stores/campaign'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { CampaignSetup } from './CampaignSetup'
import { CampaignManagement } from './CampaignManagement'
import { SessionList } from './SessionList'
import { SessionDetail } from './SessionDetail'
import { SessionDialog } from './SessionDialog'
import { InviteDialog } from './InviteDialog'
import { JoinCampaign } from './JoinCampaign'
import { Sword, Users, Calendar, Map, Trophy, UserPlus, Edit } from 'lucide-react'
import { getDisplayStatus } from '@/constants/campaignStatus'
import type { Session, Campaign } from '@/types'

const AuthForm = () => {
  const [isLogin, setIsLogin] = React.useState(true)
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const { signIn, signUp } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isLogin) {
        await signIn(email, password)
      } else {
        await signUp(email, password)
      }
    } catch (error) {
      console.error('Auth error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Sword className="h-8 w-8 text-purple-600 mr-2" />
            <h1 className="text-2xl font-bold">SessionForge</h1>
          </div>
          <CardTitle>{isLogin ? 'Welcome Back' : 'Create Account'}</CardTitle>
          <CardDescription>
            {isLogin ? 'Sign in to your campaign portal' : 'Join your D&D campaign'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-purple-600 hover:underline"
            >
              {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const Dashboard = () => {
  const { user, signOut } = useAuthStore()
  const { currentCampaign, setCurrentCampaign, fetchCampaignFull, fetchUserCampaigns, userRole, validateCurrentCampaignAccess } = useCampaignStore()
  
  const [currentView, setCurrentView] = React.useState<'campaign-setup' | 'campaign-management' | 'home' | 'sessions' | 'characters' | 'campaign' | 'tavern'>('campaign-setup')
  const [selectedSessionId, setSelectedSessionId] = React.useState<string | null>(null)
  const [sessionDialogOpen, setSessionDialogOpen] = React.useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = React.useState(false)
  const [editingSession, setEditingSession] = React.useState<Session | null>(null)
  const [joinDialogOpen, setJoinDialogOpen] = React.useState(false)
  const [inviteCodeFromUrl, setInviteCodeFromUrl] = React.useState<string | null>(null)

  // Track campaign ID separately to avoid navigation on property updates
  const [lastCampaignId, setLastCampaignId] = React.useState<string | null>(null)

  // Check for invite URLs on mount
  React.useEffect(() => {
    const path = window.location.pathname
    const joinMatch = path.match(/^\/join\/([A-Z0-9]+)$/i)
    
    if (joinMatch && user) {
      const inviteCode = joinMatch[1].toUpperCase()
      setInviteCodeFromUrl(inviteCode)
      setJoinDialogOpen(true)
      
      // Clean up the URL without refreshing the page
      window.history.replaceState({}, '', '/')
    }
  }, [user])

  React.useEffect(() => {
    const currentCampaignId = currentCampaign?.id || null
    
    // Only navigate if the campaign ID actually changed, not just properties
    if (currentCampaignId !== lastCampaignId) {
      console.log('Campaign ID changed from', lastCampaignId, 'to', currentCampaignId)
      if (!currentCampaign) {
        setCurrentView('campaign-setup')
      } else {
        // Only navigate to home if we're not already in a campaign view
        if (currentView === 'campaign-setup') {
          setCurrentView('home')
        }
      }
      setLastCampaignId(currentCampaignId)
    } else if (currentCampaign) {
      console.log('Campaign properties updated, staying in current view:', currentView)
    }
  }, [currentCampaign, currentView, lastCampaignId])

  // Validate access when user returns to tab - no alerts, just cleanup
  React.useEffect(() => {
    if (!currentCampaign) return

    const handleFocus = async () => {
      const hasAccess = await validateCurrentCampaignAccess()
      if (!hasAccess) {
        // Silently cleanup and redirect to campaign setup
        setCurrentCampaign(null)
        await fetchUserCampaigns()
        setCurrentView('campaign-setup')
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [currentCampaign?.id, validateCurrentCampaignAccess, fetchUserCampaigns])

  const handleCampaignSelected = async (campaign: Campaign) => {
    try {
      await fetchCampaignFull(campaign.id)
      setCurrentView('home')
    } catch (error) {
      // Silently refresh campaign list to remove inaccessible campaigns
      await fetchUserCampaigns()
    }
  }

  const handleCampaignManage = async (campaign: Campaign) => {
    try {
      await fetchCampaignFull(campaign.id)
      setCurrentView('campaign-management')
    } catch (error) {
      // Silently refresh campaign list to remove inaccessible campaigns
      await fetchUserCampaigns()
    }
  }

  const handleSessionClick = (session: Session) => {
    setSelectedSessionId(session.id)
    setCurrentView('sessions')
  }

  const handleCreateSession = () => {
    setEditingSession(null)
    setSessionDialogOpen(true)
  }

  const handleEditSession = (session: Session) => {
    setEditingSession(session)
    setSessionDialogOpen(true)
  }

  const handleBackToSessions = () => {
    setSelectedSessionId(null)
  }

  const handleBackToHome = () => {
    // If no campaign, redirect to setup instead of home
    if (!currentCampaign) {
      setCurrentView('campaign-setup')
    } else {
      setCurrentView('home')
    }
    setSelectedSessionId(null)
  }

  const renderContent = () => {
    if (currentView === 'campaign-setup') {
      return <CampaignSetup onCampaignSelected={handleCampaignSelected} onCampaignManage={handleCampaignManage} />
    }

    if (currentView === 'campaign-management') {
      return <CampaignManagement onBack={handleBackToHome} />
    }

    if (currentView === 'sessions') {
      if (selectedSessionId) {
        return (
          <SessionDetail
            sessionId={selectedSessionId}
            onEdit={handleEditSession}
            onBack={handleBackToSessions}
          />
        )
      }
      return (
        <SessionList
          onCreateSession={handleCreateSession}
          onSessionClick={handleSessionClick}
        />
      )
    }

    // Default home view - redirect to setup if no campaign
    if (!currentCampaign) {
      setCurrentView('campaign-setup')
      return <CampaignSetup onCampaignSelected={handleCampaignSelected} onCampaignManage={handleCampaignManage} />
    }
    
    return (
      <div className="space-y-8">
        {currentCampaign ? (
          <div 
            className="mb-8 p-6 bg-black/20 backdrop-blur-sm border border-purple-500/20 rounded-lg hover:border-purple-400/30 transition-colors cursor-pointer group"
            onClick={() => setCurrentView('campaign-management')}
          >
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-bold text-white group-hover:text-purple-100 transition-colors">{currentCampaign.name}</h2>
              <span className={`px-2 py-1 rounded text-sm font-medium self-start mt-1 ${getDisplayStatus(currentCampaign.status).color}`}>
                {getDisplayStatus(currentCampaign.status).label}
              </span>
            </div>
            <p className="text-purple-200 group-hover:text-purple-100 transition-colors">
              {currentCampaign.setting ? `${currentCampaign.setting} Campaign` : 'D&D Campaign'}
            </p>
            {currentCampaign.description && (
              <p className="text-purple-300 group-hover:text-purple-200 transition-colors mt-2">{currentCampaign.description}</p>
            )}
            <div className="flex items-center gap-2 mt-3 text-purple-400 group-hover:text-purple-300 transition-colors">
              <Edit className="h-4 w-4" />
              <span className="text-sm">Click to edit campaign</span>
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">SessionForge</h2>
            <p className="text-purple-200">Your D&D campaign management portal</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-black/20 backdrop-blur-sm border-purple-500/20 hover:border-purple-400/30 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Calendar className="h-5 w-5 mr-2 text-purple-400" />
                Sessions
              </CardTitle>
              <CardDescription className="text-purple-200">
                Manage your campaign sessions and scheduling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setCurrentView('sessions')}
              >
                View Sessions
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-black/20 backdrop-blur-sm border-purple-500/20 opacity-50">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Users className="h-5 w-5 mr-2 text-purple-400" />
                Characters
              </CardTitle>
              <CardDescription className="text-purple-200">
                Manage party members and character sheets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-black/20 backdrop-blur-sm border-purple-500/20 opacity-50">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Map className="h-5 w-5 mr-2 text-purple-400" />
                Campaign
              </CardTitle>
              <CardDescription className="text-purple-200">
                Track your campaign progress and world
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-black/20 backdrop-blur-sm border-purple-500/20 opacity-50">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Trophy className="h-5 w-5 mr-2 text-purple-400" />
                Tavern
              </CardTitle>
              <CardDescription className="text-purple-200">
                Manage your party's tavern business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <nav className="bg-black/20 backdrop-blur-sm border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleBackToHome}
                className="flex items-center hover:opacity-80 transition-opacity"
              >
                <Sword className="h-8 w-8 text-purple-400 mr-2" />
                <h1 className="text-xl font-bold text-white">SessionForge</h1>
              </button>
              
              {currentCampaign && currentView !== 'campaign-setup' && (
                <div className="flex items-center space-x-2">
                  <span className="text-purple-300">|</span>
                  <span className="text-purple-200 font-medium">{currentCampaign.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentView('campaign-setup')}
                    className="text-purple-300 hover:text-purple-100"
                  >
                    Switch Campaign
                  </Button>
                  {userRole === 'dm' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setInviteDialogOpen(true)}
                      className="text-purple-300 hover:text-purple-100"
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Invite Players
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-purple-200">{user?.email}</span>
              <Button variant="outline" onClick={signOut} size="sm">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>

      <SessionDialog
        session={editingSession}
        open={sessionDialogOpen}
        onOpenChange={setSessionDialogOpen}
      />
      
      <InviteDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
      />
      
      <Dialog open={joinDialogOpen} onOpenChange={(open) => {
        setJoinDialogOpen(open)
        if (!open) {
          setInviteCodeFromUrl(null)
        }
      }}>
        <DialogContent className="max-w-lg bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border-purple-500/20">
          <JoinCampaign
            inviteCode={inviteCodeFromUrl || undefined}
            onSuccess={async (campaign) => {
              setJoinDialogOpen(false)
              setInviteCodeFromUrl(null)
              // Refresh campaigns list first to include the newly joined campaign
              await fetchUserCampaigns()
              // Then select and load the full campaign
              await handleCampaignSelected(campaign)
            }}
            onCancel={() => {
              setJoinDialogOpen(false)
              setInviteCodeFromUrl(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export const Layout = () => {
  const { user, loading, initialize } = useAuthStore()

  React.useEffect(() => {
    initialize()
  }, [initialize])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return user ? <Dashboard /> : <AuthForm />
}