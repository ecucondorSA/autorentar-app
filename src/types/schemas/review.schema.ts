/**
 * Zod Schemas para Review (Reseñas)
 * Validación runtime para creación y búsqueda de reseñas
 */

import { z } from 'zod'

// ============================================
// ENUMS
// ============================================

export const ReviewTypeEnum = z.enum(['user_to_user', 'user_to_car', 'car_to_user'])

export const RatingRoleEnum = z.enum(['reviewer', 'reviewee'])

// ============================================
// RATING VALIDATION
// ============================================

const RatingSchema = z.number().int().min(1, 'Rating mínimo: 1').max(5, 'Rating máximo: 5')

// ============================================
// CREATE REVIEW INPUT
// ============================================

/**
 * Schema para crear una reseña
 * Debe ser llamado después de completar un booking
 */
export const CreateReviewInputSchema = z.object({
  // Required IDs
  booking_id: z.string().uuid('ID de booking inválido'),
  reviewer_id: z.string().uuid('ID de reviewer inválido'),
  reviewee_id: z.string().uuid('ID de reviewee inválido'),

  // Review type
  review_type: ReviewTypeEnum,

  // Car (si es review de car)
  car_id: z.string().uuid().optional(),

  // Ratings (1-5 stars)
  rating_cleanliness: RatingSchema,
  rating_communication: RatingSchema,
  rating_accuracy: RatingSchema,
  rating_location: RatingSchema.optional(),
  rating_checkin: RatingSchema,
  rating_value: RatingSchema,

  // Comments
  comment_public: z
    .string()
    .min(20, 'Comentario público muy corto (mínimo 20 caracteres)')
    .max(1000, 'Comentario público muy largo (máximo 1000 caracteres)'),
  comment_private: z.string().max(500, 'Comentario privado muy largo').optional(),

  // Recommendations
  would_recommend: z.boolean().default(true),

  // Tags (opcional)
  tags: z.array(z.string()).max(10).optional(),
})

export type CreateReviewInput = z.infer<typeof CreateReviewInputSchema>

// ============================================
// UPDATE REVIEW INPUT
// ============================================

/**
 * Schema para actualizar una reseña
 * Solo se pueden editar los comentarios, no los ratings
 */
export const UpdateReviewInputSchema = z.object({
  review_id: z.string().uuid(),

  // Solo comentarios editables
  comment_public: z.string().min(20).max(1000).optional(),
  comment_private: z.string().max(500).optional(),

  // No se pueden cambiar ratings después de creación
  rating_cleanliness: z.never().optional(),
  rating_communication: z.never().optional(),
  rating_accuracy: z.never().optional(),
  rating_location: z.never().optional(),
  rating_checkin: z.never().optional(),
  rating_value: z.never().optional(),
})

export type UpdateReviewInput = z.infer<typeof UpdateReviewInputSchema>

// ============================================
// REVIEW RESPONSE INPUT
// ============================================

/**
 * Schema para responder a una reseña
 * El reviewee puede responder al reviewer
 */
export const ReviewResponseInputSchema = z.object({
  review_id: z.string().uuid(),
  reviewee_id: z.string().uuid(),
  response_text: z
    .string()
    .min(10, 'Respuesta muy corta')
    .max(500, 'Respuesta muy larga (máximo 500 caracteres)'),
})

export type ReviewResponseInput = z.infer<typeof ReviewResponseInputSchema>

// ============================================
// REVIEW SEARCH FILTERS
// ============================================

/**
 * Schema para filtrar reseñas
 */
export const ReviewSearchFiltersSchema = z.object({
  // User filters
  reviewer_id: z.string().uuid().optional(),
  reviewee_id: z.string().uuid().optional(),
  car_id: z.string().uuid().optional(),
  booking_id: z.string().uuid().optional(),

  // Type filter
  review_type: ReviewTypeEnum.optional(),

  // Rating filters
  min_rating: z.number().min(1).max(5).optional(),
  max_rating: z.number().min(1).max(5).optional(),

  // Recommendation filter
  would_recommend: z.boolean().optional(),

  // Date range
  created_from: z.string().datetime().optional(),
  created_to: z.string().datetime().optional(),

  // Has response filter
  has_response: z.boolean().optional(),

  // Tags filter
  tags: z.array(z.string()).optional(),

  // Sorting
  sortBy: z
    .enum(['created_at_desc', 'created_at_asc', 'rating_overall_desc', 'rating_overall_asc'])
    .default('created_at_desc'),

  // Pagination
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
})

