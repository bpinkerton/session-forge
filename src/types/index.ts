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

export interface CampaignMemberWithProfile extends CampaignMember {
  user_profile?: {
    user_id: string
    display_name: string | null
    profile_picture_url: string | null
  }
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
  dm_profile?: {
    user_id: string
    display_name: string | null
    profile_picture_url: string | null
  }
  members: CampaignMemberWithProfile[]
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

// User Profile System
export interface UserProfile {
  id: string
  user_id: string
  display_name: string | null
  about_me: string | null
  profile_picture_url: string | null
  timezone: string | null
  preferred_session_length: number | null // in minutes
  availability_notes: string | null
  experience_level: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null
  dm_experience: boolean
  content_preferences: string[] // ['family-friendly', 'mature-themes', 'horror', etc.]
  scheduling_preferences: {
    preferred_days: string[] // ['monday', 'tuesday', etc.]
    preferred_times: {
      start_time: string // '19:00'
      end_time: string // '23:00'
    } | null
    frequency: 'weekly' | 'biweekly' | 'monthly' | 'flexible' | null
  } | null
  privacy_settings: {
    profile_visibility: 'public' | 'friends' | 'private'
    show_campaign_history: boolean
    show_connected_accounts: boolean
  }
  created_at: string
  updated_at: string
}

export interface TTRPGSystem {
  id: string
  name: string
  category: 'fantasy' | 'sci-fi' | 'horror' | 'modern' | 'generic'
  publisher: string | null
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface PlayStyle {
  id: string
  name: string
  description: string | null
  sort_order: number
  created_at: string
}

export interface UserTTRPGSystem {
  user_id: string
  system_id: string
  experience_level: 'never_played' | 'beginner' | 'familiar' | 'experienced' | 'expert' | null
  is_favorite: boolean
  created_at: string
  system?: TTRPGSystem // Joined data
}

export interface UserPlayStyle {
  user_id: string
  style_id: string
  preference_level: number // 1-5 scale
  created_at: string
  style?: PlayStyle // Joined data
}

export interface ConnectedAccount {
  id: string
  user_id: string
  provider: 'google' | 'discord' | 'twitch'
  provider_user_id: string
  provider_username: string | null
  provider_avatar_url: string | null
  is_primary: boolean // for profile picture
  connected_at: string
  last_used_at: string | null
}

export interface UserProfileWithAccounts extends UserProfile {
  connected_accounts: ConnectedAccount[]
  ttrpg_systems: UserTTRPGSystem[]
  play_styles: UserPlayStyle[]
}

// Campaign Statistics for Profile
export interface UserCampaignStats {
  total_campaigns: number
  campaigns_as_dm: number
  campaigns_as_player: number
  completed_campaigns: number
  active_campaigns: number
  total_sessions_played: number
  total_sessions_dmed: number
  favorite_systems: string[]
}