/* eslint-disable @typescript-eslint/no-unnecessary-condition, eslint-comments/disable-enable-pair -- SDK layer: Defensive programming for runtime safety against Supabase SDK changes */
import {
  CreatePaymentInputSchema,
  RefundRequestSchema,
  PaymentSearchFiltersSchema,
  type PaymentDTO,
  type CreatePaymentInput,
  type RefundRequest,
  type PaymentSearchFilters,
  type PaginatedResponse,
  type PaymentStatus,
  parsePayment,
} from '@/types'
import type { PaymentInsert } from '@/types/database-helpers'
/**
 * Payment SDK
 * Handles payment processing operations
 */


import { toError } from '../errors'
import { supabase } from '../supabase'

import { BaseSDK } from './base.sdk'

export class PaymentSDK extends BaseSDK {
  /**
   * Get payment by ID
   */
  async getById(id: string): Promise<PaymentDTO> {
    try {
      const { data, error } = await this.supabase
        .from('payments')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {throw toError(error)}
      if (!data) {throw new Error('Payment not found')}

      return parsePayment(data)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Create a new payment
   */
  async create(input: CreatePaymentInput): Promise<PaymentDTO> {
    try {
      // Validate input
      const validData = CreatePaymentInputSchema.parse(input)

      const { data, error } = await this.supabase
        .from('payments')
        .insert(validData as PaymentInsert)
        .select()
        .single()

      if (error) {throw toError(error)}
      if (!data) {throw new Error('Failed to create payment')}

      return parsePayment(data)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Update payment status (webhook handler)
   */
  async updateStatus(
    paymentId: string,
    status: PaymentStatus,
    metadata?: Record<string, unknown>
  ): Promise<PaymentDTO> {
    try {
      const { data, error } = await this.supabase
        .from('payments')
        .update({
          status,
          ...(status === 'succeeded' && { completed_at: new Date().toISOString() }),
          ...(metadata && { metadata }),
        })
        .eq('id', paymentId)
        .select()
        .single()

      if (error) {throw toError(error)}
      if (!data) {throw new Error('Failed to update payment status')}

      return parsePayment(data)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Request refund
   */
  async requestRefund(input: RefundRequest): Promise<PaymentDTO> {
    try {
      // Validate input
      const validData = RefundRequestSchema.parse(input)

      const payment = await this.getById(validData.payment_id)

      if (payment.status !== 'succeeded') {
        throw new Error('Can only refund completed payments')
      }

      // Process refund via payment provider
      // This would call MercadoPago/Stripe API

      const { data, error } = await this.supabase
        .from('payments')
        .update({
          status: 'refunded',
          refund_amount_cents: validData.refund_amount_cents,
          refund_reason: validData.refund_reason,
          refunded_at: new Date().toISOString(),
        })
        .eq('id', validData.payment_id)
        .select()
        .single()

      if (error) {throw toError(error)}
      if (!data) {throw new Error('Failed to process refund')}

      return parsePayment(data)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Search payments
   */
  async search(filters: PaymentSearchFilters): Promise<PaginatedResponse<PaymentDTO>> {
    try {
      // Validate filters
      const validFilters = PaymentSearchFiltersSchema.parse(filters)

      let query = this.supabase
        .from('payments')
        .select('*', { count: 'exact' })

      // Apply filters
      if (validFilters.payer_id) {
        query = query.eq('payer_id', validFilters.payer_id)
      }

      if (validFilters.booking_id) {
        query = query.eq('booking_id', validFilters.booking_id)
      }

      if (validFilters.status) {
        query = query.eq('status', validFilters.status)
      }

      if (validFilters.statuses && validFilters.statuses.length > 0) {
        query = query.in('status', validFilters.statuses)
      }

      if (validFilters.provider) {
        query = query.eq('provider', validFilters.provider)
      }

      if (validFilters.created_from) {
        query = query.gte('created_at', validFilters.created_from)
      }

      if (validFilters.created_to) {
        query = query.lte('created_at', validFilters.created_to)
      }

      if (validFilters.min_amount_cents) {
        query = query.gte('amount_cents', validFilters.min_amount_cents)
      }

      if (validFilters.max_amount_cents) {
        query = query.lte('amount_cents', validFilters.max_amount_cents)
      }

      if (validFilters.external_payment_id) {
        query = query.eq('external_payment_id', validFilters.external_payment_id)
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

      if (error) {throw toError(error)}

      // Validate and parse all results
      const validatedData = (data ?? []).map(parsePayment)

      return this.createPaginatedResponse(
        validatedData,
        count,
        validFilters.page,
        validFilters.pageSize
      )
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Get payments for booking
   */
  async getByBooking(bookingId: string): Promise<PaymentDTO[]> {
    try {
      const { data, error } = await this.supabase
        .from('payments')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false })

      if (error) {throw toError(error)}

      // Validate and parse all results
      return (data ?? []).map(parsePayment)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Get payment splits for a payment
   *
   * Note: Returns payment_splits table data. Consider using PaymentSplitDTO.
   */
  async getSplits(paymentId: string): Promise<unknown[]> {
    try {
      const { data, error } = await this.supabase
        .from('payment_splits')
        .select('*')
        .eq('payment_id', paymentId)

      if (error) {throw toError(error)}

      return data ?? []
    } catch (e) {
      throw toError(e)
    }
  }
}

// Singleton instance
export const paymentSDK = new PaymentSDK(supabase)
