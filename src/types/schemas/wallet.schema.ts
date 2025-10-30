/**
 * Zod Schemas para Wallet (Billetera)
 * Validación runtime para transacciones, ledger y balance
 */

import { z } from 'zod'

// ============================================
// ENUMS
// ============================================

export const WalletLedgerKindEnum = z.enum([
  'booking_payment',
  'booking_refund',
  'booking_payout',
  'deposit_hold',
  'deposit_release',
  'service_fee',
  'platform_commission',
  'withdrawal',
  'topup',
  'adjustment',
  'dispute_resolution',
  'insurance_claim',
  'promo_credit',
])

export const TransactionStatusEnum = z.enum(['pending', 'processing', 'completed', 'failed'])

// ============================================
// WALLET TRANSACTION INPUT
// ============================================

/**
 * Schema para crear una transacción en la wallet
 */
export const CreateWalletTransactionSchema = z.object({
  // User
  user_id: z.string().uuid('ID de usuario inválido'),

  // Transaction details
  kind: WalletLedgerKindEnum,
  amount_cents: z.number().int(), // puede ser positivo o negativo

  // Related entities (opcional)
  booking_id: z.string().uuid().optional(),
  payment_id: z.string().uuid().optional(),
  related_user_id: z.string().uuid().optional(),

  // Description
  description: z.string().min(5).max(500),

  // Metadata (JSON)
  metadata: z.record(z.unknown()).optional(),

  // Status
  status: TransactionStatusEnum.default('pending'),
})

export type CreateWalletTransaction = z.infer<typeof CreateWalletTransactionSchema>

// ============================================
// LEDGER ENTRY INPUT
// ============================================

/**
 * Schema para crear entrada en el ledger (libro mayor)
 * El ledger es append-only y tracking de todos los movimientos
 */
export const CreateLedgerEntrySchema = z.object({
  // Users (from/to)
  from_user_id: z.string().uuid().optional(), // null = plataforma
  to_user_id: z.string().uuid().optional(), // null = plataforma

  // Amount
  amount_cents: z.number().int().positive('Monto debe ser positivo'),

  // Type
  kind: WalletLedgerKindEnum,

  // Related entities
  booking_id: z.string().uuid().optional(),
  payment_id: z.string().uuid().optional(),

  // Description
  description: z.string().min(5).max(500),

  // Metadata
  metadata: z.record(z.unknown()).optional(),
})

export type CreateLedgerEntry = z.infer<typeof CreateLedgerEntrySchema>

// ============================================
// WITHDRAWAL REQUEST
// ============================================

/**
 * Schema para solicitud de retiro de fondos
 */
export const WithdrawalRequestSchema = z.object({
  user_id: z.string().uuid(),

  // Amount to withdraw
  amount_cents: z
    .number()
    .int()
    .positive('Monto debe ser positivo')
    .min(100000, 'Monto mínimo: $1000'),

  // Bank account info
  bank_account_id: z.string().uuid().optional(),
  cbu_cvu: z.string().length(22, 'CBU/CVU debe tener 22 dígitos'),
  bank_name: z.string().min(3),
  account_holder_name: z.string().min(3),

  // Verification
  otp_code: z.string().length(6, 'Código OTP debe tener 6 dígitos').optional(),
})

export type WithdrawalRequest = z.infer<typeof WithdrawalRequestSchema>

// ============================================
// TOPUP REQUEST
// ============================================

/**
 * Schema para agregar fondos a la wallet
 */
export const TopupRequestSchema = z.object({
  user_id: z.string().uuid(),

  // Amount to add
  amount_cents: z
    .number()
    .int()
    .positive('Monto debe ser positivo')
    .min(100000, 'Monto mínimo: $1000')
    .max(100000000, 'Monto máximo: $1,000,000'),

  // Payment method
  payment_method: z.enum(['credit_card', 'debit_card', 'bank_transfer', 'mercadopago']),
  payment_method_id: z.string().optional(),

  // Promo code (opcional)
  promo_code: z.string().optional(),
})

