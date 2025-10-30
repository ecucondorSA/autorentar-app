/**
 * Zod Schemas para Profile (Usuarios)
 * Validación runtime para registro, actualización y KYC
 */

import { z } from 'zod'

// ============================================
// ENUMS
// ============================================

export const UserRoleEnum = z.enum(['renter', 'owner', 'admin'])
export const KYCStatusEnum = z.enum(['not_started', 'pending', 'approved', 'rejected', 'expired'])
export const OnboardingStatusEnum = z.enum([
  'not_started',
  'profile_created',
  'kyc_submitted',
  'first_car_added',
  'first_booking_made',
  'completed',
])

// ============================================
// PHONE VALIDATION
// ============================================

const PhoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Formato de teléfono inválido (usar formato internacional)')
  .optional()

// ============================================
// CREATE PROFILE INPUT (Registro)
// ============================================

/**
 * Schema para crear perfil de usuario (registro)
 * Campos mínimos requeridos en onboarding
 */
export const CreateProfileInputSchema = z.object({
  // Identity (requerido)
  id: z.string().uuid('ID de usuario inválido'),
  email: z.string().email('Email inválido'),
  full_name: z.string().min(3, 'Nombre muy corto').max(100, 'Nombre muy largo'),

  // Contact
  phone: PhoneSchema,

  // Optional at registration
  avatar_url: z.string().url('URL de avatar inválida').optional(),
  bio: z.string().max(500, 'Bio muy larga (máximo 500 caracteres)').optional(),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (usar YYYY-MM-DD)')
    .optional(),

  // Role (default: renter)
  role: UserRoleEnum.default('renter'),

  // Status
  kyc_status: KYCStatusEnum.default('not_started'),
  onboarding_status: OnboardingStatusEnum.default('profile_created'),

  // Preferences
  preferred_language: z.string().length(2, 'Código de idioma debe ser ISO 2 letras').default('es'),
  preferred_currency: z.string().length(3, 'Código de moneda debe ser ISO 3 letras').default('ARS'),
})

export type CreateProfileInput = z.infer<typeof CreateProfileInputSchema>

// ============================================
// UPDATE PROFILE INPUT
// ============================================

/**
 * Schema para actualizar perfil de usuario
 * Todos los campos son opcionales excepto id
 */
export const UpdateProfileInputSchema = z.object({
  // No se pueden cambiar
  id: z.never().optional(),
  email: z.never().optional(),
  created_at: z.never().optional(),

  // Personal Info
  full_name: z.string().min(3).max(100).optional(),
  phone: PhoneSchema,
  avatar_url: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),

  // Preferences
  preferred_language: z.string().length(2).optional(),
  preferred_currency: z.string().length(3).optional(),

  // Notifications
  email_notifications: z.boolean().optional(),
  push_notifications: z.boolean().optional(),
  sms_notifications: z.boolean().optional(),
})

export type UpdateProfileInput = z.infer<typeof UpdateProfileInputSchema>

// ============================================
// KYC SUBMISSION
// ============================================

/**
 * Schema para envío de documentos KYC
 */
export const KYCSubmissionSchema = z.object({
  user_id: z.string().uuid(),

  // Identity documents
  document_type: z.enum(['dni', 'passport', 'driver_license']),
  document_number: z.string().min(7, 'Número de documento inválido').max(20),
  document_front_url: z.string().url('URL de foto frontal requerida'),
  document_back_url: z.string().url('URL de foto trasera requerida'),

  // Driver's license (requerido para renters y owners)
  driver_license_number: z.string().min(8).max(20),
  driver_license_expiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  driver_license_url: z.string().url(),

  // Selfie verification
  selfie_url: z.string().url('Selfie requerida para verificación'),

  // Address proof (opcional)
  address_proof_url: z.string().url().optional(),

  // Date of birth (required for age verification)
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export type KYCSubmission = z.infer<typeof KYCSubmissionSchema>

// Validación de edad mínima (18 años)
export const validateMinimumAge = (dateOfBirth: string): boolean => {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  const age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1 >= 18
  }

  return age >= 18
}

// ============================================
// PROFILE SEARCH FILTERS
// ============================================

/**
 * Schema para buscar usuarios (admin)
 */
export const ProfileSearchFiltersSchema = z.object({
  // Search text
  query: z.string().min(2).optional(),

  // Filters
  role: UserRoleEnum.optional(),
  kyc_status: KYCStatusEnum.optional(),
  onboarding_status: OnboardingStatusEnum.optional(),

  // Rating filter
  min_rating: z.number().min(1).max(5).optional(),

  // Sorting
  sortBy: z
    .enum([
      'created_at_desc',
      'created_at_asc',
      'rating_desc',
      'total_bookings_desc',
      'full_name_asc',
    ])
    .default('created_at_desc'),

  // Pagination
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
})

export type ProfileSearchFilters = z.infer<typeof ProfileSearchFiltersSchema>

// ============================================
// NOTIFICATION PREFERENCES UPDATE
// ============================================

/**
 * Schema para actualizar preferencias de notificaciones
 */
export const UpdateNotificationPreferencesSchema = z.object({
  // Notification types
  email_notifications: z.boolean(),
  push_notifications: z.boolean(),
  sms_notifications: z.boolean(),

  // Specific preferences
  notify_booking_requests: z.boolean().default(true),
  notify_booking_confirmations: z.boolean().default(true),
  notify_messages: z.boolean().default(true),
  notify_reviews: z.boolean().default(true),
  notify_payments: z.boolean().default(true),
  notify_promotions: z.boolean().default(false),
  notify_platform_updates: z.boolean().default(false),
})

export type UpdateNotificationPreferences = z.infer<typeof UpdateNotificationPreferencesSchema>

// ============================================
// BECOME OWNER REQUEST
// ============================================

/**
 * Schema para solicitud de convertirse en owner (dueño de auto)
 */
export const BecomeOwnerRequestSchema = z.object({
  user_id: z.string().uuid(),

  // KYC must be approved
  kyc_status: z.literal('approved', {
    errorMap: () => ({ message: 'Debes tener KYC aprobado para ser propietario' }),
  }),

  // Bank account info (required for payouts)
  bank_name: z.string().min(3),
  bank_account_number: z.string().min(10).max(30),
  bank_account_type: z.enum(['savings', 'checking']),
  bank_account_holder: z.string().min(3),
  cbu_cvu: z.string().length(22, 'CBU/CVU debe tener 22 dígitos'),

  // Agreement
  accepts_terms: z.literal(true, {
    errorMap: () => ({ message: 'Debes aceptar términos y condiciones' }),
  }),
})

export type BecomeOwnerRequest = z.infer<typeof BecomeOwnerRequestSchema>
