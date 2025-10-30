/**
 * Supabase Edge Function: Process Payment Split
 * Distributes payment between owner, platform, and insurance
 *
 * URL: /functions/v1/process-payment-split
 * Method: POST
 * Auth: Service role required
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// Types
interface SplitPaymentRequest {
  payment_id: string
  owner_id: string
  config?: {
    owner_percentage: number
    platform_percentage: number
    insurance_percentage: number
  }
}

interface SplitResult {
  owner_transaction_id: string
  platform_transaction_id: string
  insurance_transaction_id?: string
  total_split_cents: number
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

    // 2. Verify authorization (only service role can call this)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 3. Parse request
    const request: SplitPaymentRequest = await req.json()

    // 4. Validate input
    if (!request.payment_id || !request.owner_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: payment_id, owner_id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 5. Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 6. Get payment
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', request.payment_id)
      .single()

    if (paymentError || !payment) {
      return new Response(
        JSON.stringify({ error: 'Payment not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 7. Verify payment is completed
    if (payment.status !== 'completed') {
      return new Response(
        JSON.stringify({ error: `Cannot split payment with status: ${payment.status}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 8. Apply split configuration (defaults)
    const config = request.config || {
      owner_percentage: 85,
      platform_percentage: 10,
      insurance_percentage: 5,
    }

    // 9. Validate percentages sum to 100
    const totalPercentage = config.owner_percentage + config.platform_percentage + config.insurance_percentage
    if (Math.abs(totalPercentage - 100) > 0.01) {
      return new Response(
        JSON.stringify({ error: 'Split percentages must sum to 100' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 10. Calculate amounts
    const totalAmount = payment.amount_cents
    const ownerAmount = Math.floor((totalAmount * config.owner_percentage) / 100)
    const platformAmount = Math.floor((totalAmount * config.platform_percentage) / 100)
    const insuranceAmount = Math.floor((totalAmount * config.insurance_percentage) / 100)

    // 11. Create wallet transactions
    const result: SplitResult = {
      owner_transaction_id: '',
      platform_transaction_id: '',
      total_split_cents: ownerAmount + platformAmount + insuranceAmount,
    }

    // Owner transaction
    const { data: ownerTx, error: ownerError } = await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: request.owner_id,
        amount_cents: ownerAmount,
        type: 'credit',
        status: 'completed',
        description: `Payment for booking ${payment.booking_id}`,
        reference_type: 'payment',
        reference_id: payment.id,
      })
      .select()
      .single()

    if (ownerError) {
      throw new Error(`Failed to create owner transaction: ${ownerError.message}`)
    }
    result.owner_transaction_id = ownerTx.id

    // Platform transaction
    const PLATFORM_WALLET_ID =
      Deno.env.get('PLATFORM_WALLET_ID') ?? 'platform-wallet-id'
    if (PLATFORM_WALLET_ID === 'platform-wallet-id') {
      console.warn(
        'PLATFORM_WALLET_ID not set. Using placeholder platform wallet ID.'
      )
    }
    const { data: platformTx, error: platformError } = await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: PLATFORM_WALLET_ID,
        amount_cents: platformAmount,
        type: 'credit',
        status: 'completed',
        description: `Platform fee for booking ${payment.booking_id}`,
        reference_type: 'payment',
        reference_id: payment.id,
      })
      .select()
      .single()

    if (platformError) {
      throw new Error(`Failed to create platform transaction: ${platformError.message}`)
    }
    result.platform_transaction_id = platformTx.id

    // Insurance transaction (if applicable)
    if (insuranceAmount > 0) {
      const INSURANCE_WALLET_ID =
        Deno.env.get('INSURANCE_WALLET_ID') ?? 'insurance-wallet-id'
      if (INSURANCE_WALLET_ID === 'insurance-wallet-id') {
        console.warn(
          'INSURANCE_WALLET_ID not set. Using placeholder insurance wallet ID.'
        )
      }
      const { data: insuranceTx, error: insuranceError } = await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: INSURANCE_WALLET_ID,
          amount_cents: insuranceAmount,
          type: 'credit',
          status: 'completed',
          description: `Insurance fee for booking ${payment.booking_id}`,
          reference_type: 'payment',
          reference_id: payment.id,
        })
        .select()
        .single()

      if (insuranceError) {
        console.warn('Failed to create insurance transaction:', insuranceError)
        // Don't fail the entire split for insurance transaction
      } else {
        result.insurance_transaction_id = insuranceTx.id
      }
    }

    // 12. Return success
    return new Response(
      JSON.stringify({ success: true, result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Payment split error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
