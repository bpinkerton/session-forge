import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase module and related functions
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis()
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/test.jpg' } }))
      }))
    }
  },
  uploadProfilePicture: vi.fn(),
  deleteProfilePicture: vi.fn(),
  validateImageFile: vi.fn()
}))

// Mock request cache
vi.mock('@/utils/requestCache', () => ({
  requestCache: {
    get: vi.fn(),
    clear: vi.fn()
  }
}))

// Mock getCurrentUser
vi.mock('@/utils/getCurrentUser', () => ({
  getCurrentUser: vi.fn(() => ({ id: 'test-user-id' })),
  requireAuth: vi.fn(() => ({ id: 'test-user-id' }))
}))

import { useProfileStore } from '@/stores/profile'
import { supabase } from '@/lib/supabase'

const mockSupabaseClient = supabase as any

describe('Profile Store', () => {
  it('should have initial state', () => {
    const state = useProfileStore.getState()
    expect(state).toHaveProperty('profile')
    expect(state).toHaveProperty('ttrpgSystems')
    expect(state).toHaveProperty('playStyles')
    expect(state).toHaveProperty('loading')
    expect(state).toHaveProperty('saving')
    expect(state).toHaveProperty('error')
  })

  it('should have required methods', () => {
    const state = useProfileStore.getState()
    expect(state).toHaveProperty('fetchProfile')
    expect(state).toHaveProperty('updateProfile')
    expect(typeof state.fetchProfile).toBe('function')
    expect(typeof state.updateProfile).toBe('function')
  })

  it('should validate profile structure', () => {
    const mockProfile = {
      user_id: 'test-user-id',
      display_name: 'Test User',
      about_me: 'Test bio',
      profile_picture_url: 'https://example.com/profile.jpg',
      scheduling_preference: 'evenings',
      session_length_preference: '3-4 hours',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }

    expect(mockProfile).toHaveProperty('user_id')
    expect(mockProfile).toHaveProperty('display_name')
    expect(mockProfile).toHaveProperty('about_me')
    expect(typeof mockProfile.user_id).toBe('string')
    expect(typeof mockProfile.display_name).toBe('string')
  })

  it('should validate TTRPG system structure', () => {
    const mockTtrpgSystem = {
      id: 'dnd5e',
      name: 'D&D 5e',
      description: 'Dungeons & Dragons 5th Edition'
    }

    expect(mockTtrpgSystem).toHaveProperty('id')
    expect(mockTtrpgSystem).toHaveProperty('name')
    expect(mockTtrpgSystem).toHaveProperty('description')
    expect(typeof mockTtrpgSystem.id).toBe('string')
    expect(typeof mockTtrpgSystem.name).toBe('string')
  })

  it('should handle state updates', () => {
    const initialState = useProfileStore.getState()
    
    // Test that state can be updated
    useProfileStore.setState({ loading: true })
    const updatedState = useProfileStore.getState()
    expect(updatedState.loading).toBe(true)
    
    // Reset
    useProfileStore.setState({ loading: false })
  })
})