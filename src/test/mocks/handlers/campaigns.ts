import { http, HttpResponse } from 'msw'

const SUPABASE_URL = 'https://rvuhpidukddvpoulwdkj.supabase.co'

export const campaignHandlers = [
  // Get user campaigns
  http.get(`${SUPABASE_URL}/rest/v1/campaigns`, ({ request }) => {
    const url = new URL(request.url)
    const select = url.searchParams.get('select')
    
    if (select?.includes('members')) {
      return HttpResponse.json([
        {
          id: 'campaign-1',
          name: 'Test Campaign',
          description: 'A test campaign',
          dm_user_id: 'test-user-id',
          status: 'active',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          members: [
            {
              id: 'member-1',
              user_id: 'test-user-id',
              campaign_id: 'campaign-1',
              role: 'dm',
              joined_at: '2024-01-01T00:00:00Z'
            }
          ]
        }
      ])
    }

    return HttpResponse.json([
      {
        id: 'campaign-1',
        name: 'Test Campaign',
        description: 'A test campaign',
        dm_user_id: 'test-user-id',
        status: 'active',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ])
  }),

  // Create campaign
  http.post(`${SUPABASE_URL}/rest/v1/campaigns`, () => {
    return HttpResponse.json([
      {
        id: 'new-campaign-id',
        name: 'New Campaign',
        description: 'A new campaign',
        dm_user_id: 'test-user-id',
        status: 'planning',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ])
  }),

  // Update campaign
  http.patch(`${SUPABASE_URL}/rest/v1/campaigns`, () => {
    return HttpResponse.json([
      {
        id: 'campaign-1',
        name: 'Updated Campaign',
        description: 'An updated campaign',
        dm_user_id: 'test-user-id',
        status: 'active',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ])
  }),

  // Campaign members
  http.get(`${SUPABASE_URL}/rest/v1/campaign_members`, () => {
    return HttpResponse.json([
      {
        id: 'member-1',
        user_id: 'test-user-id',
        campaign_id: 'campaign-1',
        role: 'dm',
        joined_at: '2024-01-01T00:00:00Z'
      }
    ])
  }),

  // Add campaign member
  http.post(`${SUPABASE_URL}/rest/v1/campaign_members`, () => {
    return HttpResponse.json([
      {
        id: 'new-member-id',
        user_id: 'player-user-id',
        campaign_id: 'campaign-1',
        role: 'player',
        joined_at: '2024-01-01T00:00:00Z'
      }
    ])
  })
]