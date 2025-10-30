/* eslint-disable @typescript-eslint/no-unnecessary-condition, eslint-comments/disable-enable-pair -- SDK layer: Defensive programming for runtime safety against Supabase SDK changes */
import {
  CreateReviewInputSchema,
  ReviewSearchFiltersSchema,
  type Review,
  type CreateReviewInput,
  type ReviewSearchFilters,
  type PaginatedResponse,
} from '@/types'
import type { CreateReviewParams } from '@/types/database-helpers'
/**
 * Review SDK
 * Handles review and rating operations
 */


import { supabase } from '../supabase'

import { BaseSDK } from './base.sdk'

export class ReviewSDK extends BaseSDK {
  /**
   * Get review by ID
   */
  async getById(id: string): Promise<Review> {
    return this.execute(async () => {
      return await this.supabase
        .from('reviews')
        .select('*')
        .eq('id', id)
        .single()
    })
  }

  /**
   * Create a review
   */
  async create(input: CreateReviewInput): Promise<string> {
    // Validate input
    const validData = CreateReviewInputSchema.parse(input)

    // Use RPC to create review (updates stats automatically)
    const { data, error } = await this.supabase.rpc('create_review', {
      p_booking_id: validData.booking_id,
      p_reviewer_id: validData.reviewer_id,
      p_reviewee_id: validData.reviewee_id,
      p_car_id: validData.car_id ?? null,
      p_review_type: validData.review_type,
      p_rating_cleanliness: validData.rating_cleanliness,
      p_rating_communication: validData.rating_communication,
      p_rating_accuracy: validData.rating_accuracy,
      p_rating_location: validData.rating_location ?? null,
      p_rating_checkin: validData.rating_checkin,
      p_rating_value: validData.rating_value,
      p_comment_public: validData.comment_public,
    } as CreateReviewParams)

    if (error) {
      this.handleError(error, 'Review creation failed')
    }

    return data // Returns review_id
  }

  /**
   * Search reviews
   */
  async search(filters: ReviewSearchFilters): Promise<PaginatedResponse<Review>> {
    // Validate filters
    const validFilters = ReviewSearchFiltersSchema.parse(filters)

    let query = this.supabase
      .from('reviews')
      .select('*', { count: 'exact' })

    // Apply filters
    if (validFilters.reviewer_id) {
      query = query.eq('reviewer_id', validFilters.reviewer_id)
    }

    if (validFilters.reviewee_id) {
      query = query.eq('reviewee_id', validFilters.reviewee_id)
    }

    if (validFilters.car_id) {
      query = query.eq('car_id', validFilters.car_id)
    }

    if (validFilters.booking_id) {
      query = query.eq('booking_id', validFilters.booking_id)
    }

    if (validFilters.review_type) {
      query = query.eq('review_type', validFilters.review_type)
    }

    if (validFilters.min_rating) {
      query = query.gte('rating_overall', validFilters.min_rating)
    }

    if (validFilters.max_rating) {
      query = query.lte('rating_overall', validFilters.max_rating)
    }

    if (validFilters.would_recommend !== undefined) {
      query = query.eq('would_recommend', validFilters.would_recommend)
    }

    if (validFilters.created_from) {
      query = query.gte('created_at', validFilters.created_from)
    }

    if (validFilters.created_to) {
      query = query.lte('created_at', validFilters.created_to)
    }

    // Sorting
    const [field, order] = validFilters.sortBy.split('_').reduce((acc, part, i, arr) => {
      if (i === arr.length - 1) {
        acc[1] = part
      } else {
        acc[0] += (i > 0 ? '_' : '') + part
      }
      return acc
    }, ['', 'desc'])

    query = query.order(field, { ascending: order === 'asc' })

    // Pagination
    const from = (validFilters.page - 1) * validFilters.pageSize
    const to = from + validFilters.pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      this.handleError(error, 'Review search failed')
    }

    return this.createPaginatedResponse(
      data || [],
      count,
      validFilters.page,
      validFilters.pageSize
    )
  }

  /**
   * Get reviews for a user
   */
  async getByUser(userId: string): Promise<Review[]> {
    const { data, error } = await this.supabase
      .from('reviews')
      .select('*')
      .eq('reviewee_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      this.handleError(error, 'Failed to fetch user reviews')
    }

    return data || []
  }

  /**
   * Get reviews for a car
   */
  async getByCar(carId: string): Promise<Review[]> {
    const { data, error } = await this.supabase
      .from('reviews')
      .select('*')
      .eq('car_id', carId)
      .order('created_at', { ascending: false })

    if (error) {
      this.handleError(error, 'Failed to fetch car reviews')
    }

    return data || []
  }

  /**
   * Get user stats
   */
  async getUserStats(userId: string): Promise<unknown> {
    const { data, error } = await this.supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      return {
        user_id: userId,
        total_reviews_received: 0,
        rating_avg: 0,
      }
    }

    return data
  }

  /**
   * Get car stats
   */
  async getCarStats(carId: string): Promise<unknown> {
    const { data, error } = await this.supabase
      .from('car_stats')
      .select('*')
      .eq('car_id', carId)
      .single()

    if (error) {
      return {
        car_id: carId,
        total_reviews: 0,
        rating_avg: 0,
      }
    }

    return data
  }

  /**
   * Check if user can review booking
   */
  async canReviewBooking(bookingId: string, userId: string): Promise<boolean> {
    // Check if booking is completed
    const { data: booking } = await this.supabase
      .from('bookings')
      .select('status, renter_id')
      .eq('id', bookingId)
      .single()

    if (booking?.status !== 'completed') {
      return false
    }

    // Check if user is the renter
    if (booking.renter_id !== userId) {
      return false
    }

    // Check if review already exists
    const { data: existingReview } = await this.supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', bookingId)
      .eq('reviewer_id', userId)
      .single()

    return !existingReview
  }
}

// Singleton instance
export const reviewSDK = new ReviewSDK(supabase)
