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
  doors: z.number().int().nullable(),
  rating_avg: z.number().nullable(),
  rating_count: z.number().int().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type CarDTO = z.infer<typeof CarDTOSchema>

// ============================================
// PROFILE DTOs
// ============================================

export const ProfileDTOSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  phone: z.string().nullable(),
  role: z.enum(['renter', 'owner', 'admin']),
  kyc: z.enum(['not_started', 'pending', 'verified', 'rejected']).nullable(),
  onboarding: z.enum(['incomplete', 'complete']).nullable(),
  email_verified: z.boolean().nullable(),
  phone_verified: z.boolean().nullable(),
  rating_avg: z.number().nullable(),
  rating_count: z.number().int().nonnegative().nullable(),
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
    'requires_payment',
    'processing',
    'succeeded',
    'failed',
    'refunded',
    'partial_refund',
    'chargeback',
  ]),
  provider: z.enum(['mercadopago', 'stripe', 'otro']),
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
  insurer: z.string(),
  policy_type: z.string(),
  car_id: z.string().uuid().nullable(),
  owner_id: z.string().uuid().nullable(),
  annual_premium: z.number().nullable(),
  daily_premium: z.number().nullable(),
  liability_coverage_amount: z.number().nullable(),
  own_damage_coverage: z.boolean().nullable(),
  theft_coverage: z.boolean().nullable(),
  fire_coverage: z.boolean().nullable(),
  misappropriation_coverage: z.boolean().nullable(),
  misappropriation_limit: z.number().nullable(),
  deductible_type: z.string().nullable(),
  deductible_percentage: z.number().nullable(),
  deductible_min_amount: z.number().nullable(),
  deductible_fixed_amount: z.number().nullable(),
  status: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
})

export type InsurancePolicyDTO = z.infer<typeof InsurancePolicyDTOSchema>

// ============================================
// WALLET DTOs
// ============================================

export const WalletDTOSchema = z.object({
  user_id: z.string().uuid(),
  available_balance: z.number(),
  locked_balance: z.number(),
  currency: z.string(),
  non_withdrawable_floor: z.number(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
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
  claim_type: z.string(),
  description: z.string(),
  incident_date: z.string(),
  estimated_damage_amount: z.number().nullable(),
  insurance_payout: z.number().nullable(),
  deductible_charged: z.number().nullable(),
  location: z.string().nullable(),
  police_report_number: z.string().nullable(),
  police_report_url: z.string().nullable(),
  assigned_adjuster: z.string().nullable(),
  adjuster_contact: z.string().nullable(),
  reporter_role: z.string().nullable(),
  resolution_notes: z.string().nullable(),
  status: z.string().nullable(),
  photos: z.unknown().nullable(),
  metadata: z.unknown().nullable(),
  closed_at: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
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
  user_id: z.string().uuid(),
  amount: z.number(),
  type: z.string(),
  status: z.string(),
  reference_type: z.string().nullable(),
  reference_id: z.string().nullable(),
  description: z.string().nullable(),
  provider: z.string().nullable(),
  provider_metadata: z.unknown().nullable(),
  provider_transaction_id: z.string().nullable(),
  currency: z.string(),
  is_withdrawable: z.boolean(),
  admin_notes: z.string().nullable(),
  completed_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
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

// ============================================
// MESSAGE DTOs
// ============================================

export const MessageDTOSchema = z.object({
  id: z.string().uuid(),
  car_id: z.string().uuid().nullable(),
  booking_id: z.string().uuid().nullable(),
  sender_id: z.string().uuid(),
  recipient_id: z.string().uuid(),
  body: z.string().min(1),
  created_at: z.string(),
  delivered_at: z.string().nullable(),
  read_at: z.string().nullable(),
})

export type MessageDTO = z.infer<typeof MessageDTOSchema>

export function parseMessage(row: unknown): MessageDTO {
  return MessageDTOSchema.parse(row)
}

// ============================================
// NOTIFICATION DTOs
// ============================================

export const NotificationDTOSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string().min(1),
  body: z.string().min(1),
  cta_link: z.string().nullable(),
  is_read: z.boolean(),
  type: z.enum([
    'new_booking_for_owner',
    'booking_cancelled_for_owner',
    'booking_cancelled_for_renter',
    'new_chat_message',
    'payment_successful',
    'payout_successful',
    'inspection_reminder',
    'generic_announcement',
  ]),
  metadata: z.record(z.unknown()).nullable(),
  created_at: z.string(),
})

export type NotificationDTO = z.infer<typeof NotificationDTOSchema>

export function parseNotification(row: unknown): NotificationDTO {
  return NotificationDTOSchema.parse(row)
}

// ============================================
// PUSH TOKEN DTOs
// ============================================

export const PushTokenDTOSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  token: z.string().min(1),
  created_at: z.string(),
})

export type PushTokenDTO = z.infer<typeof PushTokenDTOSchema>

export function parsePushToken(row: unknown): PushTokenDTO {
  return PushTokenDTOSchema.parse(row)
}

// ============================================
// DOCUMENT DTOs
// ============================================

export const UserDocumentDTOSchema = z.object({
  id: z.number().int(),
  user_id: z.string().uuid(),
  kind: z.enum(['gov_id_front', 'gov_id_back', 'driver_license', 'utility_bill', 'selfie']),
  storage_path: z.string(),
  status: z.enum(['not_started', 'pending', 'verified', 'rejected']),
  notes: z.string().nullable(),
  created_at: z.string(),
  reviewed_by: z.string().uuid().nullable(),
  reviewed_at: z.string().nullable(),
})

export type UserDocumentDTO = z.infer<typeof UserDocumentDTOSchema>

export function parseUserDocument(row: unknown): UserDocumentDTO {
  return UserDocumentDTOSchema.parse(row)
}

export const VehicleDocumentDTOSchema = z.object({
  id: z.string().uuid(),
  car_id: z.string().uuid(),
  kind: z.enum(['registration', 'insurance', 'technical_inspection', 'circulation_permit', 'ownership_proof']),
  storage_path: z.string(),
  status: z.enum(['pending', 'verified', 'rejected']),
  expiry_date: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  verified_by: z.string().uuid().nullable(),
  verified_at: z.string().nullable(),
})

export type VehicleDocumentDTO = z.infer<typeof VehicleDocumentDTOSchema>

export function parseVehicleDocument(row: unknown): VehicleDocumentDTO {
  return VehicleDocumentDTOSchema.parse(row)
}

// ============================================
// DISPUTE DTOs
// ============================================

export const DisputeDTOSchema = z.object({
  id: z.string().uuid(),
  booking_id: z.string().uuid(),
  opened_by: z.string().uuid(),
  kind: z.enum(['damage', 'no_show', 'late_return', 'other']),
  description: z.string().nullable(),
  status: z.enum(['open', 'in_review', 'resolved', 'rejected']),
  created_at: z.string(),
  resolved_by: z.string().uuid().nullable(),
  resolved_at: z.string().nullable(),
})

export type DisputeDTO = z.infer<typeof DisputeDTOSchema>

export function parseDispute(row: unknown): DisputeDTO {
  return DisputeDTOSchema.parse(row)
}

export const DisputeEvidenceDTOSchema = z.object({
  id: z.string().uuid(),
  dispute_id: z.string().uuid(),
  path: z.string(),
  note: z.string().nullable(),
  created_at: z.string(),
})

export type DisputeEvidenceDTO = z.infer<typeof DisputeEvidenceDTOSchema>

export function parseDisputeEvidence(row: unknown): DisputeEvidenceDTO {
  return DisputeEvidenceDTOSchema.parse(row)
}
