/**
 * Wallet RPC Contract Tests
 * Validates atomic operations prevent race conditions
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { supabase } from '@/lib/supabase'

describe('Wallet RPCs - Atomic Operations', () => {
  const TEST_RENTER_ID = '00000000-0000-0000-0000-000000000001'
  const TEST_OWNER_ID = '00000000-0000-0000-0000-000000000002'
  const TEST_BOOKING_ID = '00000000-0000-0000-0000-000000000003'

  beforeEach(async () => {
    // Setup: create test wallets
    await supabase.from('user_wallets').upsert([
      {
        user_id: TEST_RENTER_ID,
        available_balance: 10000,
        locked_balance: 0,
        currency: 'ARS',
        non_withdrawable_floor: 0,
      },
      {
        user_id: TEST_OWNER_ID,
        available_balance: 0,
        locked_balance: 0,
        currency: 'ARS',
        non_withdrawable_floor: 0,
      },
    ])
  })

  afterEach(async () => {
    // Cleanup
    await supabase.from('wallet_transactions').delete().in('user_id', [TEST_RENTER_ID, TEST_OWNER_ID])
    await supabase.from('user_wallets').delete().in('user_id', [TEST_RENTER_ID, TEST_OWNER_ID])
  })

  describe('wallet_hold_funds', () => {
    it('should hold funds atomically', async () => {
      const { data, error } = await supabase.rpc('wallet_hold_funds', {
        p_user_id: TEST_RENTER_ID,
        p_amount: 5000,
        p_reference_type: 'booking',
        p_reference_id: TEST_BOOKING_ID,
      })

      expect(error).toBeNull()
      expect(data).toMatchObject({
        success: true,
        available_balance: 5000,
        locked_balance: 5000,
      })
      expect(data).toHaveProperty('transaction_id')

      // Verify transaction created
      const { data: tx } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('id', data.transaction_id)
        .single()

      expect(tx).toMatchObject({
        user_id: TEST_RENTER_ID,
        amount: -5000,
        type: 'hold',
        status: 'completed',
        reference_type: 'booking',
        reference_id: TEST_BOOKING_ID,
      })
    })

    it('should reject hold with insufficient funds', async () => {
      const { error } = await supabase.rpc('wallet_hold_funds', {
        p_user_id: TEST_RENTER_ID,
        p_amount: 15000, // More than available
        p_reference_type: 'booking',
        p_reference_id: TEST_BOOKING_ID,
      })

      expect(error).not.toBeNull()
      expect(error?.message).toContain('Insufficient funds')
    })

    it('should prevent concurrent holds (race condition test)', async () => {
      // Simulate 2 concurrent holds
      const results = await Promise.allSettled([
        supabase.rpc('wallet_hold_funds', {
          p_user_id: TEST_RENTER_ID,
          p_amount: 6000,
          p_reference_type: 'booking',
          p_reference_id: TEST_BOOKING_ID,
        }),
        supabase.rpc('wallet_hold_funds', {
          p_user_id: TEST_RENTER_ID,
          p_amount: 6000,
          p_reference_type: 'booking',
          p_reference_id: TEST_BOOKING_ID,
        }),
      ])

      // One should succeed, one should fail
      const successful = results.filter((r) => r.status === 'fulfilled' && !r.value.error)
      const failed = results.filter((r) => r.status === 'fulfilled' && r.value.error)

      expect(successful.length).toBe(1)
      expect(failed.length).toBe(1)
    })
  })

  describe('wallet_capture_hold', () => {
    beforeEach(async () => {
      // Hold 5000 first
      await supabase.rpc('wallet_hold_funds', {
        p_user_id: TEST_RENTER_ID,
        p_amount: 5000,
        p_reference_type: 'booking',
        p_reference_id: TEST_BOOKING_ID,
      })
    })

    it('should capture and transfer held funds', async () => {
      const { data, error } = await supabase.rpc('wallet_capture_hold', {
        p_user_id: TEST_RENTER_ID,
        p_amount: 5000,
        p_reference_id: TEST_BOOKING_ID,
        p_recipient_id: TEST_OWNER_ID,
      })

      expect(error).toBeNull()
      expect(data).toMatchObject({
        success: true,
      })

      // Verify renter wallet
      const { data: renterWallet } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', TEST_RENTER_ID)
        .single()

      expect(renterWallet).toMatchObject({
        available_balance: 5000,
        locked_balance: 0,
      })

      // Verify owner wallet
      const { data: ownerWallet } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', TEST_OWNER_ID)
        .single()

      expect(ownerWallet).toMatchObject({
        available_balance: 5000,
        locked_balance: 0,
      })
    })

    it('should reject capture without sufficient locked funds', async () => {
      const { error } = await supabase.rpc('wallet_capture_hold', {
        p_user_id: TEST_RENTER_ID,
        p_amount: 8000, // More than locked
        p_reference_id: TEST_BOOKING_ID,
        p_recipient_id: TEST_OWNER_ID,
      })

      expect(error).not.toBeNull()
      expect(error?.message).toContain('Insufficient locked funds')
    })

    it('should create transactions for both payer and recipient', async () => {
      await supabase.rpc('wallet_capture_hold', {
        p_user_id: TEST_RENTER_ID,
        p_amount: 5000,
        p_reference_id: TEST_BOOKING_ID,
        p_recipient_id: TEST_OWNER_ID,
      })

      // Check payer transaction
      const { data: payerTxs } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', TEST_RENTER_ID)
        .eq('type', 'capture')

      expect(payerTxs).toHaveLength(1)
      expect(payerTxs[0].amount).toBe(-5000)

      // Check recipient transaction
      const { data: recipientTxs } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', TEST_OWNER_ID)
        .eq('type', 'credit')

      expect(recipientTxs).toHaveLength(1)
      expect(recipientTxs[0].amount).toBe(5000)
    })
  })

  describe('wallet_release_hold', () => {
    beforeEach(async () => {
      // Hold 5000 first
      await supabase.rpc('wallet_hold_funds', {
        p_user_id: TEST_RENTER_ID,
        p_amount: 5000,
        p_reference_type: 'booking',
        p_reference_id: TEST_BOOKING_ID,
      })
    })

    it('should release hold back to available', async () => {
      const { data, error } = await supabase.rpc('wallet_release_hold', {
        p_user_id: TEST_RENTER_ID,
        p_amount: 5000,
        p_reference_id: TEST_BOOKING_ID,
      })

      expect(error).toBeNull()
      expect(data).toMatchObject({
        success: true,
      })

      // Verify balance restored
      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', TEST_RENTER_ID)
        .single()

      expect(wallet).toMatchObject({
        available_balance: 10000,
        locked_balance: 0,
      })
    })

    it('should create refund transaction', async () => {
      const { data } = await supabase.rpc('wallet_release_hold', {
        p_user_id: TEST_RENTER_ID,
        p_amount: 5000,
        p_reference_id: TEST_BOOKING_ID,
      })

      const { data: tx } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('id', data.transaction_id)
        .single()

      expect(tx).toMatchObject({
        type: 'release',
        amount: 5000,
        status: 'completed',
      })
      expect(tx.description).toContain('refund')
    })

    it('should reject release without sufficient locked funds', async () => {
      const { error } = await supabase.rpc('wallet_release_hold', {
        p_user_id: TEST_RENTER_ID,
        p_amount: 8000, // More than locked
        p_reference_id: TEST_BOOKING_ID,
      })

      expect(error).not.toBeNull()
      expect(error?.message).toContain('Insufficient locked funds')
    })
  })

  describe('Full booking flow', () => {
    it('should handle complete booking lifecycle', async () => {
      // 1. Hold funds (booking created)
      const { data: holdResult } = await supabase.rpc('wallet_hold_funds', {
        p_user_id: TEST_RENTER_ID,
        p_amount: 8000,
        p_reference_type: 'booking',
        p_reference_id: TEST_BOOKING_ID,
      })
      expect(holdResult.success).toBe(true)

      // 2. Capture funds (booking completed)
      const { data: captureResult } = await supabase.rpc('wallet_capture_hold', {
        p_user_id: TEST_RENTER_ID,
        p_amount: 8000,
        p_reference_id: TEST_BOOKING_ID,
        p_recipient_id: TEST_OWNER_ID,
      })
      expect(captureResult.success).toBe(true)

      // 3. Verify final state
      const { data: renterFinal } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', TEST_RENTER_ID)
        .single()

      const { data: ownerFinal } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', TEST_OWNER_ID)
        .single()

      expect(renterFinal.available_balance).toBe(2000) // 10000 - 8000
      expect(renterFinal.locked_balance).toBe(0)
      expect(ownerFinal.available_balance).toBe(8000)

      // Verify transaction history
      const { data: renterTxs } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', TEST_RENTER_ID)
        .order('created_at', { ascending: true })

      expect(renterTxs.length).toBeGreaterThanOrEqual(2)
      expect(renterTxs[0].type).toBe('hold')
      expect(renterTxs[1].type).toBe('capture')
    })

    it('should handle cancellation (hold then release)', async () => {
      // 1. Hold funds
      await supabase.rpc('wallet_hold_funds', {
        p_user_id: TEST_RENTER_ID,
        p_amount: 6000,
        p_reference_type: 'booking',
        p_reference_id: TEST_BOOKING_ID,
      })

      // 2. Cancel (release)
      await supabase.rpc('wallet_release_hold', {
        p_user_id: TEST_RENTER_ID,
        p_amount: 6000,
        p_reference_id: TEST_BOOKING_ID,
      })

      // 3. Verify balance restored
      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', TEST_RENTER_ID)
        .single()

      expect(wallet.available_balance).toBe(10000)
      expect(wallet.locked_balance).toBe(0)
    })
  })
})
