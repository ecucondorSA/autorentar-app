/* eslint-disable @typescript-eslint/no-unnecessary-condition, eslint-comments/disable-enable-pair -- Service layer: Defensive programming for business logic safety */
/**
 * BookingService
 * Business logic layer for booking operations
 *
 * Responsibilities:
 * - Coordinate multiple SDKs for complex operations
 * - Apply business rules and validations
 * - Handle state transitions
 * - Manage pricing calculations
 * - Process payments and refunds
 */

import { type BookingSDK } from '@/lib/sdk/booking.sdk'
import { type CarSDK } from '@/lib/sdk/car.sdk'
import { type PaymentSDK } from '@/lib/sdk/payment.sdk'
import { type PricingSDK } from '@/lib/sdk/pricing.sdk'
import type {
  BookingDTO,
} from '@/types'
import {
  BookingError,
  BookingErrorCode,
  type CancelBookingInput,
  type CompleteBookingInput,
  type CreateBookingServiceInput,
  CreateBookingServiceInputSchema,
  type StartBookingInput,
} from '@/types/service-types'

import { toError } from '../lib/errors'

export class BookingService {
  constructor(
    private readonly bookingSDK: BookingSDK = bookingSDK,
    private readonly carSDK: CarSDK = carSDK,
    private readonly paymentSDK: PaymentSDK = paymentSDK,
    private readonly pricingSDK: PricingSDK = pricingSDK
  ) {}

  /**
   * Create a new booking
   * Complex operation that coordinates multiple SDKs
   */
  async createBooking(input: CreateBookingServiceInput): Promise<BookingDTO> {
    try {
      // 1. Validate input
      const validInput = CreateBookingServiceInputSchema.parse(input)

      // 2. Verify car exists and is active
      const car = await this.carSDK.getById(validInput.car_id)
      if (car.status !== 'active') {
        throw new BookingError(
          'Car is not available for booking',
          BookingErrorCode.CAR_INACTIVE,
          400
        )
      }

      // 3. Check car availability
      const isAvailable = await this.checkCarAvailability(
        validInput.car_id,
        validInput.start_date,
        validInput.end_date
      )

      if (!isAvailable) {
        throw new BookingError(
          'Car is not available for the selected dates',
          BookingErrorCode.CAR_NOT_AVAILABLE,
          409
        )
      }

      // 4. Calculate pricing
      const rentalDays = this.calculateRentalDays(
        validInput.start_date,
        validInput.end_date
      )

      const pricing = await this.pricingSDK.calculate({
        car_id: validInput.car_id,
        start_date: validInput.start_date,
        end_date: validInput.end_date,
        rental_days: rentalDays,
        base_price_per_day_cents: car.price_per_day_cents,
        // insurance_coverage_level: will use 'none' if not specified
        insurance_coverage_level: 'none', // Default to no insurance add-on
        extra_driver_count: validInput.extra_driver_count,
        extra_child_seat_count: validInput.extra_child_seat_count,
        extra_gps: validInput.extra_gps,
        extra_wifi: validInput.extra_wifi,
        promo_code: validInput.promo_code,
        user_id: validInput.renter_id,
      })

      // 5. Create booking
      let booking: BookingDTO
      try {
        booking = await this.bookingSDK.create({
          car_id: validInput.car_id,
          renter_id: validInput.renter_id,
          start_date: validInput.start_date,
          end_date: validInput.end_date,
          status: 'pending',
          total_price_cents: pricing.total_cents,
          // Default cancellation policy - can be customized per car in future
          cancel_policy: 'moderate',
          // Required fields from DB schema
          guarantee_type: 'deposit',
          guarantee_amount_cents: Math.round(pricing.total_cents * 0.2), // 20% deposit
          extra_driver_count: validInput.extra_driver_count ?? 0,
          extra_child_seat_count: validInput.extra_child_seat_count ?? 0,
          base_price_cents: car.price_per_day_cents,
          service_fee_cents: Math.round(pricing.total_cents * 0.1), // 10% platform fee
          tax_cents: Math.round(pricing.total_cents * 0.02), // 2% tax
          // insurance_coverage_level removed - use insurance_policy_id (UUID) instead
          extra_gps: validInput.extra_gps ?? false,
        })
      } catch {
        throw new BookingError(
          'Failed to create booking',
          BookingErrorCode.VALIDATION_ERROR,
          500
        )
      }

      // 6. Create pending payment
      try {
        await this.paymentSDK.create({
          booking_id: booking.id,
          payer_id: validInput.renter_id,
          amount_cents: pricing.total_cents,
          status: 'requires_payment',
          provider: 'mercadopago', // Default provider
          mode: 'full_upfront',
          installments: 1,
        })
      } catch {
        // Compensating transaction: delete booking
        // In production, use proper transaction or saga pattern
        try {
          await this.bookingSDK.update(booking.id, { status: 'cancelled' })
        } catch {
          // Log error but don't throw
        }

        throw new BookingError(
          'Failed to create payment. Booking has been cancelled.',
          BookingErrorCode.PAYMENT_FAILED,
          500
        )
      }

      // TODO: Create insurance policy if coverage level is not 'none'
      // if (validInput.insurance_coverage_level && validInput.insurance_coverage_level !== 'none') {
      //   await this.insuranceSDK.createPolicy({
      //     booking_id: booking.id,
      //     coverage_level: validInput.insurance_coverage_level,
      //     total_premium_cents: pricing.addons.insurance_cents,
      //   })
      // }

      return booking
    } catch (error) {
      if (error instanceof BookingError) {throw error}
      throw toError(error)
    }
  }

