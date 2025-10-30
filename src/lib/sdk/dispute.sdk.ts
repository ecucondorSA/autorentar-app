/**
 * Dispute SDK
 * Handles dispute and dispute evidence operations
 */

import type {
  DisputeDTO,
  DisputeEvidenceDTO,
  Database,
} from '@/types'
import {
  parseDispute,
  parseDisputeEvidence,
} from '@/types'

import { toError } from '../errors'
import { supabase } from '../supabase'


import { BaseSDK } from './base.sdk'

export class DisputeSDK extends BaseSDK {
  // ============================================
  // DISPUTE OPERATIONS
  // ============================================

  /**
   * Get dispute by ID
   */
  async getById(id: string): Promise<DisputeDTO> {
    try {
      const { data, error } = await this.supabase
        .from('disputes')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        throw toError(error)
      }

      if (!data) {
        throw new Error('Dispute not found')
      }

      return parseDispute(data)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Create a dispute
   */
  async create(input: {
    booking_id: string
    opened_by: string
    kind: 'damage' | 'no_show' | 'late_return' | 'other'
    description?: string
  }): Promise<DisputeDTO> {
    try {
      const { data, error } = await this.supabase
        .from('disputes')
        .insert({
          booking_id: input.booking_id,
          opened_by: input.opened_by,
          kind: input.kind,
          description: input.description ?? null,
          status: 'open',
        })
        .select()
        .single()

      if (error) {
        throw toError(error)
      }

      if (!data) {
        throw new Error('Failed to create dispute')
      }

      return parseDispute(data)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Get disputes by booking ID
   */
  async getByBooking(bookingId: string): Promise<DisputeDTO[]> {
    try {
      const { data, error } = await this.supabase
        .from('disputes')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false })

      if (error) {
        throw toError(error)
      }

      return (data ?? []).map(parseDispute)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Get disputes opened by user
   */
  async getByUser(userId: string): Promise<DisputeDTO[]> {
    try {
      const { data, error } = await this.supabase
        .from('disputes')
        .select('*')
        .eq('opened_by', userId)
        .order('created_at', { ascending: false })

      if (error) {
        throw toError(error)
      }

      return (data ?? []).map(parseDispute)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Get open disputes
   */
  async getOpenDisputes(): Promise<DisputeDTO[]> {
    try {
      const { data, error } = await this.supabase
        .from('disputes')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: true })

      if (error) {
        throw toError(error)
      }

      return (data ?? []).map(parseDispute)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Update dispute status
   */
  async updateStatus(
    disputeId: string,
    status: 'in_review' | 'resolved' | 'rejected',
    resolvedBy?: string
  ): Promise<DisputeDTO> {
    try {
      const updateData: Database['public']['Tables']['disputes']['Update'] = {
        status: status as Database['public']['Enums']['dispute_status'],
      }

      if (status === 'resolved' || status === 'rejected') {
        if (!resolvedBy) {
          throw new Error('resolvedBy is required when resolving or rejecting a dispute')
        }
        updateData.resolved_by = resolvedBy
        updateData.resolved_at = new Date().toISOString()
      }

      const { data, error } = await this.supabase
        .from('disputes')
        .update(updateData)
        .eq('id', disputeId)
        .select()
        .single()

      if (error) {
        throw toError(error)
      }

      if (!data) {
        throw new Error('Dispute not found')
      }

      return parseDispute(data)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Resolve dispute
   */
  async resolve(
    disputeId: string,
    resolvedBy: string
  ): Promise<DisputeDTO> {
    return this.updateStatus(disputeId, 'resolved', resolvedBy)
  }

  /**
   * Reject dispute
   */
  async reject(
    disputeId: string,
    resolvedBy: string
  ): Promise<DisputeDTO> {
    return this.updateStatus(disputeId, 'rejected', resolvedBy)
  }

  // ============================================
  // DISPUTE EVIDENCE OPERATIONS
  // ============================================

  /**
   * Add evidence to dispute
   */
  async addEvidence(input: {
    dispute_id: string
    path: string
    note?: string
  }): Promise<DisputeEvidenceDTO> {
    try {
      const { data, error } = await this.supabase
        .from('dispute_evidence')
        .insert({
          dispute_id: input.dispute_id,
          path: input.path,
          note: input.note ?? null,
        })
        .select()
        .single()

      if (error) {
        throw toError(error)
      }

      if (!data) {
        throw new Error('Failed to add evidence')
      }

      return parseDisputeEvidence(data)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Get evidence for dispute
   */
  async getEvidence(disputeId: string): Promise<DisputeEvidenceDTO[]> {
    try {
      const { data, error } = await this.supabase
        .from('dispute_evidence')
        .select('*')
        .eq('dispute_id', disputeId)
        .order('created_at', { ascending: true })

      if (error) {
        throw toError(error)
      }

      return (data ?? []).map(parseDisputeEvidence)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Delete evidence
   */
  async deleteEvidence(evidenceId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('dispute_evidence')
        .delete()
        .eq('id', evidenceId)

      if (error) {
        throw toError(error)
      }
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Get dispute with evidence
   */
  async getWithEvidence(disputeId: string): Promise<{
    dispute: DisputeDTO
    evidence: DisputeEvidenceDTO[]
  }> {
    try {
      const [dispute, evidence] = await Promise.all([
        this.getById(disputeId),
        this.getEvidence(disputeId),
      ])

      return {
        dispute,
        evidence,
      }
    } catch (e) {
      throw toError(e)
    }
  }
}

// Singleton instance
export const disputeSDK = new DisputeSDK(supabase)
