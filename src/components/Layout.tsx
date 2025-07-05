import React from 'react'
import { useAuthStore } from '@/stores/auth'
import { useCampaignStore } from '@/stores/campaign'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/dropdown'
import { CampaignSetup } from './CampaignSetup'
import { CampaignManagement } from './CampaignManagement'
import { SessionList } from './SessionList'
import { SessionDetail } from './SessionDetail'
import { SessionDialog } from './SessionDialog'
import { InviteDialog } from './InviteDialog'
import { JoinCampaign } from './JoinCampaign'
import { UserProfile } from './UserProfile'
import { Sword, Users, Calendar, Map, Trophy, UserPlus, Edit, User, ChevronDown, LogOut } from 'lucide-react'
import { getDisplayStatus } from '@/constants/campaignStatus'
import { useProfileStore } from '@/stores/profile'
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
  const { signIn, signUp, resetPassword, updatePassword, signInWithGoogle, signInWithApple, signInWithDiscord, signInWithTwitch } = useAuthStore()

  // Check for password reset mode on component mount
  React.useEffect(() => {
    const isPasswordResetMode = sessionStorage.getItem('passwordResetMode') === 'true'
    if (isPasswordResetMode) {
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
      // Check URL hash for recovery type (Supabase password reset)
      const hash = window.location.hash
      const params = new URLSearchParams(hash.substring(1))
      const type = params.get('type')
      
      // Also check URL search params as fallback
      const searchParams = new URLSearchParams(window.location.search)
      const searchType = searchParams.get('type')
      
      // Check for errors in URL (expired links, etc.)
      const hasError = params.get('error') || searchParams.get('error')
      const errorCode = params.get('error_code') || searchParams.get('error_code')
      
      if (hasError) {
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
        setShowResetPassword(true)
        setShowForgotPassword(false)
        setIsLogin(false)
        
        // Store that we're in password reset mode
        sessionStorage.setItem('passwordResetMode', 'true')
        
        // Clear the URL parameters
        window.history.replaceState({}, '', window.location.pathname)
      } else if (type === 'signup' || searchType === 'signup') {
        // This is an email confirmation link, not password reset
        // Clear any stored password reset mode
        sessionStorage.removeItem('passwordResetMode')
        // Just clear the URL parameters and let normal auth flow proceed
        window.history.replaceState({}, '', window.location.pathname)
      } else if (type === 'oauth' || searchType === 'oauth') {
        // This is an OAuth callback, let Supabase handle it
        // Clear any stored password reset mode
        sessionStorage.removeItem('passwordResetMode')
        // Clear the URL parameters after OAuth completes
        window.history.replaceState({}, '', window.location.pathname)
      } else if (type || searchType) {
        // Clear password reset mode for unknown types
        sessionStorage.removeItem('passwordResetMode')
        // Clear the URL parameters for unknown types
        window.history.replaceState({}, '', window.location.pathname)
      } else {
        // Check if we have stored password reset mode but no current URL params
        const storedMode = sessionStorage.getItem('passwordResetMode')
        if (storedMode && !window.location.hash && !window.location.search) {
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

  const handleOAuthSignIn = async (provider: 'google' | 'apple' | 'discord' | 'twitch') => {
    setLoading(true)
    setError(null)
    
    try {
      switch (provider) {
        case 'google':
          await signInWithGoogle()
          break
        case 'apple':
          await signInWithApple()
          break
        case 'discord':
          await signInWithDiscord()
          break
        case 'twitch':
          await signInWithTwitch()
          break
      }
    } catch (error) {
      console.error(`${provider} sign-in error:`, error)
      setError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-app-gradient">
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
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm mb-4">
              {success}
            </div>
          )}
          
          {/* OAuth Sign In Buttons - only show for login and signup, not for password reset flows */}
          {!showResetPassword && !showForgotPassword && (
            <div className="space-y-3">
              {/* Google */}
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-2 h-11"
                onClick={() => handleOAuthSignIn('google')}
                disabled={loading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {loading ? 'Signing in...' : 'Continue with Google'}
              </Button>


              {/* Discord */}
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-2 h-11"
                onClick={() => handleOAuthSignIn('discord')}
                disabled={loading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#5865F2">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0002 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9554 2.4189-2.1568 2.4189Z"/>
                </svg>
                {loading ? 'Signing in...' : 'Continue with Discord'}
              </Button>

              {/* Twitch */}
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-2 h-11"
                onClick={() => handleOAuthSignIn('twitch')}
                disabled={loading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#9146FF">
                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                </svg>
                {loading ? 'Signing in...' : 'Continue with Twitch'}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-purple-500/20" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-purple-400">Or continue with email</span>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className={`space-y-4 ${!showResetPassword && !showForgotPassword ? 'mt-4' : ''}`}>
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
  const { profile, fetchProfile } = useProfileStore()
  
  const [currentView, setCurrentView] = React.useState<'campaign-setup' | 'campaign-management' | 'home' | 'sessions' | 'characters' | 'campaign' | 'tavern' | 'profile'>('campaign-setup')
  const [selectedSessionId, setSelectedSessionId] = React.useState<string | null>(null)
  const [sessionDialogOpen, setSessionDialogOpen] = React.useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = React.useState(false)
  const [editingSession, setEditingSession] = React.useState<Session | null>(null)
  const [joinDialogOpen, setJoinDialogOpen] = React.useState(false)
  const [inviteCodeFromUrl, setInviteCodeFromUrl] = React.useState<string | null>(null)
  const [signingOut, setSigningOut] = React.useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = React.useState(false)

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

  // Handle OAuth return navigation
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const oauthReturn = urlParams.get('oauth_return')
    const provider = urlParams.get('provider')
    
    if (oauthReturn === 'accounts' && user) {
      setCurrentView('profile')
      // Store the tab preference for the UserProfile component
      sessionStorage.setItem('profileActiveTab', 'accounts')
      // Set flag to enable auto-linking for this OAuth return with specific provider
      sessionStorage.setItem('oauth_auto_link', 'true')
      if (provider) {
        sessionStorage.setItem('oauth_provider', provider)
      }
      // Clean up URL parameter
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [user])

  // Fetch user profile on mount
  React.useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user, fetchProfile])

  React.useEffect(() => {
    const currentCampaignId = currentCampaign?.id || null
    
    // Only navigate if the campaign ID actually changed, not just properties
    if (currentCampaignId !== lastCampaignId) {
      if (!currentCampaign) {
        setCurrentView('campaign-setup')
      } else {
        // Only navigate to home if we're not already in a campaign view
        if (currentView === 'campaign-setup') {
          setCurrentView('home')
        }
      }
      setLastCampaignId(currentCampaignId)
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

    if (currentView === 'profile') {
      return <UserProfile onBack={handleBackToHome} />
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
          <Card className="bg-app-card hover:border-purple-400/30 transition-colors cursor-pointer">
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

          <Card className="bg-app-card opacity-50">
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

          <Card className="bg-app-card opacity-50">
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

          <Card className="bg-app-card opacity-50">
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
    <div className="min-h-screen bg-app-gradient">
      <nav className="bg-black/20 backdrop-blur-sm border-b border-purple-500/20 relative z-30">
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
            <Dropdown
              isOpen={profileDropdownOpen}
              onClose={() => setProfileDropdownOpen(false)}
              trigger={
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-purple-500/20 transition-colors"
                >
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center overflow-hidden">
                    {profile?.profile_picture_url ? (
                      <img 
                        src={profile.profile_picture_url} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">{profile?.display_name || 'User'}</p>
                    <p className="text-xs text-purple-200">{user?.email}</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-purple-300 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              }
            >
              <DropdownItem
                onClick={() => {
                  setCurrentView('profile')
                  setProfileDropdownOpen(false)
                }}
              >
                <User className="h-4 w-4 mr-3" />
                View Profile
              </DropdownItem>
              
              <DropdownSeparator />
              
              <DropdownItem
                onClick={() => {
                  handleSignOut()
                  setProfileDropdownOpen(false)
                }}
                disabled={signingOut}
                variant="danger"
              >
                <LogOut className="h-4 w-4 mr-3" />
                {signingOut ? 'Signing Out...' : 'Sign Out'}
              </DropdownItem>
            </Dropdown>
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
        <DialogContent className="max-w-lg bg-app-gradient border-purple-500/20">
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
      // Check URL hash for recovery type (password reset only)
      const hash = window.location.hash
      const params = new URLSearchParams(hash.substring(1))
      const type = params.get('type')
      
      // Also check search params as fallback
      const searchParams = new URLSearchParams(window.location.search)
      const searchType = searchParams.get('type')
      
      // Also check session storage
      const storedResetMode = sessionStorage.getItem('passwordResetMode') === 'true'
      
      // Only trigger password reset mode for actual recovery links
      // DO NOT trigger for error URLs or expired links
      const hasError = params.get('error') || searchParams.get('error')
      
      if (hasError) {
        setIsPasswordResetMode(false)
        sessionStorage.removeItem('passwordResetMode')
      } else if ((type === 'recovery' || searchType === 'recovery') || storedResetMode) {
        setIsPasswordResetMode(true)
        sessionStorage.setItem('passwordResetMode', 'true')
      } else {
        setIsPasswordResetMode(false)
        sessionStorage.removeItem('passwordResetMode')
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
      <div className="min-h-screen flex items-center justify-center bg-app-gradient">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  // Show AuthForm if no user OR if in password reset mode (even with user)
  return (user && !isPasswordResetMode) ? <Dashboard /> : <AuthForm />
}