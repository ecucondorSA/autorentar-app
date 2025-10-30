/**
 * WalletService
 * Business logic layer for wallet operations
 *
 * Responsibilities:
 * - Credit/debit wallet funds
 * - Hold funds for pending bookings
 * - Release held funds after booking completion
 * - Validate sufficient balance
 * - Process wallet transactions
 */

import { walletSDK, type WalletSDK } from '@/lib/sdk/wallet.sdk'
import type { WalletDTO, WalletTransactionDTO } from '@/types'

import { toError } from '../lib/errors'

// ============================================
// WALLET SERVICE ERRORS
// ============================================

export enum WalletErrorCode {
  WALLET_NOT_FOUND = 'WALLET_NOT_FOUND',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  INSUFFICIENT_HELD_FUNDS = 'INSUFFICIENT_HELD_FUNDS',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  WALLET_FROZEN = 'WALLET_FROZEN',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

export class WalletError extends Error {
  constructor(
    message: string,
    public code: WalletErrorCode,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'WalletError'
    Object.setPrototypeOf(this, WalletError.prototype)
  }
}

// ============================================
// WALLET SERVICE
// ============================================

export class WalletService {
  constructor(private readonly walletSDK: WalletSDK) {}

  /**
   * Credit wallet
   * Add funds to wallet balance
   */
  async creditWallet(input: CreditWalletInput): Promise<WalletTransactionDTO> {
    try {
      // 1. Validate amount
      if (input.amount_cents <= 0) {
        throw new WalletError(
          'Amount must be positive',
          WalletErrorCode.INVALID_AMOUNT,
          400
        )
      }

      // 2. Get wallet
      const wallet = await this.walletSDK.getByUserId(input.user_id)

      // 3. Verify wallet exists (getByUserId throws if not found)
      if (!wallet) {
        throw new WalletError(
          'Wallet not found',
          WalletErrorCode.WALLET_NOT_FOUND,
          404
        )
      }

      // 4. Create credit transaction
      const transaction = await this.walletSDK.createTransaction({
        user_id: input.user_id,
        amount: input.amount_cents,
        type: 'credit',
        status: 'completed',
        description: input.description ?? 'Wallet credit',
        reference_type: input.reference_type ?? null,
        reference_id: input.reference_id ?? null,
      })

      return transaction
    } catch (error) {
      if (error instanceof WalletError) {throw error}
      throw toError(error)
    }
  }

  /**
   * Debit wallet
   * Remove funds from wallet balance
   */
  async debitWallet(input: DebitWalletInput): Promise<WalletTransactionDTO> {
    try {
      // 1. Validate amount
      if (input.amount_cents <= 0) {
        throw new WalletError(
          'Amount must be positive',
          WalletErrorCode.INVALID_AMOUNT,
          400
        )
      }

      // 2. Get wallet
      const wallet = await this.walletSDK.getByUserId(input.user_id)

      // 3. Check sufficient balance
      if (wallet.available_balance < input.amount_cents) {
        throw new WalletError(
          'Insufficient balance',
          WalletErrorCode.INSUFFICIENT_BALANCE,
          400
        )
      }

      // 4. Create debit transaction
      const transaction = await this.walletSDK.createTransaction({
        user_id: input.user_id,
        amount: input.amount_cents,
        type: 'debit',
        status: 'completed',
        description: input.description ?? 'Wallet debit',
        reference_type: input.reference_type ?? null,
        reference_id: input.reference_id ?? null,
      })

      return transaction
    } catch (error) {
      if (error instanceof WalletError) {throw error}
      throw toError(error)
    }
  }

  /**
   * Hold funds
   * Reserve funds for pending booking
   */
  async holdFunds(input: HoldFundsInput): Promise<WalletTransactionDTO> {
    try {
      // 1. Validate amount
      if (input.amount_cents <= 0) {
        throw new WalletError(
          'Amount must be positive',
          WalletErrorCode.INVALID_AMOUNT,
          400
        )
      }

      // 2. Get wallet
      const wallet = await this.walletSDK.getByUserId(input.user_id)

      // 3. Check sufficient balance
      if (wallet.available_balance < input.amount_cents) {
        throw new WalletError(
          'Insufficient balance to hold funds',
          WalletErrorCode.INSUFFICIENT_BALANCE,
          400
        )
      }

      // 4. Create hold transaction
      const transaction = await this.walletSDK.createTransaction({
        user_id: input.user_id,
        amount: input.amount_cents,
        type: 'hold',
        status: 'completed',
        description: input.description ?? 'Funds hold',
        reference_type: input.reference_type ?? 'booking',
        reference_id: input.reference_id,
      })

      return transaction
    } catch (error) {
      if (error instanceof WalletError) {throw error}
      throw toError(error)
    }
  }

