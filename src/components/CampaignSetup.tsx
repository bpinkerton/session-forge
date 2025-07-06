import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip } from '@/components/ui/tooltip'
import { Plus, Sword, Users, UserPlus, Calendar, Trophy, Settings } from 'lucide-react'
import { useCampaignStore } from '@/stores/campaign'
import { useAuthStore } from '@/stores/auth'
import { JoinCampaign } from './JoinCampaign'
import { getDisplayStatus } from '@/constants/campaignStatus'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import type { Campaign } from '@/types'

interface CampaignSetupProps {
  onCampaignSelected: (campaign: Campaign) => void
  onCampaignManage?: (campaign: Campaign) => void
}

const CreateCampaignForm = ({ onCancel, onSuccess }: { onCancel: () => void, onSuccess: (campaign: Campaign) => void }) => {
  const { user } = useAuthStore()
  const { createCampaign, loading } = useCampaignStore()
  
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    setting: '',
    status: 'planning' as Campaign['status'] // This maps to "Worldbuilding"
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const campaign = await createCampaign({
      ...formData,
      dm_user_id: user.id
    })

    if (campaign) {
      onSuccess(campaign)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create New Campaign</CardTitle>
        <CardDescription>
          Set up your D&D campaign to get started
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Campaign Name
            </label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter campaign name..."
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="setting" className="text-sm font-medium">
              Setting (Optional)
            </label>
            <Input
              id="setting"
              value={formData.setting}
              onChange={(e) => setFormData(prev => ({ ...prev, setting: e.target.value }))}
              placeholder="e.g., Curse of Strahd, Homebrew..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description (Optional)
            </label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of your campaign..."
              rows={3}
            />
          </div>


          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Campaign'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export const CampaignSetup: React.FC<CampaignSetupProps> = ({ onCampaignSelected, onCampaignManage }) => {
  const { campaigns, fetchUserCampaigns, loading } = useCampaignStore()
  const [showCreateForm, setShowCreateForm] = React.useState(false)
  const [showJoinForm, setShowJoinForm] = React.useState(false)


  React.useEffect(() => {
    // Always refresh campaigns when this component mounts to ensure removed campaigns are cleared
    fetchUserCampaigns()
  }, [fetchUserCampaigns])

  const handleCreateSuccess = (campaign: Campaign) => {
    setShowCreateForm(false)
    onCampaignSelected(campaign)
  }

  const handleJoinSuccess = (campaign: Campaign) => {
    setShowJoinForm(false)
    onCampaignSelected(campaign)
  }

  const handleManageCampaign = async (campaign: Campaign, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent the card click from firing
    if (onCampaignManage) {
      onCampaignManage(campaign)
    }
  }

  if (loading && campaigns.length === 0) {
    return (
      <LoadingSpinner variant="page" text="Loading campaigns..." />
    )
  }

  if (showCreateForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app-gradient">
        <CreateCampaignForm
          onCancel={() => setShowCreateForm(false)}
          onSuccess={handleCreateSuccess}
        />
      </div>
    )
  }

  if (showJoinForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app-gradient">
        <JoinCampaign
          onCancel={() => setShowJoinForm(false)}
          onSuccess={handleJoinSuccess}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-app-gradient">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Sword className="h-12 w-12 text-purple-400 mr-4" />
            <h1 className="text-4xl font-bold text-white">SessionForge</h1>
          </div>
          <p className="text-purple-200 text-lg">Choose a campaign to manage or create a new one</p>
        </div>

        {campaigns.length === 0 ? (
          <div className="max-w-md mx-auto">
            <Card className="bg-app-card">
              <CardContent className="p-8">
                <EmptyState
                  icon={Users}
                  title="No campaigns yet"
                  description="Create your first campaign or join an existing one to get started"
                  action={
                    <div className="space-y-3">
                      <Button onClick={() => setShowCreateForm(true)} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Campaign
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowJoinForm(true)}
                        className="w-full"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Join Existing Campaign
                      </Button>
                    </div>
                  }
                />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Your Campaigns</h2>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowJoinForm(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Join Campaign
                </Button>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Campaign
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign) => (
                <Card
                  key={campaign.id}
                  className="bg-app-card hover:border-purple-400/30 transition-colors cursor-pointer"
                  onClick={() => onCampaignSelected(campaign)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-white mb-1">{campaign.name}</CardTitle>
                        <div className="mb-2">
                          <Tooltip content={getDisplayStatus(campaign.status).description}>
                            <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getDisplayStatus(campaign.status).color}`}>
                              {getDisplayStatus(campaign.status).label}
                            </span>
                          </Tooltip>
                        </div>
                        {campaign.setting && (
                          <CardDescription className="text-purple-300">
                            {campaign.setting}
                          </CardDescription>
                        )}
                      </div>
                      {onCampaignManage && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleManageCampaign(campaign, e)}
                          className="text-purple-300 hover:text-purple-100 h-8 w-8 p-0 -mt-1"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {campaign.description && (
                      <p className="text-purple-200 text-sm mb-3 line-clamp-2">
                        {campaign.description}
                      </p>
                    )}
                    
                    {/* Session Info - Contextual based on campaign status */}
                    <div className="mb-3">
                      {campaign.status === 'planning' && (
                        <div className="flex items-center gap-2 text-sm text-orange-300">
                          <Sword className="h-4 w-4" />
                          <span>Building your world...</span>
                        </div>
                      )}
                      {campaign.status === 'active' && (
                        <div className="flex items-center gap-2 text-sm text-green-300">
                          <Calendar className="h-4 w-4" />
                          <span>Ready to schedule next session</span>
                        </div>
                      )}
                      {campaign.status === 'on_hold' && (
                        <div className="flex items-center gap-2 text-sm text-yellow-300">
                          <Users className="h-4 w-4" />
                          <span>Campaign paused</span>
                        </div>
                      )}
                      {campaign.status === 'completed' && (
                        <div className="flex items-center gap-2 text-sm text-purple-300">
                          <Trophy className="h-4 w-4" />
                          <span>Epic campaign completed!</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}