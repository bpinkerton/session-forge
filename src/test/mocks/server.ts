import { setupServer } from 'msw/node'
import { authHandlers } from './handlers/auth'
import { campaignHandlers } from './handlers/campaigns'
import { profileHandlers } from './handlers/profiles'

// Combine all handlers
export const server = setupServer(
  ...authHandlers,
  ...campaignHandlers,
  ...profileHandlers
)