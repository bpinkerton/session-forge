import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase env vars:', { 
    url: supabaseUrl ? 'present' : 'missing',
    key: supabaseAnonKey ? 'present' : 'missing'
  })
  throw new Error('Missing Supabase environment variables')
}

console.log('Supabase config:', { 
  url: supabaseUrl,
  keyPrefix: supabaseAnonKey?.slice(0, 20) + '...',
  fullKey: supabaseAnonKey // Temporarily show full key for debugging
})

export const supabase = createClient(supabaseUrl, supabaseAnonKey)