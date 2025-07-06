import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Plus } from 'lucide-react'
import { useSessionStore } from '@/stores/session'
import { useCampaignStore } from '@/stores/campaign'
import { EmptyState } from '@/components/ui/empty-state'
import type { Session } from '@/types'

interface SessionListProps {
  onCreateSession: () => void
  onSessionClick: (session: Session) => void
}

const SessionStatusBadge = ({ status }: { status: Session['status'] }) => {
  const variants = {
    planning: 'bg-yellow-100 text-yellow-800',
    scheduled: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  }
  
  return (
    <Badge className={variants[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

export const SessionList: React.FC<SessionListProps> = ({ onCreateSession, onSessionClick }) => {
  const { sessions, loading } = useSessionStore()
  const { currentCampaign } = useCampaignStore()

  React.useEffect(() => {
    if (currentCampaign) {
      useSessionStore.getState().fetchSessions(currentCampaign.id)
    }
  }, [currentCampaign])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not scheduled'
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDurationText = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (hours === 0) return `${remainingMinutes}m`
    if (remainingMinutes === 0) return `${hours}h`
    return `${hours}h ${remainingMinutes}m`
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Sessions</h2>
        <Button onClick={onCreateSession} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Session
        </Button>
      </div>

      {sessions.length === 0 ? (
        <Card className="bg-app-card">
          <CardContent className="p-8">
            <EmptyState
              icon={Calendar}
              title="No sessions yet"
              description="Create your first session to start planning your campaign"
              action={
                <Button onClick={onCreateSession}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Session
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <Card
              key={session.id}
              className="bg-app-card hover:border-purple-400/30 transition-colors cursor-pointer"
              onClick={() => onSessionClick(session)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-white text-lg">{session.title}</CardTitle>
                    <CardDescription className="text-purple-200">
                      {session.description || 'No description'}
                    </CardDescription>
                  </div>
                  <SessionStatusBadge status={session.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-purple-200">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(session.scheduled_date)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{getDurationText(session.duration_minutes)}</span>
                  </div>
                </div>
                
                {session.session_notes && (
                  <p className="text-sm text-purple-100 line-clamp-2">
                    {session.session_notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}