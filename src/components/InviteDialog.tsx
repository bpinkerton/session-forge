import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, Plus, Trash2, Users, Clock, Hash } from 'lucide-react'
import { useInvitationStore, generateInviteUrl, copyInviteUrl } from '@/stores/invitation'
import { useCampaignStore } from '@/stores/campaign'
import type { CampaignInvitation } from '@/types'

interface InviteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CreateInviteForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const { currentCampaign } = useCampaignStore()
  const { createInvitation, loading } = useInvitationStore()
  
  const [formData, setFormData] = React.useState({
    maxUses: '',
    expiresInDays: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentCampaign) return

    const options = {
      maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
      expiresInDays: formData.expiresInDays ? parseInt(formData.expiresInDays) : undefined
    }

    const invitation = await createInvitation(currentCampaign.id, options)
    if (invitation) {
      setFormData({ maxUses: '', expiresInDays: '' })
      onSuccess()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create New Invitation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="maxUses" className="text-sm font-medium">
                Max Uses (Optional)
              </label>
              <Select 
                value={formData.maxUses} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, maxUses: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unlimited" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unlimited</SelectItem>
                  <SelectItem value="1">1 use</SelectItem>
                  <SelectItem value="5">5 uses</SelectItem>
                  <SelectItem value="10">10 uses</SelectItem>
                  <SelectItem value="25">25 uses</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="expires" className="text-sm font-medium">
                Expires In (Optional)
              </label>
              <Select 
                value={formData.expiresInDays} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, expiresInDays: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Never" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Never</SelectItem>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating...' : 'Create Invitation'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

const InvitationCard = ({ invitation }: { invitation: CampaignInvitation }) => {
  const { deactivateInvitation } = useInvitationStore()
  const [copySuccess, setCopySuccess] = React.useState(false)

  const handleCopy = async (text: string, type: 'code' | 'url') => {
    try {
      if (type === 'url') {
        await copyInviteUrl(invitation.invite_code)
      } else {
        await navigator.clipboard.writeText(text)
      }
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleDeactivate = () => {
    deactivateInvitation(invitation.id)
  }

  const isExpired = invitation.expires_at && new Date(invitation.expires_at) < new Date()
  const isMaxUsesReached = invitation.max_uses !== null && invitation.current_uses >= invitation.max_uses
  const isInactive = !invitation.is_active || isExpired || isMaxUsesReached

  const getStatusBadge = () => {
    if (!invitation.is_active) return <Badge variant="destructive">Deactivated</Badge>
    if (isExpired) return <Badge variant="destructive">Expired</Badge>
    if (isMaxUsesReached) return <Badge variant="destructive">Max Uses Reached</Badge>
    return <Badge className="bg-green-100 text-green-800">Active</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card className={isInactive ? 'opacity-60' : ''}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-purple-400" />
              <code className="text-lg font-mono font-bold">{invitation.invite_code}</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(invitation.invite_code, 'code')}
                className="h-6 px-2"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            {getStatusBadge()}
          </div>
          
          {invitation.is_active && !isExpired && !isMaxUsesReached && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeactivate}
              className="text-red-400 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-400" />
            <span>
              {invitation.current_uses} / {invitation.max_uses || '∞'} uses
            </span>
          </div>
          
          {invitation.expires_at && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-400" />
              <span>Expires {formatDate(invitation.expires_at)}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Invite URL:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopy(generateInviteUrl(invitation.invite_code), 'url')}
              className="h-6 px-2"
            >
              <Copy className="h-3 w-3" />
              {copySuccess ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <code className="text-xs text-purple-300 block break-all">
            {generateInviteUrl(invitation.invite_code)}
          </code>
        </div>
      </CardContent>
    </Card>
  )
}

export const InviteDialog: React.FC<InviteDialogProps> = ({ open, onOpenChange }) => {
  const { currentCampaign } = useCampaignStore()
  const { invitations, fetchCampaignInvitations, loading } = useInvitationStore()

  React.useEffect(() => {
    if (open && currentCampaign) {
      fetchCampaignInvitations(currentCampaign.id)
    }
  }, [open, currentCampaign])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Campaign Invitations</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <CreateInviteForm onSuccess={() => {}} />
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Active Invitations</h3>
            
            {loading && invitations.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                Loading invitations...
              </div>
            ) : invitations.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No invitations created yet. Create one above to invite players!
              </div>
            ) : (
              <div className="space-y-3">
                {invitations.map((invitation) => (
                  <InvitationCard key={invitation.id} invitation={invitation} />
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}