export type TopupRequest = z.infer<typeof TopupRequestSchema>

// ============================================
// WALLET BALANCE QUERY
// ============================================

/**
 * Schema para consultar balance de wallet
 */
export const GetWalletBalanceSchema = z.object({
  user_id: z.string().uuid(),
})

export type GetWalletBalance = z.infer<typeof GetWalletBalanceSchema>

// ============================================
// TRANSACTION HISTORY FILTERS
// ============================================

/**
 * Schema para filtrar historial de transacciones
 */
export const TransactionHistoryFiltersSchema = z.object({
  user_id: z.string().uuid(),

  // Filters
  kind: WalletLedgerKindEnum.optional(),
  status: TransactionStatusEnum.optional(),

  // Date range
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),

  // Amount range
  min_amount_cents: z.number().int().optional(),
  max_amount_cents: z.number().int().optional(),

  // Related entities
  booking_id: z.string().uuid().optional(),
  payment_id: z.string().uuid().optional(),

  // Sorting
  sortBy: z.enum(['created_at_desc', 'created_at_asc', 'amount_desc', 'amount_asc']).default('created_at_desc'),

  // Pagination
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
})

export type TransactionHistoryFilters = z.infer<typeof TransactionHistoryFiltersSchema>

// ============================================
// HOLD FUNDS (Deposit)
// ============================================

/**
 * Schema para retener fondos (ej. depósito de garantía)
 */
export const HoldFundsSchema = z.object({
  user_id: z.string().uuid(),
  booking_id: z.string().uuid(),
  amount_cents: z.number().int().positive(),
  reason: z.string().min(10).max(200),
  expires_at: z.string().datetime().optional(), // auto-release después de esta fecha
})

export type HoldFunds = z.infer<typeof HoldFundsSchema>

// ============================================
// RELEASE HELD FUNDS
// ============================================

/**
 * Schema para liberar fondos retenidos
 */
export const ReleaseFundsSchema = z.object({
  user_id: z.string().uuid(),
  booking_id: z.string().uuid(),
  amount_cents: z.number().int().positive(),
  reason: z.string().min(10).max(200),
})

export type ReleaseFunds = z.infer<typeof ReleaseFundsSchema>

// ============================================
// TRANSFER BETWEEN USERS
// ============================================

/**
 * Schema para transferir fondos entre usuarios
 * Usado para payouts de owner después de completar booking
 */
export const TransferFundsSchema = z.object({
  from_user_id: z.string().uuid(),
  to_user_id: z.string().uuid(),
  amount_cents: z.number().int().positive(),
  kind: WalletLedgerKindEnum,
  booking_id: z.string().uuid().optional(),
  description: z.string().min(10).max(500),
})

export type TransferFunds = z.infer<typeof TransferFundsSchema>

// ============================================
// PROMO CREDIT APPLICATION
// ============================================

/**
 * Schema para aplicar crédito promocional
 */
export const ApplyPromoCreditSchema = z.object({
  user_id: z.string().uuid(),
  promo_code: z.string().min(3).max(20).toUpperCase(),
  amount_cents: z.number().int().positive(),
  expires_at: z.string().datetime().optional(),
  valid_for_booking_ids: z.array(z.string().uuid()).optional(), // null = válido para cualquier booking
})

export type ApplyPromoCredit = z.infer<typeof ApplyPromoCreditSchema>

// ============================================
// WALLET STATEMENT EXPORT
// ============================================

/**
 * Schema para exportar estado de cuenta
 */
export const ExportWalletStatementSchema = z.object({
  user_id: z.string().uuid(),
  from_date: z.string().datetime(),
  to_date: z.string().datetime(),
  format: z.enum(['pdf', 'csv', 'excel']).default('pdf'),
  include_pending: z.boolean().default(false),
})

export type ExportWalletStatement = z.infer<typeof ExportWalletStatementSchema>
