/**
 * Zod Schemas para Pricing (Precios dinámicos)
 * Validación runtime para cálculos de precios, regiones y overrides
 */

import { z } from 'zod'

// ============================================
// ENUMS
// ============================================

export const PricingRegionTypeEnum = z.enum(['city', 'state', 'country', 'custom'])

export const SeasonalityEnum = z.enum(['low', 'medium', 'high', 'peak'])

export const DayTypeEnum = z.enum(['weekday', 'weekend', 'holiday'])

export const PricingFactorEnum = z.enum([
  'base_price',
  'distance_multiplier',
  'demand_multiplier',
  'seasonality_multiplier',
  'duration_discount',
  'early_bird_discount',
  'last_minute_surcharge',
  'insurance_addon',
  'extras_addon',
])

// ============================================
// CREATE PRICING REGION
// ============================================

/**
 * Schema para crear región de precios
 */
export const CreatePricingRegionSchema = z.object({
  // Region details
  name: z.string().min(3, 'Nombre muy corto').max(100),
  region_type: PricingRegionTypeEnum,
  country_code: z.string().length(2, 'Código país debe ser ISO 2 letras').default('AR'),
  city: z.string().optional(),
  state: z.string().optional(),

  // Multipliers
  base_multiplier: z
    .number()
    .min(0.5, 'Multiplicador base mínimo: 0.5')
    .max(5.0, 'Multiplicador base máximo: 5.0')
    .default(1.0),

  demand_multiplier_low: z.number().min(0.5).max(2.0).default(0.8),
  demand_multiplier_medium: z.number().min(0.5).max(2.0).default(1.0),
  demand_multiplier_high: z.number().min(0.5).max(2.0).default(1.3),
  demand_multiplier_peak: z.number().min(0.5).max(2.0).default(1.8),

  // Seasonality
  season_low_months: z.array(z.number().int().min(1).max(12)).default([3, 4, 5, 8, 9, 10]),
  season_high_months: z.array(z.number().int().min(1).max(12)).default([1, 2, 7, 12]),

  // Service fee
  service_fee_percentage: z
    .number()
    .min(0, 'Fee mínimo: 0%')
    .max(50, 'Fee máximo: 50%')
    .default(15),

  // Tax
  tax_percentage: z.number().min(0).max(50).default(21), // IVA en Argentina: 21%

  // Active
  is_active: z.boolean().default(true),
})

export type CreatePricingRegion = z.infer<typeof CreatePricingRegionSchema>

// ============================================
// PRICING CALCULATION INPUT
// ============================================

/**
 * Schema para calcular precio de un booking
 */
export const CalculatePricingSchema = z.object({
  // Car
  car_id: z.string().uuid(),
  base_price_per_day_cents: z.number().int().positive(),

  // Dates
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  rental_days: z.number().int().min(1).max(180),

  // Location
  pickup_lat: z.number().min(-90).max(90).optional(),
  pickup_lng: z.number().min(-180).max(180).optional(),
  region_id: z.string().uuid().optional(),

  // User (para descuentos/multiplicadores personalizados)
  user_id: z.string().uuid().optional(),

  // Insurance
  insurance_coverage_level: z.enum(['none', 'basic', 'standard', 'premium']).default('none'),

  // Extras
  extra_driver_count: z.number().int().min(0).max(3).default(0),
  extra_child_seat_count: z.number().int().min(0).max(3).default(0),
  extra_gps: z.boolean().default(false),
  extra_wifi: z.boolean().default(false),

  // Promo code
  promo_code: z.string().optional(),

  // Overrides (admin only)
  override_multiplier: z.number().min(0.1).max(10).optional(),
})

export type CalculatePricing = z.infer<typeof CalculatePricingSchema>

// ============================================
// PRICING CALCULATION RESPONSE
// ============================================

/**
 * Schema para respuesta de cálculo de precio
 */
export const PricingCalculationResponseSchema = z.object({
  // Calculation ID
  calculation_id: z.string().uuid(),

  // Base pricing
  base_price_cents: z.number().int(),
  rental_days: z.number().int(),
  base_subtotal_cents: z.number().int(),

  // Multipliers applied
  multipliers: z.object({
    region_multiplier: z.number().default(1.0),
    demand_multiplier: z.number().default(1.0),
    seasonality_multiplier: z.number().default(1.0),
    duration_discount: z.number().default(1.0),
  }),

  // Discounts
  discounts: z.object({
    duration_discount_cents: z.number().int().default(0),
    promo_discount_cents: z.number().int().default(0),
    early_bird_discount_cents: z.number().int().default(0),
    total_discounts_cents: z.number().int(),
  }),

  // Addons
  addons: z.object({
    insurance_cents: z.number().int().default(0),
    extra_drivers_cents: z.number().int().default(0),
    extra_equipment_cents: z.number().int().default(0),
    total_addons_cents: z.number().int(),
  }),

  // Fees
  service_fee_cents: z.number().int(),
  tax_cents: z.number().int(),

  // Total
  subtotal_cents: z.number().int(),
  total_cents: z.number().int(),

  // Breakdown for display
  breakdown: z.array(
    z.object({
      label: z.string(),
      amount_cents: z.number().int(),
      is_discount: z.boolean().default(false),
    }),
  ),

  // Calculation metadata
  calculated_at: z.string().datetime(),
  valid_until: z.string().datetime(),
})

