/**
 * Booking Compatibility Layer
 *
 * Maps between DTO types (used in the app) and real DB types.
 *
 * DTO uses: start_date, end_date, total_price_cents
 * DB uses:  start_at,   end_at,   total_amount
 */

import type { Database } from '@/types/supabase.generated'

type BookingsTable = Database['public']['Tables']['bookings']
export type BookingInsertDB = BookingsTable['Insert']
export type BookingUpdateDB = BookingsTable['Update']

/**
 * DTO type (what the app uses)
 * Note: All optional fields include undefined for exactOptionalPropertyTypes: true
 * car_id, renter_id can be undefined from UpdateBookingInput schema
 */
export interface BookingDTO {
  car_id?: string | undefined
  renter_id?: string | undefined
  start_date?: string | undefined
  end_date?: string | undefined
  total_price_cents?: number | undefined
  status?: Database['public']['Enums']['booking_status'] | undefined
  guarantee_type?: string | undefined
  guarantee_amount_cents?: number | undefined
  cancellation_reason?: string | undefined
  cancelled_by_user_id?: string | undefined
  // Add other optional fields as needed
}

/**
 * Type-safe insert input (requires all mandatory fields)
 */
interface BookingInsertInput {
  car_id: string
  renter_id: string
  start_date: string
  end_date: string
  total_price_cents: number
  status?: Database['public']['Enums']['booking_status']
  guarantee_type?: string
  guarantee_amount_cents?: number
}

/**
 * Convert Insert Input to DB Insert type
 * Mandatory fields: car_id, renter_id, start_at, end_at, total_amount
 */
export function toDBBookingInsert(input: BookingInsertInput): BookingInsertDB {
  return {
    car_id: input.car_id,
    renter_id: input.renter_id,
    start_at: input.start_date,           // ← DTO → DB name mapping
    end_at: input.end_date,               // ← DTO → DB name mapping
    total_amount: input.total_price_cents, // ← DTO → DB name mapping
    status: input.status ?? 'pending',
    guarantee_type: input.guarantee_type ?? null,
    guarantee_amount_cents: input.guarantee_amount_cents ?? null,
  }
}

/**
 * Convert DTO to DB Update type (all fields optional)
 */
export function toDBBookingUpdate(dto: Partial<BookingDTO>): BookingUpdateDB {
  const update: BookingUpdateDB = {}

  if (dto.start_date !== undefined) {update.start_at = dto.start_date}
  if (dto.end_date !== undefined) {update.end_at = dto.end_date}
  if (dto.total_price_cents !== undefined) {update.total_amount = dto.total_price_cents}
  if (dto.status !== undefined) {update.status = dto.status}
  if (dto.guarantee_type !== undefined) {update.guarantee_type = dto.guarantee_type}
  if (dto.guarantee_amount_cents !== undefined) {
    update.guarantee_amount_cents = dto.guarantee_amount_cents
  }
  if (dto.cancellation_reason !== undefined) {update.cancellation_reason = dto.cancellation_reason}
  if (dto.cancelled_by_user_id !== undefined) {update.cancelled_at = new Date().toISOString()}

  return update
}
