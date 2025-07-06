import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { vi } from 'vitest'
import { AllTheProviders } from './test-providers'

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    signInWithOAuth: vi.fn(),
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
}

// Mock the Supabase module
vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseClient
}))


const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
export { mockSupabaseClient }

// Common test data
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

export const mockProfile = {
  user_id: 'test-user-id',
  display_name: 'Test User',
  about_me: 'This is a test user profile',
  profile_picture_url: 'https://example.com/profile.jpg',
  scheduling_preference: 'evenings',
  session_length_preference: '3-4 hours',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

export const mockCampaign = {
  id: 'campaign-1',
  name: 'Test Campaign',
  description: 'A test campaign',
  dm_user_id: 'test-user-id',
  status: 'active',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

// Helper function to wait for async operations
export const waitForAsyncOperations = () => 
  new Promise(resolve => setTimeout(resolve, 0))

// Helper to mock store states
export const mockAuthStore = {
  user: mockUser,
  isLoading: false,
  error: null,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  signInWithGoogle: vi.fn(),
  signInWithDiscord: vi.fn(),
  signInWithTwitch: vi.fn(),
  clearError: vi.fn(),
  initialize: vi.fn()
}

export const mockProfileStore = {
  profile: mockProfile,
  ttrpgSystems: [
    { id: 'dnd5e', name: 'D&D 5e', description: 'Dungeons & Dragons 5th Edition' }
  ],
  playStyles: [
    { id: 'roleplay', name: 'Roleplay Heavy', description: 'Focus on character development' }
  ],
  userTtrpgInterests: ['dnd5e'],
  userPlayStyles: ['roleplay'],
  connectedAccounts: [],
  isLoading: false,
  error: null,
  fetchProfile: vi.fn(),
  updateProfile: vi.fn(),
  toggleTtrpgInterest: vi.fn(),
  togglePlayStyle: vi.fn(),
  uploadProfilePicture: vi.fn(),
  fetchConnectedAccounts: vi.fn(),
  unlinkAccount: vi.fn(),
  updateProfilePicture: vi.fn()
}

export const mockCampaignStore = {
  campaigns: [mockCampaign],
  currentCampaign: mockCampaign,
  members: [],
  isLoading: false,
  error: null,
  fetchCampaigns: vi.fn(),
  fetchCampaignById: vi.fn(),
  createCampaign: vi.fn(),
  updateCampaign: vi.fn(),
  deleteCampaign: vi.fn(),
  addMember: vi.fn(),
  removeMember: vi.fn(),
  fetchCampaignMembers: vi.fn(),
  clearError: vi.fn()
}