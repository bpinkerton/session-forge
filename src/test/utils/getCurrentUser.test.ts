import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase first to avoid environment variable issues
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null }))
    }
  }
}))

// Mock the auth store
vi.mock('@/stores/auth', () => ({
  useAuthStore: {
    getState: vi.fn()
  }
}))

import { getCurrentUser } from '@/utils/getCurrentUser'
import { useAuthStore } from '@/stores/auth'

describe('getCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return user when authenticated', () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated'
    }

    vi.mocked(useAuthStore.getState).mockReturnValue({
      user: mockUser,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn(),
      signInWithGoogle: vi.fn(),
      signInWithApple: vi.fn(),
      signInWithDiscord: vi.fn(),
      signInWithTwitch: vi.fn(),
      initialize: vi.fn()
    })

    const result = getCurrentUser()
    expect(result).toEqual(mockUser)
  })

  it('should return null when not authenticated', () => {
    vi.mocked(useAuthStore.getState).mockReturnValue({
      user: null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn(),
      signInWithGoogle: vi.fn(),
      signInWithApple: vi.fn(),
      signInWithDiscord: vi.fn(),
      signInWithTwitch: vi.fn(),
      initialize: vi.fn()
    })

    const result = getCurrentUser()
    expect(result).toBeNull()
  })

  it('should return null when user is undefined', () => {
    vi.mocked(useAuthStore.getState).mockReturnValue({
      user: null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn(),
      signInWithGoogle: vi.fn(),
      signInWithApple: vi.fn(),
      signInWithDiscord: vi.fn(),
      signInWithTwitch: vi.fn(),
      initialize: vi.fn()
    })

    const result = getCurrentUser()
    expect(result).toBeNull()
  })

  it('should handle store errors gracefully', () => {
    vi.mocked(useAuthStore.getState).mockImplementation(() => {
      throw new Error('Store error')
    })

    const result = getCurrentUser()
    expect(result).toBeNull()
  })
})