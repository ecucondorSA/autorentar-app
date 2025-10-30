/**
 * Zod Schemas para Booking (Reservas)
 * Validación runtime para creación, actualización y búsqueda de reservas
 */

import { z } from 'zod'

import { CancelPolicyEnum } from './car.schema'

// ============================================
// ENUMS
// ============================================

export const BookingStatusEnum = z.enum([
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
  'expired',
])

// CancelPolicyEnum imported from car.schema.ts to avoid duplicate export
// export const CancelPolicyEnum = z.enum(['flex', 'moderate', 'strict'])

export const GuaranteeTypeEnum = z.enum(['deposit', 'credit_card_hold', 'insurance_bond'])

// ============================================
// DATE VALIDATION HELPERS
// ============================================

/**
 * Valida que end_date sea después de start_date
 */
const validateDateRange = (data: { start_date: string; end_date: string }): boolean => {
  const start = new Date(data.start_date)
  const end = new Date(data.end_date)
  return end > start
}

/**
 * Valida que start_date sea en el futuro
 */
const validateFutureDate = (dateStr: string): boolean => {
  const date = new Date(dateStr)
  const now = new Date()
  return date > now
}

/**
 * Calcula días entre fechas
 */
const calculateDays = (start: string, end: string): number => {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// ============================================
// CREATE BOOKING INPUT
// ============================================

/**
 * Schema para crear una reserva nueva
 */
export const CreateBookingInputSchema = z
  .object({
    // IDs (requeridos)
    renter_id: z.string().uuid('ID de renter inválido'),
    car_id: z.string().uuid('ID de auto inválido'),

    // Dates (requeridas)
    start_date: z.string().datetime('Formato de fecha inválido (usar ISO 8601)'),
    end_date: z.string().datetime('Formato de fecha inválido (usar ISO 8601)'),

    // Pickup/Dropoff location (opcional, default = car location)
    pickup_lat: z.number().min(-90).max(90).optional(),
    pickup_lng: z.number().min(-180).max(180).optional(),
    dropoff_lat: z.number().min(-90).max(90).optional(),
    dropoff_lng: z.number().min(-180).max(180).optional(),

    // Pricing breakdown
    base_price_cents: z.number().int().positive(),
    service_fee_cents: z.number().int().min(0),
    tax_cents: z.number().int().min(0),
    total_price_cents: z.number().int().positive(),

    // Insurance (opcional)
    insurance_policy_id: z.string().uuid().optional(),
    insurance_coverage_level: z.enum(['basic', 'standard', 'premium']).optional(),

    // Extras (opcional)
    extra_driver_count: z.number().int().min(0).max(3).default(0),
    extra_child_seat_count: z.number().int().min(0).max(3).default(0),
    extra_gps: z.boolean().default(false),

    // Special requests
    special_requests: z.string().max(500, 'Solicitud muy larga').optional(),

    // Guarantee
    guarantee_type: GuaranteeTypeEnum.default('credit_card_hold'),
    guarantee_amount_cents: z.number().int().positive(),

    // Policies
    cancel_policy: CancelPolicyEnum.default('moderate'),

    // Status (default: pending hasta que owner confirme)
    status: BookingStatusEnum.default('pending'),
  })
  .refine(validateDateRange, {
    message: 'La fecha de fin debe ser después de la fecha de inicio',
    path: ['end_date'],
  })
  .refine((data) => validateFutureDate(data.start_date), {
    message: 'La fecha de inicio debe ser en el futuro',
    path: ['start_date'],
  })
  .refine(
    (data) => {
      const days = calculateDays(data.start_date, data.end_date)
      return days >= 1 && days <= 180
    },
    {
      message: 'La reserva debe ser entre 1 y 180 días',
      path: ['end_date'],
    },
  )

export type CreateBookingInput = z.infer<typeof CreateBookingInputSchema>

// ============================================
// UPDATE BOOKING INPUT
// ============================================

/**
 * Schema para actualizar una reserva existente
 * Solo ciertos campos son editables después de creación
 */
export const UpdateBookingInputSchema = z.object({
  // No se pueden cambiar después de creación
  renter_id: z.never().optional(),
  car_id: z.never().optional(),
  created_at: z.never().optional(),

  // Dates (solo si booking está en pending)
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),

  // Status updates
  status: BookingStatusEnum.optional(),

  // Special requests can be updated
  special_requests: z.string().max(500).optional(),

  // Pickup/dropoff can be adjusted
  pickup_lat: z.number().min(-90).max(90).optional(),
  pickup_lng: z.number().min(-180).max(180).optional(),
  dropoff_lat: z.number().min(-90).max(90).optional(),
  dropoff_lng: z.number().min(-180).max(180).optional(),
})

