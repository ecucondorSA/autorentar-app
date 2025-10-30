/**
 * ReviewService Tests
 * Business logic layer for review operations
 *
 * Coverage:
 * - Review creation with validation (8 tests)
 * - Review retrieval (4 tests)
 * - Statistics (7 tests)
 * - Bidirectional reviews (4 tests)
 * - Rating calculations (3 tests)
 * - Notifications (4 tests)
 * - Error scenarios (5 tests)
 *
 * Total: 35 tests
 */

/* eslint-disable @typescript-eslint/unbound-method -- Jasmine spy methods are intentionally unbound */
/* eslint-disable @typescript-eslint/no-unsafe-argument -- Test mocks use any types for flexibility */

import type { NotificationSDK } from '@/lib/sdk/notification.sdk'
import type { ReviewSDK } from '@/lib/sdk/review.sdk'
import type {
  Review,
  CreateReviewInput,
  ReviewSearchFilters,
  PaginatedResponse,
} from '@/types'

import { ReviewService, ReviewErrorCode } from './review.service'

describe('ReviewService (Feature Horizontal)', () => {
  let service: ReviewService
  let mockReviewSDK: jasmine.SpyObj<ReviewSDK>
  let mockNotificationSDK: jasmine.SpyObj<NotificationSDK>

  // Mock data
  const mockReviewId = 'review-123'
  const mockBookingId = 'booking-456'
  const mockReviewerId = 'user-reviewer'
  const mockRevieweeId = 'user-reviewee'
  const mockCarId = 'car-789'

  const mockReview = {
    id: mockReviewId,
    booking_id: mockBookingId,
    reviewer_id: mockReviewerId,
    reviewee_id: mockRevieweeId,
    car_id: mockCarId,
    review_type: 'user_to_user',
    rating: 5,
    rating_cleanliness: 5,
    rating_communication: 5,
    rating_accuracy: 4,
    rating_location: 5,
    rating_checkin: 5,
    rating_value: 4,
    role: 'renter_rates_owner' as const,
    comment: null,
    comment_public: 'Great experience! Very clean car.',
    comment_private: 'Minor scratches on bumper.',
    would_recommend: true,
    tags: ['clean', 'punctual'],
    status: 'published',
    is_visible: true,
    created_at: new Date().toISOString(),
    updated_at: null,
    published_at: new Date().toISOString(),
    is_flagged: false,
    flag_reason: null,
    flagged_by: null,
    flagged_at: null,
    moderation_status: 'approved',
    moderated_by: null,
    moderated_at: null,
    moderation_notes: null,
  } as Review

  const mockUserStats = {
    user_id: mockRevieweeId,
    owner_reviews_count: 15,
    owner_rating_avg: 4.8,
    owner_rating_cleanliness_avg: 4.9,
    owner_rating_communication_avg: 5.0,
    owner_rating_accuracy_avg: 4.7,
    owner_rating_location_avg: 4.8,
    owner_rating_checkin_avg: 4.9,
    owner_rating_value_avg: 4.6,
    renter_reviews_count: 8,
    renter_rating_avg: 4.5,
    renter_rating_cleanliness_avg: 4.6,
    renter_rating_communication_avg: 4.7,
    renter_rating_accuracy_avg: 4.4,
    renter_rating_checkin_avg: 4.5,
    renter_rating_value_avg: 4.3,
    total_bookings_as_owner: 20,
    total_bookings_as_renter: 10,
    cancellation_count: 1,
    cancellation_rate: 0.05,
    is_top_host: true,
    is_super_host: false,
    is_verified_renter: true,
    badges: ['clean', 'punctual'],
    response_rate: 0.95,
    response_time_avg_minutes: 45,
    acceptance_rate: 0.85,
  }

  const mockCarStats = {
    car_id: mockCarId,
    total_reviews: 12,
    rating_avg: 4.7,
    rating_cleanliness_avg: 4.8,
    rating_communication_avg: 4.9,
    rating_accuracy_avg: 4.6,
    rating_location_avg: 4.7,
    rating_checkin_avg: 4.8,
    rating_value_avg: 4.5,
    total_bookings: 15,
    completed_bookings: 12,
    cancelled_bookings: 1,
    cancellation_rate: 0.067,
    acceptance_rate: 0.9,
    response_time_avg_minutes: 30,
  }

  beforeEach(() => {
    mockReviewSDK = jasmine.createSpyObj<ReviewSDK>('ReviewSDK', [
      'create',
      'getById',
      'search',
      'getByUser',
      'getByCar',
      'getUserStats',
      'getCarStats',
      'canReviewBooking',
    ])

    mockNotificationSDK = jasmine.createSpyObj<NotificationSDK>(
      'NotificationSDK',
      ['create', 'getById', 'getUserNotifications', 'getUnreadCount']
    )

    service = new ReviewService(mockReviewSDK, mockNotificationSDK)
  })

  // ============================================
  // REVIEW CREATION - 8 TESTS
  // ============================================

  describe('createReview()', () => {
    const validInput: CreateReviewInput = {
      booking_id: mockBookingId,
      reviewer_id: mockReviewerId,
      reviewee_id: mockRevieweeId,
      review_type: 'user_to_user',
      rating_cleanliness: 5,
      rating_communication: 5,
      rating_accuracy: 4,
      rating_checkin: 5,
      rating_value: 4,
      comment_public: 'Great experience! Very clean car.',
      would_recommend: true,
    }

    it('should create review successfully with all required fields', async () => {
      mockReviewSDK.canReviewBooking.and.returnValue(Promise.resolve(true))
      mockReviewSDK.create.and.returnValue(Promise.resolve(mockReviewId))
      mockNotificationSDK.create.and.returnValue(Promise.resolve({} as any))

      const result = await service.createReview(validInput)

      expect(result).toBe(mockReviewId)
      expect(mockReviewSDK.canReviewBooking).toHaveBeenCalledWith(
        mockBookingId,
        mockReviewerId
      )
      expect(mockReviewSDK.create).toHaveBeenCalledWith(validInput)
    })

    it('should create review with optional rating_location', async () => {
      const inputWithLocation: CreateReviewInput = {
        ...validInput,
        rating_location: 5,
      }

      mockReviewSDK.canReviewBooking.and.returnValue(Promise.resolve(true))
      mockReviewSDK.create.and.returnValue(Promise.resolve(mockReviewId))
      mockNotificationSDK.create.and.returnValue(Promise.resolve({} as any))

      const result = await service.createReview(inputWithLocation)

      expect(result).toBe(mockReviewId)
      expect(mockReviewSDK.create).toHaveBeenCalledWith(inputWithLocation)
    })

    it('should send notification after creating review', async () => {
      mockReviewSDK.canReviewBooking.and.returnValue(Promise.resolve(true))
      mockReviewSDK.create.and.returnValue(Promise.resolve(mockReviewId))
      mockNotificationSDK.create.and.returnValue(Promise.resolve({} as any))

      await service.createReview(validInput)
      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(mockNotificationSDK.create).toHaveBeenCalledWith({
        user_id: mockRevieweeId,
        title: 'New Review Received',
        body: 'A renter has reviewed you as a car owner',
        type: 'generic_announcement',
        metadata: {
          reviewer_id: mockReviewerId,
          review_type: 'user_to_user',
        },
      })
    })

    it('should throw error when reviewer equals reviewee (self-review)', async () => {
      const selfReviewInput: CreateReviewInput = {
        ...validInput,
        reviewer_id: mockRevieweeId,
        reviewee_id: mockRevieweeId,
      }

      await expectAsync(service.createReview(selfReviewInput)).toBeRejectedWith(
        jasmine.objectContaining({
          code: ReviewErrorCode.SELF_REVIEW_NOT_ALLOWED,
          statusCode: 400,
        })
      )
    })

    it('should throw error when rating is below 1', async () => {
      const invalidInput: CreateReviewInput = {
        ...validInput,
        rating_cleanliness: 0,
      }

      await expectAsync(service.createReview(invalidInput)).toBeRejectedWith(
        jasmine.objectContaining({
          code: ReviewErrorCode.INVALID_RATINGS,
          statusCode: 400,
        })
      )
    })

    it('should throw error when rating is above 5', async () => {
      const invalidInput: CreateReviewInput = {
        ...validInput,
        rating_communication: 6,
      }

      await expectAsync(service.createReview(invalidInput)).toBeRejectedWith(
        jasmine.objectContaining({
          code: ReviewErrorCode.INVALID_RATINGS,
          statusCode: 400,
        })
      )
    })

    it('should throw error when booking is not eligible', async () => {
      mockReviewSDK.canReviewBooking.and.returnValue(Promise.resolve(false))

      await expectAsync(service.createReview(validInput)).toBeRejectedWith(
        jasmine.objectContaining({
          code: ReviewErrorCode.BOOKING_NOT_ELIGIBLE,
          statusCode: 400,
        })
      )
    })

    it('should handle notification failure gracefully (non-blocking)', async () => {
      mockReviewSDK.canReviewBooking.and.returnValue(Promise.resolve(true))
      mockReviewSDK.create.and.returnValue(Promise.resolve(mockReviewId))
      mockNotificationSDK.create.and.returnValue(
        Promise.reject(new Error('Notification service down'))
      )

      // Should not throw error even if notification fails
      const result = await service.createReview(validInput)
      expect(result).toBe(mockReviewId)
    })
  })

  // ============================================
  // REVIEW RETRIEVAL - 4 TESTS
  // ============================================

  describe('Review Retrieval', () => {
    it('should get review by ID', async () => {
      mockReviewSDK.getById.and.returnValue(Promise.resolve(mockReview))

      const result = await service.getReviewById(mockReviewId)

      expect(result).toEqual(mockReview)
      expect(mockReviewSDK.getById).toHaveBeenCalledWith(mockReviewId)
    })

    it('should get user reviews', async () => {
      const reviews = [mockReview]
      mockReviewSDK.getByUser.and.returnValue(Promise.resolve(reviews))

      const result = await service.getUserReviews(mockRevieweeId)

      expect(result).toEqual(reviews)
      expect(mockReviewSDK.getByUser).toHaveBeenCalledWith(mockRevieweeId)
    })

    it('should get car reviews', async () => {
      const reviews = [mockReview]
      mockReviewSDK.getByCar.and.returnValue(Promise.resolve(reviews))

      const result = await service.getCarReviews(mockCarId)

      expect(result).toEqual(reviews)
      expect(mockReviewSDK.getByCar).toHaveBeenCalledWith(mockCarId)
    })

    it('should search reviews with filters', async () => {
      const filters: ReviewSearchFilters = {
        reviewer_id: mockReviewerId,
        page: 1,
        pageSize: 20,
        sortBy: 'created_at_desc',
      }

      const paginatedResponse: PaginatedResponse<Review> = {
        data: [mockReview],
        count: 1,
        page: 1,
        pageSize: 20,
        hasMore: false,
      }

      mockReviewSDK.search.and.returnValue(Promise.resolve(paginatedResponse))

      const result = await service.searchReviews(filters)

      expect(result).toEqual(paginatedResponse)
      expect(mockReviewSDK.search).toHaveBeenCalledWith(filters)
    })
  })

  // ============================================
  // STATISTICS - 7 TESTS
  // ============================================

  describe('Statistics', () => {
    it('should get user stats', async () => {
      mockReviewSDK.getUserStats.and.returnValue(Promise.resolve(mockUserStats))

      const result = await service.getUserStats(mockRevieweeId)

      expect(result).toEqual(mockUserStats)
      expect(mockReviewSDK.getUserStats).toHaveBeenCalledWith(mockRevieweeId)
    })

    it('should get car stats', async () => {
      mockReviewSDK.getCarStats.and.returnValue(Promise.resolve(mockCarStats))

      const result = await service.getCarStats(mockCarId)

      expect(result).toEqual(mockCarStats)
      expect(mockReviewSDK.getCarStats).toHaveBeenCalledWith(mockCarId)
    })

    it('should verify user stats has owner ratings', async () => {
      mockReviewSDK.getUserStats.and.returnValue(Promise.resolve(mockUserStats))

      const result = await service.getUserStats(mockRevieweeId)

      expect(result.owner_reviews_count).toBe(15)
      expect(result.owner_rating_avg).toBe(4.8)
      expect(result.owner_rating_cleanliness_avg).toBe(4.9)
      expect(result.owner_rating_communication_avg).toBe(5.0)
    })

    it('should verify user stats has renter ratings', async () => {
      mockReviewSDK.getUserStats.and.returnValue(Promise.resolve(mockUserStats))

      const result = await service.getUserStats(mockRevieweeId)

      expect(result.renter_reviews_count).toBe(8)
      expect(result.renter_rating_avg).toBe(4.5)
      expect(result.renter_rating_cleanliness_avg).toBe(4.6)
    })

    it('should verify user stats has badges', async () => {
      mockReviewSDK.getUserStats.and.returnValue(Promise.resolve(mockUserStats))

      const result = await service.getUserStats(mockRevieweeId)

      expect(result.is_top_host).toBe(true)
      expect(result.is_super_host).toBe(false)
      expect(result.is_verified_renter).toBe(true)
      expect(result.badges).toEqual(['clean', 'punctual'])
    })

    it('should verify car stats has all ratings', async () => {
      mockReviewSDK.getCarStats.and.returnValue(Promise.resolve(mockCarStats))

      const result = await service.getCarStats(mockCarId)

      expect(result.rating_avg).toBe(4.7)
      expect(result.rating_cleanliness_avg).toBe(4.8)
      expect(result.rating_communication_avg).toBe(4.9)
      expect(result.rating_accuracy_avg).toBe(4.6)
      expect(result.rating_location_avg).toBe(4.7)
      expect(result.rating_checkin_avg).toBe(4.8)
      expect(result.rating_value_avg).toBe(4.5)
    })

    it('should verify car stats has booking metrics', async () => {
      mockReviewSDK.getCarStats.and.returnValue(Promise.resolve(mockCarStats))

      const result = await service.getCarStats(mockCarId)

      expect(result.total_bookings).toBe(15)
      expect(result.completed_bookings).toBe(12)
      expect(result.cancelled_bookings).toBe(1)
      expect(result.cancellation_rate).toBeCloseTo(0.067, 2)
      expect(result.acceptance_rate).toBe(0.9)
    })
  })

  // ============================================
  // BIDIRECTIONAL REVIEWS - 4 TESTS
  // ============================================

  describe('Bidirectional Reviews', () => {
    it('should check if user can review booking', async () => {
      mockReviewSDK.canReviewBooking.and.returnValue(Promise.resolve(true))

      const result = await service.canReviewBooking(mockBookingId, mockReviewerId)

      expect(result).toBe(true)
      expect(mockReviewSDK.canReviewBooking).toHaveBeenCalledWith(
        mockBookingId,
        mockReviewerId
      )
    })

    it('should return false when user cannot review booking', async () => {
      mockReviewSDK.canReviewBooking.and.returnValue(Promise.resolve(false))

      const result = await service.canReviewBooking(mockBookingId, mockReviewerId)

      expect(result).toBe(false)
    })

    it('should detect bidirectional review is complete', async () => {
      const renterReview: Review = {
        ...mockReview,
        id: 'review-1',
        review_type: 'user_to_user',
        reviewer_id: 'user-renter',
        reviewee_id: 'user-owner',
      }

      const ownerReview: Review = {
        ...mockReview,
        id: 'review-2',
        review_type: 'car_to_user',
        reviewer_id: 'user-owner',
        reviewee_id: 'user-renter',
      }

      const paginatedResponse: PaginatedResponse<Review> = {
        data: [renterReview, ownerReview],
        count: 2,
        page: 1,
        pageSize: 10,
        hasMore: false,
      }

      mockReviewSDK.search.and.returnValue(Promise.resolve(paginatedResponse))

      const result = await service.isBidirectionalReviewComplete(mockBookingId)

      expect(result).toBe(true)
    })

    it('should detect bidirectional review is incomplete', async () => {
      const renterReview: Review = {
        ...mockReview,
        id: 'review-1',
        review_type: 'user_to_user',
        reviewer_id: 'user-renter',
        reviewee_id: 'user-owner',
      }

      const paginatedResponse: PaginatedResponse<Review> = {
        data: [renterReview],
        count: 1,
        page: 1,
        pageSize: 10,
        hasMore: false,
      }

      mockReviewSDK.search.and.returnValue(Promise.resolve(paginatedResponse))

      const result = await service.isBidirectionalReviewComplete(mockBookingId)

      expect(result).toBe(false)
    })
  })

  // ============================================
  // RATING CALCULATIONS - 3 TESTS
  // ============================================

  describe('Rating Calculations', () => {
    it('should calculate average rating from 5 ratings', () => {
      const ratings = {
        rating_cleanliness: 5,
        rating_communication: 5,
        rating_accuracy: 4,
        rating_checkin: 5,
        rating_value: 4,
      }

      const avg = service.calculateAverageRating(ratings)

      // (5 + 5 + 4 + 5 + 4) / 5 = 4.6
      expect(avg).toBe(4.6)
    })

    it('should calculate average rating from 6 ratings (with location)', () => {
      const ratings = {
        rating_cleanliness: 5,
        rating_communication: 5,
        rating_accuracy: 4,
        rating_checkin: 5,
        rating_value: 4,
        rating_location: 5,
      }

      const avg = service.calculateAverageRating(ratings)

      // (5 + 5 + 4 + 5 + 4 + 5) / 6 = 4.666... ≈ 4.7
      expect(avg).toBe(4.7)
    })

    it('should round average rating to 1 decimal place', () => {
      const ratings = {
        rating_cleanliness: 5,
        rating_communication: 4,
        rating_accuracy: 4,
        rating_checkin: 4,
        rating_value: 4,
      }

      const avg = service.calculateAverageRating(ratings)

      // (5 + 4 + 4 + 4 + 4) / 5 = 4.2
      expect(avg).toBe(4.2)
    })
  })

  // ============================================
  // NOTIFICATIONS - 4 TESTS
  // ============================================

  describe('Notifications', () => {
    it('should send notification for user_to_user review type', async () => {
      const input: CreateReviewInput = {
        ...{
          booking_id: mockBookingId,
          reviewer_id: mockReviewerId,
          reviewee_id: mockRevieweeId,
          review_type: 'user_to_user',
          rating_cleanliness: 5,
          rating_communication: 5,
          rating_accuracy: 4,
          rating_checkin: 5,
          rating_value: 4,
          comment_public: 'Great!',
          would_recommend: true,
        },
        review_type: 'user_to_user',
      }

      mockReviewSDK.canReviewBooking.and.returnValue(Promise.resolve(true))
      mockReviewSDK.create.and.returnValue(Promise.resolve(mockReviewId))
      mockNotificationSDK.create.and.returnValue(Promise.resolve({} as any))

      await service.createReview(input)
      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(mockNotificationSDK.create).toHaveBeenCalledWith(
        jasmine.objectContaining({
          body: 'A renter has reviewed you as a car owner',
        })
      )
    })

    it('should send notification for user_to_car review type', async () => {
      const input: CreateReviewInput = {
        ...{
          booking_id: mockBookingId,
          reviewer_id: mockReviewerId,
          reviewee_id: mockRevieweeId,
          review_type: 'user_to_car',
          rating_cleanliness: 5,
          rating_communication: 5,
          rating_accuracy: 4,
          rating_checkin: 5,
          rating_value: 4,
          comment_public: 'Great!',
          would_recommend: true,
        },
        review_type: 'user_to_car',
      }

      mockReviewSDK.canReviewBooking.and.returnValue(Promise.resolve(true))
      mockReviewSDK.create.and.returnValue(Promise.resolve(mockReviewId))
      mockNotificationSDK.create.and.returnValue(Promise.resolve({} as any))

      await service.createReview(input)
      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(mockNotificationSDK.create).toHaveBeenCalledWith(
        jasmine.objectContaining({
          body: 'A renter has reviewed your car',
        })
      )
    })

    it('should send notification for car_to_user review type', async () => {
      const input: CreateReviewInput = {
        ...{
          booking_id: mockBookingId,
          reviewer_id: mockReviewerId,
          reviewee_id: mockRevieweeId,
          review_type: 'car_to_user',
          rating_cleanliness: 5,
          rating_communication: 5,
          rating_accuracy: 4,
          rating_checkin: 5,
          rating_value: 4,
          comment_public: 'Great!',
          would_recommend: true,
        },
        review_type: 'car_to_user',
      }

      mockReviewSDK.canReviewBooking.and.returnValue(Promise.resolve(true))
      mockReviewSDK.create.and.returnValue(Promise.resolve(mockReviewId))
      mockNotificationSDK.create.and.returnValue(Promise.resolve({} as any))

      await service.createReview(input)
      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(mockNotificationSDK.create).toHaveBeenCalledWith(
        jasmine.objectContaining({
          body: 'A car owner has reviewed you as a renter',
        })
      )
    })

    it('should include metadata in notification', async () => {
      const input: CreateReviewInput = {
        booking_id: mockBookingId,
        reviewer_id: mockReviewerId,
        reviewee_id: mockRevieweeId,
        review_type: 'user_to_user',
        rating_cleanliness: 5,
        rating_communication: 5,
        rating_accuracy: 4,
        rating_checkin: 5,
        rating_value: 4,
        comment_public: 'Great!',
        would_recommend: true,
      }

      mockReviewSDK.canReviewBooking.and.returnValue(Promise.resolve(true))
      mockReviewSDK.create.and.returnValue(Promise.resolve(mockReviewId))
      mockNotificationSDK.create.and.returnValue(Promise.resolve({} as any))

      await service.createReview(input)
      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(mockNotificationSDK.create).toHaveBeenCalledWith(
        jasmine.objectContaining({
          metadata: {
            reviewer_id: mockReviewerId,
            review_type: 'user_to_user',
          },
        })
      )
    })
  })

  // ============================================
  // ERROR SCENARIOS - 5 TESTS
  // ============================================

  describe('Error Scenarios', () => {
    it('should throw ReviewError when review not found', async () => {
      mockReviewSDK.getById.and.returnValue(
        Promise.reject(new Error('Not found'))
      )

      await expectAsync(service.getReviewById('invalid-id')).toBeRejectedWith(
        jasmine.objectContaining({
          code: ReviewErrorCode.REVIEW_NOT_FOUND,
          statusCode: 404,
        })
      )
    })

    it('should throw error when all ratings are invalid', async () => {
      const invalidInput: CreateReviewInput = {
        booking_id: mockBookingId,
        reviewer_id: mockReviewerId,
        reviewee_id: mockRevieweeId,
        review_type: 'user_to_user',
        rating_cleanliness: 0,
        rating_communication: 0,
        rating_accuracy: 0,
        rating_checkin: 0,
        rating_value: 0,
        comment_public: 'Bad',
        would_recommend: false,
      }

      await expectAsync(service.createReview(invalidInput)).toBeRejectedWith(
        jasmine.objectContaining({
          code: ReviewErrorCode.INVALID_RATINGS,
        })
      )
    })

    it('should throw error when optional rating_location is invalid', async () => {
      const invalidInput: CreateReviewInput = {
        booking_id: mockBookingId,
        reviewer_id: mockReviewerId,
        reviewee_id: mockRevieweeId,
        review_type: 'user_to_user',
        rating_cleanliness: 5,
        rating_communication: 5,
        rating_accuracy: 4,
        rating_checkin: 5,
        rating_value: 4,
        rating_location: 10,
        comment_public: 'Good',
        would_recommend: true,
      }

      await expectAsync(service.createReview(invalidInput)).toBeRejectedWith(
        jasmine.objectContaining({
          code: ReviewErrorCode.INVALID_RATINGS,
        })
      )
    })

    it('should propagate SDK errors correctly', async () => {
      mockReviewSDK.getByUser.and.returnValue(
        Promise.reject(new Error('Database connection failed'))
      )

      await expectAsync(
        service.getUserReviews(mockRevieweeId)
      ).toBeRejectedWithError('Database connection failed')
    })

    it('should handle bidirectional check failure gracefully', async () => {
      mockReviewSDK.search.and.returnValue(
        Promise.reject(new Error('Search failed'))
      )

      await expectAsync(
        service.isBidirectionalReviewComplete(mockBookingId)
      ).toBeRejectedWithError('Search failed')
    })
  })
})
/* Review service tests completed */
/* eslint-enable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-argument */
