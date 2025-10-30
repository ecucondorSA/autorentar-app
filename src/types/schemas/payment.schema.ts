/**
 * Zod Schemas para Payment (Pagos)
 * Validación runtime para procesamiento de pagos
 */

import { z } from 'zod'

// ============================================
// ENUMS
// ============================================

export const PaymentStatusEnum = z.enum([
  'pending',
  'processing',
  'completed',
  'failed',
  'refunded',
  'partially_refunded',
  'disputed',
])

export const PaymentProviderEnum = z.enum([
  'mercadopago',
  'stripe',
  'wallet',
  'bank_transfer',
  'cash',
])

export const PaymentModeEnum = z.enum([
  'full_upfront',
  'split_payment',
  'installments',
  'wallet_only',
])

// ============================================
// CREATE PAYMENT INPUT
// ============================================

/**
 * Schema para crear un pago
 */
export const CreatePaymentInputSchema = z.object({
  // Booking
  booking_id: z.string().uuid('ID de booking inválido'),

  // User
  payer_id: z.string().uuid('ID de pagador inválido'),

  // Amount
  amount_cents: z.number().int().positive('Monto debe ser positivo'),

  // Payment method
  provider: PaymentProviderEnum,
  mode: PaymentModeEnum.default('full_upfront'),

  // External references
  external_payment_id: z.string().optional(), // ID de MercadoPago, Stripe, etc.
  external_payment_url: z.string().url().optional(),

  // Card info (if applicable, tokenized)
  payment_method_id: z.string().optional(), // Token de tarjeta
  last_4_digits: z.string().length(4).optional(),
  card_brand: z.enum(['visa', 'mastercard', 'amex', 'cabal', 'naranja']).optional(),

  // Installments (if mode = installments)
  installments: z.number().int().min(1).max(12).default(1),

  // Status
  status: PaymentStatusEnum.default('pending'),

  // Description
  description: z.string().max(500).optional(),

  // Metadata
  metadata: z.record(z.unknown()).optional(),
})

export type CreatePaymentInput = z.infer<typeof CreatePaymentInputSchema>

// ============================================
// UPDATE PAYMENT STATUS
// ============================================

/**
 * Schema para actualizar estado de un pago
 * Usado por webhooks de payment providers
 */
export const UpdatePaymentStatusSchema = z.object({
  payment_id: z.string().uuid(),
  status: PaymentStatusEnum,
  external_payment_id: z.string().optional(),
  failure_reason: z.string().max(500).optional(),
  completed_at: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
})

export type UpdatePaymentStatus = z.infer<typeof UpdatePaymentStatusSchema>

// ============================================
// REFUND REQUEST
// ============================================

/**
 * Schema para solicitar reembolso
 */
export const RefundRequestSchema = z.object({
  payment_id: z.string().uuid(),
  booking_id: z.string().uuid(),
  refund_amount_cents: z.number().int().positive(),
  refund_reason: z.string().min(10, 'Razón de reembolso muy corta').max(500),
  initiated_by: z.string().uuid(), // user_id que solicita reembolso
  refund_method: z.enum(['original_payment_method', 'wallet']).default('original_payment_method'),
})

export type RefundRequest = z.infer<typeof RefundRequestSchema>

// ============================================
// PAYMENT SPLIT INPUT
// ============================================

/**
 * Schema para split de pago (distribución)
 * Ej: 80% owner, 15% plataforma, 5% seguro
 */
export const PaymentSplitSchema = z.object({
  payment_id: z.string().uuid(),
  recipient_id: z.string().uuid(),
  amount_cents: z.number().int().positive(),
  percentage: z.number().min(0).max(100),
  split_type: z.enum(['owner_payout', 'platform_fee', 'insurance_fee', 'tax', 'other']),
  status: z.enum(['pending', 'completed', 'failed']).default('pending'),
})

export type PaymentSplit = z.infer<typeof PaymentSplitSchema>

// ============================================
// PAYMENT INTENT (Pre-authorization)
// ============================================

/**
 * Schema para crear un payment intent (pre-autorización)
 * Usado para reservar fondos antes de confirmar booking
 */
