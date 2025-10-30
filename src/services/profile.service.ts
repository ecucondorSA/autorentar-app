/**
 * ProfileService
 * Business logic layer for profile operations
 *
 * Responsibilities:
 * - Handle user registration workflow
 * - Manage KYC (Know Your Customer) verification
 * - Upgrade users to owner role
 * - Validate profile completeness
 */

import { profileSDK, type ProfileSDK } from '@/lib/sdk/profile.sdk'
import { walletSDK, type WalletSDK } from '@/lib/sdk/wallet.sdk'
import type { ProfileDTO, WalletDTO } from '@/types'

import { toError } from '../lib/errors'

// ============================================
// PROFILE SERVICE ERRORS
// ============================================

export enum ProfileErrorCode {
  PROFILE_NOT_FOUND = 'PROFILE_NOT_FOUND',
  PROFILE_ALREADY_EXISTS = 'PROFILE_ALREADY_EXISTS',
  KYC_ALREADY_SUBMITTED = 'KYC_ALREADY_SUBMITTED',
  KYC_NOT_APPROVED = 'KYC_NOT_APPROVED',
  ALREADY_OWNER = 'ALREADY_OWNER',
  MISSING_REQUIREMENTS = 'MISSING_REQUIREMENTS',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

export class ProfileError extends Error {
  constructor(
    message: string,
    public code: ProfileErrorCode,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'ProfileError'
    Object.setPrototypeOf(this, ProfileError.prototype)
  }
}

// ============================================
// PROFILE SERVICE
// ============================================

export class ProfileService {
  constructor(
    private readonly profileSDK: ProfileSDK,
    private readonly walletSDK: WalletSDK
  ) {}

  /**
   * Register a new user
   * Creates profile and initializes wallet
   */
  async registerUser(input: RegisterUserInput): Promise<{
    profile: ProfileDTO
    wallet: WalletDTO
  }> {
    try {
      // 1. Verify user doesn't already have a profile
      try {
        const existingProfile = await this.profileSDK.getById(input.user_id)
        if (existingProfile) {
          throw new ProfileError(
            'Profile already exists for this user',
            ProfileErrorCode.PROFILE_ALREADY_EXISTS,
            409
          )
        }
      } catch {
        // Profile not found, continue with registration
      }

      // 2. Create profile (using real DB schema)
      const profile = await this.profileSDK.create({
        id: input.user_id,
        email: input.email,
        full_name: `${input.first_name} ${input.last_name}`,
        phone: input.phone,
        role: 'renter',
        kyc: 'not_started',
        onboarding: 'incomplete',
        preferred_language: 'es',
        preferred_currency: 'ARS',
      })

      // 3. Create wallet (using real DB schema)
      const wallet = await this.walletSDK.create({
        user_id: input.user_id,
        available_balance: 0, // BD usa available_balance, no balance_cents
        locked_balance: 0, // BD usa locked_balance, no held_cents
        currency: 'ARS',
        // status removed - not in DB schema
      })

      return {
        profile,
         
        wallet,
      }
    } catch (error) {
      if (error instanceof ProfileError) {throw error}
      throw toError(error)
    }
  }

  /**
   * Submit KYC documentation
   * Validates documents and updates verification status
   */
  async submitKYC(
    userId: string,
    documents: KYCDocuments
  ): Promise<ProfileDTO> {
    try {
      // 1. Get profile
      const profile = await this.profileSDK.getById(userId)

      // 2. Verify KYC not already approved
      if (profile.kyc === 'verified') {
        throw new ProfileError(
          'KYC already approved',
          ProfileErrorCode.KYC_ALREADY_SUBMITTED,
          400
        )
      }

      // 3. Validate documents
      this.validateKYCDocuments(documents)

      // 4. Update profile with KYC status
      // In production, this would trigger async verification workflow
      // TODO: Store documents in user_documents table instead of profile fields
      const updatedProfile = await this.profileSDK.adminUpdate(userId, {
        kyc: 'pending',
        // Documents stored separately - remove these fields when user_documents table is ready
      })

       
      return updatedProfile
    } catch (error) {
      if (error instanceof ProfileError) {throw error}
      throw toError(error)
    }
  }

  /**
   * Approve KYC verification
   * Admin action to approve user's KYC documents
   */
  async approveKYC(userId: string): Promise<ProfileDTO> {
    try {
      const updatedProfile = await this.profileSDK.adminUpdate(userId, {
        kyc: 'verified',
      })

      return updatedProfile
    } catch (error) {
      throw toError(error)
    }
  }

  /**
   * Reject KYC verification
   * Admin action to reject user's KYC documents
   */
  async rejectKYC(userId: string): Promise<ProfileDTO> {
    try {
      // TODO: Store rejection reason in user_verifications table
      const updatedProfile = await this.profileSDK.adminUpdate(userId, {
        kyc: 'rejected',
        // Rejection reason stored separately in user_verifications
      })

      return updatedProfile
    } catch (error) {
      throw toError(error)
    }
  }

  /**
   * Upgrade user to owner role
   * Validates KYC approval and grants owner permissions
   */
  async becomeOwner(userId: string): Promise<ProfileDTO> {
    try {
      // 1. Get profile
      const profile = await this.profileSDK.getById(userId)

      // 2. Verify KYC is approved
      if (profile.kyc !== 'verified') {
        throw new ProfileError(
          'KYC must be approved before becoming an owner',
          ProfileErrorCode.KYC_NOT_APPROVED,
          403
        )
      }

      // 3. Verify not already an owner
      if (profile.role === 'owner' || profile.role === 'admin') {
        throw new ProfileError(
          'User is already an owner',
          ProfileErrorCode.ALREADY_OWNER,
          400
        )
      }

      // 4. Update role to owner
      const updatedProfile = await this.profileSDK.adminUpdate(userId, {
        role: 'owner',
      })

      return updatedProfile
    } catch (error) {
      if (error instanceof ProfileError) {throw error}
      throw toError(error)
    }
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  /**
   * Validate KYC documents
   */
  private validateKYCDocuments(documents: KYCDocuments): void {
    const missingDocs: string[] = []

    if (!documents.id_document_url) {
      missingDocs.push('id_document')
    }
    if (!documents.driver_license_url) {
      missingDocs.push('driver_license')
    }

    if (missingDocs.length > 0) {
      throw new ProfileError(
        `Missing required documents: ${missingDocs.join(', ')}`,
        ProfileErrorCode.MISSING_REQUIREMENTS,
        400
      )
    }

    // TODO: Add validation for document format (PDF, JPG, PNG)
    // TODO: Add validation for document size (max 10MB)
    // TODO: Add validation for document expiry dates
  }
}

// ============================================
// TYPES
// ============================================

interface RegisterUserInput {
  user_id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
}

interface KYCDocuments {
  id_document_url: string
  driver_license_url: string
  proof_of_address_url?: string
}

// Singleton instance
export const profileService = new ProfileService(profileSDK, walletSDK)
