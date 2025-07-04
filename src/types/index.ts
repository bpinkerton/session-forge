export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface Campaign {
  id: string
  name: string
  description: string
  dm_id: string
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  campaign_id: string
  name: string
  description: string
  scheduled_for: string
  status: 'scheduled' | 'active' | 'completed' | 'cancelled'
  notes: string
  created_at: string
  updated_at: string
}

export interface Character {
  id: string
  user_id: string
  campaign_id: string
  name: string
  class: string
  level: number
  dndbeyond_id?: string
  created_at: string
  updated_at: string
}