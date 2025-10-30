/**
 * ReviewService
 * Business logic layer for review and rating operations
 *
 * Responsibilities:
 * - Handle review creation with validation
 * - Manage bidirectional reviews (renter ↔ owner)
 * - Calculate and retrieve review statistics
 * - Handle review moderation workflow
 * - Integrate with notification system
 */

import { notificationSDK, type NotificationSDK } from '@/lib/sdk/notification.sdk'
import { reviewSDK, type ReviewSDK } from '@/lib/sdk/review.sdk'
import type {
  Review,
  CreateReviewInput,
  ReviewSearchFilters,
  PaginatedResponse,
} from '@/types'

import { toError } from '../lib/errors'

// ============================================
// REVIEW SERVICE ERRORS
// ============================================

export enum ReviewErrorCode {
  REVIEW_NOT_FOUND = 'REVIEW_NOT_FOUND',
  BOOKING_NOT_ELIGIBLE = 'BOOKING_NOT_ELIGIBLE',
  REVIEW_ALREADY_EXISTS = 'REVIEW_ALREADY_EXISTS',
  INVALID_RATINGS = 'INVALID_RATINGS',
  SELF_REVIEW_NOT_ALLOWED = 'SELF_REVIEW_NOT_ALLOWED',
  REVIEW_CREATION_FAILED = 'REVIEW_CREATION_FAILED',
  STATS_NOT_FOUND = 'STATS_NOT_FOUND',
}

export class ReviewError extends Error {
  constructor(
    message: string,
    public code: ReviewErrorCode,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'ReviewError'
    Object.setPrototypeOf(this, ReviewError.prototype)
  }
}

// ============================================
// REVIEW SERVICE TYPES
// ============================================

export interface UserStats {
  user_id: string
  owner_reviews_count: number
  owner_rating_avg: number
  owner_rating_cleanliness_avg: number
  owner_rating_communication_avg: number
  owner_rating_accuracy_avg: number
  owner_rating_location_avg: number
  owner_rating_checkin_avg: number
  owner_rating_value_avg: number
  renter_reviews_count: number
  renter_rating_avg: number
  renter_rating_cleanliness_avg: number
  renter_rating_communication_avg: number
  renter_rating_accuracy_avg: number
  renter_rating_checkin_avg: number
  renter_rating_value_avg: number
  total_bookings_as_owner: number
  total_bookings_as_renter: number
  cancellation_count: number
  cancellation_rate: number
  is_top_host: boolean
  is_super_host: boolean
  is_verified_renter: boolean
  badges: string[]
  response_rate: number
  response_time_avg_minutes: number
  acceptance_rate: number
}

export interface CarStats {
  car_id: string
  total_reviews: number
  rating_avg: number
  rating_cleanliness_avg: number
  rating_communication_avg: number
  rating_accuracy_avg: number
  rating_location_avg: number
  rating_checkin_avg: number
  rating_value_avg: number
  total_bookings: number
  completed_bookings: number
  cancelled_bookings: number
  cancellation_rate: number
  acceptance_rate: number
  response_time_avg_minutes: number
}

// ============================================
// REVIEW SERVICE
// ============================================

export class ReviewService {
  constructor(
    private readonly reviewSDK: ReviewSDK,
    private readonly notificationSDK: NotificationSDK
  ) {}

  /**
   * Create a review
   * Validates eligibility and sends notifications
   */
  async createReview(input: CreateReviewInput): Promise<string> {
    try {
      // 1. Validate reviewer != reviewee
      if (input.reviewer_id === input.reviewee_id) {
        throw new ReviewError(
          'Cannot review yourself',
          ReviewErrorCode.SELF_REVIEW_NOT_ALLOWED,
          400
        )
      }

      // 2. Validate all ratings are between 1-5
      const ratings = [
        input.rating_cleanliness,
        input.rating_communication,
        input.rating_accuracy,
        input.rating_checkin,
        input.rating_value,
      ]
      if (input.rating_location !== undefined) {
        ratings.push(input.rating_location)
      }

      const invalidRatings = ratings.filter((r) => r < 1 || r > 5)
      if (invalidRatings.length > 0) {
        throw new ReviewError(
          'All ratings must be between 1 and 5',
          ReviewErrorCode.INVALID_RATINGS,
          400
        )
      }

      // 3. Check if user can review this booking
      const canReview = await this.reviewSDK.canReviewBooking(
        input.booking_id,
        input.reviewer_id
      )
      if (!canReview) {
        throw new ReviewError(
          'Booking is not eligible for review or review already exists',
          ReviewErrorCode.BOOKING_NOT_ELIGIBLE,
          400
        )
      }

      // 4. Create review via RPC (updates stats automatically)
      const reviewId = await this.reviewSDK.create(input)

      // 5. Send notification to reviewee (non-blocking)
      void this.sendReviewNotification(
        input.reviewee_id,
        input.reviewer_id,
        input.review_type
      ).catch((err) => {
        console.error('Failed to send review notification:', err)
      })

      return reviewId
    } catch (error) {
      if (error instanceof ReviewError) {
        throw error
      }
      throw toError(error)
    }
  }

