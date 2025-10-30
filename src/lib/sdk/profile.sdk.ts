import {
  CreateProfileInputSchema,
  UpdateProfileInputSchema,
  KYCSubmissionSchema,
  ProfileSearchFiltersSchema,
  validateMinimumAge,
  type ProfileDTO,
  type CreateProfileInput,
  type UpdateProfileInput,
  type KYCSubmission,
  type ProfileSearchFilters,
  type PaginatedResponse,
  type TablesUpdate,
  parseProfile,
} from '@/types'
import type { ProfileInsert, ProfileUpdate, ProfileRow } from '@/types/database-helpers'
/**
 * Profile SDK
 * Handles all profile-related operations
 */


import { toError } from '../errors'
import { supabase } from '../supabase'

import { BaseSDK } from './base.sdk'

export class ProfileSDK extends BaseSDK {
  /**
   * Get profile by ID
   */
  async getById(id: string): Promise<ProfileDTO> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {throw toError(error)}
      if (!data) {throw new Error('Profile not found')}

      return parseProfile(data)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Get current user's profile
   */
  async getCurrent(): Promise<ProfileDTO> {
    try {
      const { data: { user }, error: authError } = await this.supabase.auth.getUser()

      if (authError) {throw toError(authError)}
      if (!user) {throw new Error('Not authenticated')}

      return await this.getById(user.id)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Create a new profile (registration)
   */
  async create(input: CreateProfileInput): Promise<ProfileDTO> {
    try {
      // Validate input
      const validData = CreateProfileInputSchema.parse(input)

      const { data, error } = await this.supabase
        .from('profiles')
        .insert(validData as ProfileInsert)
        .select()
        .single()

      if (error) {throw toError(error)}
      if (!data) {throw new Error('Failed to create profile')}

      return parseProfile(data)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Update profile
   */
  async update(id: string, input: UpdateProfileInput): Promise<ProfileDTO> {
    try {
      // Validate input
      const validData = UpdateProfileInputSchema.parse(input)

      const { data, error } = await this.supabase
        .from('profiles')
        .update(validData as ProfileUpdate)
        .eq('id', id)
        .select()
        .single()

      if (error) {throw toError(error)}
      if (!data) {throw new Error('Failed to update profile')}

      return parseProfile(data)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Admin update (bypasses validation for admin-only fields like kyc, role)
   */
  async adminUpdate(id: string, input: TablesUpdate<'profiles'>): Promise<ProfileDTO> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (error) {throw toError(error)}
      if (!data) {throw new Error('Failed to update profile')}

      return parseProfile(data)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Update current user's profile
   */
  async updateCurrent(input: UpdateProfileInput): Promise<ProfileDTO> {
    try {
      const { data: { user }, error: authError } = await this.supabase.auth.getUser()

      if (authError) {throw toError(authError)}
      if (!user) {throw new Error('Not authenticated')}

      return await this.update(user.id, input)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Submit KYC documents
   */
  async submitKYC(input: KYCSubmission): Promise<void> {
    try {
      // Validate input
      const validData = KYCSubmissionSchema.parse(input)

      // Validate minimum age
      if (!validateMinimumAge(validData.date_of_birth)) {
        throw new Error('Must be at least 18 years old')
      }

      // Update profile with KYC data
      const { error } = await this.supabase
        .from('profiles')
        .update({
          date_of_birth: validData.date_of_birth,
          kyc_status: 'pending',
        } as ProfileRow)
        .eq('id', validData.user_id)
        .select()
        .single()

      if (error) {throw toError(error)}

      // Create user documents (would need user_documents table)
      // This is simplified - actual implementation would upload docs
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Search profiles (admin only)
   */
  async search(filters: ProfileSearchFilters): Promise<PaginatedResponse<ProfileDTO>> {
    try {
      // Validate filters
      const validFilters = ProfileSearchFiltersSchema.parse(filters)

      let query = this.supabase
        .from('profiles')
        .select('*', { count: 'exact' })

      // Apply filters
      if (validFilters.query) {
        query = query.ilike('full_name', `%${validFilters.query}%`)
      }

      if (validFilters.role) {
        query = query.eq('role', validFilters.role)
      }

      if (validFilters.kyc) {
        query = query.eq('kyc', validFilters.kyc)
      }

      if (validFilters.onboarding) {
        query = query.eq('onboarding', validFilters.onboarding)
      }

      if (validFilters.min_rating) {
        query = query.gte('rating_avg', validFilters.min_rating)
      }

      // Sorting
      const [sortField, sortOrder] = validFilters.sortBy.split('_').reduce<[string, 'asc' | 'desc']>((acc, part, i, arr) => {
        if (i === arr.length - 1) {
          acc[1] = part as 'asc' | 'desc'
        } else {
          acc[0] += (i > 0 ? '_' : '') + part
        }
        return acc
      }, ['', 'desc'])

      query = query.order(sortField, { ascending: sortOrder === 'asc' })

      // Pagination
      const from = (validFilters.page - 1) * validFilters.pageSize
      const to = from + validFilters.pageSize - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {throw toError(error)}

      // Validate and parse all results
      const validatedData = (data ?? []).map(parseProfile)

      return this.createPaginatedResponse(
        validatedData,
        count,
        validFilters.page,
        validFilters.pageSize
      )
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Get profile stats
   *
   * Note: Returns user_stats table data. Consider creating UserStatsDTO in the future.
   */
  async getStats(userId: string): Promise<unknown> {
    try {
      const { data, error } = await this.supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        // Stats might not exist yet, return default
        return {
          user_id: userId,
          total_bookings_as_renter: 0,
          total_bookings_as_owner: 0,
          total_reviews_received: 0,
          rating_avg: 0,
        }
      }

      return data
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Check if user can become owner
   */
  async canBecomeOwner(userId: string): Promise<boolean> {
    try {
      const profile = await this.getById(userId)

      // Must have approved KYC
      if (profile.kyc !== 'verified') {
        return false
      }

      // Must have email verified
      if (!profile.email_verified) {
        return false
      }

      return true
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Upgrade user to owner role
   */
  async becomeOwner(userId: string): Promise<ProfileDTO> {
    try {
      const canBeOwner = await this.canBecomeOwner(userId)

      if (!canBeOwner) {
        throw new Error('User does not meet requirements to become owner')
      }

      const { data, error } = await this.supabase
        .from('profiles')
        .update({ role: 'owner' })
        .eq('id', userId)
        .select()
        .single()

      if (error) {throw toError(error)}
      if (!data) {throw new Error('Failed to update profile role')}

      return parseProfile(data)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Soft delete profile (deactivate)
   */
  async deactivate(userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('profiles')
        .update({ is_active: false } as ProfileUpdate)
        .eq('id', userId)
        .select()
        .single()

      if (error) {throw toError(error)}
    } catch (e) {
      throw toError(e)
    }
  }
}

// Singleton instance
export const profileSDK = new ProfileSDK(supabase)
