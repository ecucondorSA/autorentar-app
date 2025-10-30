/**
 * CarService
 * Business logic layer for car operations
 *
 * Responsibilities:
 * - Validate car publishing requirements
 * - Manage car availability calendar
 * - Aggregate car statistics and metrics
 * - Handle car activation/deactivation
 */

import { carSDK, type CarSDK } from '@/lib/sdk/car.sdk'
import type { CarDTO } from '@/types'

import { toError } from '../lib/errors'

// ============================================
// CAR SERVICE ERRORS
// ============================================

export enum CarErrorCode {
  CAR_NOT_FOUND = 'CAR_NOT_FOUND',
  CAR_ALREADY_PUBLISHED = 'CAR_ALREADY_PUBLISHED',
  MISSING_REQUIREMENTS = 'MISSING_REQUIREMENTS',
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_STATUS_TRANSITION = 'INVALID_STATUS_TRANSITION',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

export class CarError extends Error {
  constructor(
    message: string,
    public code: CarErrorCode,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'CarError'
    Object.setPrototypeOf(this, CarError.prototype)
  }
}

// ============================================
// CAR SERVICE
// ============================================

export class CarService {
  constructor(private readonly carSDK: CarSDK) {}

  /**
   * Publish a car
   * Validates requirements and activates car for booking
   */
  async publishCar(carId: string, ownerId: string): Promise<CarDTO> {
    try {
      // 1. Get car
      const car = await this.carSDK.getById(carId)

      // 2. Verify ownership
      if (car.owner_id !== ownerId) {
        throw new CarError(
          'Only the car owner can publish this car',
          CarErrorCode.UNAUTHORIZED,
          403
        )
      }

      // 3. Verify car is not already published
      if (car.status === 'active') {
        throw new CarError(
          'Car is already published',
          CarErrorCode.CAR_ALREADY_PUBLISHED,
          400
        )
      }

      // 4. Validate publishing requirements
      this.validatePublishingRequirements(car)

      // 5. Update car status to active
       
      const publishedCar = await this.carSDK.update(carId, {
        status: 'active',
      })

       
      return publishedCar
    } catch (error) {
      if (error instanceof CarError) {throw error}
      throw toError(error)
    }
  }

  /**
   * Unpublish a car
   * Deactivates car from being available for booking
   */
  async unpublishCar(carId: string, ownerId: string): Promise<CarDTO> {
    try {
      // 1. Get car
      const car = await this.carSDK.getById(carId)

      // 2. Verify ownership
      if (car.owner_id !== ownerId) {
        throw new CarError(
          'Only the car owner can unpublish this car',
          CarErrorCode.UNAUTHORIZED,
          403
        )
      }

      // 3. Verify car is published
      if (car.status !== 'active') {
        throw new CarError(
          'Car is not published',
          CarErrorCode.INVALID_STATUS_TRANSITION,
          400
        )
      }

      // 4. Update car status to suspended
       
      const unpublishedCar = await this.carSDK.update(carId, {
        status: 'suspended',
      } as never)

       
      return unpublishedCar
    } catch (error) {
      if (error instanceof CarError) {throw error}
      throw toError(error)
    }
  }

  /**
   * Get car with aggregated statistics
   * Returns car data with booking stats, rating, revenue
   */
  async getCarWithStats(
    carId: string
  ): Promise<CarDTO & { stats: CarStats }> {
    try {
      // 1. Get car
      const car = await this.carSDK.getById(carId)

      // 2. Get stats
      // TODO: Implement actual stats aggregation from bookings, reviews, payments
      const stats: CarStats = {
        total_bookings: 0,
        total_revenue_cents: 0,
        average_rating: 0,
        total_reviews: 0,
        occupancy_rate: 0,
      }

      return {
        ...car,
        stats,
      }
    } catch (error) {
      if (error instanceof CarError) {throw error}
      throw toError(error)
    }
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  /**
   * Validate car meets publishing requirements
   */
  private validatePublishingRequirements(car: CarDTO): void {
    const missingFields: string[] = []

    // Required fields for publishing
    if (!car.brand) {missingFields.push('brand')}
    if (!car.model) {missingFields.push('model')}
    if (!car.year) {missingFields.push('year')}
    // TODO: Add license_plate validation when field is confirmed in CarDTO
    if (!car.price_per_day_cents || car.price_per_day_cents <= 0) {
      missingFields.push('price_per_day_cents')
    }
    if (!car.location_city) {missingFields.push('location_city')}
    if (!car.location_country) {missingFields.push('location_country')}

    // TODO: Add validation for required images (at least 3 photos)
    // TODO: Add validation for required documents (registration, insurance)

    if (missingFields.length > 0) {
      throw new CarError(
        `Missing required fields: ${missingFields.join(', ')}`,
        CarErrorCode.MISSING_REQUIREMENTS,
        400
      )
    }
  }
}

// ============================================
// TYPES
// ============================================

interface CarStats {
  total_bookings: number
  total_revenue_cents: number
  average_rating: number
  total_reviews: number
  occupancy_rate: number
}

// Singleton instance
export const carService = new CarService(carSDK)
