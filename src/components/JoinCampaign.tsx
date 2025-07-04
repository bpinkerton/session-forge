import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
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
      // Refresh user's campaigns
      await fetchUserCampaigns()
      
      // Call success callback immediately to close dialog and navigate
      if (onSuccess) {
        onSuccess(result.campaign)
      } else {
        // Fallback if no callback provided
        setStep('success')
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
          <CardHeader className="text-center">
            <CardTitle className="text-white text-xl">{campaign.name}</CardTitle>
            {campaign.setting && (
              <div className="text-sm text-purple-300 mt-1">
                {campaign.setting}
              </div>
            )}
            {campaign.description && (
              <CardDescription className="text-purple-200 mt-6">
                {campaign.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button 
                onClick={handleJoin} 
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Joining...' : 'Join Campaign'}
              </Button>
              
              {onCancel && (
                <Button 
                  variant="outline" 
                  onClick={onCancel}
                  className="flex-1"
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
          <CardTitle className="text-white">Join Campaign</CardTitle>
          <CardDescription className="text-purple-200">
            Enter your invitation code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          {(error || validationResult?.error) && (
            <div className="flex items-center space-x-2 p-3 bg-red-900/20 border border-red-500/20 rounded">
              <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-200">
                {error || validationResult?.error}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button 
              onClick={handleValidate} 
              disabled={!inviteCode.trim() || loading}
              className="flex-1"
            >
              {loading ? 'Checking...' : 'Continue'}
            </Button>
            
            {onCancel && (
              <Button 
                variant="outline" 
                onClick={onCancel}
                className="flex-1"
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