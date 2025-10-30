/* eslint-disable @typescript-eslint/no-unnecessary-condition, eslint-comments/disable-enable-pair -- SDK layer: Defensive programming for runtime safety against Supabase SDK changes */
/**
 * Wallet SDK
 * Handles wallet and transaction operations
 */

import {
  WithdrawalRequestSchema,
  TopupRequestSchema,
  TransactionHistoryFiltersSchema,
  type UserWallet,
  type WalletTransaction,
  type WithdrawalRequest,
  type TopupRequest,
  type TransactionHistoryFilters,
  type PaginatedResponse,
  type TablesInsert,
  type TablesUpdate,
} from '@/types'

import { toError } from '../errors'
import { supabase } from '../supabase'

import { BaseSDK } from './base.sdk'

export class WalletSDK extends BaseSDK {
  /**
   * Get wallet for user
   */
  async getByUserId(userId: string): Promise<UserWallet> {
    return this.execute(async () => {
      return await this.supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', userId)
        .single()
    })
  }

  /**
   * Get current user's wallet
   */
  async getCurrent(): Promise<UserWallet> {
    const { data: { user } } = await this.supabase.auth.getUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    return this.getByUserId(user.id)
  }

  /**
   * Get available balance
   */
  async getBalance(userId: string): Promise<number> {
    const wallet = await this.getByUserId(userId)
    return wallet.available_balance // Already in pesos
  }

  /**
   * Request withdrawal
   */
  async requestWithdrawal(input: WithdrawalRequest): Promise<WalletTransaction> {
    // Validate input
    const validData = WithdrawalRequestSchema.parse(input)

    // Check sufficient balance
    const wallet = await this.getByUserId(validData.user_id)

    if (wallet.available_balance < validData.amount_cents) {
      throw new Error('Insufficient balance')
    }

    // Create withdrawal transaction
    return this.execute(async () => {
      return await this.supabase
        .from('wallet_transactions')
        .insert({
          user_id: validData.user_id,
          type: 'withdrawal',
          amount: -validData.amount_cents, // Negative for withdrawal
          status: 'pending',
          description: `Withdrawal to ${validData.bank_name}`,
          provider_metadata: {
            cbu_cvu: validData.cbu_cvu,
            bank_name: validData.bank_name,
            account_holder: validData.account_holder_name,
          },
        })
        .select()
        .single()
    })
  }

  /**
   * Request topup (add funds)
   */
  async requestTopup(input: TopupRequest): Promise<WalletTransaction> {
    // Validate input
    const validData = TopupRequestSchema.parse(input)

    return this.execute(async () => {
      return await this.supabase
        .from('wallet_transactions')
        .insert({
          user_id: validData.user_id,
          type: 'topup',
          amount: validData.amount_cents, // Positive for topup
          status: 'pending',
          description: `Topup via ${validData.payment_method}`,
          provider_metadata: {
            payment_method: validData.payment_method,
            payment_method_id: validData.payment_method_id,
            promo_code: validData.promo_code,
          },
        })
        .select()
        .single()
    })
  }

  /**
   * Get transaction history
   */
  async getTransactions(
    filters: TransactionHistoryFilters
  ): Promise<PaginatedResponse<WalletTransaction>> {
    // Validate filters
    const validFilters = TransactionHistoryFiltersSchema.parse(filters)

    let query = this.supabase
      .from('wallet_transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', validFilters.user_id)

    // Apply filters
    if (validFilters.kind) {
      query = query.eq('kind', validFilters.kind)
    }

    if (validFilters.status) {
      query = query.eq('status', validFilters.status)
    }

    if (validFilters.from_date) {
      query = query.gte('created_at', validFilters.from_date)
    }

    if (validFilters.to_date) {
      query = query.lte('created_at', validFilters.to_date)
    }

    if (validFilters.min_amount_cents) {
      query = query.gte('amount_cents', validFilters.min_amount_cents)
    }

    if (validFilters.max_amount_cents) {
      query = query.lte('amount_cents', validFilters.max_amount_cents)
    }

    if (validFilters.booking_id) {
      query = query.eq('booking_id', validFilters.booking_id)
    }

    if (validFilters.payment_id) {
      query = query.eq('payment_id', validFilters.payment_id)
    }

    // Sorting
    const [field, order] = validFilters.sortBy.split('_').reduce((acc, part, i, arr) => {
      if (i === arr.length - 1) {
        acc[1] = part
      } else {
        acc[0] += (i > 0 ? '_' : '') + part
      }
      return acc
    }, ['', 'desc'])

    query = query.order(field, { ascending: order === 'asc' })

    // Pagination
    const from = (validFilters.page - 1) * validFilters.pageSize
    const to = from + validFilters.pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      this.handleError(error, 'Transaction history fetch failed')
    }

    return this.createPaginatedResponse(
      data || [],
      count,
      validFilters.page,
      validFilters.pageSize
    )
  }

  /**
   * Get ledger entries (for debugging/admin)
   */
  async getLedgerEntries(userId: string): Promise<unknown[]> {
    const { data, error } = await this.supabase
      .from('wallet_ledger')
      .select('*')
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      this.handleError(error, 'Ledger fetch failed')
    }

    return data || []
  }

  /**
   * Create wallet transaction
   */
  async createTransaction(payload: TablesInsert<'wallet_transactions'>): Promise<WalletTransaction> {
    try {
      const { data, error } = await this.supabase
        .from('wallet_transactions')
        .insert(payload)
        .select()
        .single()

      if (error) {throw toError(error)}
      if (!data) {throw new Error('Failed to create transaction')}

      return data
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(id: string): Promise<WalletTransaction | null> {
    try {
      const { data, error } = await this.supabase
        .from('wallet_transactions')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (error) {throw toError(error)}
      return data ?? null
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Update transaction
   */
  async updateTransaction(
    id: string,
    patch: TablesUpdate<'wallet_transactions'>
  ): Promise<WalletTransaction> {
    try {
      const { data, error } = await this.supabase
        .from('wallet_transactions')
        .update(patch)
        .eq('id', id)
        .select()
        .single()

      if (error) {throw toError(error)}
      if (!data) {throw new Error('Failed to update transaction')}

      return data
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Create wallet (for new users)
   */
  async create(payload: TablesInsert<'user_wallets'>): Promise<UserWallet> {
    try {
      const { data, error } = await this.supabase
        .from('user_wallets')
        .insert(payload)
        .select()
        .single()

      if (error) {throw toError(error)}
      if (!data) {throw new Error('Failed to create wallet')}

      return data
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Update wallet
   */
  async update(userId: string, patch: TablesUpdate<'user_wallets'>): Promise<UserWallet> {
    try {
      const { data, error } = await this.supabase
        .from('user_wallets')
        .update(patch)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {throw toError(error)}
      if (!data) {throw new Error('Failed to update wallet')}

      return data
    } catch (e) {
      throw toError(e)
    }
  }
}

// Singleton instance
export const walletSDK = new WalletSDK(supabase)
