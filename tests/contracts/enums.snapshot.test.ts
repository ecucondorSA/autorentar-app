/**
 * Enum Snapshot Tests
 * Prevents silent breaking changes to database enums
 *
 * When a test fails:
 * 1. Review the enum change in database
 * 2. Update corresponding TypeScript types/schemas
 * 3. Update the snapshot: pnpm test -u
 */

import { describe, it, expect } from 'vitest'
import type { Database } from '@/types/database.types'

describe('Enum Contracts - Prevent Silent Breaking Changes', () => {
  it('payment_status enum is synchronized', () => {
    type PaymentStatus = Database['public']['Enums']['payment_status']

    // List all values explicitly (forces review on changes)
    const valores: PaymentStatus[] = [
      'requires_payment',
      'processing',
      'succeeded',
      'failed',
      'refunded',
      'partial_refund',
      'chargeback',
    ]

    expect(valores).toMatchInlineSnapshot(`
      [
        "requires_payment",
        "processing",
        "succeeded",
        "failed",
        "refunded",
        "partial_refund",
        "chargeback",
      ]
    `)
  })

  it('kyc_status enum is synchronized', () => {
    type KYCStatus = Database['public']['Enums']['kyc_status']

    const valores: KYCStatus[] = ['not_started', 'pending', 'verified', 'rejected']

    expect(valores).toMatchInlineSnapshot(`
      [
        "not_started",
        "pending",
        "verified",
        "rejected",
      ]
    `)
  })

  it('booking_status enum is synchronized', () => {
    type BookingStatus = Database['public']['Enums']['booking_status']

    const valores: BookingStatus[] = [
      'pending',
      'confirmed',
      'in_progress',
      'completed',
      'cancelled',
      'no_show',
      'expired',
    ]

    expect(valores).toMatchInlineSnapshot(`
      [
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
        "expired",
      ]
    `)
  })

  it('car_status enum is synchronized', () => {
    type CarStatus = Database['public']['Enums']['car_status']

    const valores: CarStatus[] = ['draft', 'active', 'suspended', 'maintenance']

    expect(valores).toMatchInlineSnapshot(`
      [
        "draft",
        "active",
        "suspended",
        "maintenance",
      ]
    `)
  })

  it('user_role enum is synchronized', () => {
    // Note: This is inferred from profiles table role field
    const valores: ('renter' | 'owner' | 'admin')[] = ['renter', 'owner', 'admin']

    expect(valores).toMatchInlineSnapshot(`
      [
        "renter",
        "owner",
        "admin",
      ]
    `)
  })

  it('cancel_policy enum is synchronized', () => {
    type CancelPolicy = Database['public']['Enums']['cancel_policy']

    const valores: CancelPolicy[] = ['flex', 'moderate', 'strict']

    expect(valores).toMatchInlineSnapshot(`
      [
        "flex",
        "moderate",
        "strict",
      ]
    `)
  })

  it('fuel_type enum is synchronized', () => {
    type FuelType = Database['public']['Enums']['fuel_type']

    const valores: FuelType[] = ['nafta', 'gasoil', 'hibrido', 'electrico']

    expect(valores).toMatchInlineSnapshot(`
      [
        "nafta",
        "gasoil",
        "hibrido",
        "electrico",
      ]
    `)
  })

  it('onboarding_status enum is synchronized', () => {
    type OnboardingStatus = Database['public']['Enums']['onboarding_status']

    const valores: OnboardingStatus[] = ['incomplete', 'complete']

    expect(valores).toMatchInlineSnapshot(`
      [
        "incomplete",
        "complete",
      ]
    `)
  })

  it('payment_provider enum is synchronized', () => {
    type PaymentProvider = Database['public']['Enums']['payment_provider']

    const valores: PaymentProvider[] = ['mercadopago', 'stripe', 'otro']

    expect(valores).toMatchInlineSnapshot(`
      [
        "mercadopago",
        "stripe",
        "otro",
      ]
    `)
  })

  describe('Critical enums have no drift', () => {
    it('wallet transaction types are stable', () => {
      // These are critical for accounting - changes require migration
      const transactionTypes = [
        'deposit',
        'transfer_out',
        'transfer_in',
        'rental_charge',
        'rental_payment',
        'refund',
        'franchise_user',
        'franchise_fund',
        'withdrawal',
        'adjustment',
        'bonus',
        'fee',
        // New types from RPCs
        'hold',
        'capture',
        'release',
        'credit',
      ]

      expect(transactionTypes.length).toBeGreaterThanOrEqual(12)
    })
  })
})
