/**
 * Type-safe Database Facade
 * Clean layer over auto-generated Supabase types
 *
 * This file provides:
 * 1. Isolation from generated type errors
 * 2. Clean domain aliases
 * 3. Type-safe helpers
 */

import type { Database } from './database.types'

// ============================================
// SUPABASE HELPERS
// ============================================

/**
 * Extract Row type from table
 */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

/**
 * Extract Insert type from table
 */
export type Insertable<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

/**
 * Extract Update type from table
 */
export type Updatable<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

/**
 * Extract Enum type
 */
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]

// ============================================
// DOMAIN ALIASES (Clean, type-safe exports)
// ============================================

// Core Entities
export type Booking = Tables<'bookings'>
export type Car = Tables<'cars'>
export type Profile = Tables<'profiles'>

// Financial
export type Payment = Tables<'payments'>
export type PaymentSplit = Tables<'payment_splits'>
export type UserWallet = Tables<'user_wallets'>
export type WalletTransaction = Tables<'wallet_transactions'>
export type WalletLedger = Tables<'wallet_ledger'>

// Insurance
export type InsurancePolicy = Tables<'insurance_policies'>
export type InsuranceClaim = Tables<'insurance_claims'>

// Communication
export type Message = Tables<'messages'>
export type Notification = Tables<'notifications'>

// Reviews & Ratings
export type Review = Tables<'reviews'>

// Support & Disputes
export type Dispute = Tables<'disputes'>

// Documents
export type UserDocument = Tables<'user_documents'>

// ============================================
// INSERTABLE TYPES (for creation)
// ============================================

export type CreateBooking = Insertable<'bookings'>
export type CreateCar = Insertable<'cars'>
export type CreateProfile = Insertable<'profiles'>
export type CreatePayment = Insertable<'payments'>

// ============================================
// UPDATABLE TYPES (for updates)
// ============================================

export type UpdateBooking = Updatable<'bookings'>
export type UpdateCar = Updatable<'cars'>
export type UpdateProfile = Updatable<'profiles'>
export type UpdatePayment = Updatable<'payments'>

// ============================================
// ENUMS (type-safe enumerations)
// ============================================

export type BookingStatus = Enums<'booking_status'>
export type CarStatus = Enums<'car_status'>
export type PaymentStatus = Enums<'payment_status'>
export type PaymentProvider = Enums<'payment_provider'>
export type UserRole = Enums<'user_role'>
export type KYCStatus = Enums<'kyc_status'>
export type NotificationType = Enums<'notification_type'>
export type DisputeStatus = Enums<'dispute_status'>
export type TransmissionType = Enums<'transmission'>
export type FuelType = Enums<'fuel_type'>

// ============================================
// RE-EXPORT Database for SDK use
// ============================================

export type { Database, Json } from './database.types'
