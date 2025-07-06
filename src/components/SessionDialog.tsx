import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSessionStore } from '@/stores/session'
import { useCampaignStore } from '@/stores/campaign'
import { useAuthStore } from '@/stores/auth'
import type { Session } from '@/types'

interface SessionDialogProps {
  session?: Session | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: (session: Session) => void
}

export const SessionDialog: React.FC<SessionDialogProps> = ({ 
  session, 
  open, 
  onOpenChange, 
  onSave 
}) => {
  const { user } = useAuthStore()
  const { currentCampaign } = useCampaignStore()
  const { createSession, updateSession, loading } = useSessionStore()

  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    duration_minutes: 240,
    status: 'planning' as Session['status']
  })

  React.useEffect(() => {
    if (session) {
      setFormData({
        title: session.title,
        description: session.description || '',
        duration_minutes: session.duration_minutes,
        status: session.status
      })
    } else {
      setFormData({
        title: '',
        description: '',
        duration_minutes: 240,
        status: 'planning'
      })
    }
  }, [session, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !currentCampaign) {
      console.error('Missing user or campaign - cannot create session')
      return
    }

    try {
      if (session) {
        // Update existing session
        await updateSession(session.id, formData)
        onSave?.(session)
      } else {
        // Create new session
        const newSession = await createSession({
          ...formData,
          campaign_id: currentCampaign.id,
          created_by: user.id
        })
        if (newSession) {
          onSave?.(newSession)
        }
      }
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving session:', error)
    }
  }

  const handleChange = (field: keyof typeof formData) => (
    value: string | number
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {session ? 'Edit Session' : 'Create New Session'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Session Title
            </label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('title')(e.target.value)}
              placeholder="Enter session title..."
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('description')(e.target.value)}
              placeholder="What's happening in this session?"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="duration" className="text-sm font-medium">
                Duration (hours)
              </label>
              <Select
                value={formData.duration_minutes.toString()}
                onValueChange={(value) => handleChange('duration_minutes')(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="180">3 hours</SelectItem>
                  <SelectItem value="240">4 hours</SelectItem>
                  <SelectItem value="300">5 hours</SelectItem>
                  <SelectItem value="360">6 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium">
                Status
              </label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange('status')(value as Session['status'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : session ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}