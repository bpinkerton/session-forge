import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

// Cache for the current user to avoid repeated auth store access
let userCache: User | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 30000 // 30 seconds

/**
 * Get the current authenticated user without making an API call
 * Uses the auth store state for better performance
 */
export const getCurrentUser = (): User | null => {
  try {
    const { user } = useAuthStore.getState()
    
    // Update cache
    userCache = user ?? null
    cacheTimestamp = Date.now()
    
    return user ?? null
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Get the current user with fallback to API call if needed
 * Use this only when you need to ensure the user is fresh
 */
export const getCurrentUserWithFallback = async (): Promise<User | null> => {
  // First try to get from auth store
  const { user } = useAuthStore.getState()
  
  if (user) {
    return user
  }
  
  // Fallback to API call only if auth store doesn't have user
  try {
    const { data: { user: apiUser }, error } = await supabase.auth.getUser()
    if (error) throw error
    return apiUser
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

/**
 * Get current user ID quickly without API calls
 */
export const getCurrentUserId = (): string | null => {
  const user = getCurrentUser()
  return user?.id || null
}

/**
 * Check if user is authenticated without API calls  
 */
export const isAuthenticated = (): boolean => {
  return getCurrentUser() !== null
}

/**
 * Require authenticated user or throw error
 */
export const requireAuth = (): User => {
  const user = getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}