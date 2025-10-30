/**
 * Zod Schemas para Insurance (Seguros)
 * Validación runtime para pólizas, claims y addons
 */

import { z } from 'zod'

// ============================================
// ENUMS
// ============================================

export const InsuranceCoverageLevelEnum = z.enum(['basic', 'standard', 'premium'])

export const InsuranceClaimStatusEnum = z.enum([
  'pending',
  'under_review',
  'approved',
  'rejected',
  'paid',
])

export const DamageTypeEnum = z.enum([
  'collision',
  'theft',
  'vandalism',
  'weather',
  'mechanical',
  'tire',
  'glass',
  'interior',
  'other',
])

export const ClaimSeverityEnum = z.enum(['minor', 'moderate', 'major', 'total_loss'])

// ============================================
// CREATE INSURANCE POLICY
// ============================================

/**
 * Schema para crear póliza de seguro para un booking
 */
export const CreateInsurancePolicySchema = z.object({
  // Booking
  booking_id: z.string().uuid('ID de booking inválido'),

  // Car and user
  car_id: z.string().uuid('ID de auto inválido'),
  user_id: z.string().uuid('ID de usuario inválido'),

  // Coverage level
  coverage_level: InsuranceCoverageLevelEnum,

  // Coverage amounts (in cents)
  collision_coverage_cents: z.number().int().min(0),
  theft_coverage_cents: z.number().int().min(0),
  liability_coverage_cents: z.number().int().min(0),
  personal_injury_coverage_cents: z.number().int().min(0),

  // Deductible (franquicia)
  deductible_cents: z.number().int().min(0),

  // Premium (costo del seguro)
  premium_cents: z.number().int().positive('Premium debe ser positivo'),

  // Coverage period
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),

  // Terms
  terms_url: z.string().url('URL de términos inválida'),
  policy_number: z.string().optional(),
})

export type CreateInsurancePolicy = z.infer<typeof CreateInsurancePolicySchema>

// ============================================
// INSURANCE ADDONS
// ============================================

/**
 * Schema para agregar cobertura adicional (addons)
 */
export const AddInsuranceAddonSchema = z.object({
  policy_id: z.string().uuid(),
  addon_type: z.enum([
    'roadside_assistance',
    'windshield_protection',
    'tire_protection',
    'interior_protection',
    'pet_damage',
    'additional_driver',
  ]),
  addon_price_cents: z.number().int().positive(),
  coverage_amount_cents: z.number().int().positive().optional(),
})

export type AddInsuranceAddon = z.infer<typeof AddInsuranceAddonSchema>

// ============================================
// CREATE INSURANCE CLAIM
// ============================================

/**
 * Schema para crear un reclamo de seguro
 */
export const CreateInsuranceClaimSchema = z.object({
  // Policy
  policy_id: z.string().uuid('ID de póliza inválido'),
  booking_id: z.string().uuid('ID de booking inválido'),

  // Reported by
  reported_by: z.string().uuid('ID de reportante inválido'),

  // Incident details
  incident_date: z.string().datetime('Fecha de incidente inválida'),
  incident_location: z.string().min(10, 'Ubicación muy corta').max(500),
  incident_lat: z.number().min(-90).max(90).optional(),
  incident_lng: z.number().min(-180).max(180).optional(),

  // Damage details
  damage_type: DamageTypeEnum,
  severity: ClaimSeverityEnum,
  description: z
    .string()
    .min(50, 'Descripción muy corta (mínimo 50 caracteres)')
    .max(2000, 'Descripción muy larga'),

  // Estimated costs
  estimated_repair_cost_cents: z.number().int().positive('Costo estimado debe ser positivo'),

  // Evidence
  photo_urls: z
    .array(z.string().url('URL de foto inválida'))
    .min(2, 'Mínimo 2 fotos requeridas')
    .max(20, 'Máximo 20 fotos'),
  video_urls: z.array(z.string().url()).max(5).optional(),

  // Police report (si aplica)
  police_report_filed: z.boolean().default(false),
  police_report_number: z.string().optional(),
  police_report_url: z.string().url().optional(),

  // Third party involved
  third_party_involved: z.boolean().default(false),
  third_party_name: z.string().optional(),
  third_party_contact: z.string().optional(),
  third_party_insurance: z.string().optional(),

  // Status
  status: InsuranceClaimStatusEnum.default('pending'),
})

export type CreateInsuranceClaim = z.infer<typeof CreateInsuranceClaimSchema>

// ============================================
// UPDATE CLAIM STATUS
// ============================================

