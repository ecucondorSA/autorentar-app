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
        insurance_coverage_level: validInput.insurance_coverage_level ?? 'none',
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
          status: 'pending',
          provider: 'mercadopago', // Default provider
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- bookingWithDetails is unknown (joined type), needs BookingWithDetailsDTO
      if (bookingWithDetails.car.owner_id !== ownerId) {
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- bookingSDK.update returns BookingDTO but ESLint sees unsafe assignment
      const confirmedBooking = await this.bookingSDK.update(bookingId, {
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
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

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- confirmedBooking is BookingDTO from SDK
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
      await this.verifyBookingPermissions(booking, input.user_id, input.cancelled_by)

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
      const refundAmount = this.calculateRefundAmount(booking, input.cancelled_by)

      // 5. Update booking status
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- bookingSDK.update returns BookingDTO but ESLint sees unsafe assignment
      const cancelledBooking = await this.bookingSDK.update(input.booking_id, {
        status: 'cancelled',
        cancelled_by: input.cancelled_by,
        cancellation_reason: input.cancellation_reason,
        cancelled_at: new Date().toISOString(),
      })

      // 6. Process refund if applicable
      if (refundAmount > 0) {
        const payments = await this.paymentSDK.getByBooking(booking.id)
        const completedPayment = payments.find(p => p.status === 'completed')

        if (completedPayment) {
          await this.paymentSDK.requestRefund({
            payment_id: completedPayment.id,
            refund_amount_cents: refundAmount,
            refund_reason: input.cancellation_reason ?? 'Booking cancelled',
          })
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- cancelledBooking is BookingDTO from SDK
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
    input: StartBookingInput
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

      // 3. Update booking to active
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- bookingSDK.update returns BookingDTO
      return await this.bookingSDK.update(bookingId, {
        status: 'active',
        actual_start_date: input.actual_start_date,
        initial_odometer_km: input.odometer_km,
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
    input: CompleteBookingInput
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- bookingSDK.update returns BookingDTO
      const completedBooking = await this.bookingSDK.update(bookingId, {
        status: 'completed',
        actual_end_date: input.actual_end_date,
        final_odometer_km: input.final_odometer_km,
        completed_at: new Date().toISOString(),
      })

      // 5. Process final payment and distribute
      // In production, this would split payment between owner, platform, insurance
      // await this.splitPayment(booking, totalAmount)

      // 6. Update statistics
      // await this.updateBookingStats(booking)

      // 7. Enable reviews
      // await this.enableReviews(booking)

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- completedBooking is BookingDTO from SDK
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

  /**
   * Split payment between owner, platform, and insurance
   * @private
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- TODO: Implement payment splitting when PaymentSplitService is ready
  private async splitPayment(_booking: BookingDTO, _totalAmount: number): Promise<void> {
    // TODO: Implement payment splitting
    // const splits = [
    //   { recipient_id: car.owner_id, amount: totalAmount * 0.85, type: 'owner' },
    //   { recipient_id: PLATFORM_WALLET_ID, amount: totalAmount * 0.10, type: 'platform' },
    //   { recipient_id: INSURANCE_WALLET_ID, amount: totalAmount * 0.05, type: 'insurance' },
    // ]
    // await this.paymentSDK.createSplits(payment.id, splits)
  }
}

// Singleton instance
export const bookingService = new BookingService()
