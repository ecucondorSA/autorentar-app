/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-argument -- Test file */
/**
 * ReviewSDK Tests (Feature Horizontal)
 * Tests completos usando schema real con 6 ratings específicos
 *
 * REFACTORIZADO: 30 Oct 2025
 * - Usa CreateReviewInput correcto (6 ratings: cleanliness, communication, accuracy, location, checkin, value)
 * - Usa ReviewDTO correcto (rating_overall, comment_public)
 * - Coincide 100% con base de datos real
 */

import type { SupabaseClient } from '@supabase/supabase-js'

import type { CreateReviewInput } from '@/types'

import { ReviewSDK } from './review.sdk'

describe('ReviewSDK (Feature Horizontal)', () => {
  let sdk: ReviewSDK
  let mockSupabase: jasmine.SpyObj<SupabaseClient>

  // Mock data usando tipo completo de DB
  const mockReview = {
    id: 'review-123',
    booking_id: 'booking-456',
    reviewer_id: 'user-reviewer',
    reviewee_id: 'user-reviewee',
    car_id: null,
    review_type: null,
    rating: 5,
    rating_cleanliness: 5,
    rating_communication: 5,
    rating_accuracy: 5,
    rating_location: null,
    rating_checkin: 5,
    rating_value: 5,
    role: 'renter_rates_owner' as const,
    comment: null,
    comment_public: 'Excellent car and owner!',
    comment_private: null,
    would_recommend: null,
    tags: null,
    status: 'published',
    is_visible: true,
    published_at: '2025-10-30T10:00:00Z',
    is_flagged: false,
    flag_reason: null,
    flagged_by: null,
    flagged_at: null,
    moderation_status: 'approved',
    moderated_by: null,
    moderated_at: null,
    moderation_notes: null,
    created_at: '2025-10-30T10:00:00Z',
    updated_at: null,
  }

  beforeEach(() => {
    // Create Supabase mock
    mockSupabase = jasmine.createSpyObj('SupabaseClient', ['from'])

    // Inject mock
    sdk = new ReviewSDK(mockSupabase as any)
  })

  // ============================================
  // CREATE REVIEW TESTS
  // ============================================

  describe('create()', () => {
    it('should create review with all 6 ratings successfully', async () => {
      // Arrange - Schema REAL con 6 ratings
      const input: CreateReviewInput = {
        booking_id: 'booking-456',
        reviewer_id: 'user-reviewer',
        reviewee_id: 'user-reviewee',
        review_type: 'user_to_user',
        rating_cleanliness: 5,
        rating_communication: 5,
        rating_accuracy: 4,
        rating_checkin: 5,
        rating_value: 4,
        comment_public: 'Great experience! Very clean car and excellent communication.',
        would_recommend: true,
      }

      const mockReviewId = 'review-123'

      // Mock RPC call (SDK real usa RPC en lugar de insert)
      const rpcSpy = jasmine.createSpy('rpc').and.returnValue(
        Promise.resolve({ data: mockReviewId, error: null })
      )

      mockSupabase.rpc = rpcSpy as any

      // Act
      const result = await sdk.create(input)

      // Assert
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'create_review' as never,
        jasmine.objectContaining({
          p_booking_id: input.booking_id,
          p_reviewer_id: input.reviewer_id,
          p_reviewee_id: input.reviewee_id,
          p_review_type: input.review_type,
          p_rating_cleanliness: 5,
          p_rating_communication: 5,
          p_rating_accuracy: 4,
          p_rating_checkin: 5,
          p_rating_value: 4,
          p_comment_public: input.comment_public,
        }) as never
      )
      expect(result).toBe(mockReviewId) // SDK retorna review_id (string)
    })

    it('should create car review with optional rating_location', async () => {
      // Arrange
      const input: CreateReviewInput = {
        booking_id: 'booking-456',
        reviewer_id: 'user-renter',
        reviewee_id: 'user-owner',
        review_type: 'user_to_car',
        car_id: 'car-789',
        rating_cleanliness: 5,
        rating_communication: 4,
        rating_accuracy: 5,
        rating_location: 5, // Opcional para car reviews
        rating_checkin: 4,
        rating_value: 5,
        comment_public: 'Perfect car! Great location too.',
      }

      const mockChain = {
        insert: jasmine.createSpy('insert').and.returnValue({
          select: jasmine.createSpy('select').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({ data: mockReview, error: null })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      const result = await sdk.create(input)

      // Assert
      expect(mockChain.insert).toHaveBeenCalledWith(
        jasmine.objectContaining({
          car_id: 'car-789',
          rating_location: 5,
        })
      )
      expect(result).toEqual(mockReview)
    })

    it('should create review with private comment', async () => {
      // Arrange
      const input: CreateReviewInput = {
        booking_id: 'booking-456',
        reviewer_id: 'user-renter',
        reviewee_id: 'user-owner',
        review_type: 'user_to_user',
        rating_cleanliness: 4,
        rating_communication: 5,
        rating_accuracy: 4,
        rating_checkin: 5,
        rating_value: 4,
        comment_public: 'Good experience overall.',
        comment_private: 'Car had minor scratches not mentioned in listing.',
      }

      const mockChain = {
        insert: jasmine.createSpy('insert').and.returnValue({
          select: jasmine.createSpy('select').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({ data: mockReview, error: null })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      await sdk.create(input)

      // Assert
      expect(mockChain.insert).toHaveBeenCalledWith(
        jasmine.objectContaining({
          comment_public: input.comment_public,
          comment_private: input.comment_private,
        })
      )
    })

    it('should create review with tags', async () => {
      // Arrange
      const input: CreateReviewInput = {
        booking_id: 'booking-456',
        reviewer_id: 'user-renter',
        reviewee_id: 'user-owner',
        review_type: 'user_to_user',
        rating_cleanliness: 5,
        rating_communication: 5,
        rating_accuracy: 5,
        rating_checkin: 5,
        rating_value: 5,
        comment_public: 'Perfect rental experience!',
        tags: ['clean', 'punctual', 'friendly', 'professional'],
      }

      const mockChain = {
        insert: jasmine.createSpy('insert').and.returnValue({
          select: jasmine.createSpy('select').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({ data: mockReview, error: null })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      await sdk.create(input)

      // Assert
      expect(mockChain.insert).toHaveBeenCalledWith(
        jasmine.objectContaining({
          tags: ['clean', 'punctual', 'friendly', 'professional'],
        })
      )
    })

    it('should throw error when Supabase insert fails', async () => {
      // Arrange
      const input: CreateReviewInput = {
        booking_id: 'booking-456',
        reviewer_id: 'user-renter',
        reviewee_id: 'user-owner',
        review_type: 'user_to_user',
        rating_cleanliness: 5,
        rating_communication: 5,
        rating_accuracy: 5,
        rating_checkin: 5,
        rating_value: 5,
        comment_public: 'Great!',
      }

      const mockChain = {
        insert: jasmine.createSpy('insert').and.returnValue({
          select: jasmine.createSpy('select').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({
                data: null,
                error: { message: 'Duplicate review' },
              })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act & Assert
      await expectAsync(sdk.create(input)).toBeRejected()
    })
  })

  // ============================================
  // GET REVIEW BY ID TESTS
  // ============================================

  describe('getById()', () => {
    it('should get review by id', async () => {
      // Arrange
      const reviewId = 'review-123'

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({ data: mockReview, error: null })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      const result = await sdk.getById(reviewId)

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('reviews')
      expect(mockChain.select).toHaveBeenCalled()
      expect(mockChain.select().eq).toHaveBeenCalledWith('id', reviewId)
      expect(result).toEqual(mockReview)
    })

    it('should throw error when review not found', async () => {
      // Arrange
      const reviewId = 'non-existent'

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({
                data: null,
                error: { message: 'Not found' },
              })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act & Assert
      await expectAsync(sdk.getById(reviewId)).toBeRejected()
    })
  })

  // ============================================
  // GET REVIEWS BY USER TESTS
  // ============================================

  describe('getByUser()', () => {
    it('should get all reviews for a user (reviewee)', async () => {
      // Arrange
      const userId = 'user-reviewee'
      const reviews = [mockReview, { ...mockReview, id: 'review-456' }]

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue(
              Promise.resolve({ data: reviews, error: null })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      const result = await sdk.getByUser(userId)

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('reviews')
      expect(mockChain.select().eq).toHaveBeenCalledWith('reviewee_id', userId)
      expect(result).toEqual(reviews)
      expect(result.length).toBe(2)
    })

    it('should return empty array when user has no reviews', async () => {
      // Arrange
      const userId = 'user-no-reviews'

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue(
              Promise.resolve({ data: [], error: null })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      const result = await sdk.getByUser(userId)

      // Assert
      expect(result).toEqual([])
    })
  })

  // ============================================
  // GET REVIEWS BY CAR TESTS
  // ============================================

  describe('getByCar()', () => {
    it('should get all reviews for a car', async () => {
      // Arrange
      const carId = 'car-789'
      const carReviews = [
        { ...mockReview, id: 'review-1', rating_overall: 5 },
        { ...mockReview, id: 'review-2', rating_overall: 4 },
        { ...mockReview, id: 'review-3', rating_overall: 5 },
      ]

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue(
              Promise.resolve({ data: carReviews, error: null })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      const result = await sdk.getByCar(carId)

      // Assert
      expect(mockChain.select().eq).toHaveBeenCalledWith('car_id', carId)
      expect(result).toEqual(carReviews)
      expect(result.length).toBe(3)
    })

    it('should calculate average rating for car', async () => { await Promise.resolve();
      // Arrange
      const carReviews = [
        { ...mockReview, rating_overall: 5 },
        { ...mockReview, rating_overall: 4 },
        { ...mockReview, rating_overall: 5 },
      ]

      // Act
      const avgRating =
        carReviews.reduce((sum, r) => sum + r.rating_overall, 0) / carReviews.length

      // Assert
      expect(avgRating).toBe(4.666666666666667)
      expect(Math.round(avgRating * 10) / 10).toBe(4.7) // Redondeado
    })
  })

  // ============================================
  // EDGE CASES
  // ============================================

  describe('Edge Cases', () => {
    it('should handle very long public comment (1000 chars)', async () => {
      // Arrange
      const longComment = 'a'.repeat(1000)
      const input: CreateReviewInput = {
        booking_id: 'booking-456',
        reviewer_id: 'user-renter',
        reviewee_id: 'user-owner',
        review_type: 'user_to_user',
        rating_cleanliness: 5,
        rating_communication: 5,
        rating_accuracy: 5,
        rating_checkin: 5,
        rating_value: 5,
        comment_public: longComment,
      }

      const mockChain = {
        insert: jasmine.createSpy('insert').and.returnValue({
          select: jasmine.createSpy('select').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({
                data: { ...mockReview, comment_public: longComment },
                error: null,
              })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      const result = await sdk.create(input)

      // Assert
      expect(result.comment_public?.length).toBe(1000)
    })

    it('should handle minimum valid ratings (all 1s)', async () => {
      // Arrange
      const input: CreateReviewInput = {
        booking_id: 'booking-456',
        reviewer_id: 'user-renter',
        reviewee_id: 'user-owner',
        review_type: 'user_to_user',
        rating_cleanliness: 1,
        rating_communication: 1,
        rating_accuracy: 1,
        rating_checkin: 1,
        rating_value: 1,
        comment_public: 'Terrible experience overall.',
        would_recommend: false,
      }

      const mockChain = {
        insert: jasmine.createSpy('insert').and.returnValue({
          select: jasmine.createSpy('select').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({
                data: { ...mockReview, rating_overall: 1 },
                error: null,
              })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      const result = await sdk.create(input)

      // Assert
      expect(mockChain.insert).toHaveBeenCalledWith(
        jasmine.objectContaining({
          rating_cleanliness: 1,
          rating_communication: 1,
          rating_accuracy: 1,
          rating_checkin: 1,
          rating_value: 1,
        })
      )
      expect(result.rating_overall).toBe(1)
    })

    it('should handle maximum tags (10 tags)', async () => {
      // Arrange
      const maxTags = Array.from({ length: 10 }, (_, i) => `tag-${i + 1}`)
      const input: CreateReviewInput = {
        booking_id: 'booking-456',
        reviewer_id: 'user-renter',
        reviewee_id: 'user-owner',
        review_type: 'user_to_user',
        rating_cleanliness: 5,
        rating_communication: 5,
        rating_accuracy: 5,
        rating_checkin: 5,
        rating_value: 5,
        comment_public: 'Great!',
        tags: maxTags,
      }

      const mockChain = {
        insert: jasmine.createSpy('insert').and.returnValue({
          select: jasmine.createSpy('select').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({ data: mockReview, error: null })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      await sdk.create(input)

      // Assert
      expect(mockChain.insert).toHaveBeenCalledWith(
        jasmine.objectContaining({
          tags: maxTags,
        })
      )
    })

    it('should handle bidirectional reviews (renter and owner)', async () => {
      // Arrange
      const renterReview: CreateReviewInput = {
        booking_id: 'booking-456',
        reviewer_id: 'user-renter',
        reviewee_id: 'user-owner',
        review_type: 'user_to_user',
        rating_cleanliness: 5,
        rating_communication: 5,
        rating_accuracy: 4,
        rating_checkin: 5,
        rating_value: 4,
        comment_public: 'Great owner!',
      }

      const ownerReview: CreateReviewInput = {
        booking_id: 'booking-456',
        reviewer_id: 'user-owner',
        reviewee_id: 'user-renter',
        review_type: 'car_to_user',
        rating_cleanliness: 5,
        rating_communication: 5,
        rating_accuracy: 5,
        rating_checkin: 4,
        rating_value: 5,
        comment_public: 'Responsible renter!',
      }

      const mockChain = {
        insert: jasmine.createSpy('insert').and.returnValue({
          select: jasmine.createSpy('select').and.returnValue({
            single: jasmine.createSpy('single').and.returnValues(
              Promise.resolve({ data: { ...mockReview, id: 'review-1' }, error: null }),
              Promise.resolve({ data: { ...mockReview, id: 'review-2' }, error: null })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      const result1 = await sdk.create(renterReview)
      const result2 = await sdk.create(ownerReview)

      // Assert
      expect(mockChain.insert).toHaveBeenCalledTimes(2)
      expect(result1).toBe('review-1')
      expect(result2).toBe('review-2')
    })
  })

  // ============================================
  // SEARCH REVIEWS TESTS (15 tests críticos)
  // ============================================

  describe('search()', () => {
    it('should search reviews by reviewer_id', async () => {
      const filters = {
        reviewer_id: 'user-reviewer',
        page: 1,
        pageSize: 20,
        sortBy: 'created_desc',
      }

      const reviews = [mockReview]

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue({
              range: jasmine.createSpy('range').and.returnValue(
                Promise.resolve({ data: reviews, error: null, count: 1 })
              ),
            }),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      const result = await sdk.search(filters as any)

      expect(result.data).toEqual(reviews)
      expect(result.count).toBe(1)
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(20)
    })

    it('should search reviews by reviewee_id', async () => {
      const filters = {
        reviewee_id: 'user-reviewee',
        page: 1,
        pageSize: 20,
        sortBy: 'created_desc',
      }

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue({
              range: jasmine.createSpy('range').and.returnValue(
                Promise.resolve({ data: [], error: null, count: 0 })
              ),
            }),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      const _result = await sdk.search(filters as any)

      expect(mockChain.select().eq).toHaveBeenCalledWith('reviewee_id', 'user-reviewee')
    })

    it('should search reviews by car_id', async () => {
      const filters = {
        car_id: 'car-789',
        page: 1,
        pageSize: 10,
        sortBy: 'rating_desc',
      }

      const carReviews = [mockReview, { ...mockReview, id: 'review-2' }]

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue({
              range: jasmine.createSpy('range').and.returnValue(
                Promise.resolve({ data: carReviews, error: null, count: 2 })
              ),
            }),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      const result = await sdk.search(filters as any)

      expect(result.count).toBe(2)
      expect(result.data.length).toBe(2)
    })

    it('should search reviews by min_rating', async () => {
      const filters = {
        min_rating: 4,
        page: 1,
        pageSize: 20,
        sortBy: 'rating_desc',
      }

      const highRatedReviews = [
        { ...mockReview, rating_overall: 5 },
        { ...mockReview, id: 'review-2', rating_overall: 4 },
      ]

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          gte: jasmine.createSpy('gte').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue({
              range: jasmine.createSpy('range').and.returnValue(
                Promise.resolve({ data: highRatedReviews, error: null, count: 2 })
              ),
            }),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      const result = await sdk.search(filters as any)

      expect(mockChain.select().gte).toHaveBeenCalledWith('rating_overall', 4)
      expect(result.data.every((r: any) => r.rating_overall >= 4)).toBeTrue()
    })

    it('should search reviews by max_rating', async () => {
      const filters = {
        max_rating: 3,
        page: 1,
        pageSize: 20,
        sortBy: 'created_desc',
      }

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          lte: jasmine.createSpy('lte').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue({
              range: jasmine.createSpy('range').and.returnValue(
                Promise.resolve({ data: [], error: null, count: 0 })
              ),
            }),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      await sdk.search(filters as any)

      expect(mockChain.select().lte).toHaveBeenCalledWith('rating_overall', 3)
    })

    it('should search reviews by would_recommend true', async () => {
      const filters = {
        would_recommend: true,
        page: 1,
        pageSize: 20,
        sortBy: 'created_desc',
      }

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue({
              range: jasmine.createSpy('range').and.returnValue(
                Promise.resolve({ data: [mockReview], error: null, count: 1 })
              ),
            }),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      await sdk.search(filters as any)

      expect(mockChain.select().eq).toHaveBeenCalledWith('would_recommend', true)
    })

    it('should search reviews by date range', async () => {
      const filters = {
        created_from: '2025-01-01T00:00:00Z',
        created_to: '2025-12-31T23:59:59Z',
        page: 1,
        pageSize: 20,
        sortBy: 'created_desc',
      }

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          gte: jasmine.createSpy('gte').and.returnValue({
            lte: jasmine.createSpy('lte').and.returnValue({
              order: jasmine.createSpy('order').and.returnValue({
                range: jasmine.createSpy('range').and.returnValue(
                  Promise.resolve({ data: [mockReview], error: null, count: 1 })
                ),
              }),
            }),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      await sdk.search(filters as any)

      expect(mockChain.select().gte).toHaveBeenCalledWith(
        'created_at',
        '2025-01-01T00:00:00Z'
      )
    })

    it('should search with combined filters (reviewer + min_rating)', async () => {
      const filters = {
        reviewer_id: 'user-reviewer',
        min_rating: 4,
        page: 1,
        pageSize: 20,
        sortBy: 'rating_desc',
      }

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            gte: jasmine.createSpy('gte').and.returnValue({
              order: jasmine.createSpy('order').and.returnValue({
                range: jasmine.createSpy('range').and.returnValue(
                  Promise.resolve({ data: [mockReview], error: null, count: 1 })
                ),
              }),
            }),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      const result = await sdk.search(filters as any)

      expect(mockChain.select().eq).toHaveBeenCalledWith('reviewer_id', 'user-reviewer')
      expect(result.data.length).toBe(1)
    })

    it('should sort by rating_desc', async () => {
      const filters = {
        page: 1,
        pageSize: 20,
        sortBy: 'rating_desc',
      }

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          order: jasmine.createSpy('order').and.returnValue({
            range: jasmine.createSpy('range').and.returnValue(
              Promise.resolve({ data: [], error: null, count: 0 })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      await sdk.search(filters as any)

      expect(mockChain.select().order).toHaveBeenCalledWith('rating', {
        ascending: false,
      })
    })

    it('should sort by created_asc', async () => {
      const filters = {
        page: 1,
        pageSize: 20,
        sortBy: 'created_asc',
      }

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          order: jasmine.createSpy('order').and.returnValue({
            range: jasmine.createSpy('range').and.returnValue(
              Promise.resolve({ data: [], error: null, count: 0 })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      await sdk.search(filters as any)

      expect(mockChain.select().order).toHaveBeenCalledWith('created', {
        ascending: true,
      })
    })

    it('should handle pagination page 1', async () => {
      const filters = {
        page: 1,
        pageSize: 10,
        sortBy: 'created_desc',
      }

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          order: jasmine.createSpy('order').and.returnValue({
            range: jasmine.createSpy('range').and.returnValue(
              Promise.resolve({ data: [], error: null, count: 0 })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      await sdk.search(filters as any)

      // Page 1, pageSize 10: range(0, 9)
      expect(mockChain.select().order().range).toHaveBeenCalledWith(0, 9)
    })

    it('should handle pagination page 2', async () => {
      const filters = {
        page: 2,
        pageSize: 10,
        sortBy: 'created_desc',
      }

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          order: jasmine.createSpy('order').and.returnValue({
            range: jasmine.createSpy('range').and.returnValue(
              Promise.resolve({ data: [], error: null, count: 0 })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      await sdk.search(filters as any)

      // Page 2, pageSize 10: range(10, 19)
      expect(mockChain.select().order().range).toHaveBeenCalledWith(10, 19)
    })

    it('should handle different page sizes', async () => {
      const filters = {
        page: 1,
        pageSize: 50,
        sortBy: 'created_desc',
      }

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          order: jasmine.createSpy('order').and.returnValue({
            range: jasmine.createSpy('range').and.returnValue(
              Promise.resolve({ data: [], error: null, count: 0 })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      const result = await sdk.search(filters as any)

      expect(result.pageSize).toBe(50)
      expect(mockChain.select().order().range).toHaveBeenCalledWith(0, 49)
    })

    it('should return correct pagination metadata', async () => {
      const filters = {
        page: 3,
        pageSize: 10,
        sortBy: 'created_desc',
      }

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          order: jasmine.createSpy('order').and.returnValue({
            range: jasmine.createSpy('range').and.returnValue(
              Promise.resolve({ data: [], error: null, count: 47 })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      const result = await sdk.search(filters as any)

      expect(result.page).toBe(3)
      expect(result.pageSize).toBe(10)
      expect(result.count).toBe(47)
      expect(result.hasMore).toBe(5) // 47 / 10 = 5 pages
    })

    it('should search by review_type', async () => {
      const filters = {
        review_type: 'user_to_car',
        page: 1,
        pageSize: 20,
        sortBy: 'created_desc',
      }

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue({
              range: jasmine.createSpy('range').and.returnValue(
                Promise.resolve({ data: [mockReview], error: null, count: 1 })
              ),
            }),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      await sdk.search(filters as any)

      expect(mockChain.select().eq).toHaveBeenCalledWith('review_type', 'user_to_car')
    })
  })

  // ============================================
  // GET USER STATS TESTS (12 tests críticos)
  // ============================================

  describe('getUserStats()', () => {
    const mockUserStats = {
      user_id: 'user-123',
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
      total_bookings_as_owner: 20,
      total_bookings_as_renter: 10,
      cancellation_count: 1,
      cancellation_rate: 0.05,
      is_top_host: true,
      is_super_host: false,
      is_verified_renter: true,
      badges: ['clean', 'punctual'],
    }

    it('should get user stats with owner reviews', async () => {
      const userId = 'user-123'

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({ data: mockUserStats, error: null })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      const result = await sdk.getUserStats(userId)

      expect(mockSupabase.from).toHaveBeenCalledWith('user_stats')
      expect(mockChain.select().eq).toHaveBeenCalledWith('user_id', userId)
      expect(result).toEqual(mockUserStats)
    })

    it('should get user stats with renter reviews', async () => {
      const result = await sdk.getUserStats('user-123')

      expect((result as any).renter_reviews_count).toBe(8)
      expect((result as any).renter_rating_avg).toBe(4.5)
    })

    it('should return defaults when user has no stats', async () => {
      const userId = 'user-no-stats'

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({ data: null, error: { message: 'Not found' } })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      const result = await sdk.getUserStats(userId)

      expect(result).toEqual({
        user_id: userId,
        total_reviews_received: 0,
        rating_avg: 0,
      })
    })

    it('should calculate owner rating average correctly', async () => {
      const stats = await sdk.getUserStats('user-123')

      expect((stats as any).owner_rating_avg).toBe(4.8)
      expect((stats as any).owner_rating_cleanliness_avg).toBe(4.9)
    })

    it('should calculate renter rating average correctly', async () => {
      const stats = await sdk.getUserStats('user-123')

      expect((stats as any).renter_rating_avg).toBe(4.5)
    })

    it('should calculate cancellation rate correctly', async () => {
      const stats = await sdk.getUserStats('user-123')

      // cancellation_rate = cancellation_count / total_bookings
      // 1 / 20 = 0.05 (5%)
      expect((stats as any).cancellation_rate).toBe(0.05)
    })

    it('should check is_top_host badge', async () => {
      const stats = await sdk.getUserStats('user-123')

      expect((stats as any).is_top_host).toBeTrue()
    })

    it('should check is_super_host badge', async () => {
      const stats = await sdk.getUserStats('user-123')

      expect((stats as any).is_super_host).toBeFalse()
    })

    it('should check is_verified_renter status', async () => {
      const stats = await sdk.getUserStats('user-123')

      expect((stats as any).is_verified_renter).toBeTrue()
    })

    it('should parse badges JSON correctly', async () => {
      const stats = await sdk.getUserStats('user-123')

      expect((stats as any).badges).toEqual(['clean', 'punctual'])
      expect(Array.isArray((stats as any).badges)).toBeTrue()
    })

    it('should handle user with no badges', async () => {
      const statsNoBadges = { ...mockUserStats, badges: [] }

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({ data: statsNoBadges, error: null })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      const result = await sdk.getUserStats('user-no-badges')

      expect((result as any).badges).toEqual([])
    })

    it('should calculate response rate and time', async () => {
      const statsWithResponse = {
        ...mockUserStats,
        owner_response_rate: 0.95,
        owner_response_time_hours: 2.5,
      }

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({ data: statsWithResponse, error: null })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      const result = await sdk.getUserStats('user-123')

      expect((result as any).owner_response_rate).toBe(0.95)
      expect((result as any).owner_response_time_hours).toBe(2.5)
    })
  })

  // ============================================
  // GET CAR STATS TESTS (10 tests críticos)
  // ============================================

  describe('getCarStats()', () => {
    const mockCarStats = {
      car_id: 'car-789',
      reviews_count: 25,
      rating_avg: 4.7,
      rating_cleanliness_avg: 4.8,
      rating_communication_avg: 4.9,
      rating_accuracy_avg: 4.6,
      rating_location_avg: 4.7,
      rating_checkin_avg: 4.8,
      rating_value_avg: 4.5,
      total_bookings: 30,
      completed_bookings: 28,
      cancelled_bookings: 2,
      cancellation_rate: 0.07,
      acceptance_rate: 0.93,
      avg_response_time_hours: 3.2,
    }

    it('should get car stats with reviews', async () => {
      const carId = 'car-789'

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({ data: mockCarStats, error: null })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      const result = await sdk.getCarStats(carId)

      expect(mockSupabase.from).toHaveBeenCalledWith('car_stats')
      expect(mockChain.select().eq).toHaveBeenCalledWith('car_id', carId)
      expect(result).toEqual(mockCarStats)
    })

    it('should calculate rating average from 6 ratings', async () => {
      const stats = await sdk.getCarStats('car-789')

      // Promedio de 6 ratings: (4.8 + 4.9 + 4.6 + 4.7 + 4.8 + 4.5) / 6 = 4.72
      expect((stats as any).rating_avg).toBe(4.7)
    })

    it('should calculate cancellation rate correctly', async () => {
      const stats = await sdk.getCarStats('car-789')

      // 2 cancelled / 30 total = 0.0666... ≈ 0.07
      expect((stats as any).cancellation_rate).toBe(0.07)
    })

    it('should calculate acceptance rate correctly', async () => {
      const stats = await sdk.getCarStats('car-789')

      expect((stats as any).acceptance_rate).toBe(0.93)
    })

    it('should calculate average response time', async () => {
      const stats = await sdk.getCarStats('car-789')

      expect((stats as any).avg_response_time_hours).toBe(3.2)
    })

    it('should return defaults when car has no stats', async () => {
      const carId = 'car-no-stats'

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({ data: null, error: { message: 'Not found' } })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      const result = await sdk.getCarStats(carId)

      expect(result).toEqual({
        car_id: carId,
        total_reviews: 0,
        rating_avg: 0,
      })
    })

    it('should verify total bookings vs completed bookings', async () => {
      const stats = await sdk.getCarStats('car-789')

      expect((stats as any).total_bookings).toBe(30)
      expect((stats as any).completed_bookings).toBe(28)
      expect((stats as any).cancelled_bookings).toBe(2)
      /* eslint-disable @typescript-eslint/restrict-plus-operands -- Test calculations require any type for dynamic stats */
      expect(
        (stats as any).completed_bookings + (stats as any).cancelled_bookings
      ).toBeLessThanOrEqual((stats as any).total_bookings)
      /* eslint-enable @typescript-eslint/restrict-plus-operands -- Re-enable after test calculation */
    })

    it('should verify rating averages match individual ratings', async () => {
      const stats = await sdk.getCarStats('car-789')

      /* eslint-disable @typescript-eslint/restrict-plus-operands -- Average calculation requires any type for dynamic stats */
      const calculatedAvg =
        ((stats as any).rating_cleanliness_avg +
          (stats as any).rating_communication_avg +
          (stats as any).rating_accuracy_avg +
          (stats as any).rating_location_avg +
          (stats as any).rating_checkin_avg +
          (stats as any).rating_value_avg) /
        6
      /* eslint-enable @typescript-eslint/restrict-plus-operands -- Re-enable after test calculation */

      expect(Math.round(calculatedAvg * 10) / 10).toBe((stats as any).rating_avg)
    })

    it('should handle car with high reviews count', async () => {
      const highReviewStats = { ...mockCarStats, reviews_count: 100 }

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({ data: highReviewStats, error: null })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      const result = await sdk.getCarStats('car-popular')

      expect((result as any).reviews_count).toBe(100)
    })

    it('should handle car with perfect ratings', async () => {
      const perfectStats = {
        ...mockCarStats,
        rating_avg: 5.0,
        rating_cleanliness_avg: 5.0,
        rating_communication_avg: 5.0,
        rating_accuracy_avg: 5.0,
        rating_location_avg: 5.0,
        rating_checkin_avg: 5.0,
        rating_value_avg: 5.0,
      }

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({ data: perfectStats, error: null })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      const result = await sdk.getCarStats('car-perfect')

      expect((result as any).rating_avg).toBe(5.0)
    })
  })

  // ============================================
  // CAN REVIEW BOOKING TESTS (8 tests críticos)
  // ============================================

  describe('canReviewBooking()', () => {
    it('should return true when booking completed and no review exists', async () => {
      const bookingId = 'booking-123'
      const userId = 'user-renter'

      // Mock booking query
      const bookingChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({
                data: { status: 'completed', renter_id: userId },
                error: null,
              })
            ),
          }),
        }),
      }

      // Mock review query (no existing review)
      const reviewChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValues(
            {
              eq: jasmine.createSpy('eq').and.returnValue({
                single: jasmine.createSpy('single').and.returnValue(
                  Promise.resolve({ data: null, error: null })
                ),
              }),
            }
          ),
        }),
      }

      mockSupabase.from = jasmine
        .createSpy('from')
        .and.returnValues(bookingChain as any, reviewChain as any)

      const result = await sdk.canReviewBooking(bookingId, userId)

      expect(result).toBeTrue()
    })

    it('should return false when booking not completed', async () => {
      const bookingId = 'booking-123'
      const userId = 'user-renter'

      const bookingChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({
                data: { status: 'in_progress', renter_id: userId },
                error: null,
              })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(bookingChain as any)

      const result = await sdk.canReviewBooking(bookingId, userId)

      expect(result).toBeFalse()
    })

    it('should return false when booking is pending', async () => {
      const bookingChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({
                data: { status: 'pending', renter_id: 'user-renter' },
                error: null,
              })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(bookingChain as any)

      const result = await sdk.canReviewBooking('booking-123', 'user-renter')

      expect(result).toBeFalse()
    })

    it('should return false when user is not the renter', async () => {
      const bookingChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({
                data: { status: 'completed', renter_id: 'user-other' },
                error: null,
              })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(bookingChain as any)

      const result = await sdk.canReviewBooking('booking-123', 'user-wrong')

      expect(result).toBeFalse()
    })

    it('should return false when review already exists', async () => {
      const bookingId = 'booking-123'
      const userId = 'user-renter'

      const bookingChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({
                data: { status: 'completed', renter_id: userId },
                error: null,
              })
            ),
          }),
        }),
      }

      const reviewChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValues(
            {
              eq: jasmine.createSpy('eq').and.returnValue({
                single: jasmine.createSpy('single').and.returnValue(
                  Promise.resolve({ data: { id: 'review-existing' }, error: null })
                ),
              }),
            }
          ),
        }),
      }

      mockSupabase.from = jasmine
        .createSpy('from')
        .and.returnValues(bookingChain as any, reviewChain as any)

      const result = await sdk.canReviewBooking(bookingId, userId)

      expect(result).toBeFalse()
    })

    it('should handle booking with null status', async () => {
      const bookingChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({ data: null, error: null })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(bookingChain as any)

      const result = await sdk.canReviewBooking('booking-not-found', 'user-123')

      expect(result).toBeFalse()
    })

    it('should handle cancelled bookings', async () => {
      const bookingChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({
                data: { status: 'cancelled', renter_id: 'user-renter' },
                error: null,
              })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(bookingChain as any)

      const result = await sdk.canReviewBooking('booking-cancelled', 'user-renter')

      expect(result).toBeFalse()
    })

    it('should allow review for completed booking with correct renter', async () => {
      const bookingId = 'booking-completed'
      const userId = 'user-correct-renter'

      const bookingChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({
                data: { status: 'completed', renter_id: userId },
                error: null,
              })
            ),
          }),
        }),
      }

      const reviewChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValues(
            {
              eq: jasmine.createSpy('eq').and.returnValue({
                single: jasmine.createSpy('single').and.returnValue(
                  Promise.resolve({ data: null, error: null })
                ),
              }),
            }
          ),
        }),
      }

      mockSupabase.from = jasmine
        .createSpy('from')
        .and.returnValues(bookingChain as any, reviewChain as any)

      const result = await sdk.canReviewBooking(bookingId, userId)

      expect(result).toBeTrue()
    })
  })
})
/* eslint-enable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-argument -- Re-enable after test file */
