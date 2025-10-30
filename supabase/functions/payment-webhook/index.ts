/**
 * Supabase Edge Function: Payment Webhook Handler
 * Handles webhooks from payment providers (MercadoPago, Stripe)
 *
 * URL: /functions/v1/payment-webhook
 * Method: POST
 * Auth: Public (signature verification required)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// Types
interface WebhookPayload {
  provider: 'mercadopago' | 'stripe'
  event_type: string
  payment_id: string
  status: string
  signature?: string
}

serve(async (req) => {
  try {
    // 1. Verify method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 2. Parse webhook payload
    const payload: WebhookPayload = await req.json()

    // 3. Verify signature (provider-specific)
    const isValid = await verifySignature(
      payload.provider,
      payload.signature,
      req.headers.get('x-signature') || ''
    )

    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 4. Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 5. Process webhook based on event type
    let result
    switch (payload.event_type) {
      case 'payment.completed':
        result = await handlePaymentCompleted(supabase, payload.payment_id)
        break
      case 'payment.failed':
        result = await handlePaymentFailed(supabase, payload.payment_id)
        break
      case 'payment.refunded':
        result = await handlePaymentRefunded(supabase, payload.payment_id)
        break
      default:
        result = { message: 'Event type not handled', processed: false }
    }

    // 6. Return success response
    return new Response(
      JSON.stringify({ success: true, ...result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

// ============================================
// HELPER FUNCTIONS
// ============================================

async function verifySignature(
  provider: string,
  signature?: string,
  headerSignature?: string
): Promise<boolean> {
  // TODO: Implement real signature verification
  // For MercadoPago: verify x-signature header with secret
  // For Stripe: verify stripe-signature header with webhook secret

  // For now, accept all (INSECURE - only for development)
  return true
}

async function handlePaymentCompleted(
  supabase: any,
  paymentId: string
): Promise<{ message: string; processed: boolean }> {
  // Update payment status to completed
  const { error } = await supabase
    .from('payments')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', paymentId)

  if (error) {
    throw new Error(`Failed to update payment: ${error.message}`)
  }

  // TODO: Trigger payment split logic
  // TODO: Send notification to user
  // TODO: Update booking status if applicable

  return { message: 'Payment marked as completed', processed: true }
}

async function handlePaymentFailed(
  supabase: any,
  paymentId: string
): Promise<{ message: string; processed: boolean }> {
  // Update payment status to failed
  const { error } = await supabase
    .from('payments')
    .update({ status: 'failed', updated_at: new Date().toISOString() })
    .eq('id', paymentId)

  if (error) {
    throw new Error(`Failed to update payment: ${error.message}`)
  }

  // TODO: Cancel booking if applicable
  // TODO: Send notification to user

  return { message: 'Payment marked as failed', processed: true }
}

async function handlePaymentRefunded(
  supabase: any,
  paymentId: string
): Promise<{ message: string; processed: boolean }> {
  // Update payment status to refunded
  const { error } = await supabase
    .from('payments')
    .update({ status: 'refunded', updated_at: new Date().toISOString() })
    .eq('id', paymentId)

  if (error) {
    throw new Error(`Failed to update payment: ${error.message}`)
  }

  // TODO: Update wallet balance
  // TODO: Send notification to user

  return { message: 'Payment marked as refunded', processed: true }
}
