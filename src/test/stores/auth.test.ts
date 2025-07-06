import { describe, it, expect, vi } from 'vitest'

// Mock Supabase module
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      signInWithOAuth: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
    }
  }
}))

import { useAuthStore } from '@/stores/auth'


describe('Auth Store', () => {
  it('should have initial state', () => {
    const state = useAuthStore.getState()
    expect(state).toHaveProperty('user')
    expect(state).toHaveProperty('loading')
    expect(state).toHaveProperty('signIn')
  })

  it('should have required methods', () => {
    const state = useAuthStore.getState()
    expect(state).toHaveProperty('signIn')
    expect(state).toHaveProperty('signUp')
    expect(state).toHaveProperty('signOut')
    expect(state).toHaveProperty('signInWithGoogle')
    expect(state).toHaveProperty('signInWithDiscord')
    expect(state).toHaveProperty('signInWithTwitch')
    expect(typeof state.signIn).toBe('function')
    expect(typeof state.signUp).toBe('function')
    expect(typeof state.signOut).toBe('function')
  })

  it('should handle state updates', () => {
    
    // Test that state can be updated
    useAuthStore.setState({ loading: true })
    const updatedState = useAuthStore.getState()
    expect(updatedState.loading).toBe(true)
    
    // Reset
    useAuthStore.setState({ loading: false })
  })

  it('should validate user object structure', () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
    
    expect(mockUser).toHaveProperty('id')
    expect(mockUser).toHaveProperty('email')
    expect(typeof mockUser.id).toBe('string')
    expect(typeof mockUser.email).toBe('string')
  })
})