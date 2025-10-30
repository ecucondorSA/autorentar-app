/**
 * Payment Compatibility Layer
 *
 * Maps between DTO types (used in the app) and real DB types.
 *
 * DTO uses: amount_cents
 * DB uses:  amount
 */

import type { Database } from '@/types/supabase.generated'

type PaymentsTable = Database['public']['Tables']['payments']
export type PaymentInsertDB = PaymentsTable['Insert']
export type PaymentUpdateDB = PaymentsTable['Update']

/**
 * DTO type (what the app uses)
 * Note: All optional fields include undefined for exactOptionalPropertyTypes: true
 */
export interface PaymentDTO {
  booking_id: string
  amount_cents: number
  status?: Database['public']['Enums']['payment_status'] | undefined
  provider: Database['public']['Enums']['payment_provider']
  provider_payment_id?: string | undefined
  provider_intent_id?: string | undefined
  currency?: string | undefined
  description?: string | undefined
  payment_method_id?: string | undefined
  user_id?: string | undefined
  // Add other optional fields as needed
}

/**
 * Convert DTO to DB Insert type
 * Mandatory fields: booking_id, amount
 */
export function toDBPaymentInsert(dto: PaymentDTO): PaymentInsertDB {
  return {
    booking_id: dto.booking_id,
    amount: dto.amount_cents,            // ← DTO → DB name mapping
    status: dto.status ?? 'requires_payment',
    provider: dto.provider,
    provider_payment_id: dto.provider_payment_id ?? null,
    provider_intent_id: dto.provider_intent_id ?? null,
    currency: dto.currency ?? 'ARS',
    description: dto.description ?? null,
    payment_method_id: dto.payment_method_id ?? null,
    user_id: dto.user_id ?? null,
  }
}

/**
 * Convert DTO to DB Update type (all fields optional)
 */
export function toDBPaymentUpdate(dto: Partial<PaymentDTO>): PaymentUpdateDB {
  const update: PaymentUpdateDB = {}

  if (dto.amount_cents !== undefined) {update.amount = dto.amount_cents}
  if (dto.status) {update.status = dto.status}
  if (dto.provider) {update.provider = dto.provider}
  if (dto.provider_payment_id !== undefined) {
    update.provider_payment_id = dto.provider_payment_id
  }
  if (dto.provider_intent_id !== undefined) {
    update.provider_intent_id = dto.provider_intent_id
  }
  if (dto.currency) {update.currency = dto.currency}
  if (dto.description !== undefined) {update.description = dto.description}
  if (dto.payment_method_id !== undefined) {
    update.payment_method_id = dto.payment_method_id
  }
  if (dto.user_id !== undefined) {update.user_id = dto.user_id}

  return update
}
