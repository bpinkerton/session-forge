import type { Campaign } from '@/types'

export const CAMPAIGN_STATUS_CONFIG = {
  planning: {
    label: 'Worldbuilding',
    color: 'bg-orange-100 text-orange-800'
  },
  active: {
    label: 'Active',
    color: 'bg-green-100 text-green-800'
  },
  on_hold: {
    label: 'On Break',
    color: 'bg-yellow-100 text-yellow-800'
  },
  completed: {
    label: 'Completed',
    color: 'bg-purple-100 text-purple-800'
  }
} as const

export const getDisplayStatus = (status: Campaign['status']) => {
  return CAMPAIGN_STATUS_CONFIG[status] || CAMPAIGN_STATUS_CONFIG.planning
}

export const CAMPAIGN_STATUS_OPTIONS = [
  { value: 'planning' as const, label: 'Worldbuilding' },
  { value: 'active' as const, label: 'Active' },
  { value: 'on_hold' as const, label: 'On Break' },
  { value: 'completed' as const, label: 'Completed' }
] as const