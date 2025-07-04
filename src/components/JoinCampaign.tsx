import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Sword, Users, Calendar, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useInvitationStore } from '@/stores/invitation'
import { useCampaignStore } from '@/stores/campaign'
import type { Campaign } from '@/types'

interface JoinCampaignProps {
  inviteCode?: string // Pre-filled from URL parameter
  onSuccess?: (campaign: Campaign) => void
  onCancel?: () => void
}

export const JoinCampaign: React.FC<JoinCampaignProps> = ({ 
  inviteCode: initialCode = '', 
  onSuccess,
  onCancel 
}) => {
  const { validateInviteCode, joinViaInviteCode, loading, error, clearError } = useInvitationStore()
  const { fetchUserCampaigns } = useCampaignStore()
  
  const [inviteCode, setInviteCode] = React.useState(initialCode.toUpperCase())
  const [validationResult, setValidationResult] = React.useState<{
    valid: boolean
    campaign?: Campaign
    error?: string
  } | null>(null)
  const [step, setStep] = React.useState<'input' | 'preview' | 'joining' | 'success'>('input')

  // Auto-validate if code is provided via URL
  React.useEffect(() => {
    if (initialCode) {
      handleValidate()
    }
  }, [initialCode])

  const handleValidate = async () => {
    if (!inviteCode.trim()) return
    
    clearError()
    const result = await validateInviteCode(inviteCode.trim())
    setValidationResult(result)
    
    if (result.valid && result.campaign) {
      setStep('preview')
    }
  }

  const handleJoin = async () => {
    if (!validationResult?.valid || !validationResult.campaign) return
    
    setStep('joining')
    const result = await joinViaInviteCode(inviteCode.trim())
    
    if (result.success && result.campaign) {
      setStep('success')
      // Refresh user's campaigns
      await fetchUserCampaigns()
      
      // Call success callback
      if (onSuccess) {
        onSuccess(result.campaign)
      }
    } else {
      setStep('preview')
    }
  }

  const handleCodeChange = (value: string) => {
    const upperCode = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12)
    setInviteCode(upperCode)
    setValidationResult(null)
    setStep('input')
    clearError()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inviteCode.trim()) {
      handleValidate()
    }
  }

  if (step === 'success') {
    return (
      <div className="max-w-md mx-auto">
        <Card className="bg-black/20 backdrop-blur-sm border-green-500/20">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-400" />
            </div>
            <CardTitle className="text-white">Welcome to the Party!</CardTitle>
            <CardDescription className="text-green-200">
              You've successfully joined {validationResult?.campaign?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-purple-200 mb-4">
              You can now access campaign sessions, view your characters, and participate in the adventure.
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              Continue to Campaign
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'joining') {
    return (
      <div className="max-w-md mx-auto">
        <Card className="bg-black/20 backdrop-blur-sm border-purple-500/20">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="h-12 w-12 text-purple-400 animate-spin" />
            </div>
            <CardTitle className="text-white">Joining Campaign...</CardTitle>
            <CardDescription className="text-purple-200">
              Please wait while we add you to the party
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (step === 'preview' && validationResult?.valid && validationResult.campaign) {
    const campaign = validationResult.campaign
    return (
      <div className="max-w-md mx-auto">
        <Card className="bg-black/20 backdrop-blur-sm border-purple-500/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Sword className="h-6 w-6 text-purple-400 mr-2" />
                <CardTitle className="text-white">Join Campaign</CardTitle>
              </div>
              <Badge className="bg-green-100 text-green-800">Valid Invitation</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-white">{campaign.name}</h3>
              {campaign.setting && (
                <Badge variant="outline" className="text-purple-300 border-purple-300">
                  {campaign.setting}
                </Badge>
              )}
              {campaign.description && (
                <p className="text-purple-200 text-sm">{campaign.description}</p>
              )}
            </div>

            <div className="flex items-center justify-center space-x-6 py-4 border-t border-purple-500/20">
              <div className="text-center">
                <Users className="h-5 w-5 text-purple-400 mx-auto mb-1" />
                <p className="text-sm text-purple-200">Join as Player</p>
              </div>
              <div className="text-center">
                <Calendar className="h-5 w-5 text-purple-400 mx-auto mb-1" />
                <p className="text-sm text-purple-200">Access Sessions</p>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleJoin} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Joining...' : 'Join Campaign'}
              </Button>
              
              {onCancel && (
                <Button 
                  variant="outline" 
                  onClick={onCancel}
                  className="w-full"
                >
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <Card className="bg-black/20 backdrop-blur-sm border-purple-500/20">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Sword className="h-8 w-8 text-purple-400 mr-2" />
            <CardTitle className="text-white">Join Campaign</CardTitle>
          </div>
          <CardDescription className="text-purple-200">
            Enter your invitation code to join a D&D campaign
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="invite-code" className="text-sm font-medium text-purple-200">
              Invitation Code
            </label>
            <Input
              id="invite-code"
              type="text"
              placeholder="ABC123XYZ789"
              value={inviteCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              onKeyPress={handleKeyPress}
              className="text-center text-lg font-mono tracking-wider"
              maxLength={12}
            />
            <p className="text-xs text-purple-300 text-center">
              Enter the 12-character code shared by your DM
            </p>
          </div>

          {(error || validationResult?.error) && (
            <div className="flex items-center space-x-2 p-3 bg-red-900/20 border border-red-500/20 rounded">
              <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-200">
                {error || validationResult?.error}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Button 
              onClick={handleValidate} 
              disabled={!inviteCode.trim() || loading}
              className="w-full"
            >
              {loading ? 'Validating...' : 'Validate Code'}
            </Button>
            
            {onCancel && (
              <Button 
                variant="outline" 
                onClick={onCancel}
                className="w-full"
              >
                Cancel
              </Button>
            )}
          </div>

          <div className="text-center pt-4 border-t border-purple-500/20">
            <p className="text-sm text-purple-300">
              Don't have an invitation code?{' '}
              <button className="text-purple-200 hover:underline">
                Contact your DM
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}