  /**
   * Confirm booking (owner action)
   * Validates ownership and transitions booking to confirmed state
   */
  async confirmBooking(bookingId: string, ownerId: string): Promise<BookingDTO> {
    try {
      // 1. Get booking with car details
      const bookingWithDetails = await this.bookingSDK.getByIdWithDetails(bookingId)

      // 2. Verify ownership
      if (!bookingWithDetails || typeof bookingWithDetails !== 'object' || !('car' in bookingWithDetails)) {
        throw new BookingError(
          'Failed to fetch booking details',
          BookingErrorCode.BOOKING_NOT_FOUND,
          404
        )
      }

      // Type assertion after validation
      const details = bookingWithDetails as { car: { owner_id: string } }
      if (details.car.owner_id !== ownerId) {
        throw new BookingError(
          'Only the car owner can confirm this booking',
          BookingErrorCode.UNAUTHORIZED,
          403
        )
      }

      // 3. Get booking to check status
      const booking = await this.bookingSDK.getById(bookingId)

      // 4. Verify booking is in pending state
      if (booking.status !== 'pending') {
        throw new BookingError(
          `Cannot confirm booking with status: ${booking.status}`,
          BookingErrorCode.INVALID_STATE_TRANSITION,
          400
        )
      }

      // 5. Update booking status
       
      const confirmedBooking = await this.bookingSDK.update(bookingId, {
        status: 'confirmed',
      })

      // 6. Process payment (capture hold or charge)
      // In production, this would call payment provider API
      // await this.paymentSDK.updateStatus(booking.payment_id, 'processing')

      // 7. Send notification to renter
      // await this.notificationService.send({
      //   user_id: booking.renter_id,
      //   type: 'booking_confirmed',
      //   data: { booking_id: bookingId }
      // })

       
      return confirmedBooking
    } catch (error) {
      if (error instanceof BookingError) {throw error}
      throw toError(error)
    }
  }

  /**
   * Cancel booking
   * Applies cancellation policy and processes refunds
   */
  async cancelBooking(input: CancelBookingInput): Promise<BookingDTO> {
    try {
      // 1. Get booking
      const booking = await this.bookingSDK.getById(input.booking_id)

      // 2. Verify permissions
      await this.verifyBookingPermissions(booking, input.user_id, 'renter')

      // 3. Verify booking can be cancelled
      if (booking.status === 'active' || booking.status === 'completed') {
        throw new BookingError(
          `Cannot cancel booking with status: ${booking.status}`,
          BookingErrorCode.INVALID_STATE_TRANSITION,
          400
        )
      }

      if (booking.status === 'cancelled') {
        throw new BookingError(
          'Booking is already cancelled',
          BookingErrorCode.INVALID_STATE_TRANSITION,
          400
        )
      }

      // 4. Calculate refund amount
      const refundAmount = this.calculateRefundAmount(booking, 'renter')

      // 5. Update booking status
       
      const cancelledBooking = await this.bookingSDK.update(input.booking_id, {
        status: 'cancelled',
        // cancelled_by_user_id and cancelled_at are auto-set by DB trigger
      })

      // 6. Process refund if applicable
      if (refundAmount > 0) {
        const payments = await this.paymentSDK.getByBooking(booking.id)
        const completedPayment = payments.find(p => p.status === 'succeeded')

        if (completedPayment) {
          await this.paymentSDK.requestRefund({
            booking_id: booking.id,
            payment_id: completedPayment.id,
            refund_amount_cents: refundAmount,
            refund_reason: input.cancellation_reason ?? 'Booking cancelled',
            initiated_by: input.user_id,
            refund_method: 'original_payment_method', // Refund to original payment method
          })
        }
      }

       
      return cancelledBooking
    } catch (error) {
      if (error instanceof BookingError) {throw error}
      throw toError(error)
    }
  }

  /**
   * Start booking (pickup)
   * Transitions booking from confirmed to active
   */
  async startBooking(
    bookingId: string,
    _input: StartBookingInput
  ): Promise<BookingDTO> {
    try {
      // 1. Get booking
      const booking = await this.bookingSDK.getById(bookingId)

      // 2. Verify booking is confirmed
      if (booking.status !== 'confirmed') {
        throw new BookingError(
          `Cannot start booking with status: ${booking.status}`,
          BookingErrorCode.INVALID_STATE_TRANSITION,
          400
        )
      }

      // 3. Update booking to in_progress

      return await this.bookingSDK.update(bookingId, {
        status: 'in_progress',
        // actual_start_at is timestamp (not date string)
        // actual_start_date is renamed to actual_start_at in DB
      })
    } catch (error) {
      if (error instanceof BookingError) {throw error}
      throw toError(error)
    }
  }

