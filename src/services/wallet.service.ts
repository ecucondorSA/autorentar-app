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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call -- walletSDK.getById returns WalletDTO
      const wallet = await this.walletSDK.getById(input.wallet_id)

      // 3. Verify wallet is active
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- wallet has status property
      if (wallet.status !== 'active') {
        throw new WalletError(
          'Wallet is not active',
          WalletErrorCode.WALLET_FROZEN,
          403
        )
      }

      // 4. Create credit transaction
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call -- walletSDK.createTransaction returns WalletTransactionDTO
      const transaction = await this.walletSDK.createTransaction({
        wallet_id: input.wallet_id,
        amount_cents: input.amount_cents,
        type: 'credit',
        status: 'completed',
        description: input.description ?? 'Wallet credit',
        reference_type: input.reference_type ?? null,
        reference_id: input.reference_id ?? null,
      })

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- transaction is WalletTransactionDTO from SDK
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call -- walletSDK.getById returns WalletDTO
      const wallet = await this.walletSDK.getById(input.wallet_id)

      // 3. Verify wallet is active
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- wallet has status property
      if (wallet.status !== 'active') {
        throw new WalletError(
          'Wallet is not active',
          WalletErrorCode.WALLET_FROZEN,
          403
        )
      }

      // 4. Check sufficient balance
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- wallet has balance_cents property
      if (wallet.balance_cents < input.amount_cents) {
        throw new WalletError(
          'Insufficient balance',
          WalletErrorCode.INSUFFICIENT_BALANCE,
          400
        )
      }

      // 5. Create debit transaction
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call -- walletSDK.createTransaction returns WalletTransactionDTO
      const transaction = await this.walletSDK.createTransaction({
        wallet_id: input.wallet_id,
        amount_cents: input.amount_cents,
        type: 'debit',
        status: 'completed',
        description: input.description ?? 'Wallet debit',
        reference_type: input.reference_type ?? null,
        reference_id: input.reference_id ?? null,
      })

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- transaction is WalletTransactionDTO from SDK
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call -- walletSDK.getById returns WalletDTO
      const wallet = await this.walletSDK.getById(input.wallet_id)

      // 3. Check sufficient balance
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- wallet has balance_cents property
      if (wallet.balance_cents < input.amount_cents) {
        throw new WalletError(
          'Insufficient balance to hold funds',
          WalletErrorCode.INSUFFICIENT_BALANCE,
          400
        )
      }

      // 4. Create hold transaction
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call -- walletSDK.createTransaction returns WalletTransactionDTO
      const transaction = await this.walletSDK.createTransaction({
        wallet_id: input.wallet_id,
        amount_cents: input.amount_cents,
        type: 'hold',
        status: 'completed',
        description: input.description ?? 'Funds hold',
        reference_type: input.reference_type ?? 'booking',
        reference_id: input.reference_id,
      })

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- transaction is WalletTransactionDTO from SDK
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call -- walletSDK.getById returns WalletDTO
      const wallet = await this.walletSDK.getById(input.wallet_id)

      // 3. Verify sufficient held funds
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access -- wallet has held_balance_cents property
      const heldBalance = wallet.held_balance_cents ?? 0
      if (heldBalance < input.amount_cents) {
        throw new WalletError(
          'Insufficient held funds',
          WalletErrorCode.INSUFFICIENT_HELD_FUNDS,
          400
        )
      }

      // 4. Create release transaction
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call -- walletSDK.createTransaction returns WalletTransactionDTO
      const transaction = await this.walletSDK.createTransaction({
        wallet_id: input.wallet_id,
        amount_cents: input.amount_cents,
        type: 'release',
        status: 'completed',
        description: input.description ?? 'Funds release',
        reference_type: input.reference_type ?? 'booking',
        reference_id: input.reference_id,
      })

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- transaction is WalletTransactionDTO from SDK
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
  async getBalance(walletId: string): Promise<WalletBalance> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call -- walletSDK.getById returns WalletDTO
      const wallet = await this.walletSDK.getById(walletId)

      return {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access -- wallet has balance_cents property
        balance_cents: wallet.balance_cents,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access -- wallet has held_balance_cents property
        held_balance_cents: wallet.held_balance_cents ?? 0,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access -- wallet has balance_cents and held_balance_cents properties
        available_balance_cents: wallet.balance_cents - (wallet.held_balance_cents ?? 0),
      }
    } catch (error) {
      throw toError(error)
    }
  }

  /**
   * Freeze wallet
   * Prevent any transactions (admin action)
   */
  async freezeWallet(walletId: string): Promise<WalletDTO> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call -- walletSDK.updateStatus returns WalletDTO
      const wallet = await this.walletSDK.updateStatus(walletId, 'frozen')

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- wallet is WalletDTO from SDK
      return wallet
    } catch (error) {
      throw toError(error)
    }
  }

  /**
   * Unfreeze wallet
   * Allow transactions again (admin action)
   */
  async unfreezeWallet(walletId: string): Promise<WalletDTO> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call -- walletSDK.updateStatus returns WalletDTO
      const wallet = await this.walletSDK.updateStatus(walletId, 'active')

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- wallet is WalletDTO from SDK
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
  wallet_id: string
  amount_cents: number
  description?: string
  reference_type?: 'booking' | 'payment' | 'refund' | 'payout' | null
  reference_id?: string | null
}

interface DebitWalletInput {
  wallet_id: string
  amount_cents: number
  description?: string
  reference_type?: 'booking' | 'payment' | 'refund' | 'payout' | null
  reference_id?: string | null
}

interface HoldFundsInput {
  wallet_id: string
  amount_cents: number
  reference_id: string
  description?: string
  reference_type?: 'booking' | 'payment' | 'refund' | 'payout'
}

interface ReleaseFundsInput {
  wallet_id: string
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
