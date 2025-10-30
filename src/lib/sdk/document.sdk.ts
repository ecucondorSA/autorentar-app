/* eslint-disable @typescript-eslint/no-unnecessary-condition -- SDK defensive programming pattern */
/**
 * Document SDK
 * Handles user and vehicle document operations
 */

import type {
  UserDocumentDTO,
  VehicleDocumentDTO,
} from '@/types'
import {
  parseUserDocument,
  parseVehicleDocument,
} from '@/types'

import { toError } from '../errors'
import { supabase } from '../supabase'


import { BaseSDK } from './base.sdk'

export class DocumentSDK extends BaseSDK {
  // ============================================
  // USER DOCUMENTS (KYC)
  // ============================================

  /**
   * Get user document by ID
   */
  async getUserDocumentById(id: number): Promise<UserDocumentDTO> {
    try {
      const { data, error } = await this.supabase
        .from('user_documents')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        throw toError(error)
      }

      if (!data) {
        throw new Error('User document not found')
      }

      return parseUserDocument(data)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Get all documents for a user
   */
  async getUserDocuments(userId: string): Promise<UserDocumentDTO[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        throw toError(error)
      }

      return (data ?? []).map(parseUserDocument)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Upload user document
   */
  async uploadUserDocument(input: {
    user_id: string
    kind: 'gov_id_front' | 'gov_id_back' | 'driver_license' | 'utility_bill' | 'selfie'
    storage_path: string
  }): Promise<UserDocumentDTO> {
    try {
      const { data, error } = await this.supabase
        .from('user_documents')
        .insert({
          user_id: input.user_id,
          kind: input.kind,
          storage_path: input.storage_path,
          status: 'pending',
        })
        .select()
        .single()

      if (error) {
        throw toError(error)
      }

      if (!data) {
        throw new Error('Failed to upload user document')
      }

      return parseUserDocument(data)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Verify user document (admin only)
   */
  async verifyUserDocument(
    documentId: number,
    reviewerId: string,
    status: 'verified' | 'rejected',
    notes?: string
  ): Promise<UserDocumentDTO> {
    try {
      const { data, error } = await this.supabase
        .from('user_documents')
        .update({
          status,
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
          notes: notes ?? null,
        })
        .eq('id', documentId)
        .select()
        .single()

      if (error) {
        throw toError(error)
      }

      if (!data) {
        throw new Error('User document not found')
      }

      return parseUserDocument(data)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Delete user document
   */
  async deleteUserDocument(documentId: number): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('user_documents')
        .delete()
        .eq('id', documentId)

      if (error) {
        throw toError(error)
      }
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Get pending user documents (for admin review)
   */
  async getPendingUserDocuments(): Promise<UserDocumentDTO[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_documents')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })

      if (error) {
        throw toError(error)
      }

      return (data ?? []).map(parseUserDocument)
    } catch (e) {
      throw toError(e)
    }
  }

  // ============================================
  // VEHICLE DOCUMENTS
  // ============================================

  /**
   * Get vehicle document by ID
   */
  async getVehicleDocumentById(id: string): Promise<VehicleDocumentDTO> {
    try {
      const { data, error } = await this.supabase
        .from('vehicle_documents')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        throw toError(error)
      }

      if (!data) {
        throw new Error('Vehicle document not found')
      }

      return parseVehicleDocument(data)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Get all documents for a vehicle
   */
  async getVehicleDocuments(carId: string): Promise<VehicleDocumentDTO[]> {
    try {
      const { data, error } = await this.supabase
        .from('vehicle_documents')
        .select('*')
        .eq('car_id', carId)
        .order('created_at', { ascending: false })

      if (error) {
        throw toError(error)
      }

      return (data ?? []).map(parseVehicleDocument)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Upload vehicle document
   */
  async uploadVehicleDocument(input: {
    car_id: string
    kind: 'registration' | 'insurance' | 'technical_inspection' | 'circulation_permit' | 'ownership_proof'
    storage_path: string
    expiry_date?: string
  }): Promise<VehicleDocumentDTO> {
    try {
      const { data, error } = await this.supabase
        .from('vehicle_documents')
        .insert({
          car_id: input.car_id,
          kind: input.kind,
          storage_path: input.storage_path,
          expiry_date: input.expiry_date ?? null,
          status: 'pending',
        })
        .select()
        .single()

      if (error) {
        throw toError(error)
      }

      if (!data) {
        throw new Error('Failed to upload vehicle document')
      }

      return parseVehicleDocument(data)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Verify vehicle document (admin only)
   */
  async verifyVehicleDocument(
    documentId: string,
    verifierId: string,
    status: 'verified' | 'rejected',
    notes?: string
  ): Promise<VehicleDocumentDTO> {
    try {
      const { data, error } = await this.supabase
        .from('vehicle_documents')
        .update({
          status,
          verified_by: verifierId,
          verified_at: new Date().toISOString(),
          notes: notes ?? null,
        })
        .eq('id', documentId)
        .select()
        .single()

      if (error) {
        throw toError(error)
      }

      if (!data) {
        throw new Error('Vehicle document not found')
      }

      return parseVehicleDocument(data)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Delete vehicle document
   */
  async deleteVehicleDocument(documentId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('vehicle_documents')
        .delete()
        .eq('id', documentId)

      if (error) {
        throw toError(error)
      }
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Get pending vehicle documents (for admin review)
   */
  async getPendingVehicleDocuments(): Promise<VehicleDocumentDTO[]> {
    try {
      const { data, error } = await this.supabase
        .from('vehicle_documents')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })

      if (error) {
        throw toError(error)
      }

      return (data ?? []).map(parseVehicleDocument)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Get expired vehicle documents
   */
  async getExpiredVehicleDocuments(): Promise<VehicleDocumentDTO[]> {
    try {
      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await this.supabase
        .from('vehicle_documents')
        .select('*')
        .lt('expiry_date', today)
        .order('expiry_date', { ascending: true })

      if (error) {
        throw toError(error)
      }

      return (data ?? []).map(parseVehicleDocument)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Get vehicle documents expiring soon (within 30 days)
   */
  async getExpiringSoonVehicleDocuments(): Promise<VehicleDocumentDTO[]> {
    try {
      const today = new Date()
      const in30Days = new Date(today)
      in30Days.setDate(in30Days.getDate() + 30)

      const todayStr = today.toISOString().split('T')[0]
      const in30DaysStr = in30Days.toISOString().split('T')[0]

      const { data, error } = await this.supabase
        .from('vehicle_documents')
        .select('*')
        .gte('expiry_date', todayStr)
        .lte('expiry_date', in30DaysStr)
        .order('expiry_date', { ascending: true })

      if (error) {
        throw toError(error)
      }

      return (data ?? []).map(parseVehicleDocument)
    } catch (e) {
      throw toError(e)
    }
  }
}

// Singleton instance
export const documentSDK = new DocumentSDK(supabase)
