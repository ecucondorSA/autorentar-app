/**
 * Supabase Client Configuration
 * Singleton client for database access
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types'

import env from './env'

// Environment variables from centralized config
const supabaseUrl = env.SUPABASE_URL
const supabaseAnonKey = env.SUPABASE_ANON_KEY

/**
 * Supabase client instance
 * Type-safe with auto-generated Database types
 */
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user']> {
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    throw error
  }

  return user
}

/**
 * Get current session
 */
export async function getCurrentSession(): Promise<Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']> {
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error) {
    throw error
  }

  return session
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }
}
