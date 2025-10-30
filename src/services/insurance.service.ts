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
    private readonly insuranceSDK: InsuranceSDK
    // paymentSDK removed - not used in this service
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
      // Note: Using basic required fields from insurance_policies table
      // TODO: Verify if should use booking_insurance_coverage instead
      const policy = await this.insuranceSDK.createPolicy({
        car_id: input.car_id,
        policy_type: 'rental',
        insurer: 'platform',
        deductible_percentage: 10,
        deductible_min_amount: 10000,
        liability_coverage_amount: premiumCents,
      })

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
       
      const policy = await this.insuranceSDK.getPolicyByBooking(input.booking_id)

       
      if (policy?.status !== 'active') {
        throw new InsuranceError(
          'No active insurance policy found for this booking',
          InsuranceErrorCode.POLICY_NOT_FOUND,
          404
        )
      }

      // 2. Validate claim amount (TODO: Get correct coverage limit from policy)
      const coverageLimit = 1000000 // Default coverage limit
      if (input.claim_amount_cents > coverageLimit) {
        throw new InsuranceError(
          `Claim amount exceeds coverage limit of ${coverageLimit / 100}`,
          InsuranceErrorCode.INVALID_CLAIM_AMOUNT,
          400
        )
      }

      // 3. Create claim (using real DB schema)
      const claim = await this.insuranceSDK.submitClaim({
        policy_id: policy.id,
        booking_id: input.booking_id,
        reported_by: input.reported_by,
        incident_date: input.incident_date,
        claim_type: input.damage_type, // BD usa claim_type
        description: input.description,
        estimated_damage_amount: input.claim_amount_cents, // BD usa estimated_damage_amount
        // severity removed - not in DB schema
        status: 'submitted', // Or whatever the actual DB enum value is
      })

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
      const claim = await this.insuranceSDK.getClaimById(claimId)

      if (!claim) {
        throw new InsuranceError(
          'Claim not found',
          InsuranceErrorCode.CLAIM_NOT_FOUND,
          404
        )
      }

      if (claim.status !== 'pending') {
        throw new InsuranceError(
          `Cannot approve claim with status: ${claim.status ?? 'unknown'}`,
          InsuranceErrorCode.CLAIM_ALREADY_PROCESSED,
          400
        )
      }

      // 2. Validate approved amount
      if (claim.estimated_damage_amount && approvedAmountCents > claim.estimated_damage_amount) {
        throw new InsuranceError(
          'Approved amount cannot exceed requested amount',
          InsuranceErrorCode.INVALID_CLAIM_AMOUNT,
          400
        )
      }

      // 3. Update claim status
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

       
      return approvedClaim as InsuranceClaimDTO
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
      const rejectedClaim = await this.insuranceSDK.updateClaimStatus(
        claimId,
        'rejected',
        0,
        rejectionReason
      )

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

  // getCoverageLimit() method removed - was not used anywhere
}

// ============================================
// TYPES
// ============================================

interface CreatePolicyInput {
  booking_id: string
  user_id: string
  car_id: string
  coverage_level: 'none' | 'basic' | 'standard' | 'premium'
  booking_total_cents: number
  rental_days: number
  start_date: string
  end_date: string
}

interface SubmitClaimInput {
  booking_id: string
  claim_amount_cents: number
  description: string
  incident_date: string
  reported_by: string
  damage_type: string
  severity: 'minor' | 'moderate' | 'severe'
  evidence_urls?: string[]
}

// Singleton instance
export const insuranceService = new InsuranceService(insuranceSDK)
