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

    // 2. Read raw body for signature validation
    const rawBody = await req.text()
    if (!rawBody) {
      return new Response(
        JSON.stringify({ error: 'Empty body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 3. Parse webhook payload after preserving rawBody
    let payload: WebhookPayload
    try {
      payload = JSON.parse(rawBody) as WebhookPayload
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 4. Verify signature (provider-specific)
    const isValid = await verifySignature({
      provider: payload.provider,
      rawBody,
      headerSignature:
        payload.provider === 'mercadopago'
          ? req.headers.get('x-signature') ?? ''
          : req.headers.get('stripe-signature') ?? '',
      explicitSignature: payload.signature ?? '',
    })

    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 5. Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 6. Process webhook based on event type
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

    // 7. Return success response
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

interface VerifySignatureParams {
  provider: WebhookPayload['provider']
  rawBody: string
  headerSignature: string
  explicitSignature: string
}

async function verifySignature({
  provider,
  rawBody,
  headerSignature,
  explicitSignature,
}: VerifySignatureParams): Promise<boolean> {
  if (provider === 'mercadopago') {
    const secret = Deno.env.get('MERCADOPAGO_WEBHOOK_SECRET')
    if (!secret) {
      console.warn('Missing MERCADOPAGO_WEBHOOK_SECRET environment variable')
      return false
    }

    const signatureHeader = headerSignature || explicitSignature
    if (!signatureHeader) {
      console.warn('MercadoPago signature header missing')
      return false
    }

    return verifyMercadoPagoSignature(signatureHeader, rawBody, secret)
  }

  if (provider === 'stripe') {
    const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    if (!secret) {
      console.warn('Missing STRIPE_WEBHOOK_SECRET environment variable')
      return false
    }

    if (!headerSignature) {
      console.warn('Stripe signature header missing')
      return false
    }

    return verifyStripeSignature(headerSignature, rawBody, secret)
  }

  console.warn(`Unsupported provider: ${provider}`)
  return false
}

async function verifyMercadoPagoSignature(
  signatureHeader: string,
  rawBody: string,
  secret: string
): Promise<boolean> {
  const parts = parseKeyValueHeader(signatureHeader)
  const timestamp = parts.get('ts')
  const signature = parts.get('v1')

  if (!timestamp || !signature) {
    console.warn('MercadoPago signature header missing ts or v1')
    return false
  }

  const message = `ts=${timestamp}${rawBody}`
  const expectedSignature = await hmacSha256(secret, message)
  return timingSafeEqual(signature, expectedSignature)
}

async function verifyStripeSignature(
  headerSignature: string,
  rawBody: string,
  secret: string
): Promise<boolean> {
  const parts = parseKeyValueHeader(headerSignature)
  const timestamp = parts.get('t')
  const signature = parts.get('v1')

  if (!timestamp || !signature) {
    console.warn('Stripe signature header missing t or v1')
    return false
  }

  const signedPayload = `${timestamp}.${rawBody}`
  const expectedSignature = await hmacSha256(secret, signedPayload)
  return timingSafeEqual(signature, expectedSignature)
}

function parseKeyValueHeader(header: string): Map<string, string> {
  return new Map(
    header
      .split(',')
      .map((part) => part.trim().split('='))
      .filter((kv): kv is [string, string] => kv.length === 2)
  )
}

async function hmacSha256(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(message)
  )

  return Array.from(new Uint8Array(signatureBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
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