export const CreatePaymentIntentSchema = z.object({
  // Booking
  booking_id: z.string().uuid(),

  // User
  user_id: z.string().uuid(),

  // Amount
  amount_cents: z.number().int().positive(),

  // Payment method
  payment_method_id: z.string(), // Token de tarjeta

  // Provider
  provider: PaymentProviderEnum,

  // Description
  description: z.string().max(500),

  // Metadata
  metadata: z.record(z.unknown()).optional(),
})

export type CreatePaymentIntent = z.infer<typeof CreatePaymentIntentSchema>

// ============================================
// CAPTURE PAYMENT INTENT
// ============================================

/**
 * Schema para capturar un payment intent pre-autorizado
 */
export const CapturePaymentIntentSchema = z.object({
  intent_id: z.string().uuid(),
  amount_cents: z.number().int().positive().optional(), // Si no se envía, captura el monto completo
})

export type CapturePaymentIntent = z.infer<typeof CapturePaymentIntentSchema>

// ============================================
// PAYMENT SEARCH FILTERS
// ============================================

/**
 * Schema para filtrar historial de pagos
 */
export const PaymentSearchFiltersSchema = z.object({
  // User filters
  payer_id: z.string().uuid().optional(),
  booking_id: z.string().uuid().optional(),

  // Status filter
  status: PaymentStatusEnum.optional(),
  statuses: z.array(PaymentStatusEnum).optional(),

  // Provider filter
  provider: PaymentProviderEnum.optional(),

  // Date range
  created_from: z.string().datetime().optional(),
  created_to: z.string().datetime().optional(),

  // Amount range
  min_amount_cents: z.number().int().optional(),
  max_amount_cents: z.number().int().optional(),

  // External ID search
  external_payment_id: z.string().optional(),

  // Sorting
  sortBy: z.enum(['created_at_desc', 'created_at_asc', 'amount_desc', 'amount_asc']).default('created_at_desc'),

  // Pagination
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
})

export type PaymentSearchFilters = z.infer<typeof PaymentSearchFiltersSchema>

// ============================================
// WEBHOOK VERIFICATION
// ============================================

/**
 * Schema para verificar webhooks de payment providers
 */
export const PaymentWebhookSchema = z.object({
  // Provider
  provider: PaymentProviderEnum,

  // Webhook payload
  payload: z.record(z.unknown()),

  // Signature verification
  signature: z.string(),

  // Event type
  event_type: z.string(),
})

export type PaymentWebhook = z.infer<typeof PaymentWebhookSchema>

// ============================================
// MERCADOPAGO PREFERENCE
// ============================================

/**
 * Schema para crear preferencia de pago en MercadoPago
 */
export const CreateMercadoPagoPreferenceSchema = z.object({
  // Transaction info
  booking_id: z.string().uuid(),
  user_id: z.string().uuid(),
  amount_cents: z.number().int().positive(),

  // Item details
  title: z.string().min(5).max(256),
  description: z.string().max(600).optional(),

  // URLs
  success_url: z.string().url(),
  failure_url: z.string().url(),
  pending_url: z.string().url(),

  // Auto return
  auto_return: z.enum(['approved', 'all']).default('approved'),

  // Installments
  max_installments: z.number().int().min(1).max(12).default(1),

  // External reference
  external_reference: z.string().optional(),
})

export type CreateMercadoPagoPreference = z.infer<typeof CreateMercadoPagoPreferenceSchema>

// ============================================
// STRIPE PAYMENT INTENT
// ============================================

/**
 * Schema para crear payment intent de Stripe
 */
export const CreateStripePaymentIntentSchema = z.object({
  // Transaction info
  booking_id: z.string().uuid(),
  user_id: z.string().uuid(),
  amount_cents: z.number().int().positive(),

  // Currency
  currency: z.string().length(3).default('ars'),

  // Payment method types
  payment_method_types: z.array(z.string()).default(['card']),

  // Customer
  customer_id: z.string().optional(), // Stripe customer ID

  // Metadata
  metadata: z.record(z.string()).optional(),

  // Description
  description: z.string().max(500).optional(),
})

export type CreateStripePaymentIntent = z.infer<typeof CreateStripePaymentIntentSchema>
