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
  const [confirmSignUpPassword, setConfirmSignUpPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)
  const [showForgotPassword, setShowForgotPassword] = React.useState(false)
  const [showResetPassword, setShowResetPassword] = React.useState(false)
  const [showSignupSuccess, setShowSignupSuccess] = React.useState(false)
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const { signIn, signUp, resetPassword, updatePassword } = useAuthStore()

  // Check for password reset mode on component mount
  React.useEffect(() => {
    const isPasswordResetMode = sessionStorage.getItem('passwordResetMode') === 'true'
    if (isPasswordResetMode) {
      console.log('Continuing password reset mode from session storage')
      setShowResetPassword(true)
      setShowForgotPassword(false)
      setIsLogin(false)
    }
  }, [])

  const getErrorMessage = (error: any): string => {
    if (!error?.message) return 'An unexpected error occurred'
    
    const message = error.message.toLowerCase()
    
    // Common Supabase auth error messages
    if (message.includes('invalid login credentials') || message.includes('invalid email or password')) {
      return 'Invalid email or password. Please check your credentials and try again.'
    }
    if (message.includes('email not confirmed')) {
      return 'Please check your email and click the confirmation link before signing in.'
    }
    if (message.includes('user already registered') || message.includes('email address is already registered')) {
      return 'An account with this email already exists. Please sign in instead or use the "Forgot Password" option.'
    }
    if (message.includes('signup is disabled')) {
      return 'New account registration is currently disabled. Please contact support.'
    }
    if (message.includes('password should be at least')) {
      return 'Password must be at least 6 characters long.'
    }
    if (message.includes('only lowercase letters allowed')) {
      return 'Please use a valid email address.'
    }
    if (message.includes('email address not authorized')) {
      return 'This email address is not authorized to sign up.'
    }
    if (message.includes('too many requests')) {
      return 'Too many attempts. Please wait a moment before trying again.'
    }
    
    // Return the original message if we don't have a specific handler
    return error.message
  }

  const validateForm = (): string | null => {
    if (!email.trim()) {
      return 'Email is required'
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address'
    }
    
    if (!password) {
      return 'Password is required'
    }
    
    if (!isLogin && password.length < 6) {
      return 'Password must be at least 6 characters long'
    }
    
    if (!isLogin && !confirmSignUpPassword) {
      return 'Please confirm your password'
    }
    
    if (!isLogin && password !== confirmSignUpPassword) {
      return 'Passwords do not match'
    }
    
    return null
  }

  const handleForgotPassword = async () => {
    setError(null)
    setSuccess(null)
    
    if (!email.trim()) {
      setError('Email is required')
      return
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }
    
    setLoading(true)
    try {
      await resetPassword(email)
      setSuccess('Password reset email sent! Please check your email for instructions.')
    } catch (error) {
      console.error('Reset password error:', error)
      setError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordUpdate = async () => {
    setError(null)
    setSuccess(null)
    
    if (!newPassword.trim()) {
      setError('New password is required')
      return
    }
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    setLoading(true)
    try {
      await updatePassword(newPassword)
      setSuccess('Password updated successfully! You are now signed in.')
      // Clear the reset state and session storage
      sessionStorage.removeItem('passwordResetMode')
      setTimeout(() => {
        setShowResetPassword(false)
        setNewPassword('')
        setConfirmPassword('')
        // Force a page reload to ensure the layout switches to Dashboard
        window.location.reload()
      }, 2000)
    } catch (error) {
      console.error('Update password error:', error)
      setError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  // Check for password reset URL parameters on component mount
  React.useEffect(() => {
    const checkForPasswordReset = async () => {
      // Debug: Log the full URL to see what we're working with
      console.log('Full URL:', window.location.href)
      console.log('Hash:', window.location.hash)
      console.log('Search:', window.location.search)
      
      // Check URL hash for recovery type (Supabase password reset)
      const hash = window.location.hash
      const params = new URLSearchParams(hash.substring(1))
      const type = params.get('type')
      
      // Also check URL search params as fallback
      const searchParams = new URLSearchParams(window.location.search)
      const searchType = searchParams.get('type')
      
      // Debug: Log all URL parameters
      console.log('Hash params:', Object.fromEntries(params))
      console.log('Search params:', Object.fromEntries(searchParams))
      console.log('Type from hash:', type)
      console.log('Type from search:', searchType)
      
      // Check for errors in URL (expired links, etc.)
      const hasError = params.get('error') || searchParams.get('error')
      const errorCode = params.get('error_code') || searchParams.get('error_code')
      
      if (hasError) {
        console.log('❌ Error in URL detected:', hasError, 'Code:', errorCode)
        // Clear password reset mode for any error URLs
        sessionStorage.removeItem('passwordResetMode')
        setShowResetPassword(false)
        setShowForgotPassword(false)
        setIsLogin(true)
        
        // Show appropriate error message
        if (errorCode === 'otp_expired') {
          setError('This link has expired. Please request a new confirmation email or password reset.')
        } else {
          setError('Invalid or expired link. Please try again.')
        }
        
        // Clear the URL parameters
        window.history.replaceState({}, '', window.location.pathname)
      } else if (type === 'recovery' || searchType === 'recovery') {
        console.log('🔐 Password reset detected from URL')
        setShowResetPassword(true)
        setShowForgotPassword(false)
        setIsLogin(false)
        
        // Store that we're in password reset mode
        sessionStorage.setItem('passwordResetMode', 'true')
        
        // Clear the URL parameters
        window.history.replaceState({}, '', window.location.pathname)
      } else if (type === 'signup' || searchType === 'signup') {
        console.log('✉️ Email confirmation detected from URL - allowing normal login')
        // This is an email confirmation link, not password reset
        // Clear any stored password reset mode
        sessionStorage.removeItem('passwordResetMode')
        // Just clear the URL parameters and let normal auth flow proceed
        window.history.replaceState({}, '', window.location.pathname)
      } else if (type || searchType) {
        console.log('❓ Unknown link type detected:', type || searchType)
        // Clear password reset mode for unknown types
        sessionStorage.removeItem('passwordResetMode')
        // Clear the URL parameters for unknown types
        window.history.replaceState({}, '', window.location.pathname)
      } else {
        console.log('🏠 Normal app load - no special URL parameters')
        // Check if we have stored password reset mode but no current URL params
        const storedMode = sessionStorage.getItem('passwordResetMode')
        if (storedMode && !window.location.hash && !window.location.search) {
          console.log('🧹 Clearing orphaned password reset mode')
          sessionStorage.removeItem('passwordResetMode')
        }
      }
    }
    
    checkForPasswordReset()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (showResetPassword) {
      await handlePasswordUpdate()
      return
    }
    
    if (showForgotPassword) {
      await handleForgotPassword()
      return
    }
    
    // Client-side validation for sign in/sign up
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }
    
    setLoading(true)
    
    try {
      if (isLogin) {
        await signIn(email, password)
      } else {
        await signUp(email, password)
        // Switch to login form and show success message (auto transition)
        setIsLogin(true)
        setShowSignupSuccess(true)
        setSuccess('Account created successfully! Please check your email for a confirmation link, then sign in with your credentials below.')
      }
    } catch (error) {
      console.error('Auth error:', error)
      setError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  // Clear tooltips when form context changes
  const clearTooltips = React.useCallback(() => {
    // Clear any browser validation tooltips by removing focus
    const activeElement = document.activeElement as HTMLElement
    if (activeElement && activeElement.blur) {
      activeElement.blur()
    }
    
    // Clear any lingering browser validation states
    const authForm = document.querySelector('form')
    if (authForm) {
      // Reset form validation state
      const inputs = authForm.querySelectorAll('input')
      inputs.forEach(input => {
        input.setCustomValidity('')
        if (input.blur) input.blur()
      })
    }
  }, [])

  // Clear error and tooltips when switching between login/signup/forgot password/reset password
  React.useEffect(() => {
    setError(null)
    // Clear any persistent tooltips
    clearTooltips()
    
    // Clear confirm password when switching modes (but not during signup success)
    if (!showSignupSuccess) {
      setConfirmSignUpPassword('')
    }
    
    // Handle success message preservation - don't clear if showing signup success
    if (!showSignupSuccess) {
      setSuccess(null)
    }
    
    // Reset signup success flag when manually switching away from login
    if (showSignupSuccess && (!isLogin || showForgotPassword || showResetPassword)) {
      setShowSignupSuccess(false)
    }
  }, [isLogin, showForgotPassword, showResetPassword, showSignupSuccess, clearTooltips])

  // Clear error and success when user starts typing
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    if (error) setError(null)
    if (success && !showSignupSuccess) setSuccess(null)
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    if (error) setError(null)
    if (success && !showSignupSuccess) setSuccess(null)
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmSignUpPassword(e.target.value)
    if (error) setError(null)
    if (success && !showSignupSuccess) setSuccess(null)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Sword className="h-8 w-8 text-purple-600 mr-2" />
            <h1 className="text-2xl font-bold">SessionForge</h1>
          </div>
          <CardTitle>
            {showResetPassword 
              ? 'Set New Password' 
              : showForgotPassword 
                ? 'Reset Password' 
                : isLogin 
                  ? 'Welcome Back' 
                  : 'Create Account'
            }
          </CardTitle>
          <CardDescription>
            {showResetPassword
              ? 'Enter your new password below'
              : showForgotPassword 
                ? 'Enter your email to receive password reset instructions'
                : isLogin 
                  ? 'Sign in to your campaign portal' 
                  : 'Join your D&D campaign'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                {success}
              </div>
            )}
            {showResetPassword ? (
              <>
                <div>
                  <Input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={handleEmailChange}
                    required
                  />
                </div>
                {!showForgotPassword && (
                  <>
                    <div>
                      <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={handlePasswordChange}
                        required
                        minLength={6}
                      />
                    </div>
                    {!isLogin && (
                      <div>
                        <Input
                          type="password"
                          placeholder="Confirm Password"
                          value={confirmSignUpPassword}
                          onChange={handleConfirmPasswordChange}
                          required
                          minLength={6}
                        />
                      </div>
                    )}
                  </>
                )}
              </>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading 
                ? 'Loading...' 
                : showResetPassword
                  ? 'Update Password'
                  : showForgotPassword 
                    ? 'Send Reset Email'
                    : isLogin 
                      ? 'Sign In' 
                      : 'Sign Up'
              }
            </Button>
          </form>
          <div className="mt-4 text-center space-y-2">
            {showResetPassword ? (
              <div className="text-sm text-purple-300">
                Enter your new password to complete the reset process
              </div>
            ) : !showForgotPassword ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-purple-600 hover:underline block w-full"
                >
                  {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
                </button>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-purple-500 hover:underline"
                  >
                    Forgot your password?
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="text-sm text-purple-600 hover:underline"
              >
                Back to sign in
              </button>
            )}
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
  const [signingOut, setSigningOut] = React.useState(false)

  // Track campaign ID separately to avoid navigation on property updates
  const [lastCampaignId, setLastCampaignId] = React.useState<string | null>(null)

  // Handle sign out with proper error handling
  const handleSignOut = async () => {
    if (signingOut) return // Prevent multiple clicks
    
    setSigningOut(true)
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
      // If sign out fails, try to clear local state anyway
      // This helps with the session state issue
      window.location.reload()
    } finally {
      setSigningOut(false)
    }
  }

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
              <Button variant="outline" onClick={handleSignOut} size="sm" disabled={signingOut}>
                {signingOut ? 'Signing Out...' : 'Sign Out'}
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
  const [isPasswordResetMode, setIsPasswordResetMode] = React.useState(false)

  React.useEffect(() => {
    initialize()
  }, [initialize])

  // Check for password reset mode on mount and URL changes
  React.useEffect(() => {
    const checkPasswordResetMode = () => {
      // Debug logging for Layout component
      console.log('Layout: Checking password reset mode')
      console.log('Layout URL:', window.location.href)
      
      // Check URL hash for recovery type (password reset only)
      const hash = window.location.hash
      const params = new URLSearchParams(hash.substring(1))
      const type = params.get('type')
      
      // Also check search params as fallback
      const searchParams = new URLSearchParams(window.location.search)
      const searchType = searchParams.get('type')
      
      // Also check session storage
      const storedResetMode = sessionStorage.getItem('passwordResetMode') === 'true'
      
      console.log('Layout: type=', type, 'searchType=', searchType, 'storedResetMode=', storedResetMode)
      
      // Only trigger password reset mode for actual recovery links
      // DO NOT trigger for error URLs or expired links
      const hasError = params.get('error') || searchParams.get('error')
      
      if (hasError) {
        console.log('❌ Layout: Error in URL, clearing password reset mode:', hasError)
        setIsPasswordResetMode(false)
        sessionStorage.removeItem('passwordResetMode')
      } else if ((type === 'recovery' || searchType === 'recovery') || storedResetMode) {
        console.log('🔐 Layout: Password reset mode activated')
        setIsPasswordResetMode(true)
        sessionStorage.setItem('passwordResetMode', 'true')
      } else {
        console.log('✅ Layout: Normal auth flow (not password reset)')
        setIsPasswordResetMode(false)
        sessionStorage.removeItem('passwordResetMode')
        
        // If this is an email confirmation link, just log it
        if (type === 'signup' || searchType === 'signup') {
          console.log('✉️ Layout: Email confirmation link detected - proceeding with normal auth flow')
        }
      }
    }

    checkPasswordResetMode()
    
    // Listen for URL changes
    const handleLocationChange = () => checkPasswordResetMode()
    window.addEventListener('popstate', handleLocationChange)
    
    return () => window.removeEventListener('popstate', handleLocationChange)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  // Show AuthForm if no user OR if in password reset mode (even with user)
  return (user && !isPasswordResetMode) ? <Dashboard /> : <AuthForm />
}