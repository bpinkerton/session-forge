import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Calendar, Clock, Edit, Trash2, Plus, Check, X, Minus } from 'lucide-react'
import { useSessionStore, fetchSessionWithPolls } from '@/stores/session'
import { useAuthStore } from '@/stores/auth'
import type { Session, SessionWithPolls, SessionPoll } from '@/types'

interface SessionDetailProps {
  sessionId: string
  onEdit: (session: Session) => void
  onBack: () => void
}

export const SessionDetail: React.FC<SessionDetailProps> = ({ sessionId, onEdit, onBack }) => {
  const { user } = useAuthStore()
  const { createPoll, deletePoll, vote, loading } = useSessionStore()
  
  const [session, setSession] = React.useState<SessionWithPolls | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [newPollDate, setNewPollDate] = React.useState('')

  React.useEffect(() => {
    const loadSession = async () => {
      setIsLoading(true)
      const sessionData = await fetchSessionWithPolls(sessionId)
      setSession(sessionData)
      setIsLoading(false)
    }
    loadSession()
  }, [sessionId])

  const handleCreatePoll = async () => {
    if (!newPollDate || !session) return
    
    const poll = await createPoll(session.id, newPollDate)
    if (poll) {
      // Refresh session data
      const updatedSession = await fetchSessionWithPolls(sessionId)
      setSession(updatedSession)
      setNewPollDate('')
    }
  }

  const handleDeletePoll = async (pollId: string) => {
    await deletePoll(pollId)
    // Refresh session data
    const updatedSession = await fetchSessionWithPolls(sessionId)
    setSession(updatedSession)
  }

  const handleVote = async (pollId: string, availability: 'available' | 'unavailable' | 'maybe') => {
    await vote(pollId, availability)
    // Refresh session data
    const updatedSession = await fetchSessionWithPolls(sessionId)
    setSession(updatedSession)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }


  const getCurrentVote = (poll: SessionPoll & { votes: { user_id: string; availability: string }[] }) => {
    return poll.votes?.find(vote => vote.user_id === user?.id)?.availability
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!session) {
    return (
      <Card className="bg-app-card">
        <CardContent className="p-8 text-center">
          <p className="text-purple-200">Session not found</p>
          <Button onClick={onBack} className="mt-4">
            Back to Sessions
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="min-w-0 flex-1">
          <Button variant="outline" onClick={onBack} className="mb-4">
            ← Back to Sessions
          </Button>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{session.title}</h1>
          <p className="text-purple-200 mt-2">{session.description || 'No description'}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button onClick={() => onEdit(session)} variant="outline" size="sm">
            <Edit className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Session Info */}
        <Card className="bg-app-card">
          <CardHeader>
            <CardTitle className="text-white">Session Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-400" />
              <span className="text-purple-200">
                Duration: {Math.floor(session.duration_minutes / 60)}h {session.duration_minutes % 60}m
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-400" />
              <span className="text-purple-200">
                {session.scheduled_date ? formatDate(session.scheduled_date) : 'Not scheduled'}
              </span>
            </div>
            <div>
              <Badge className={
                session.status === 'planning' ? 'bg-yellow-100 text-yellow-800' :
                session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                session.status === 'completed' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }>
                {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Date Polling */}
        <Card className="bg-app-card">
          <CardHeader>
            <CardTitle className="text-white">Date Polling</CardTitle>
            <CardDescription className="text-purple-200">
              Propose and vote on session dates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="datetime-local"
                value={newPollDate}
                onChange={(e) => setNewPollDate(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleCreatePoll} disabled={!newPollDate || loading}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              {session.polls?.map((poll) => (
                <div key={poll.id} className="border border-purple-500/20 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-white font-medium">
                        {formatDate(poll.proposed_date)}
                      </p>
                      <p className="text-xs text-purple-300">
                        Proposed by {poll.proposed_by === user?.id ? 'You' : 'Someone'}
                      </p>
                    </div>
                    {poll.proposed_by === user?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePoll(poll.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    {(['available', 'maybe', 'unavailable'] as const).map((availability) => {
                      const isSelected = getCurrentVote(poll as SessionPoll & { votes: { user_id: string; availability: string }[] }) === availability
                      return (
                        <Button
                          key={availability}
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleVote(poll.id, availability)}
                          className="flex items-center justify-center gap-1 min-h-[44px] sm:min-h-0"
                        >
                          {availability === 'available' && <Check className="h-3 w-3" />}
                          {availability === 'maybe' && <Minus className="h-3 w-3" />}
                          {availability === 'unavailable' && <X className="h-3 w-3" />}
                          <span className="hidden sm:inline">{availability.charAt(0).toUpperCase() + availability.slice(1)}</span>
                          <span className="sm:hidden">{availability === 'available' ? 'Yes' : availability === 'maybe' ? 'Maybe' : 'No'}</span>
                        </Button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session Notes */}
      <Card className="bg-app-card">
        <CardHeader>
          <CardTitle className="text-white">Session Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {session.session_notes ? (
            <div className="whitespace-pre-wrap text-purple-100">
              {session.session_notes}
            </div>
          ) : (
            <p className="text-purple-300 italic">No notes yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}