export type ReviewSearchFilters = z.infer<typeof ReviewSearchFiltersSchema>

// ============================================
// REVIEW REPORT (Flag inappropriate)
// ============================================

/**
 * Schema para reportar una reseña inapropiada
 */
export const ReportReviewSchema = z.object({
  review_id: z.string().uuid(),
  reporter_id: z.string().uuid(),
  reason: z.enum([
    'offensive_language',
    'spam',
    'false_information',
    'personal_information',
    'harassment',
    'other',
  ]),
  details: z.string().min(20, 'Detalles del reporte muy cortos').max(500),
})

export type ReportReview = z.infer<typeof ReportReviewSchema>

// ============================================
// HELPFUL VOTE
// ============================================

/**
 * Schema para marcar reseña como útil
 */
export const VoteHelpfulSchema = z.object({
  review_id: z.string().uuid(),
  user_id: z.string().uuid(),
  is_helpful: z.boolean(),
})

export type VoteHelpful = z.infer<typeof VoteHelpfulSchema>

// ============================================
// GET USER STATS
// ============================================

/**
 * Schema para obtener estadísticas de reseñas de un usuario
 */
export const GetUserReviewStatsSchema = z.object({
  user_id: z.string().uuid(),
})

export type GetUserReviewStats = z.infer<typeof GetUserReviewStatsSchema>

// ============================================
// GET CAR STATS
// ============================================

/**
 * Schema para obtener estadísticas de reseñas de un auto
 */
export const GetCarReviewStatsSchema = z.object({
  car_id: z.string().uuid(),
})

export type GetCarReviewStats = z.infer<typeof GetCarReviewStatsSchema>

// ============================================
// REVIEW ELIGIBILITY CHECK
// ============================================

/**
 * Schema para verificar si un usuario puede dejar reseña
 */
export const CheckReviewEligibilitySchema = z.object({
  booking_id: z.string().uuid(),
  reviewer_id: z.string().uuid(),
})

export type CheckReviewEligibility = z.infer<typeof CheckReviewEligibilitySchema>

// ============================================
// RATING BREAKDOWN RESPONSE
// ============================================

/**
 * Schema para respuesta de breakdown de ratings
 * No es input, es output type
 */
export const RatingBreakdownSchema = z.object({
  average_overall: z.number().min(0).max(5),
  average_cleanliness: z.number().min(0).max(5),
  average_communication: z.number().min(0).max(5),
  average_accuracy: z.number().min(0).max(5),
  average_location: z.number().min(0).max(5).optional(),
  average_checkin: z.number().min(0).max(5),
  average_value: z.number().min(0).max(5),
  total_reviews: z.number().int().min(0),
  distribution: z.object({
    five_stars: z.number().int().min(0),
    four_stars: z.number().int().min(0),
    three_stars: z.number().int().min(0),
    two_stars: z.number().int().min(0),
    one_star: z.number().int().min(0),
  }),
})

export type RatingBreakdown = z.infer<typeof RatingBreakdownSchema>

// ============================================
// REVIEW TAG SUGGESTIONS
// ============================================

/**
 * Tags comunes para reviews
 */
export const ReviewTags = {
  positive: [
    'clean',
    'punctual',
    'friendly',
    'responsive',
    'accurate',
    'great_value',
    'comfortable',
    'well_maintained',
    'easy_pickup',
    'flexible',
  ],
  negative: [
    'dirty',
    'late',
    'unresponsive',
    'inaccurate_description',
    'overpriced',
    'uncomfortable',
    'poor_condition',
    'difficult_pickup',
    'inflexible',
    'rude',
  ],
} as const
