export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface Character {
  id: string
  user_id: string
  name: string
  class: string | null
  level: number
  race: string | null
  background: string | null
  dndbeyond_id: string | null
  stats: Record<string, any> | null // JSONB for character sheet data
  backstory: string | null
  created_at: string
  updated_at: string
}

export interface Campaign {
  id: string
  name: string
  description: string | null
  dm_user_id: string
  setting: string | null // "Curse of Strahd", "Homebrew", etc.
  status: 'planning' | 'active' | 'completed' | 'on_hold'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CampaignMember {
  id: string
  user_id: string
  campaign_id: string
  role: 'dm' | 'player' | 'observer'
  joined_at: string
}

export interface CampaignCharacter {
  id: string
  user_id: string
  campaign_id: string
  character_id: string
  is_active: boolean // Current character or backup
  status: 'alive' | 'dead' | 'retired' | 'npc'
  joined_session: number | null // Which session they joined
  left_session: number | null // Which session they left/died
  created_at: string
}

export interface Session {
  id: string
  campaign_id: string
  session_number: number | null // Session 1, 2, 3...
  title: string
  description: string | null
  scheduled_date: string | null
  duration_minutes: number
  status: 'planning' | 'scheduled' | 'completed' | 'cancelled'
  session_notes: string | null // Player-visible notes
  dm_notes: string | null // DM-only notes
  created_by: string
  created_at: string
  updated_at: string
}

export interface SessionPoll {
  id: string
  session_id: string
  proposed_date: string
  proposed_by: string
  created_at: string
}

export interface PollVote {
  id: string
  poll_id: string
  user_id: string
  availability: 'available' | 'unavailable' | 'maybe'
  created_at: string
  updated_at: string
}

// Extended types with relationships
export interface CharacterWithCampaigns extends Character {
  campaigns: CampaignCharacter[]
}

export interface CampaignWithMembers extends Campaign {
  members: CampaignMember[]
}

export interface CampaignWithCharacters extends Campaign {
  characters: (CampaignCharacter & { character: Character })[]
}

export interface CampaignFull extends Campaign {
  members: CampaignMember[]
  characters: (CampaignCharacter & { character: Character })[]
}

export interface SessionWithPolls extends Session {
  polls: SessionPoll[]
}

export interface SessionPollWithVotes extends SessionPoll {
  votes: PollVote[]
}

// User role in a specific campaign
export interface UserCampaignRole {
  campaign_id: string
  role: 'dm' | 'player' | 'observer'
  active_characters: Character[]
}

// Campaign Invitations
export interface CampaignInvitation {
  id: string
  campaign_id: string
  invite_code: string
  created_by: string
  max_uses: number | null
  current_uses: number
  expires_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface InvitationUse {
  id: string
  invitation_id: string
  used_by: string
  used_at: string
}

export interface InvitationWithCampaign extends CampaignInvitation {
  campaign: Campaign
}