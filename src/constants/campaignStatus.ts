import type { Campaign } from '@/types'

export const CAMPAIGN_STATUS_CONFIG = {
  planning: {
    label: 'Worldbuilding',
    color: 'bg-orange-100 text-orange-800',
    description: 'Creating the world, NPCs, and story hooks'
  },
  active: {
    label: 'Active',
    color: 'bg-green-100 text-green-800',
    description: 'Regular sessions are happening'
  },
  on_hold: {
    label: 'On Break',
    color: 'bg-yellow-100 text-yellow-800',
    description: 'Taking a temporary break from sessions'
  },
  completed: {
    label: 'Completed',
    color: 'bg-purple-100 text-purple-800',
    description: 'Campaign has reached its conclusion'
  }
} as const

export const getDisplayStatus = (status: Campaign['status']) => {
  return CAMPAIGN_STATUS_CONFIG[status] || CAMPAIGN_STATUS_CONFIG.planning
}

export const CAMPAIGN_STATUS_OPTIONS = [
  { value: 'planning' as const, label: 'Worldbuilding', description: 'Creating the world, NPCs, and story hooks' },
  { value: 'active' as const, label: 'Active', description: 'Regular sessions are happening' },
  { value: 'on_hold' as const, label: 'On Break', description: 'Taking a temporary break from sessions' },
  { value: 'completed' as const, label: 'Completed', description: 'Campaign has reached its conclusion' }
] as const