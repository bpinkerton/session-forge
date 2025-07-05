import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Storage utility functions
export const uploadProfilePicture = async (file: File, userId: string) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-${Date.now()}.${fileExt}`
  const filePath = `${fileName}` // Remove the folder prefix since we're already in the bucket

  // Upload file to Supabase storage
  const { data, error } = await supabase.storage
    .from('profile-pictures')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    throw error
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('profile-pictures')
    .getPublicUrl(filePath)

  return {
    path: data.path,
    publicUrl: urlData.publicUrl
  }
}

export const deleteProfilePicture = async (filePath: string) => {
  const { error } = await supabase.storage
    .from('profile-pictures')
    .remove([filePath])

  if (error) {
    throw error
  }
}

export const validateImageFile = (file: File): string | null => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  const maxSize = 5 * 1024 * 1024 // 5MB

  if (!allowedTypes.includes(file.type)) {
    return 'Please upload a valid image file (JPEG, PNG, GIF, or WebP)'
  }

  if (file.size > maxSize) {
    return 'Image must be less than 5MB'
  }

  return null
}