export type UpdateBookingInput = z.infer<typeof UpdateBookingInputSchema>

// ============================================
// CANCEL BOOKING INPUT
// ============================================

/**
 * Schema para cancelar una reserva
 */
export const CancelBookingInputSchema = z.object({
  booking_id: z.string().uuid(),
  cancelled_by: z.enum(['renter', 'owner', 'admin']),
  cancellation_reason: z.string().min(10, 'Razón de cancelación muy corta').max(500),
  refund_amount_cents: z.number().int().min(0),
})

export type CancelBookingInput = z.infer<typeof CancelBookingInputSchema>

// ============================================
// BOOKING SEARCH FILTERS
// ============================================

/**
 * Schema para filtros de búsqueda de reservas
 */
export const BookingSearchFiltersSchema = z.object({
  // User filters
  renter_id: z.string().uuid().optional(),
  owner_id: z.string().uuid().optional(),
  car_id: z.string().uuid().optional(),

  // Status filter
  status: BookingStatusEnum.optional(),
  statuses: z.array(BookingStatusEnum).optional(),

  // Date range filters
  start_date_from: z.string().datetime().optional(),
  start_date_to: z.string().datetime().optional(),
  end_date_from: z.string().datetime().optional(),
  end_date_to: z.string().datetime().optional(),

  // Price range
  min_price_cents: z.number().int().min(0).optional(),
  max_price_cents: z.number().int().min(0).optional(),

  // Location
  city: z.string().optional(),

  // Sorting
  sortBy: z
    .enum([
      'start_date_asc',
      'start_date_desc',
      'created_at_desc',
      'total_price_desc',
      'status_asc',
    ])
    .default('start_date_desc'),

  // Pagination
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
})

export type BookingSearchFilters = z.infer<typeof BookingSearchFiltersSchema>

// ============================================
// CHECK AVAILABILITY INPUT
// ============================================

/**
 * Schema para verificar disponibilidad de un auto
 */
export const CheckAvailabilityInputSchema = z
  .object({
    car_id: z.string().uuid(),
    start_date: z.string().datetime(),
    end_date: z.string().datetime(),
  })
  .refine(validateDateRange, {
    message: 'La fecha de fin debe ser después de la fecha de inicio',
    path: ['end_date'],
  })

export type CheckAvailabilityInput = z.infer<typeof CheckAvailabilityInputSchema>

// ============================================
// BOOKING PRICE CALCULATION INPUT
// ============================================

/**
 * Schema para calcular precio de una reserva
 * Usado antes de crear la reserva
 */
export const CalculateBookingPriceInputSchema = z
  .object({
    car_id: z.string().uuid(),
    start_date: z.string().datetime(),
    end_date: z.string().datetime(),

    // Insurance (opcional)
    insurance_coverage_level: z.enum(['basic', 'standard', 'premium']).optional(),

    // Extras
    extra_driver_count: z.number().int().min(0).max(3).default(0),
    extra_child_seat_count: z.number().int().min(0).max(3).default(0),
    extra_gps: z.boolean().default(false),

    // Promo code (opcional)
    promo_code: z.string().optional(),
  })
  .refine(validateDateRange, {
    message: 'La fecha de fin debe ser después de la fecha de inicio',
    path: ['end_date'],
  })

export type CalculateBookingPriceInput = z.infer<typeof CalculateBookingPriceInputSchema>

// ============================================
// CONFIRM BOOKING INPUT
// ============================================

/**
 * Schema para que el owner confirme una reserva
 */
export const ConfirmBookingInputSchema = z.object({
  booking_id: z.string().uuid(),
  owner_id: z.string().uuid(),
  confirmation_message: z.string().max(500).optional(),
  instant_confirmation: z.boolean().default(false),
})

export type ConfirmBookingInput = z.infer<typeof ConfirmBookingInputSchema>

// ============================================
// COMPLETE BOOKING INPUT
// ============================================

/**
 * Schema para completar una reserva (después del dropoff)
 */
export const CompleteBookingInputSchema = z.object({
  booking_id: z.string().uuid(),
  actual_end_date: z.string().datetime(),
  final_odometer_km: z.number().int().min(0),
  fuel_level_returned: z.number().min(0).max(100), // porcentaje
  damage_reported: z.boolean().default(false),
  damage_description: z.string().max(1000).optional(),
  completion_photos: z.array(z.string().url()).max(10).optional(),
})

export type CompleteBookingInput = z.infer<typeof CompleteBookingInputSchema>