  /**
   * Get review by ID
   */
  async getReviewById(reviewId: string): Promise<Review> {
    try {
      const review = await this.reviewSDK.getById(reviewId)
      return review
    } catch (error: unknown) {
      throw new ReviewError(
        'Review not found',
        ReviewErrorCode.REVIEW_NOT_FOUND,
        404
      )
    }
  }

  /**
   * Search reviews with filters
   */
  async searchReviews(
    filters: ReviewSearchFilters
  ): Promise<PaginatedResponse<Review>> {
    try {
      const result = await this.reviewSDK.search(filters)
      return result
    } catch (error) {
      throw toError(error)
    }
  }

  /**
   * Get reviews for a user
   */
  async getUserReviews(userId: string): Promise<Review[]> {
    try {
      const reviews = await this.reviewSDK.getByUser(userId)
      return reviews
    } catch (error) {
      throw toError(error)
    }
  }

  /**
   * Get reviews for a car
   */
  async getCarReviews(carId: string): Promise<Review[]> {
    try {
      const reviews = await this.reviewSDK.getByCar(carId)
      return reviews
    } catch (error) {
      throw toError(error)
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<UserStats> {
    try {
      const stats = await this.reviewSDK.getUserStats(userId)
      return stats as UserStats
    } catch (error) {
      throw toError(error)
    }
  }

  /**
   * Get car statistics
   */
  async getCarStats(carId: string): Promise<CarStats> {
    try {
      const stats = await this.reviewSDK.getCarStats(carId)
      return stats as CarStats
    } catch (error) {
      throw toError(error)
    }
  }

  /**
   * Check if user can review booking
   */
  async canReviewBooking(bookingId: string, userId: string): Promise<boolean> {
    try {
      const canReview = await this.reviewSDK.canReviewBooking(bookingId, userId)
      return canReview
    } catch (error) {
      throw toError(error)
    }
  }

  /**
   * Calculate average rating from 6 individual ratings
   */
  calculateAverageRating(ratings: {
    rating_cleanliness: number
    rating_communication: number
    rating_accuracy: number
    rating_checkin: number
    rating_value: number
    rating_location?: number
  }): number {
    const allRatings = [
      ratings.rating_cleanliness,
      ratings.rating_communication,
      ratings.rating_accuracy,
      ratings.rating_checkin,
      ratings.rating_value,
    ]

    if (ratings.rating_location !== undefined) {
      allRatings.push(ratings.rating_location)
    }

    const sum = allRatings.reduce((acc, rating) => acc + rating, 0)
    const avg = sum / allRatings.length

    // Round to 1 decimal place
    return Math.round(avg * 10) / 10
  }

  /**
   * Check if bidirectional review is complete
   * (both renter and owner have reviewed each other)
   */
  async isBidirectionalReviewComplete(bookingId: string): Promise<boolean> {
    try {
      const reviews = await this.reviewSDK.search({
        booking_id: bookingId,
        page: 1,
        pageSize: 10,
        sortBy: 'created_at_desc',
      })

      // Check if we have reviews from both renter and owner
      const reviewTypes = new Set(
        reviews.data.map((r: Review) => r.review_type)
      )
      const hasRenterReview =
        reviewTypes.has('user_to_user') || reviewTypes.has('user_to_car')
      const hasOwnerReview = reviewTypes.has('car_to_user')

      return hasRenterReview && hasOwnerReview
    } catch (error) {
      throw toError(error)
    }
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  /**
   * Send review notification
   * Private helper to notify user they received a review
   */
  private async sendReviewNotification(
    revieweeId: string,
    reviewerId: string,
    reviewType: string
  ): Promise<void> {
    try {
      const title = 'New Review Received'
      let body = 'You have received a new review'

      if (reviewType === 'user_to_user') {
        body = 'A renter has reviewed you as a car owner'
      } else if (reviewType === 'user_to_car') {
        body = 'A renter has reviewed your car'
      } else if (reviewType === 'car_to_user') {
        body = 'A car owner has reviewed you as a renter'
      }

      await this.notificationSDK.create({
        user_id: revieweeId,
        title,
        body,
        type: 'generic_announcement',
        metadata: {
          reviewer_id: reviewerId,
          review_type: reviewType,
        },
      })
    } catch (err: unknown) {
      // Non-critical error, log and continue
      console.error('Failed to send review notification:', err)
    }
  }
}

// Singleton instance
export const reviewService = new ReviewService(reviewSDK, notificationSDK)
