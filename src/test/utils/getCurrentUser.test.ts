import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCurrentUser } from '@/utils/getCurrentUser'
import { useAuthStore } from '@/stores/auth'

// Mock the auth store
vi.mock('@/stores/auth', () => ({
  useAuthStore: {
    getState: vi.fn()
  }
}))

describe('getCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return user when authenticated', () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }

    vi.mocked(useAuthStore.getState).mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: null
    })

    const result = getCurrentUser()
    expect(result).toEqual(mockUser)
  })

  it('should return null when not authenticated', () => {
    vi.mocked(useAuthStore.getState).mockReturnValue({
      user: null,
      isLoading: false,
      error: null
    })

    const result = getCurrentUser()
    expect(result).toBeNull()
  })

  it('should return null when user is undefined', () => {
    vi.mocked(useAuthStore.getState).mockReturnValue({
      user: undefined,
      isLoading: false,
      error: null
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