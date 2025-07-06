import { http, HttpResponse } from 'msw'

const SUPABASE_URL = 'https://rvuhpidukddvpoulwdkj.supabase.co'

export const profileHandlers = [
  // Get user profile
  http.get(`${SUPABASE_URL}/rest/v1/user_profiles`, () => {
    return HttpResponse.json([
      {
        user_id: 'test-user-id',
        display_name: 'Test User',
        about_me: 'This is a test user profile',
        profile_picture_url: 'https://example.com/profile.jpg',
        scheduling_preference: 'evenings',
        session_length_preference: '3-4 hours',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ])
  }),

  // Update user profile
  http.patch(`${SUPABASE_URL}/rest/v1/user_profiles`, () => {
    return HttpResponse.json([
      {
        user_id: 'test-user-id',
        display_name: 'Updated User',
        about_me: 'Updated about me',
        profile_picture_url: 'https://example.com/updated-profile.jpg',
        scheduling_preference: 'weekends',
        session_length_preference: '2-3 hours',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ])
  }),

  // Get TTRPG systems
  http.get(`${SUPABASE_URL}/rest/v1/ttrpg_systems`, () => {
    return HttpResponse.json([
      {
        id: 'dnd5e',
        name: 'D&D 5e',
        description: 'Dungeons & Dragons 5th Edition',
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'pathfinder2e',
        name: 'Pathfinder 2e',
        description: 'Pathfinder Second Edition',
        created_at: '2024-01-01T00:00:00Z'
      }
    ])
  }),

  // Get play styles
  http.get(`${SUPABASE_URL}/rest/v1/play_styles`, () => {
    return HttpResponse.json([
      {
        id: 'roleplay',
        name: 'Roleplay Heavy',
        description: 'Focus on character development and storytelling',
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'combat',
        name: 'Combat Heavy',
        description: 'Focus on tactical combat and strategy',
        created_at: '2024-01-01T00:00:00Z'
      }
    ])
  }),

  // Get user TTRPG interests
  http.get(`${SUPABASE_URL}/rest/v1/user_ttrpg_interests`, () => {
    return HttpResponse.json([
      {
        user_id: 'test-user-id',
        ttrpg_system_id: 'dnd5e',
        created_at: '2024-01-01T00:00:00Z'
      }
    ])
  }),

  // Get user play styles
  http.get(`${SUPABASE_URL}/rest/v1/user_play_styles`, () => {
    return HttpResponse.json([
      {
        user_id: 'test-user-id',
        play_style_id: 'roleplay',
        created_at: '2024-01-01T00:00:00Z'
      }
    ])
  }),

  // Add TTRPG interest
  http.post(`${SUPABASE_URL}/rest/v1/user_ttrpg_interests`, () => {
    return HttpResponse.json([
      {
        user_id: 'test-user-id',
        ttrpg_system_id: 'pathfinder2e',
        created_at: '2024-01-01T00:00:00Z'
      }
    ])
  }),

  // Remove TTRPG interest
  http.delete(`${SUPABASE_URL}/rest/v1/user_ttrpg_interests`, () => {
    return HttpResponse.json([])
  }),

  // Add play style
  http.post(`${SUPABASE_URL}/rest/v1/user_play_styles`, () => {
    return HttpResponse.json([
      {
        user_id: 'test-user-id',
        play_style_id: 'combat',
        created_at: '2024-01-01T00:00:00Z'
      }
    ])
  }),

  // Remove play style
  http.delete(`${SUPABASE_URL}/rest/v1/user_play_styles`, () => {
    return HttpResponse.json([])
  }),

  // Get OAuth identities
  http.get(`${SUPABASE_URL}/rest/v1/identities`, () => {
    return HttpResponse.json([
      {
        id: 'identity-1',
        user_id: 'test-user-id',
        provider: 'google',
        provider_id: 'google-123',
        identity_data: {
          email: 'test@gmail.com',
          name: 'Test User',
          picture: 'https://lh3.googleusercontent.com/test.jpg'
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ])
  }),

  // Unlink OAuth identity
  http.delete(`${SUPABASE_URL}/auth/v1/user/identities/*`, () => {
    return HttpResponse.json({})
  })
]