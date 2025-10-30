/**
 * InsuranceService
 * Business logic layer for insurance operations
 *
 * Responsibilities:
 * - Create insurance policies for bookings
 * - Process insurance claims
 * - Approve/reject claims
 * - Calculate premiums based on coverage level
 */

import { insuranceSDK, type InsuranceSDK } from '@/lib/sdk/insurance.sdk'
import { paymentSDK, type PaymentSDK } from '@/lib/sdk/payment.sdk'
import type { InsuranceClaimDTO, InsurancePolicyDTO } from '@/types'

import { toError } from '../lib/errors'

// ============================================
// INSURANCE SERVICE ERRORS
// ============================================

export enum InsuranceErrorCode {
  POLICY_NOT_FOUND = 'POLICY_NOT_FOUND',
  CLAIM_NOT_FOUND = 'CLAIM_NOT_FOUND',
  POLICY_ALREADY_EXISTS = 'POLICY_ALREADY_EXISTS',
  CLAIM_ALREADY_PROCESSED = 'CLAIM_ALREADY_PROCESSED',
  INVALID_COVERAGE_LEVEL = 'INVALID_COVERAGE_LEVEL',
  INVALID_CLAIM_AMOUNT = 'INVALID_CLAIM_AMOUNT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

export class InsuranceError extends Error {
  constructor(
    message: string,
    public code: InsuranceErrorCode,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'InsuranceError'
    Object.setPrototypeOf(this, InsuranceError.prototype)
  }
}

// ============================================
// INSURANCE SERVICE
// ============================================

export class InsuranceService {
  constructor(
    private readonly insuranceSDK: InsuranceSDK,
    private readonly paymentSDK: PaymentSDK
  ) {}

  /**
   * Create insurance policy for a booking
   * Calculates premium based on coverage level and booking details
   */
  async createPolicy(input: CreatePolicyInput): Promise<InsurancePolicyDTO> {
    try {
      // 1. Validate coverage level
      if (!['none', 'basic', 'standard', 'premium'].includes(input.coverage_level)) {
        throw new InsuranceError(
          'Invalid coverage level',
          InsuranceErrorCode.INVALID_COVERAGE_LEVEL,
          400
        )
      }

      // If coverage is 'none', don't create policy
      if (input.coverage_level === 'none') {
        throw new InsuranceError(
          'Cannot create policy for coverage level "none"',
          InsuranceErrorCode.INVALID_COVERAGE_LEVEL,
          400
        )
      }

      // 2. Calculate premium
      const premiumCents = this.calculatePremium(
        input.coverage_level,
        input.booking_total_cents,
        input.rental_days
      )

      // 3. Create policy
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call -- insuranceSDK.createPolicy returns InsurancePolicyDTO
      const policy = await this.insuranceSDK.createPolicy({
        booking_id: input.booking_id,
        coverage_level: input.coverage_level,
        premium_cents: premiumCents,
        coverage_limit_cents: this.getCoverageLimit(input.coverage_level),
        status: 'active',
      })

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- policy is InsurancePolicyDTO from SDK
      return policy
    } catch (error) {
      if (error instanceof InsuranceError) {throw error}
      throw toError(error)
    }
  }

  /**
   * Submit insurance claim
   * Creates a new claim for damage or incident
   */
  async submitClaim(input: SubmitClaimInput): Promise<InsuranceClaimDTO> {
    try {
      // 1. Get policy
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call -- insuranceSDK.getPolicyByBooking returns InsurancePolicyDTO
      const policy = await this.insuranceSDK.getPolicyByBooking(input.booking_id)

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- policy has status property
      if (policy?.status !== 'active') {
        throw new InsuranceError(
          'No active insurance policy found for this booking',
          InsuranceErrorCode.POLICY_NOT_FOUND,
          404
        )
      }

      // 2. Validate claim amount
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- policy has coverage_limit_cents property
      if (input.claim_amount_cents > policy.coverage_limit_cents) {
        throw new InsuranceError(
          `Claim amount exceeds coverage limit of ${policy.coverage_limit_cents / 100}`,
          InsuranceErrorCode.INVALID_CLAIM_AMOUNT,
          400
        )
      }

      // 3. Create claim
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- insuranceSDK.submitClaim returns InsuranceClaimDTO
      const claim = await this.insuranceSDK.submitClaim({
        policy_id: policy.id,
        booking_id: input.booking_id,
        claim_amount_cents: input.claim_amount_cents,
        description: input.description,
        incident_date: input.incident_date,
        status: 'pending',
      })

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- claim is InsuranceClaimDTO from SDK
      return claim
    } catch (error) {
      if (error instanceof InsuranceError) {throw error}
      throw toError(error)
    }
  }