  /**
   * Release held funds
   * Release funds after booking completion or cancellation
   */
  async releaseFunds(input: ReleaseFundsInput): Promise<WalletTransactionDTO> {
    try {
      // 1. Validate amount
      if (input.amount_cents <= 0) {
        throw new WalletError(
          'Amount must be positive',
          WalletErrorCode.INVALID_AMOUNT,
          400
        )
      }

      // 2. Get wallet
      const wallet = await this.walletSDK.getByUserId(input.user_id)

      // 3. Verify sufficient held funds
      const heldBalance = wallet.locked_balance ?? 0
      if (heldBalance < input.amount_cents) {
        throw new WalletError(
          'Insufficient held funds',
          WalletErrorCode.INSUFFICIENT_HELD_FUNDS,
          400
        )
      }

      // 4. Create release transaction
      const transaction = await this.walletSDK.createTransaction({
        user_id: input.user_id,
        amount: input.amount_cents,
        type: 'release',
        status: 'completed',
        description: input.description ?? 'Funds release',
        reference_type: input.reference_type ?? 'booking',
        reference_id: input.reference_id,
      })

      return transaction
    } catch (error) {
      if (error instanceof WalletError) {throw error}
      throw toError(error)
    }
  }

  /**
   * Get wallet balance
   * Returns current balance and held balance
   */
  async getBalance(userId: string): Promise<WalletBalance> {
    try {
      const wallet = await this.walletSDK.getByUserId(userId)

      return {
        balance_cents: wallet.available_balance,
        held_balance_cents: wallet.locked_balance,
        available_balance_cents: wallet.available_balance - wallet.locked_balance,
      }
    } catch (error) {
      throw toError(error)
    }
  }

  /**
   * Freeze wallet
   * Prevent any transactions (admin action)
   * Note: DB schema doesn't have a status field, using non_withdrawable_floor as workaround
   */
  async freezeWallet(userId: string): Promise<WalletDTO> {
    try {
      const wallet = await this.walletSDK.getByUserId(userId)
      // TODO: Implement proper freeze mechanism (maybe add status field to DB)
      // For now, just return the wallet unchanged
      return wallet
    } catch (error) {
      throw toError(error)
    }
  }

  /**
   * Unfreeze wallet
   * Allow transactions again (admin action)
   * Note: DB schema doesn't have a status field
   */
  async unfreezeWallet(userId: string): Promise<WalletDTO> {
    try {
      const wallet = await this.walletSDK.getByUserId(userId)
      // TODO: Implement proper unfreeze mechanism
      return wallet
    } catch (error) {
      throw toError(error)
    }
  }
}

// ============================================
// TYPES
// ============================================

interface CreditWalletInput {
  user_id: string
  amount_cents: number
  description?: string
  reference_type?: 'booking' | 'payment' | 'refund' | 'payout' | null
  reference_id?: string | null
}

interface DebitWalletInput {
  user_id: string
  amount_cents: number
  description?: string
  reference_type?: 'booking' | 'payment' | 'refund' | 'payout' | null
  reference_id?: string | null
}

interface HoldFundsInput {
  user_id: string
  amount_cents: number
  reference_id: string
  description?: string
  reference_type?: 'booking' | 'payment' | 'refund' | 'payout'
}

interface ReleaseFundsInput {
  user_id: string
  amount_cents: number
  reference_id: string
  description?: string
  reference_type?: 'booking' | 'payment' | 'refund' | 'payout'
}

interface WalletBalance {
  balance_cents: number
  held_balance_cents: number
  available_balance_cents: number
}

// Singleton instance
export const walletService = new WalletService(walletSDK)
