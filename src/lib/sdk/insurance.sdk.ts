/* eslint-disable @typescript-eslint/no-unnecessary-condition, eslint-comments/disable-enable-pair -- SDK layer: Defensive programming for runtime safety against Supabase SDK changes */
/**
 * Insurance SDK
 * Handles insurance policy and claims operations
 */

import {
  InsuranceQuoteRequestSchema,
  ClaimSearchFiltersSchema,
  type InsurancePolicy,
  type InsuranceClaim,
  type InsuranceQuoteRequest,
  type ClaimSearchFilters,
  type PaginatedResponse,
  type TablesInsert,
} from '@/types'

import { toError } from '../errors'
import { supabase } from '../supabase'

import { BaseSDK } from './base.sdk'

export class InsuranceSDK extends BaseSDK {
  /**
   * Get policy by ID
   */
  async getPolicyById(id: string): Promise<InsurancePolicy> {
    return this.execute(async () => {
      return await this.supabase
        .from('insurance_policies')
        .select('*')
        .eq('id', id)
        .single()
    })
  }

  /**
   * Get policy for booking
   */
  async getPolicyByBooking(bookingId: string): Promise<InsurancePolicy | null> {
    const { data, error } = await this.supabase
      .from('insurance_policies')
      .select('*')
      .eq('booking_id', bookingId)
      .single()

    if (error) {
      // Policy might not exist
      return null
    }

    return data
  }