  /**
   * Approve insurance claim
   * Admin action to approve and process payout
   */
  async approveClaim(
    claimId: string,
    approvedAmountCents: number
  ): Promise<InsuranceClaimDTO> {
    try {
      // 1. Get claim
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call -- insuranceSDK.getClaimById returns InsuranceClaimDTO
      const claim = await this.insuranceSDK.getClaimById(claimId)

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- claim has status property
      if (claim.status !== 'pending') {
        throw new InsuranceError(
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-member-access -- claim.status is a valid string
          `Cannot approve claim with status: ${claim.status}`,
          InsuranceErrorCode.CLAIM_ALREADY_PROCESSED,
          400
        )
      }

      // 2. Validate approved amount
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- claim has claim_amount_cents property
      if (approvedAmountCents > claim.claim_amount_cents) {
        throw new InsuranceError(
          'Approved amount cannot exceed requested amount',
          InsuranceErrorCode.INVALID_CLAIM_AMOUNT,
          400
        )
      }

      // 3. Update claim status
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call -- insuranceSDK.updateClaimStatus returns InsuranceClaimDTO
      const approvedClaim = await this.insuranceSDK.updateClaimStatus(
        claimId,
        'approved',
        approvedAmountCents
      )

      // 4. Process payout
      // In production, this would create a payment to the claimant
      // await this.paymentSDK.createPayout({
      //   recipient_id: claim.claimant_id,
      //   amount_cents: approvedAmountCents,
      //   reference_type: 'insurance_claim',
      //   reference_id: claimId,
      // })

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- approvedClaim is InsuranceClaimDTO from SDK
      return approvedClaim
    } catch (error) {
      if (error instanceof InsuranceError) {throw error}
      throw toError(error)
    }
  }

  /**
   * Reject insurance claim
   * Admin action to reject claim with reason
   */
  async rejectClaim(
    claimId: string,
    rejectionReason: string
  ): Promise<InsuranceClaimDTO> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call -- insuranceSDK.updateClaimStatus returns InsuranceClaimDTO
      const rejectedClaim = await this.insuranceSDK.updateClaimStatus(
        claimId,
        'rejected',
        0,
        rejectionReason
      )

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- rejectedClaim is InsuranceClaimDTO from SDK
      return rejectedClaim
    } catch (error) {
      throw toError(error)
    }
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  /**
   * Calculate insurance premium
   * Based on coverage level, booking total, and rental duration
   */
  private calculatePremium(
    coverageLevel: 'basic' | 'standard' | 'premium',
    bookingTotalCents: number,
    rentalDays: number
  ): number {
    const baseRate = bookingTotalCents * 0.05 // 5% of booking total

    const multipliers = {
      basic: 1.0,
      standard: 1.5,
      premium: 2.0,
    }

    const multiplier = multipliers[coverageLevel]
    const durationFactor = Math.max(1, rentalDays / 7) // Increase premium for longer rentals

    return Math.floor(baseRate * multiplier * durationFactor)
  }

  /**
   * Get coverage limit for each level
   */
  private getCoverageLimit(
    coverageLevel: 'basic' | 'standard' | 'premium'
  ): number {
    const limits = {
      basic: 500000, // $5,000 USD
      standard: 1000000, // $10,000 USD
      premium: 2000000, // $20,000 USD
    }

    return limits[coverageLevel]
  }
}

// ============================================
// TYPES
// ============================================

interface CreatePolicyInput {
  booking_id: string
  coverage_level: 'none' | 'basic' | 'standard' | 'premium'
  booking_total_cents: number
  rental_days: number
}

interface SubmitClaimInput {
  booking_id: string
  claim_amount_cents: number
  description: string
  incident_date: string
  evidence_urls?: string[]
}

// Singleton instance
export const insuranceService = new InsuranceService(insuranceSDK, paymentSDK)