  /**
   * Complete booking (dropoff)
   * Finalizes booking and distributes payment
   */
  async completeBooking(
    bookingId: string,
    _input: CompleteBookingInput
  ): Promise<BookingDTO> {
    try {
      // 1. Get booking
      const booking = await this.bookingSDK.getById(bookingId)

      // 2. Verify booking is active
      if (booking.status !== 'active') {
        throw new BookingError(
          `Cannot complete booking with status: ${booking.status}`,
          BookingErrorCode.INVALID_STATE_TRANSITION,
          400
        )
      }

      // 3. Calculate additional charges (if any)
      // TODO: Uncomment when payment splitting is implemented
      // let totalAmount = booking.total_price_cents + input.additional_charges_cents
      //
      // // Check for late return charges
      // const expectedEndDate = new Date(booking.end_date)
      // const actualEndDate = new Date(input.actual_end_date)
      // if (actualEndDate > expectedEndDate) {
      //   const lateDays = Math.ceil(
      //     (actualEndDate.getTime() - expectedEndDate.getTime()) / (1000 * 60 * 60 * 24)
      //   )
      //
      //   const car = await this.carSDK.getById(booking.car_id)
      //   const lateCharge = lateDays * car.price_per_day_cents * 1.5 // 1.5x late fee
      //   totalAmount += lateCharge
      // }

      // 4. Update booking to completed

      const completedBooking = await this.bookingSDK.update(bookingId, {
        status: 'completed',
        // actual_end_at and completed_at are auto-set by DB trigger
        // final_odometer_km would need to be set via different endpoint if needed
      })

      // 5. Process final payment and distribute
      // In production, this would split payment between owner, platform, insurance
      // await this.splitPayment(booking, totalAmount)

      // 6. Update statistics
      // await this.updateBookingStats(booking)

      // 7. Enable reviews
      // await this.enableReviews(booking)

       
      return completedBooking
    } catch (error) {
      if (error instanceof BookingError) {throw error}
      throw toError(error)
    }
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  /**
   * Check if car is available for given dates
   */
  private async checkCarAvailability(
    carId: string,
    startDate: string,
    endDate: string
  ): Promise<boolean> {
    try {
      return await this.bookingSDK.checkAvailability({
        car_id: carId,
        start_date: startDate,
        end_date: endDate,
      })
    } catch {
      throw new BookingError(
        'Failed to check car availability',
        BookingErrorCode.VALIDATION_ERROR,
        500
      )
    }
  }

  /**
   * Calculate number of rental days
   */
  private calculateRentalDays(startDate: string, endDate: string): number {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(diffDays, 1) // Minimum 1 day
  }

  /**
   * Calculate refund amount based on cancellation policy
   */
  private calculateRefundAmount(
    booking: BookingDTO,
    cancelledBy: 'renter' | 'owner' | 'admin'
  ): number {
    const totalPrice = booking.total_price_cents
    const startDate = new Date(booking.start_date)
    const now = new Date()
    const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60)

    // If cancelled by owner or admin, full refund
    if (cancelledBy === 'owner' || cancelledBy === 'admin') {
      return totalPrice
    }

    // Apply cancellation policy
    switch (booking.cancel_policy) {
      case 'flexible':
        // Full refund if cancelled 24h before
        return hoursUntilStart >= 24 ? totalPrice : 0

      case 'moderate':
        // Full refund if 5 days before, 50% if 2 days before
        if (hoursUntilStart >= 120) {return totalPrice}
        if (hoursUntilStart >= 48) {return Math.floor(totalPrice * 0.5)}
        return 0

      case 'strict':
        // Full refund if 7 days before
        return hoursUntilStart >= 168 ? totalPrice : 0

      default:
        return 0
    }
  }

  /**
   * Verify user has permission to perform action on booking
   */
  private async verifyBookingPermissions(
    booking: BookingDTO,
    userId: string,
    actionBy: 'renter' | 'owner' | 'admin'
  ): Promise<void> {
    try {
      // Renter can only cancel their own bookings
      if (actionBy === 'renter' && booking.renter_id !== userId) {
        throw new BookingError(
          'You can only cancel your own bookings',
          BookingErrorCode.UNAUTHORIZED,
          403
        )
      }

      // Owner can cancel bookings for their cars
      if (actionBy === 'owner') {
        const car = await this.carSDK.getById(booking.car_id)
        if (car.owner_id !== userId) {
          throw new BookingError(
            'You can only cancel bookings for your own cars',
            BookingErrorCode.UNAUTHORIZED,
            403
          )
        }
      }

      // Admin can cancel any booking (no additional check needed)
    } catch (error) {
      if (error instanceof BookingError) {throw error}
      throw toError(error)
    }
  }

}

// Singleton instance
export const bookingService = new BookingService()
