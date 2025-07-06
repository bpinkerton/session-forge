import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip } from '@/components/ui/tooltip'
import { ArrowLeft, Users, UserPlus, Trash2 } from 'lucide-react'
import { useCampaignStore } from '@/stores/campaign'
import { InviteDialog } from './InviteDialog'
import { getDisplayStatus, CAMPAIGN_STATUS_OPTIONS } from '@/constants/campaignStatus'
import { InlineEditField } from '@/components/ui/inline-edit-field'
import { useInlineEdit } from '@/hooks/useInlineEdit'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { MemberCard } from '@/components/ui/member-card'
import type { Campaign } from '@/types'

interface CampaignManagementProps {
  onBack: () => void
}

export const CampaignManagement: React.FC<CampaignManagementProps> = ({ onBack }) => {
  const { currentCampaign, updateCampaign, userRole, deactivateCampaign, removeMember, getAllMembersWithDM } = useCampaignStore()
  const [inviteDialogOpen, setInviteDialogOpen] = React.useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [removingMemberId, setRemovingMemberId] = React.useState<string | null>(null)
  const [showRemoveConfirm, setShowRemoveConfirm] = React.useState(false)
  const [memberToRemove, setMemberToRemove] = React.useState<{ userId: string, role: string } | null>(null)

  // Create a ref to track if we're preventing navigation
  const preventingNavigationRef = React.useRef(false)

  // Inline editing hook
  const inlineEdit = useInlineEdit({
    onSave: async (field: string, value: string) => {
      if (!currentCampaign) return
      
      preventingNavigationRef.current = true
      
      try {
        await updateCampaign(currentCampaign.id, { [field]: value })
      } catch (error) {
        console.error('Failed to update campaign:', error)
        alert('Failed to update campaign')
      } finally {
        setTimeout(() => {
          preventingNavigationRef.current = false
        }, 200)
      }
    }
  })

  // Override the original onBack to intercept it
  React.useEffect(() => {
    const originalHandleBackToHome = (window as unknown as Record<string, unknown>).handleBackToHome as ((...args: unknown[]) => unknown) | undefined
    if (originalHandleBackToHome) {
      (window as unknown as Record<string, unknown>).handleBackToHome = (...args: unknown[]) => {
        if (inlineEdit.editingField || preventingNavigationRef.current) {
          return
        }
        return originalHandleBackToHome(...args)
      }
      
      return () => {
        (window as unknown as Record<string, unknown>).handleBackToHome = originalHandleBackToHome
      }
    }
  }, [inlineEdit.editingField])

  // Prevent navigation when editing
  const handleBackClick = () => {
    if (inlineEdit.editingField || preventingNavigationRef.current) {
      return
    }
    onBack()
  }


  // Handle container clicks to auto-save when clicking outside
  const handleContainerClick = (e: React.MouseEvent) => {
    if (inlineEdit.editingField && e.target === e.currentTarget) {
      e.preventDefault()
      e.stopPropagation()
      inlineEdit.saveField(inlineEdit.editingField, inlineEdit.tempValue)
    }
  }

  const handleDeleteCampaign = async () => {
    if (!currentCampaign) return
    
    setDeleting(true)
    try {
      const result = await deactivateCampaign(currentCampaign.id)
      if (result.success) {
        // Navigate back to campaign setup since this campaign is now deactivated
        onBack()
      } else {
        alert(result.error || 'Failed to deactivate campaign')
      }
    } catch (error) {
      console.error('Error deactivating campaign:', error)
      alert('An error occurred while deactivating the campaign')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleRemoveMemberClick = (userId: string, role: string) => {
    setMemberToRemove({ userId, role })
    setShowRemoveConfirm(true)
  }

  const handleRemoveMember = async () => {
    if (!currentCampaign || !memberToRemove) return
    
    setRemovingMemberId(memberToRemove.userId)
    try {
      await removeMember(currentCampaign.id, memberToRemove.userId)
      setShowRemoveConfirm(false)
      setMemberToRemove(null)
    } catch (error) {
      console.error('Error removing member:', error)
      alert('Failed to remove player from campaign')
    } finally {
      setRemovingMemberId(null)
    }
  }



  if (!currentCampaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-white">
          <p>No campaign selected</p>
          <Button onClick={onBack} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen bg-app-gradient"
      onClick={handleContainerClick}
    >
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Button
              variant="ghost"
              onClick={handleBackClick}
              className="text-purple-300 hover:text-purple-100 self-start"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Campaign Management</h1>
            </div>
          </div>
          
          {userRole === 'dm' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setInviteDialogOpen(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Players
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {/* Campaign Header Card */}
          <Card className="bg-app-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-2xl">Campaign Details</CardTitle>
                {userRole === 'dm' && (
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-purple-300">
                      Click any field to edit
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-red-400 hover:bg-red-500/10 hover:text-red-300 h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <CardDescription className="text-purple-300">
                Manage your campaign information and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <InlineEditField
                  field="name"
                  label="Campaign Name"
                  value={currentCampaign.name}
                  placeholder="Enter campaign name..."
                  canEdit={userRole === 'dm'}
                  editingField={inlineEdit.editingField}
                  tempValue={inlineEdit.tempValue}
                  onStartEditing={inlineEdit.startEditing}
                  onTempValueChange={inlineEdit.setTempValue}
                  onKeyDown={inlineEdit.handleKeyDown}
                  onBlur={inlineEdit.handleBlur}
                />

                <div>
                  <label className="text-sm font-medium text-purple-300 block mb-1">Campaign Status</label>
                  <div className="p-2">
                    {userRole === 'dm' ? (
                      <Select
                        value={currentCampaign.status}
                        onValueChange={(value) => updateCampaign(currentCampaign.id, { status: value as Campaign['status'] })}
                      >
                        <SelectTrigger className="bg-transparent border-none h-auto p-0 hover:bg-transparent focus:ring-0 focus:ring-offset-0 text-left justify-start w-fit">
                          <SelectValue asChild>
                            <Tooltip content={getDisplayStatus(currentCampaign.status).description}>
                              <span className={`inline-flex px-3 py-1 rounded text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity ${getDisplayStatus(currentCampaign.status).color}`}>
                                {getDisplayStatus(currentCampaign.status).label}
                              </span>
                            </Tooltip>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-app-card text-white min-w-[140px]">
                          {CAMPAIGN_STATUS_OPTIONS.map((option) => (
                            <Tooltip key={option.value} content={option.description}>
                              <SelectItem 
                                value={option.value} 
                                className="focus:bg-purple-900/30 focus:text-white cursor-pointer"
                              >
                                {option.label}
                              </SelectItem>
                            </Tooltip>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className={`inline-flex px-3 py-1 rounded text-sm font-medium ${getDisplayStatus(currentCampaign.status).color}`}>
                        {getDisplayStatus(currentCampaign.status).label}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <InlineEditField
                field="setting"
                label="Campaign Setting"
                value={currentCampaign.setting || ''}
                placeholder="e.g., Curse of Strahd, Homebrew..."
                canEdit={userRole === 'dm'}
                editingField={inlineEdit.editingField}
                tempValue={inlineEdit.tempValue}
                onStartEditing={inlineEdit.startEditing}
                onTempValueChange={inlineEdit.setTempValue}
                onKeyDown={inlineEdit.handleKeyDown}
                onBlur={inlineEdit.handleBlur}
              />

              <InlineEditField
                field="description"
                label="Campaign Description"
                value={currentCampaign.description || ''}
                placeholder="Brief description of your campaign..."
                isTextarea={true}
                textareaRows={3}
                canEdit={userRole === 'dm'}
                editingField={inlineEdit.editingField}
                tempValue={inlineEdit.tempValue}
                onStartEditing={inlineEdit.startEditing}
                onTempValueChange={inlineEdit.setTempValue}
                onKeyDown={inlineEdit.handleKeyDown}
                onBlur={inlineEdit.handleBlur}
              />

              <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-purple-500/20">
                <div>
                  <label className="text-sm font-medium text-purple-300 block mb-1">Campaign Created</label>
                  <p className="text-purple-200">
                    {new Date(currentCampaign.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-purple-300 block mb-1">Last Updated</label>
                  <p className="text-purple-200">
                    {new Date(currentCampaign.updated_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Party Members Card */}
          <Card className="bg-app-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Party Members
              </CardTitle>
              <CardDescription className="text-purple-300">
                Players in this campaign
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const allMembers = getAllMembersWithDM()
                return allMembers.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allMembers.map((member) => (
                      <MemberCard
                        key={member.id}
                        member={member}
                        currentUserRole={userRole}
                        onRemove={handleRemoveMemberClick}
                        isRemoving={removingMemberId === member.user_id}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Users}
                    title="No party members yet"
                    description="Invite players to join your campaign"
                    size="sm"
                  />
                )
              })()}
            </CardContent>
          </Card>
        </div>
      </div>

      <InviteDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
      />

      <ConfirmationDialog
        open={showDeleteConfirm}
        onConfirm={handleDeleteCampaign}
        onCancel={() => setShowDeleteConfirm(false)}
        title="Deactivate Campaign"
        description="Are you sure you want to deactivate this campaign?"
        confirmText="Deactivate Campaign"
        variant="destructive"
        loading={deleting}
      >
        <p>
          Campaign: <strong>"{currentCampaign?.name}"</strong>
        </p>
        <p className="text-sm text-purple-400">
          This will hide the campaign and deactivate all invitations, but you can restore it later if needed.
        </p>
      </ConfirmationDialog>

      <ConfirmationDialog
        open={showRemoveConfirm && !!memberToRemove}
        onConfirm={handleRemoveMember}
        onCancel={() => {
          setShowRemoveConfirm(false)
          setMemberToRemove(null)
        }}
        title="Remove Player"
        description="Are you sure you want to remove this player from the campaign?"
        confirmText="Remove Player"
        variant="destructive"
        loading={!!memberToRemove && removingMemberId === memberToRemove.userId}
      >
        {memberToRemove && (
          <>
            <p>
              Role: <strong>{memberToRemove.role}</strong>
            </p>
            <p className="text-sm text-purple-400">
              This will remove their access to the campaign. They can be re-invited if needed.
            </p>
          </>
        )}
      </ConfirmationDialog>
    </div>
  )
}