import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Session, SessionPoll, SessionWithPolls } from '@/types'

interface SessionState {
  sessions: Session[]
  currentSession: SessionWithPolls | null
  loading: boolean
  error: string | null
  
  // Session actions
  fetchSessions: (campaignId: string) => Promise<void>
  createSession: (session: Partial<Session>) => Promise<Session | null>
  updateSession: (id: string, updates: Partial<Session>) => Promise<void>
  deleteSession: (id: string) => Promise<void>
  
  // Poll actions
  createPoll: (sessionId: string, proposedDate: string) => Promise<SessionPoll | null>
  deletePoll: (pollId: string) => Promise<void>
  
  // Vote actions
  vote: (pollId: string, availability: 'available' | 'unavailable' | 'maybe') => Promise<void>
  
  // Utility actions
  setCurrentSession: (session: SessionWithPolls | null) => void
  clearError: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  sessions: [],
  currentSession: null,
  loading: false,
  error: null,

  fetchSessions: async (campaignId: string) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ sessions: data || [], loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  createSession: async (session: Partial<Session>) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert(session)
        .select()
        .single()

      if (error) throw error
      
      // Add to local state
      set(state => ({
        sessions: [data, ...state.sessions],
        loading: false
      }))
      
      return data
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
      return null
    }
  },

  updateSession: async (id: string, updates: Partial<Session>) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Update local state
      set(state => ({
        sessions: state.sessions.map(session => 
          session.id === id ? { ...session, ...data } : session
        ),
        currentSession: state.currentSession?.id === id 
          ? { ...state.currentSession, ...data }
          : state.currentSession,
        loading: false
      }))
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  deleteSession: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Remove from local state
      set(state => ({
        sessions: state.sessions.filter(session => session.id !== id),
        currentSession: state.currentSession?.id === id ? null : state.currentSession,
        loading: false
      }))
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  createPoll: async (sessionId: string, proposedDate: string) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('session_polls')
        .insert({
          session_id: sessionId,
          proposed_date: proposedDate
        })
        .select()
        .single()

      if (error) throw error

      // Update current session if it matches
      set(state => ({
        currentSession: state.currentSession?.id === sessionId
          ? {
              ...state.currentSession,
              polls: [...state.currentSession.polls, data]
            }
          : state.currentSession,
        loading: false
      }))

      return data
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
      return null
    }
  },

  deletePoll: async (pollId: string) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('session_polls')
        .delete()
        .eq('id', pollId)

      if (error) throw error

      // Remove from current session
      set(state => ({
        currentSession: state.currentSession
          ? {
              ...state.currentSession,
              polls: state.currentSession.polls.filter(poll => poll.id !== pollId)
            }
          : null,
        loading: false
      }))
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  vote: async (pollId: string, availability: 'available' | 'unavailable' | 'maybe') => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('poll_votes')
        .upsert({
          poll_id: pollId,
          availability
        })

      if (error) throw error
      set({ loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  setCurrentSession: (session: SessionWithPolls | null) => {
    set({ currentSession: session })
  },

  clearError: () => {
    set({ error: null })
  }
}))

// Helper function to fetch session with polls and votes
export const fetchSessionWithPolls = async (sessionId: string): Promise<SessionWithPolls | null> => {
  try {
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError) throw sessionError

    const { data: polls, error: pollsError } = await supabase
      .from('session_polls')
      .select(`
        *,
        votes:poll_votes(*)
      `)
      .eq('session_id', sessionId)
      .order('proposed_date', { ascending: true })

    if (pollsError) throw pollsError

    return {
      ...session,
      polls: polls || []
    }
  } catch (error) {
    console.error('Error fetching session with polls:', error)
    return null
  }
}