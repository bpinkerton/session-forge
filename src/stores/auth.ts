import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  signIn: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  },

  signUp: async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    if (error) throw error
  },

  updatePassword: async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password: password
    })
    if (error) throw error
  },

  initialize: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    set({ user, loading: false })

    supabase.auth.onAuthStateChange((_, session) => {
      set({ user: session?.user ?? null, loading: false })
    })
  },
}))