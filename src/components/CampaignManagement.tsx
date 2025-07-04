import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Users, UserPlus, Trash2, Edit } from 'lucide-react'
import { useCampaignStore } from '@/stores/campaign'
import { InviteDialog } from './InviteDialog'
import { getDisplayStatus, CAMPAIGN_STATUS_OPTIONS } from '@/constants/campaignStatus'
import type { Campaign } from '@/types'

interface CampaignManagementProps {
  onBack: () => void
}

export const CampaignManagement: React.FC<CampaignManagementProps> = ({ onBack }) => {
  const { currentCampaign, updateCampaign, userRole, deactivateCampaign, removeMember } = useCampaignStore()
  const [inviteDialogOpen, setInviteDialogOpen] = React.useState(false)
  const [editingField, setEditingField] = React.useState<string | null>(null)
  const [tempValue, setTempValue] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [removingMemberId, setRemovingMemberId] = React.useState<string | null>(null)
  const [showRemoveConfirm, setShowRemoveConfirm] = React.useState(false)
  const [memberToRemove, setMemberToRemove] = React.useState<{ userId: string, role: string } | null>(null)

  // Create a ref to track if we're preventing navigation
  const preventingNavigationRef = React.useRef(false)

  // Override the original onBack to intercept it
  React.useEffect(() => {
    const originalHandleBackToHome = (window as any).handleBackToHome
    if (originalHandleBackToHome) {
      (window as any).handleBackToHome = (...args: any[]) => {
        console.log('Intercepted handleBackToHome call, editingField:', editingField, 'preventing:', preventingNavigationRef.current)
        if (editingField || preventingNavigationRef.current) {
          console.log('Blocked navigation - currently editing')
          return
        }
        return originalHandleBackToHome.apply(this, args)
      }
      
      return () => {
        (window as any).handleBackToHome = originalHandleBackToHome
      }
    }
  }, [editingField])

  // Prevent navigation when editing
  const handleBackClick = () => {
    console.log('Back button clicked, editingField:', editingField, 'preventing:', preventingNavigationRef.current)
    if (editingField || preventingNavigationRef.current) {
      console.log('Preventing navigation - currently editing:', editingField)
      return
    }
    onBack()
  }


  const startEditing = (field: string, currentValue: string) => {
    if (userRole !== 'dm') return
    setEditingField(field)
    setTempValue(currentValue)
  }

  const saveField = async (field: string) => {
    if (!currentCampaign || !tempValue.trim() || saving) return
    
    console.log('Saving field:', field, 'value:', tempValue.trim())
    
    // Set preventing flag before any async operations
    preventingNavigationRef.current = true
    setSaving(true)
    
    try {
      await updateCampaign(currentCampaign.id, { [field]: tempValue.trim() })
      console.log('Field saved successfully:', field)
      setEditingField(null)
      setTempValue('')
    } catch (error) {
      console.error('Failed to update campaign:', error)
      alert('Failed to update campaign')
    } finally {
      setSaving(false)
      // Keep preventing flag for a bit longer to handle any post-save rerenders
      setTimeout(() => {
        preventingNavigationRef.current = false
        console.log('Navigation prevention cleared')
      }, 200)
    }
  }

  const cancelEdit = () => {
    setEditingField(null)
    setTempValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent, field: string) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveField(field)
    } else if (e.key === 'Escape') {
      cancelEdit()
    }
  }

  const handleBlur = (field: string, e?: React.FocusEvent) => {
    // Check if the blur is caused by clicking on another focusable element
    const relatedTarget = e?.relatedTarget as HTMLElement
    console.log('Blur event:', { field, relatedTarget: relatedTarget?.tagName, className: relatedTarget?.className })
    
    // If clicking on a button or other interactive element, don't auto-save immediately
    if (relatedTarget && (
      relatedTarget.tagName === 'BUTTON' || 
      relatedTarget.closest('button') ||
      relatedTarget.hasAttribute('data-interactive')
    )) {
      console.log('Skipping auto-save due to interactive element click')
      return
    }
    
    // Auto-save immediately when clicking away
    console.log('Auto-saving field:', field)
    saveField(field)
  }

  // Use ref to detect clicks outside
  const editContainerRef = React.useRef<HTMLDivElement>(null)

  // Handle clicks outside edit fields
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editingField && editContainerRef.current && !editContainerRef.current.contains(event.target as Node)) {
        console.log('Clicked outside edit field, auto-saving:', editingField)
        
        // Set flag to prevent navigation
        preventingNavigationRef.current = true
        
        // Prevent the event from bubbling
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        
        // Save the field
        saveField(editingField)
        
        // Reset flag after a short delay
        setTimeout(() => {
          preventingNavigationRef.current = false
        }, 100)
        
        return false
      }
    }

    if (editingField) {
      // Add listener with capture to intercept early
      document.addEventListener('mousedown', handleClickOutside, true)
      document.addEventListener('click', handleClickOutside, true)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside, true)
        document.removeEventListener('click', handleClickOutside, true)
      }
    }
  }, [editingField, saveField])

  // Handle container clicks to auto-save when clicking outside
  const handleContainerClick = (e: React.MouseEvent) => {
    if (editingField && e.target === e.currentTarget) {
      console.log('Container clicked while editing, auto-saving:', editingField)
      e.preventDefault()
      e.stopPropagation()
      saveField(editingField)
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

  // Inline edit component
  const InlineEditField = ({ 
    field, 
    label, 
    value, 
    placeholder, 
    multiline = false 
  }: { 
    field: string
    label: string
    value: string
    placeholder?: string
    multiline?: boolean
  }) => {
    const isEditing = editingField === field
    const canEdit = userRole === 'dm'
    
    console.log(`Field: ${field}, userRole: ${userRole}, canEdit: ${canEdit}, isEditing: ${isEditing}`)

    if (isEditing) {
      return (
        <div ref={editContainerRef} onClick={(e) => e.stopPropagation()}>
          <label className="text-sm font-medium text-purple-300 block mb-1">{label}</label>
          <div className="relative group">
            {multiline ? (
              <Textarea
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, field)}
                onBlur={(e) => handleBlur(field, e)}
                placeholder={placeholder}
                rows={3}
                className="w-full bg-transparent border-purple-500/30 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 text-white placeholder:text-purple-400 resize-none"
                autoFocus
              />
            ) : (
              <Input
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, field)}
                onBlur={(e) => handleBlur(field, e)}
                placeholder={placeholder}
                className="bg-transparent border-purple-500/30 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 text-white placeholder:text-purple-400"
                autoFocus
              />
            )}
          </div>
          
          {/* Keyboard hints */}
          <p className="text-xs text-purple-400 mt-1">
            Press <kbd className="px-1 bg-purple-900/50 rounded">Enter</kbd> to save, <kbd className="px-1 bg-purple-900/50 rounded">Esc</kbd> to cancel
          </p>
        </div>
      )
    }

    return (
      <div>
        <label className="text-sm font-medium text-purple-300 block mb-1">{label}</label>
        <div
          className={`group ${canEdit ? 'cursor-pointer' : 'cursor-default'} ${
            canEdit ? 'hover:bg-purple-900/20 hover:border-purple-400/30' : ''
          } p-2 rounded border border-transparent transition-colors`}
          onClick={() => {
            console.log(`Clicked field: ${field}, canEdit: ${canEdit}`)
            canEdit && startEditing(field, value)
          }}
        >
          <div className="flex items-center justify-between">
            <p className={`${value ? 'text-white' : 'text-purple-400 italic'}`}>
              {value || placeholder || `No ${label.toLowerCase()} specified`}
            </p>
            {canEdit && (
              <Edit className="h-4 w-4 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </div>
      </div>
    )
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
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
      onClick={handleContainerClick}
    >
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={handleBackClick}
              className="text-purple-300 hover:text-purple-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">Campaign Management</h1>
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
          <Card className="bg-black/20 backdrop-blur-sm border-purple-500/20">
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
                            <span className={`inline-flex px-3 py-1 rounded text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity ${getDisplayStatus(currentCampaign.status).color}`}>
                              {getDisplayStatus(currentCampaign.status).label}
                            </span>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-black/20 backdrop-blur-sm border-purple-500/20 text-white min-w-[140px]">
                          {CAMPAIGN_STATUS_OPTIONS.map((option) => (
                            <SelectItem 
                              key={option.value}
                              value={option.value} 
                              className="focus:bg-purple-900/30 focus:text-white cursor-pointer"
                            >
                              {option.label}
                            </SelectItem>
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
              />

              <InlineEditField
                field="description"
                label="Campaign Description"
                value={currentCampaign.description || ''}
                placeholder="Brief description of your campaign..."
                multiline={true}
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
          <Card className="bg-black/20 backdrop-blur-sm border-purple-500/20">
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
              {currentCampaign.members && currentCampaign.members.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentCampaign.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 bg-purple-900/20 rounded-lg border border-purple-500/10">
                      <div>
                        <p className="text-white font-medium">User {member.user_id.slice(0, 8)}...</p>
                        <Badge variant="outline" className="text-purple-300 border-purple-300 mt-1">
                          {member.role}
                        </Badge>
                      </div>
                      {userRole === 'dm' && member.role !== 'dm' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemoveMemberClick(member.user_id, member.role)}
                          disabled={removingMemberId === member.user_id}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-purple-400 mx-auto mb-3" />
                  <p className="text-purple-300 mb-2">No party members yet</p>
                  <p className="text-purple-400 text-sm">Invite players to join your campaign</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <InviteDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
      />

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center">
                <Trash2 className="h-5 w-5 mr-2" />
                Deactivate Campaign
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Are you sure you want to deactivate <strong>"{currentCampaign?.name}"</strong>?
              </p>
              <p className="text-sm text-gray-600">
                This will hide the campaign and deactivate all invitations, but you can restore it later if needed.
              </p>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteCampaign}
                  disabled={deleting}
                >
                  {deleting ? 'Deactivating...' : 'Deactivate Campaign'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Remove Member Confirmation Dialog */}
      {showRemoveConfirm && memberToRemove && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center">
                <Trash2 className="h-5 w-5 mr-2" />
                Remove Player
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Are you sure you want to remove this <strong>{memberToRemove.role}</strong> from the campaign?
              </p>
              <p className="text-sm text-gray-600">
                This will remove their access to the campaign. They can be re-invited if needed.
              </p>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRemoveConfirm(false)
                    setMemberToRemove(null)
                  }}
                  disabled={removingMemberId === memberToRemove.userId}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleRemoveMember}
                  disabled={removingMemberId === memberToRemove.userId}
                >
                  {removingMemberId === memberToRemove.userId ? 'Removing...' : 'Remove Player'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}