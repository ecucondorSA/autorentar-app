/**
 * Service Layer Types
 * Types específicos para la capa de servicios
 */

import { z } from 'zod'

// ============================================
// BOOKING SERVICE TYPES
// ============================================

export const CreateBookingServiceInputSchema = z.object({
  car_id: z.string().uuid(),
  renter_id: z.string().uuid(),
  start_date: z.string(),
  end_date: z.string(),
  insurance_coverage_level: z.enum(['none', 'basic', 'standard', 'premium']).optional(),
  extra_driver_count: z.number().int().nonnegative().default(0),
  extra_child_seat_count: z.number().int().nonnegative().default(0),
  extra_gps: z.boolean().default(false),
  extra_wifi: z.boolean().default(false),
  promo_code: z.string().optional(),
})

export type CreateBookingServiceInput = z.infer<typeof CreateBookingServiceInputSchema>

export const StartBookingInputSchema = z.object({
  actual_start_date: z.string(),
  odometer_km: z.number().int().positive(),
  notes: z.string().optional(),
})

export type StartBookingInput = z.infer<typeof StartBookingInputSchema>

export const CompleteBookingInputSchema = z.object({
  actual_end_date: z.string(),
  final_odometer_km: z.number().int().positive(),
  additional_charges_cents: z.number().int().nonnegative().default(0),
  notes: z.string().optional(),
})

export type CompleteBookingInput = z.infer<typeof CompleteBookingInputSchema>

export const CancelBookingInputSchema = z.object({
  booking_id: z.string().uuid(),
  user_id: z.string().uuid(),
  cancelled_by: z.enum(['renter', 'owner', 'admin']),
  cancellation_reason: z.string().optional(),
})

export type CancelBookingInput = z.infer<typeof CancelBookingInputSchema>

// ============================================
// BOOKING SERVICE ERRORS
// ============================================

export enum BookingErrorCode {
  CAR_NOT_AVAILABLE = 'CAR_NOT_AVAILABLE',
  CAR_INACTIVE = 'CAR_INACTIVE',
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_STATE_TRANSITION = 'INVALID_STATE_TRANSITION',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  BOOKING_NOT_FOUND = 'BOOKING_NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PRICING_ERROR = 'PRICING_ERROR',
  INSURANCE_ERROR = 'INSURANCE_ERROR',
}

export class BookingError extends Error {
  constructor(
    message: string,
    public code: BookingErrorCode,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'BookingError'
    Object.setPrototypeOf(this, BookingError.prototype)
  }
}

// ============================================
// PAYMENT SERVICE TYPES
// ============================================

export const ProcessPaymentInputSchema = z.object({
  booking_id: z.string().uuid(),
  payer_id: z.string().uuid(),
  amount_cents: z.number().int().positive(),
  provider: z.enum(['mercadopago', 'stripe']),
  payment_method_id: z.string().optional(),
})

export type ProcessPaymentInput = z.infer<typeof ProcessPaymentInputSchema>

export const PaymentSplitConfigSchema = z.object({
  owner_percentage: z.number().min(0).max(100).default(85),
  platform_percentage: z.number().min(0).max(100).default(10),
  insurance_percentage: z.number().min(0).max(100).default(5),
})

export type PaymentSplitConfig = z.infer<typeof PaymentSplitConfigSchema>
