/**
 * Payment Status Mapping
 * Maps legacy payment statuses to canonical DB values
 */

export type PaymentStatusCanonical =
  | 'requires_payment'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'refunded'
  | 'partial_refund'
  | 'chargeback'

const CANONICAL: Record<string, PaymentStatusCanonical> = {
  // Legacy → Canonical
  pending: 'requires_payment',
  completed: 'succeeded',
  processing: 'processing',
  requires_payment: 'requires_payment',
  succeeded: 'succeeded',
  failed: 'failed',
  refunded: 'refunded',
  partial_refund: 'partial_refund',
  partially_refunded: 'partial_refund',
  chargeback: 'chargeback',
  disputed: 'chargeback',
}

/**
 * Converts any payment status string to canonical DB value
 * @param s - Payment status (legacy or canonical)
 * @returns Canonical payment status
 */
export function toCanonicalStatus(s: string): PaymentStatusCanonical {
  const mapped = CANONICAL[s]
  if (!mapped) {
    console.warn(`Unknown payment status: ${s}, defaulting to 'failed'`)
    return 'failed' // Safe fallback
  }
  return mapped
}

/**
 * Check if payment is in successful state
 */
export function isPaymentSuccessful(status: string): boolean {
  const canonical = toCanonicalStatus(status)
  return canonical === 'succeeded'
}

/**
 * Check if payment is in terminal state (no further processing)
 */
export function isPaymentTerminal(status: string): boolean {
  const canonical = toCanonicalStatus(status)
  return ['succeeded', 'failed', 'refunded', 'chargeback'].includes(canonical)
}