export type PricingCalculationResponse = z.infer<typeof PricingCalculationResponseSchema>

// ============================================
// CREATE PRICING OVERRIDE
// ============================================

/**
 * Schema para crear override de precio manual
 */
export const CreatePricingOverrideSchema = z.object({
  // Target
  car_id: z.string().uuid(),

  // Date range
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),

  // Override type
  override_type: z.enum(['fixed_price', 'multiplier', 'percentage_discount']),

  // Override value
  override_value: z.number().positive(),

  // Reason
  reason: z.string().min(10).max(500),

  // Priority (higher = applied first)
  priority: z.number().int().min(1).max(100).default(10),

  // Created by (admin)
  created_by: z.string().uuid(),

  // Active
  is_active: z.boolean().default(true),
})

export type CreatePricingOverride = z.infer<typeof CreatePricingOverrideSchema>

// ============================================
// DURATION DISCOUNT TIERS
// ============================================

/**
 * Schema para configurar descuentos por duración
 */
export const DurationDiscountTierSchema = z.object({
  min_days: z.number().int().min(1),
  max_days: z.number().int().min(1).optional(), // null = sin límite
  discount_percentage: z.number().min(0).max(50),
})

export const DurationDiscountConfigSchema = z.object({
  car_id: z.string().uuid().optional(), // null = global
  tiers: z.array(DurationDiscountTierSchema).min(1),
  is_active: z.boolean().default(true),
})

export type DurationDiscountConfig = z.infer<typeof DurationDiscountConfigSchema>

// ============================================
// DEMAND PRICING INPUT
// ============================================

/**
 * Schema para calcular multiplicador de demanda
 */
export const CalculateDemandMultiplierSchema = z.object({
  region_id: z.string().uuid(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),

  // Current metrics
  available_cars: z.number().int().min(0),
  total_cars: z.number().int().min(1),
  active_bookings: z.number().int().min(0),
  pending_requests: z.number().int().min(0),
})

export type CalculateDemandMultiplier = z.infer<typeof CalculateDemandMultiplierSchema>

// ============================================
// PROMO CODE VALIDATION
// ============================================

/**
 * Schema para validar código promocional
 */
export const ValidatePromoCodeSchema = z.object({
  promo_code: z.string().min(3).max(20).toUpperCase(),
  user_id: z.string().uuid(),
  car_id: z.string().uuid().optional(),
  booking_total_cents: z.number().int().positive(),
  booking_start: z.string().datetime(),
})

export type ValidatePromoCode = z.infer<typeof ValidatePromoCodeSchema>

// ============================================
// PRICING HISTORY FILTERS
// ============================================

/**
 * Schema para filtrar historial de cálculos de precios
 */
export const PricingHistoryFiltersSchema = z.object({
  // Filters
  car_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  region_id: z.string().uuid().optional(),

  // Date range
  calculated_from: z.string().datetime().optional(),
  calculated_to: z.string().datetime().optional(),

  // Amount range
  min_total_cents: z.number().int().optional(),
  max_total_cents: z.number().int().optional(),

  // Sorting
  sortBy: z.enum(['calculated_at_desc', 'calculated_at_asc', 'total_cents_desc']).default('calculated_at_desc'),

  // Pagination
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
})

export type PricingHistoryFilters = z.infer<typeof PricingHistoryFiltersSchema>

// ============================================
// PRICING CONSTANTS
// ============================================

/**
 * Constantes de pricing (configurables)
 */
export const PricingConstants = {
  // Minimum rental days for discounts
  WEEKLY_RENTAL_MIN_DAYS: 7,
  MONTHLY_RENTAL_MIN_DAYS: 28,

  // Discount percentages
  WEEKLY_DISCOUNT: 10, // 10% off for 7+ days
  MONTHLY_DISCOUNT: 25, // 25% off for 28+ days
  EARLY_BIRD_DISCOUNT: 5, // 5% off for bookings 30+ days in advance

  // Surcharges
  LAST_MINUTE_SURCHARGE: 15, // 15% surcharge for bookings <24h in advance

  // Minimum/Maximum prices
  MIN_PRICE_PER_DAY_CENTS: 100000, // $1000/day mínimo
  MAX_PRICE_PER_DAY_CENTS: 10000000, // $100,000/day máximo

  // Service fees
  DEFAULT_SERVICE_FEE_PERCENTAGE: 15,
  DEFAULT_TAX_PERCENTAGE: 21, // IVA Argentina

  // Insurance addons pricing
  BASIC_INSURANCE_PER_DAY_CENTS: 50000, // $500/day
  STANDARD_INSURANCE_PER_DAY_CENTS: 100000, // $1000/day
  PREMIUM_INSURANCE_PER_DAY_CENTS: 200000, // $2000/day

  // Extras pricing
  EXTRA_DRIVER_PER_DAY_CENTS: 20000, // $200/day
  CHILD_SEAT_PER_DAY_CENTS: 15000, // $150/day
  GPS_PER_DAY_CENTS: 10000, // $100/day
  WIFI_PER_DAY_CENTS: 15000, // $150/day
} as const
