import { http, HttpResponse } from 'msw'

const SUPABASE_URL = 'https://rvuhpidukddvpoulwdkj.supabase.co'

export const authHandlers = [
  // Get current user
  http.get(`${SUPABASE_URL}/auth/v1/user`, () => {
    return HttpResponse.json({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        identities: []
      }
    })
  }),

  // Sign in with password
  http.post(`${SUPABASE_URL}/auth/v1/token`, () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token',
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    })
  }),

  // Sign up
  http.post(`${SUPABASE_URL}/auth/v1/signup`, () => {
    return HttpResponse.json({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    })
  }),

  // Sign out
  http.post(`${SUPABASE_URL}/auth/v1/logout`, () => {
    return HttpResponse.json({})
  }),

  // OAuth sign in
  http.post(`${SUPABASE_URL}/auth/v1/authorize`, () => {
    return HttpResponse.json({
      url: 'https://google.com/oauth/authorize'
    })
  })
]