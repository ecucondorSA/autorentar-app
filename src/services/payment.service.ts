/**
 * PaymentService
 * Business logic layer for payment operations
 *
 * Responsibilities:
 * - Process payments via providers (MercadoPago, Stripe)
 * - Handle refunds and cancellations
 * - Split payments between owner, platform, insurance
 * - Process provider webhooks
 * - Manage payment state transitions
 */

import { paymentSDK, type PaymentSDK } from '@/lib/sdk/payment.sdk'
import type {
  PaymentDTO,
} from '@/types'
import {
  type ProcessPaymentInput,
  ProcessPaymentInputSchema,
} from '@/types/service-types'

import { toError } from '../lib/errors'

// ============================================
// PAYMENT SERVICE ERRORS
// ============================================

export enum PaymentErrorCode {
  PAYMENT_NOT_FOUND = 'PAYMENT_NOT_FOUND',
  PAYMENT_ALREADY_PROCESSED = 'PAYMENT_ALREADY_PROCESSED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  REFUND_FAILED = 'REFUND_FAILED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  INVALID_PROVIDER = 'INVALID_PROVIDER',
  INVALID_STATE_TRANSITION = 'INVALID_STATE_TRANSITION',
  WEBHOOK_VERIFICATION_FAILED = 'WEBHOOK_VERIFICATION_FAILED',
  SPLIT_FAILED = 'SPLIT_FAILED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

export class PaymentError extends Error {
  constructor(
    message: string,
    public code: PaymentErrorCode,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'PaymentError'
    Object.setPrototypeOf(this, PaymentError.prototype)
  }
}

// ============================================
// PAYMENT SERVICE
// ============================================

export class PaymentService {
  constructor(
    private readonly paymentSDK: PaymentSDK
  ) {}

  /**
   * Process a payment
   * Coordinates with payment provider and updates payment status
   */
  async processPayment(input: ProcessPaymentInput): Promise<PaymentDTO> {
    try {
      // 1. Validate input
      const validInput = ProcessPaymentInputSchema.parse(input)

      // 2. Get existing payment or create new one
      let payment: PaymentDTO
      try {
        const payments = await this.paymentSDK.getByBooking(validInput.booking_id)
        const pendingPayment = payments.find(p => p.status === 'requires_payment')

        if (pendingPayment) {
          payment = pendingPayment
        } else {
          // Create new payment
          payment = await this.paymentSDK.create({
            booking_id: validInput.booking_id,
            payer_id: validInput.payer_id,
            amount_cents: validInput.amount_cents,
            status: 'requires_payment',
            provider: validInput.provider,
            installments: 1, // Single payment
            mode: 'full_upfront', // Full upfront payment
            // user_id is auto-tracked by DB (nullable field for tracking payer)
          })
        }
      } catch {
        throw new PaymentError(
          'Failed to get or create payment',
          PaymentErrorCode.VALIDATION_ERROR,
          500
        )
      }

      // 3. Verify payment is in pending state
      if (payment.status !== 'requires_payment') {
        throw new PaymentError(
          `Cannot process payment with status: ${payment.status}`,
          PaymentErrorCode.INVALID_STATE_TRANSITION,
          400
        )
      }

      // 4. Process with payment provider
      // TODO: Implement actual provider integration
      // For now, we'll simulate a successful payment
      const providerResponse = await this.processWithProvider(
        payment,
        validInput.provider,
        validInput.payment_method_id
      )

      // 5. Update payment status based on provider response
      if (providerResponse.success) {
         
        const completedPayment = await this.paymentSDK.updateStatus(
          payment.id,
          'succeeded'
        )

         
        return completedPayment
      } else {
        await this.paymentSDK.updateStatus(payment.id, 'failed')

        throw new PaymentError(
          providerResponse.error ?? 'Payment processing failed',
          PaymentErrorCode.PAYMENT_FAILED,
          400
        )
      }
    } catch (error) {
      if (error instanceof PaymentError) {throw error}
      throw toError(error)
    }
  }

