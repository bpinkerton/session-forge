import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Character, CharacterWithCampaigns } from '@/types'

interface CharacterState {
  characters: Character[]
  currentCharacter: Character | null
  loading: boolean
  error: string | null
  
  // Character actions
  fetchCharacters: () => Promise<void>
  createCharacter: (character: Partial<Character>) => Promise<Character | null>
  updateCharacter: (id: string, updates: Partial<Character>) => Promise<void>
  deleteCharacter: (id: string) => Promise<void>
  
  // Utility actions
  setCurrentCharacter: (character: Character | null) => void
  clearError: () => void
}

export const useCharacterStore = create<CharacterState>((set) => ({
  characters: [],
  currentCharacter: null,
  loading: false,
  error: null,

  fetchCharacters: async () => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ characters: data || [], loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  createCharacter: async (character: Partial<Character>) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('characters')
        .insert(character)
        .select()
        .single()

      if (error) throw error
      
      // Add to local state
      set(state => ({
        characters: [data, ...state.characters],
        loading: false
      }))
      
      return data
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
      return null
    }
  },

  updateCharacter: async (id: string, updates: Partial<Character>) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('characters')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Update local state
      set(state => ({
        characters: state.characters.map(character => 
          character.id === id ? { ...character, ...data } : character
        ),
        currentCharacter: state.currentCharacter?.id === id 
          ? { ...state.currentCharacter, ...data }
          : state.currentCharacter,
        loading: false
      }))
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  deleteCharacter: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Remove from local state
      set(state => ({
        characters: state.characters.filter(character => character.id !== id),
        currentCharacter: state.currentCharacter?.id === id ? null : state.currentCharacter,
        loading: false
      }))
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  setCurrentCharacter: (character: Character | null) => {
    set({ currentCharacter: character })
  },

  clearError: () => {
    set({ error: null })
  }
}))

// Helper function to fetch character with campaign relationships
export const fetchCharacterWithCampaigns = async (characterId: string): Promise<CharacterWithCampaigns | null> => {
  try {
    const { data: character, error: characterError } = await supabase
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .single()

    if (characterError) throw characterError

    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaign_characters')
      .select('*')
      .eq('character_id', characterId)

    if (campaignsError) throw campaignsError

    return {
      ...character,
      campaigns: campaigns || []
    }
  } catch (error) {
    console.error('Error fetching character with campaigns:', error)
    return null
  }
}