  /**
   * Create insurance policy
   */
  async createPolicy(input: TablesInsert<'insurance_policies'>): Promise<InsurancePolicy> {
    try {
      const { data, error } = await this.supabase
        .from('insurance_policies')
        .insert(input)
        .select()
        .single()

      if (error) {throw toError(error)}
      if (!data) {throw new Error('Failed to create policy')}

      return data
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Get insurance quote
   */
  getQuote(input: InsuranceQuoteRequest): unknown {
    // Validate input
    const validData = InsuranceQuoteRequestSchema.parse(input)

    // Calculate quote based on factors
    const baseRate = this.calculateBaseRate(validData)
    const ageFactor = this.calculateAgeFactor(validData.user_age)
    const experienceFactor = this.calculateExperienceFactor(validData.driving_experience_years)
    const carValueFactor = validData.car_value_cents / 100000 // Per $1000

    let premium_cents = baseRate * ageFactor * experienceFactor * carValueFactor * validData.rental_days

    // Add addons
    if (validData.roadside_assistance) {
      premium_cents += 50000 * validData.rental_days // $500/day
    }

    if (validData.additional_drivers > 0) {
      premium_cents += 30000 * validData.additional_drivers * validData.rental_days // $300/day per driver
    }

    // Coverage amounts based on level
    const coverage = this.getCoverageAmounts(validData.coverage_level, validData.car_value_cents)

     
    return {
      quote_id: crypto.randomUUID(),
      coverage_level: validData.coverage_level,
      ...(coverage as Record<string, unknown>),
      base_premium_cents: Math.floor(premium_cents),
      addons_premium_cents: 0,
      total_premium_cents: Math.floor(premium_cents),
      valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
      terms_url: 'https://autorentar.com/insurance-terms',
    }
  }

  /**
   * Create insurance claim
   */
  async createClaim(input: TablesInsert<'insurance_claims'>): Promise<InsuranceClaim> {
    try {
      const { data, error } = await this.supabase
        .from('insurance_claims')
        .insert(input)
        .select()
        .single()

      if (error) {throw toError(error)}
      if (!data) {throw new Error('Failed to create claim')}

      return data
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Update claim status
   */
  async updateClaimStatus(
    claimId: string,
    status: string,
    approvedAmount?: number,
    rejectionReason?: string
  ): Promise<InsuranceClaim> {
    return this.execute(async () => {
      return await this.supabase
        .from('insurance_claims')
        .update({
          status,
          ...(approvedAmount && { approved_amount_cents: approvedAmount }),
          ...(rejectionReason && { rejection_reason: rejectionReason }),
          ...(status === 'paid' && { payment_date: new Date().toISOString() }),
        })
        .eq('id', claimId)
        .select()
        .single()
    })
  }

  /**
   * Submit claim (alias for createClaim, used by services)
   */
  async submitClaim(payload: TablesInsert<'insurance_claims'>): Promise<InsuranceClaim> {
    try {
      const { data, error } = await this.supabase
        .from('insurance_claims')
        .insert(payload)
        .select()
        .single()

      if (error) {throw toError(error)}
      if (!data) {throw new Error('Failed to create claim')}

      return data
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Get claim by ID
   */
  async getClaimById(id: string): Promise<InsuranceClaim | null> {
    try {
      const { data, error } = await this.supabase
        .from('insurance_claims')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (error) {throw toError(error)}
      return data ?? null
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Search claims
   */
  async searchClaims(filters: ClaimSearchFilters): Promise<PaginatedResponse<InsuranceClaim>> {
    // Validate filters
    const validFilters = ClaimSearchFiltersSchema.parse(filters)

    let query = this.supabase
      .from('insurance_claims')
      .select('*', { count: 'exact' })

    // Apply filters
    if (validFilters.policy_id) {
      query = query.eq('policy_id', validFilters.policy_id)
    }

    if (validFilters.booking_id) {
      query = query.eq('booking_id', validFilters.booking_id)
    }

    if (validFilters.user_id) {
      query = query.eq('reported_by', validFilters.user_id)
    }

    if (validFilters.status) {
      query = query.eq('status', validFilters.status)
    }

    if (validFilters.statuses && validFilters.statuses.length > 0) {
      query = query.in('status', validFilters.statuses)
    }

    if (validFilters.damage_type) {
      query = query.eq('damage_type', validFilters.damage_type)
    }

    if (validFilters.severity) {
      query = query.eq('severity', validFilters.severity)
    }

    if (validFilters.incident_from) {
      query = query.gte('incident_date', validFilters.incident_from)
    }

    if (validFilters.incident_to) {
      query = query.lte('incident_date', validFilters.incident_to)
    }

    // Sorting
    const [field, order] = validFilters.sortBy.split('_').reduce((acc, part, i, arr) => {
      if (i === arr.length - 1) {
        acc[1] = part
      } else {
        acc[0] += (i > 0 ? '_' : '') + part
      }
      return acc
    }, ['', 'desc'])

    query = query.order(field, { ascending: order === 'asc' })

    // Pagination
    const from = (validFilters.page - 1) * validFilters.pageSize
    const to = from + validFilters.pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      this.handleError(error, 'Claim search failed')
    }

    return this.createPaginatedResponse(
      data || [],
      count,
      validFilters.page,
      validFilters.pageSize
    )
  }

  // Helper methods

  private calculateBaseRate(input: InsuranceQuoteRequest): number {
    switch (input.coverage_level) {
      case 'basic':
        return 100000 // $1000 base
      case 'standard':
        return 200000 // $2000 base
      case 'premium':
        return 400000 // $4000 base
      default:
        return 100000
    }
  }

  private calculateAgeFactor(age: number): number {
    if (age < 25) {return 1.5} // Higher risk
    if (age < 30) {return 1.2}
    if (age > 65) {return 1.3}
    return 1.0 // Standard
  }

  private calculateExperienceFactor(years: number): number {
    if (years < 2) {return 1.4}
    if (years < 5) {return 1.2}
    if (years > 10) {return 0.9}
    return 1.0
  }

  private getCoverageAmounts(level: string, carValue: number): unknown {
    switch (level) {
      case 'basic':
        return {
          collision_coverage_cents: Math.floor(carValue * 0.5),
          theft_coverage_cents: Math.floor(carValue * 0.5),
          liability_coverage_cents: 500000000, // $5M
          personal_injury_coverage_cents: 100000000, // $1M
          deductible_cents: Math.floor(carValue * 0.1),
        }
      case 'standard':
        return {
          collision_coverage_cents: Math.floor(carValue * 0.8),
          theft_coverage_cents: Math.floor(carValue * 0.8),
          liability_coverage_cents: 1000000000, // $10M
          personal_injury_coverage_cents: 200000000, // $2M
          deductible_cents: Math.floor(carValue * 0.05),
        }
      case 'premium':
        return {
          collision_coverage_cents: carValue,
          theft_coverage_cents: carValue,
          liability_coverage_cents: 2000000000, // $20M
          personal_injury_coverage_cents: 500000000, // $5M
          deductible_cents: 0, // No deductible
        }
      default:
        return this.getCoverageAmounts('basic', carValue)
    }
  }
}

// Singleton instance
export const insuranceSDK = new InsuranceSDK(supabase)