  /**
   * Process a refund
   * Executes refund via payment provider and updates payment status
   */
  async processRefund(
    paymentId: string,
    refundAmountCents: number,
    reason?: string
  ): Promise<PaymentDTO> {
    try {
      // 1. Get payment
      const payment = await this.paymentSDK.getById(paymentId)

      // 2. Verify payment is completed
      if (payment.status !== 'succeeded' && payment.status !== 'processing') {
        throw new PaymentError(
          `Cannot refund payment with status: ${payment.status}`,
          PaymentErrorCode.INVALID_STATE_TRANSITION,
          400
        )
      }

      // 3. Verify refund amount is valid
      if (refundAmountCents > payment.amount_cents) {
        throw new PaymentError(
          'Refund amount exceeds payment amount',
          PaymentErrorCode.VALIDATION_ERROR,
          400
        )
      }

      // 4. Process refund with provider
      // TODO: Implement actual provider integration
      const refundResponse = await this.processRefundWithProvider(
        payment,
        refundAmountCents,
        reason
      )

      if (!refundResponse.success) {
        throw new PaymentError(
          refundResponse.error ?? 'Refund processing failed',
          PaymentErrorCode.REFUND_FAILED,
          500
        )
      }

      // 5. Update payment status
       
      const refundedPayment = await this.paymentSDK.updateStatus(
        payment.id,
        'refunded'
      )

       
      return refundedPayment
    } catch (error) {
      if (error instanceof PaymentError) {throw error}
      throw toError(error)
    }
  }

  /**
   * Handle webhook from payment provider
   * Processes provider events and updates payment status
   */
  async handleWebhook(
    provider: 'mercadopago' | 'stripe',
    payload: unknown,
    signature?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Verify webhook signature
      const isValid = await this.verifyWebhookSignature(
        provider,
        payload,
        signature
      )

      if (!isValid) {
        throw new PaymentError(
          'Invalid webhook signature',
          PaymentErrorCode.WEBHOOK_VERIFICATION_FAILED,
          401
        )
      }

      // 2. Parse webhook payload
      const event = this.parseWebhookPayload(provider, payload)

      // 3. Process event based on type
      switch (event.type) {
        case 'payment.completed':
          await this.paymentSDK.updateStatus(event.paymentId, 'succeeded')
          return { success: true, message: 'Payment completed' }

        case 'payment.failed':
          await this.paymentSDK.updateStatus(event.paymentId, 'failed')
          return { success: true, message: 'Payment failed' }

        case 'payment.refunded':
          await this.paymentSDK.updateStatus(event.paymentId, 'refunded')
          return { success: true, message: 'Payment refunded' }

        default:
          return { success: true, message: 'Event ignored' }
      }
    } catch (error) {
      if (error instanceof PaymentError) {throw error}
      throw toError(error)
    }
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  /**
   * Process payment with provider
   * TODO: Implement actual provider integration
   */
  private processWithProvider(
    _payment: PaymentDTO,
    _provider: 'mercadopago' | 'stripe',
    _paymentMethodId?: string
  ): Promise<{ success: boolean; error?: string }> {
    // Simulated provider response
    // In production, this would call MercadoPago or Stripe APIs
    return Promise.resolve({ success: true })
  }

  /**
   * Process refund with provider
   * TODO: Implement actual provider integration
   */
  private processRefundWithProvider(
    _payment: PaymentDTO,
    _refundAmountCents: number,
    _reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    // Simulated refund response
    // In production, this would call MercadoPago or Stripe refund APIs
    return Promise.resolve({ success: true })
  }

  /**
   * Verify webhook signature
   * TODO: Implement actual signature verification
   */
  private verifyWebhookSignature(
    _provider: 'mercadopago' | 'stripe',
    _payload: unknown,
    _signature?: string
  ): Promise<boolean> {
    // In production, verify signature using provider's SDK
    return Promise.resolve(true)
  }

  /**
   * Parse webhook payload
   * TODO: Implement actual payload parsing
   */
  private parseWebhookPayload(
    _provider: 'mercadopago' | 'stripe',
    _payload: unknown
  ): {
    type: 'payment.completed' | 'payment.failed' | 'payment.refunded'
    paymentId: string
  } {
    // In production, parse payload according to provider's format
    return {
      type: 'payment.completed',
      paymentId: 'mock-payment-id',
    }
  }
}

// Singleton instance
export const paymentService = new PaymentService(paymentSDK)