/**
 * Schema para actualizar estado de un claim (admin/insurer)
 */
export const UpdateClaimStatusSchema = z.object({
  claim_id: z.string().uuid(),
  status: InsuranceClaimStatusEnum,
  reviewer_notes: z.string().max(1000).optional(),
  approved_amount_cents: z.number().int().min(0).optional(),
  rejection_reason: z.string().max(500).optional(),
  payment_date: z.string().datetime().optional(),
})

export type UpdateClaimStatus = z.infer<typeof UpdateClaimStatusSchema>

// ============================================
// CLAIM SEARCH FILTERS
// ============================================

/**
 * Schema para filtrar claims
 */
export const ClaimSearchFiltersSchema = z.object({
  // Policy/Booking filters
  policy_id: z.string().uuid().optional(),
  booking_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),

  // Status filter
  status: InsuranceClaimStatusEnum.optional(),
  statuses: z.array(InsuranceClaimStatusEnum).optional(),

  // Damage type filter
  damage_type: DamageTypeEnum.optional(),
  severity: ClaimSeverityEnum.optional(),

  // Date range
  incident_from: z.string().datetime().optional(),
  incident_to: z.string().datetime().optional(),

  // Amount range
  min_cost_cents: z.number().int().optional(),
  max_cost_cents: z.number().int().optional(),

  // Sorting
  sortBy: z
    .enum([
      'incident_date_desc',
      'incident_date_asc',
      'created_at_desc',
      'cost_desc',
      'status_asc',
    ])
    .default('created_at_desc'),

  // Pagination
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
})

export type ClaimSearchFilters = z.infer<typeof ClaimSearchFiltersSchema>

// ============================================
// INSURANCE QUOTE REQUEST
// ============================================

/**
 * Schema para solicitar cotización de seguro
 */
export const InsuranceQuoteRequestSchema = z.object({
  // Car details
  car_id: z.string().uuid(),
  car_value_cents: z.number().int().positive(),
  car_year: z.number().int().min(1980),

  // User details
  user_id: z.string().uuid(),
  user_age: z.number().int().min(18).max(100),
  driving_experience_years: z.number().int().min(0).max(80),

  // Booking details
  booking_start: z.string().datetime(),
  booking_end: z.string().datetime(),
  rental_days: z.number().int().min(1).max(180),

  // Requested coverage
  coverage_level: InsuranceCoverageLevelEnum,

  // Optional addons
  roadside_assistance: z.boolean().default(false),
  additional_drivers: z.number().int().min(0).max(3).default(0),
})

export type InsuranceQuoteRequest = z.infer<typeof InsuranceQuoteRequestSchema>

// ============================================
// INSURANCE QUOTE RESPONSE
// ============================================

/**
 * Schema para respuesta de cotización
 */
export const InsuranceQuoteResponseSchema = z.object({
  // Quote ID
  quote_id: z.string().uuid(),

  // Coverage details
  coverage_level: InsuranceCoverageLevelEnum,
  collision_coverage_cents: z.number().int(),
  theft_coverage_cents: z.number().int(),
  liability_coverage_cents: z.number().int(),
  personal_injury_coverage_cents: z.number().int(),

  // Deductible
  deductible_cents: z.number().int(),

  // Pricing
  base_premium_cents: z.number().int(),
  addons_premium_cents: z.number().int().default(0),
  total_premium_cents: z.number().int(),

  // Quote validity
  valid_until: z.string().datetime(),

  // Terms
  terms_url: z.string().url(),
})

export type InsuranceQuoteResponse = z.infer<typeof InsuranceQuoteResponseSchema>

// ============================================
// ACTIVATE INSURANCE POLICY
// ============================================

/**
 * Schema para activar póliza (después de cotización)
 */
export const ActivateInsurancePolicySchema = z.object({
  quote_id: z.string().uuid(),
  booking_id: z.string().uuid(),
  user_id: z.string().uuid(),
  accepts_terms: z.literal(true, {
    errorMap: () => ({ message: 'Debes aceptar términos y condiciones del seguro' }),
  }),
  payment_method_id: z.string(),
})

export type ActivateInsurancePolicy = z.infer<typeof ActivateInsurancePolicySchema>

// ============================================
// CANCEL POLICY
// ============================================

/**
 * Schema para cancelar póliza
 */
export const CancelInsurancePolicySchema = z.object({
  policy_id: z.string().uuid(),
  cancellation_reason: z.string().min(10).max(500),
  refund_requested: z.boolean().default(true),
})

export type CancelInsurancePolicy = z.infer<typeof CancelInsurancePolicySchema>
