/**
 * Database Type Helpers
 *
 * Convenience types extracted from supabase.generated.ts
 * to avoid using `as never` in SDK operations.
 *
 * Usage:
 *   import { BookingInsert, CarUpdate } from '@/types/database-helpers'
 *   await supabase.from('bookings').insert(data as BookingInsert)
 */

import type { Database } from './supabase.generated'

// ============================================
// TABLE ROW TYPES (for SELECT queries)
// ============================================

export type BookingRow = Database['public']['Tables']['bookings']['Row']
export type CarRow = Database['public']['Tables']['cars']['Row']
export type ProfileRow = Database['public']['Tables']['profiles']['Row']
export type PaymentRow = Database['public']['Tables']['payments']['Row']
// NOTE: 'reviews' table doesn't exist in current schema - using car_stats instead
export type CarStatsRow = Database['public']['Tables']['car_stats']['Row']
export type UserStatsRow = Database['public']['Tables']['user_stats']['Row']
export type MessageRow = Database['public']['Tables']['messages']['Row']
export type NotificationRow = Database['public']['Tables']['notifications']['Row']
export type InsurancePolicyRow = Database['public']['Tables']['insurance_policies']['Row']
export type DisputeRow = Database['public']['Tables']['disputes']['Row']
// NOTE: 'documents' table doesn't exist in current schema - commented out
// export type DocumentRow = Database['public']['Tables']['documents']['Row']
export type CarPhotoRow = Database['public']['Tables']['car_photos']['Row']
// NOTE: wallet tables use different naming in schema
// export type UserWalletRow = Database['public']['Tables']['user_wallets']['Row']
// export type WalletTransactionRow = Database['public']['Tables']['wallet_transactions']['Row']
export type BankAccountRow = Database['public']['Tables']['bank_accounts']['Row']

// ============================================
// INSERT TYPES (for INSERT operations)
// ============================================

export type BookingInsert = Database['public']['Tables']['bookings']['Insert']
export type CarInsert = Database['public']['Tables']['cars']['Insert']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type PaymentInsert = Database['public']['Tables']['payments']['Insert']
// NOTE: 'reviews' table doesn't exist in current schema
// export type ReviewInsert = Database['public']['Tables']['reviews']['Insert']
export type MessageInsert = Database['public']['Tables']['messages']['Insert']
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
export type InsurancePolicyInsert = Database['public']['Tables']['insurance_policies']['Insert']
export type DisputeInsert = Database['public']['Tables']['disputes']['Insert']
// NOTE: 'documents' table doesn't exist in current schema
// export type DocumentInsert = Database['public']['Tables']['documents']['Insert']
export type CarPhotoInsert = Database['public']['Tables']['car_photos']['Insert']
// NOTE: wallet tables use different naming in schema - verify exact table names
// export type UserWalletInsert = Database['public']['Tables']['user_wallets']['Insert']
// export type WalletTransactionInsert = Database['public']['Tables']['wallet_transactions']['Insert']
export type BankAccountInsert = Database['public']['Tables']['bank_accounts']['Insert']

// ============================================
// UPDATE TYPES (for UPDATE operations)
// ============================================

export type BookingUpdate = Database['public']['Tables']['bookings']['Update']
export type CarUpdate = Database['public']['Tables']['cars']['Update']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type PaymentUpdate = Database['public']['Tables']['payments']['Update']
// NOTE: 'reviews' table doesn't exist in current schema
// export type ReviewUpdate = Database['public']['Tables']['reviews']['Update']
export type MessageUpdate = Database['public']['Tables']['messages']['Update']
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update']
export type InsurancePolicyUpdate = Database['public']['Tables']['insurance_policies']['Update']
export type DisputeUpdate = Database['public']['Tables']['disputes']['Update']
// NOTE: 'documents' table doesn't exist in current schema
// export type DocumentUpdate = Database['public']['Tables']['documents']['Update']
export type CarPhotoUpdate = Database['public']['Tables']['car_photos']['Update']
// NOTE: wallet tables use different naming in schema - verify exact table names
// export type UserWalletUpdate = Database['public']['Tables']['user_wallets']['Update']
// export type WalletTransactionUpdate = Database['public']['Tables']['wallet_transactions']['Update']
export type BankAccountUpdate = Database['public']['Tables']['bank_accounts']['Update']

// ============================================
// RPC FUNCTION TYPES
// ============================================

export type RpcFunctions = Database['public']['Functions']

// Common RPC parameters
export type CreateReviewParams = RpcFunctions['create_review']['Args']
// NOTE: 'search_cars_nearby' RPC doesn't exist in current schema
// export type SearchCarsNearbyParams = RpcFunctions['search_cars_nearby']['Args']
export type WalletInitiateDepositParams = RpcFunctions['wallet_initiate_deposit']['Args']
export type WalletConfirmDepositParams = RpcFunctions['wallet_confirm_deposit']['Args']
export type WalletLockFundsParams = RpcFunctions['wallet_lock_funds']['Args']
export type WalletUnlockFundsParams = RpcFunctions['wallet_unlock_funds']['Args']

// ============================================
// ENUM TYPES
// ============================================

export type BookingStatus = Database['public']['Enums']['booking_status']
export type CarStatus = Database['public']['Enums']['car_status']
export type PaymentStatus = Database['public']['Enums']['payment_status']
// NOTE: 'review_type' enum doesn't exist, use 'rating_role' instead
export type RatingRole = Database['public']['Enums']['rating_role']
export type NotificationType = Database['public']['Enums']['notification_type']
export type UserRole = Database['public']['Enums']['user_role']
export type WalletTransactionType = Database['public']['Enums']['wallet_transaction_type']
// NOTE: 'wallet_transaction_status' enum doesn't exist, payments use 'payment_status'
// export type WalletTransactionStatus = Database['public']['Enums']['wallet_transaction_status']
export type DisputeStatus = Database['public']['Enums']['dispute_status']
// NOTE: 'dispute_resolution' enum doesn't exist in current schema
// export type DisputeResolution = Database['public']['Enums']['dispute_resolution']

// ============================================
// VIEW TYPES
// ============================================

// NOTE: car_stats and user_stats are Tables, not Views
export type CarStatsView = Database['public']['Tables']['car_stats']['Row']
export type UserStatsView = Database['public']['Tables']['user_stats']['Row']

// ============================================
// UTILITY TYPES
// ============================================

/**
 * Makes all properties of T required and non-nullable
 */
export type RequiredFields<T> = {
  [P in keyof T]-?: NonNullable<T[P]>
}

/**
 * Makes specific properties K of T required
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>

/**
 * Makes specific properties K of T optional
 */
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
