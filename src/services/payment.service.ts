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
import { walletSDK, type WalletSDK } from '@/lib/sdk/wallet.sdk'
import type {
  PaymentDTO,
  WalletTransactionDTO,
} from '@/types'
import {
  type PaymentSplitConfig,
  PaymentSplitConfigSchema,
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
    private readonly paymentSDK: PaymentSDK,
    private readonly walletSDK: WalletSDK
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
        const pendingPayment = payments.find(p => p.status === 'pending')

        if (pendingPayment) {
          payment = pendingPayment
        } else {
          // Create new payment
          payment = await this.paymentSDK.create({
            booking_id: validInput.booking_id,
            payer_id: validInput.payer_id,
            amount_cents: validInput.amount_cents,
            status: 'pending',
            provider: validInput.provider,
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
      if (payment.status !== 'pending') {
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- paymentSDK.updateStatus returns PaymentDTO
        const completedPayment = await this.paymentSDK.updateStatus(
          payment.id,
          'completed'
        )

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- completedPayment is PaymentDTO from SDK
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
      if (payment.status !== 'completed') {
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- paymentSDK.updateStatus returns PaymentDTO
      const refundedPayment = await this.paymentSDK.updateStatus(
        payment.id,
        'refunded'
      )

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- refundedPayment is PaymentDTO from SDK
      return refundedPayment
    } catch (error) {
      if (error instanceof PaymentError) {throw error}
      throw toError(error)
    }
  }

  /**
   * Split payment between owner, platform, and insurance
   * Distributes funds according to configured percentages
   */
  async splitPayment(
    paymentId: string,
    ownerId: string,
    config?: PaymentSplitConfig
  ): Promise<WalletTransactionDTO[]> {
    try {
      // 1. Get payment
      const payment = await this.paymentSDK.getById(paymentId)

      // 2. Verify payment is completed
      if (payment.status !== 'completed') {
        throw new PaymentError(
          'Can only split completed payments',
          PaymentErrorCode.INVALID_STATE_TRANSITION,
          400
        )
      }

      // 3. Validate split configuration
      const splitConfig = config
        ? PaymentSplitConfigSchema.parse(config)
        : PaymentSplitConfigSchema.parse({}) // Use defaults

      // 4. Verify percentages sum to 100
      const totalPercentage =
        splitConfig.owner_percentage +
        splitConfig.platform_percentage +
        splitConfig.insurance_percentage

      if (Math.abs(totalPercentage - 100) > 0.01) {
        throw new PaymentError(
          'Split percentages must sum to 100',
          PaymentErrorCode.VALIDATION_ERROR,
          400
        )
      }

      // 5. Calculate amounts
      const totalAmount = payment.amount_cents
      const ownerAmount = Math.floor(
        (totalAmount * splitConfig.owner_percentage) / 100
      )
      const platformAmount = Math.floor(
        (totalAmount * splitConfig.platform_percentage) / 100
      )
      const insuranceAmount = Math.floor(
        (totalAmount * splitConfig.insurance_percentage) / 100
      )

      // 6. Create wallet transactions
      const transactions: WalletTransactionDTO[] = []

      // Owner transaction
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call -- walletSDK.createTransaction returns WalletTransactionDTO
        const ownerTx = await this.walletSDK.createTransaction({
          wallet_id: ownerId, // Assuming wallet_id = user_id
          amount_cents: ownerAmount,
          type: 'credit',
          status: 'completed',
          description: `Payment for booking ${payment.booking_id}`,
          reference_type: 'payment',
          reference_id: payment.id,
        })
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- ownerTx is WalletTransactionDTO
        transactions.push(ownerTx)
      } catch {
        throw new PaymentError(
          'Failed to create owner transaction',
          PaymentErrorCode.SPLIT_FAILED,
          500
        )
      }

      // Platform transaction
      // TODO: Use actual platform wallet ID from config
      const PLATFORM_WALLET_ID = 'platform-wallet-id'
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call -- walletSDK.createTransaction returns WalletTransactionDTO
        const platformTx = await this.walletSDK.createTransaction({
          wallet_id: PLATFORM_WALLET_ID,
          amount_cents: platformAmount,
          type: 'credit',
          status: 'completed',
          description: `Platform fee for booking ${payment.booking_id}`,
          reference_type: 'payment',
          reference_id: payment.id,
        })
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- platformTx is WalletTransactionDTO
        transactions.push(platformTx)
      } catch {
        throw new PaymentError(
          'Failed to create platform transaction',
          PaymentErrorCode.SPLIT_FAILED,
          500
        )
      }

      // Insurance transaction (if applicable)
      if (insuranceAmount > 0) {
        const INSURANCE_WALLET_ID = 'insurance-wallet-id'
        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call -- walletSDK.createTransaction returns WalletTransactionDTO
          const insuranceTx = await this.walletSDK.createTransaction({
            wallet_id: INSURANCE_WALLET_ID,
            amount_cents: insuranceAmount,
            type: 'credit',
            status: 'completed',
            description: `Insurance fee for booking ${payment.booking_id}`,
            reference_type: 'payment',
            reference_id: payment.id,
          })
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- insuranceTx is WalletTransactionDTO
          transactions.push(insuranceTx)
        } catch {
          // Insurance transaction is optional, log but don't fail
          // In production, this should be logged to monitoring system
        }
      }

      return transactions
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
          await this.paymentSDK.updateStatus(event.paymentId, 'completed')
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
export const paymentService = new PaymentService(paymentSDK, walletSDK)
