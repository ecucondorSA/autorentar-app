/**
 * Data Transfer Objects (DTOs)
 * Type-safe, validated shapes for API boundaries
 *
 * These DTOs serve as the contract between:
 * - Database layer (Supabase raw types)
 * - Application layer (Services, Components)
 *
 * Benefits:
 * 1. Runtime validation with Zod
 * 2. Type safety without relying on generated types
 * 3. Clear API contracts
 * 4. Easy to test and mock
 */

import { z } from 'zod'

// ============================================
// BOOKING DTOs
// ============================================

export const BookingDTOSchema = z.object({
  id: z.string().uuid(),
  car_id: z.string().uuid(),
  renter_id: z.string().uuid(),
  start_date: z.string(),
  end_date: z.string(),
  status: z.enum([
    'pending',
    'confirmed',
    'active',
    'completed',
    'cancelled',
  ]),
  total_price_cents: z.number().int().nonnegative(),
  deposit_hold_id: z.string().nullable(),
  cancel_policy: z.enum(['flexible', 'moderate', 'strict']),
  created_at: z.string(),
  updated_at: z.string(),
})

export type BookingDTO = z.infer<typeof BookingDTOSchema>

// ============================================
// CAR DTOs
// ============================================

export const CarDTOSchema = z.object({
  id: z.string().uuid(),
  owner_id: z.string().uuid(),
  brand: z.string(),
  model: z.string(),
  year: z.number().int().min(1900).max(2100),
  photo_main_url: z.string().nullable(),
  location_city: z.string().nullable(),
  location_country: z.string().nullable(),
  price_per_day_cents: z.number().int().positive(),
  status: z.enum(['draft', 'active', 'inactive', 'suspended']),
  transmission: z.enum(['manual', 'automatic']),
  fuel_type: z.enum(['gasoline', 'diesel', 'electric', 'hybrid']),
  seats: z.number().int().positive(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type CarDTO = z.infer<typeof CarDTOSchema>

// ============================================
// PROFILE DTOs
// ============================================

export const ProfileDTOSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string(),
  avatar_url: z.string().nullable(),
  phone: z.string().nullable(),
  role: z.enum(['renter', 'owner', 'both', 'admin']),
  kyc_status: z.enum(['pending', 'approved', 'rejected', 'not_started']),
  email_verified: z.boolean(),
  phone_verified: z.boolean(),
  rating_avg: z.number().nullable(),
  total_bookings_as_owner: z.number().int().nonnegative().nullable(),
  total_bookings_as_renter: z.number().int().nonnegative().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type ProfileDTO = z.infer<typeof ProfileDTOSchema>

// ============================================
// PAYMENT DTOs
// ============================================

export const PaymentDTOSchema = z.object({
  id: z.string().uuid(),
  booking_id: z.string().uuid(),
  payer_id: z.string().uuid(),
  amount_cents: z.number().int().nonnegative(),
  status: z.enum([
    'pending',
    'processing',
    'completed',
    'failed',
    'refunded',
    'cancelled',
  ]),
  provider: z.enum(['mercadopago', 'stripe']),
  external_payment_id: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  completed_at: z.string().nullable(),
})

export type PaymentDTO = z.infer<typeof PaymentDTOSchema>

// ============================================
// INSURANCE POLICY DTOs
// ============================================

export const InsurancePolicyDTOSchema = z.object({
  id: z.string().uuid(),
  booking_id: z.string().uuid(),
  coverage_level: z.enum(['basic', 'standard', 'premium']),
  total_premium_cents: z.number().int().nonnegative(),
  status: z.enum(['active', 'expired', 'cancelled']),
  created_at: z.string(),
  updated_at: z.string(),
})

export type InsurancePolicyDTO = z.infer<typeof InsurancePolicyDTOSchema>

// ============================================
// WALLET DTOs
// ============================================

export const WalletDTOSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  available_balance_cents: z.number().int(),
  pending_balance_cents: z.number().int(),
  total_earned_cents: z.number().int(),
  total_withdrawn_cents: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type WalletDTO = z.infer<typeof WalletDTOSchema>

// ============================================
// REVIEW DTOs
// ============================================

export const ReviewDTOSchema = z.object({
  id: z.string().uuid(),
  booking_id: z.string().uuid(),
  reviewer_id: z.string().uuid(),
  reviewee_id: z.string().uuid(),
  rating_overall: z.number().int().min(1).max(5),
  comment_public: z.string().nullable(),
  created_at: z.string(),
})

export type ReviewDTO = z.infer<typeof ReviewDTOSchema>

// ============================================
// INSURANCE CLAIM DTOs
// ============================================

export const InsuranceClaimDTOSchema = z.object({
  id: z.string().uuid(),
  policy_id: z.string().uuid(),
  booking_id: z.string().uuid(),
  reported_by: z.string().uuid(),
  claim_amount_cents: z.number().int().nonnegative(),
  approved_amount_cents: z.number().int().nonnegative().nullable(),
  status: z.enum(['pending', 'approved', 'rejected', 'paid']),
  damage_type: z.string(),
  severity: z.enum(['minor', 'moderate', 'severe']),
  incident_date: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type InsuranceClaimDTO = z.infer<typeof InsuranceClaimDTOSchema>

// ============================================
// PAYMENT SPLIT DTOs
// ============================================

export const PaymentSplitDTOSchema = z.object({
  id: z.string().uuid(),
  payment_id: z.string().uuid(),
  recipient_id: z.string().uuid(),
  amount_cents: z.number().int().nonnegative(),
  recipient_type: z.enum(['owner', 'platform', 'insurance']),
  status: z.enum(['pending', 'completed', 'failed']),
  created_at: z.string(),
})

export type PaymentSplitDTO = z.infer<typeof PaymentSplitDTOSchema>

// ============================================
// WALLET TRANSACTION DTOs
// ============================================

export const WalletTransactionDTOSchema = z.object({
  id: z.string().uuid(),
  wallet_id: z.string().uuid(),
  amount_cents: z.number().int(),
  type: z.enum(['credit', 'debit', 'hold', 'release']),
  status: z.enum(['pending', 'completed', 'failed', 'cancelled']),
  reference_type: z.enum(['booking', 'withdrawal', 'refund', 'deposit']).nullable(),
  reference_id: z.string().uuid().nullable(),
  created_at: z.string(),
})

export type WalletTransactionDTO = z.infer<typeof WalletTransactionDTOSchema>

// ============================================
// HELPER: Parse DB Row to DTO
// ============================================

/**
 * Safely parse database row to DTO
 * Throws if validation fails
 */
export function parseBooking(row: unknown): BookingDTO {
  return BookingDTOSchema.parse(row)
}

export function parseCar(row: unknown): CarDTO {
  return CarDTOSchema.parse(row)
}

export function parseProfile(row: unknown): ProfileDTO {
  return ProfileDTOSchema.parse(row)
}

export function parsePayment(row: unknown): PaymentDTO {
  return PaymentDTOSchema.parse(row)
}

export function parseInsurancePolicy(row: unknown): InsurancePolicyDTO {
  return InsurancePolicyDTOSchema.parse(row)
}

export function parseWallet(row: unknown): WalletDTO {
  return WalletDTOSchema.parse(row)
}

export function parseReview(row: unknown): ReviewDTO {
  return ReviewDTOSchema.parse(row)
}
