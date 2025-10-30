/* eslint-disable @typescript-eslint/no-unnecessary-condition -- SDK defensive programming pattern */
/**
 * Booking SDK
 * Handles all booking-related operations
 */

import {
  type BookingDTO,
  BookingSearchFiltersSchema,
  CalculateBookingPriceInputSchema,
  CancelBookingInputSchema,
  CompleteBookingInputSchema,
  ConfirmBookingInputSchema,
  type CancelBookingInput,
  CheckAvailabilityInputSchema,
  type CheckAvailabilityInput,
  type CompleteBookingInput,
  type ConfirmBookingInput,
  CreateBookingInputSchema,
  type CreateBookingInput,
  type PaginatedResponse,
  parseBooking,
  type UpdateBookingInput,
  UpdateBookingInputSchema,
  type CalculateBookingPriceInput,
  type BookingSearchFilters,
} from '@/types'

import { toError } from '../errors'
import { supabase } from '../supabase'

import { BaseSDK } from './base.sdk'

export class BookingSDK extends BaseSDK {
  /**
   * Get booking by ID
   */
  async getById(id: string): Promise<BookingDTO> {
    try {
      const { data, error } = await this.supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        throw toError(error)
      }

      if (!data) {
        throw new Error('Booking not found')
      }

      return parseBooking(data)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Get booking with related data (car, renter, owner)
   *
   * Note: This method returns extended data with joins, which don't fit
   * the standard BookingDTO. Consider creating a BookingWithDetailsDTO in the future.
   */
  async getByIdWithDetails(id: string): Promise<unknown> {
    const { data, error } = await this.supabase
      .from('bookings')
      .select(`
        *,
        car:cars!car_id (
          id,
          brand,
          model,
          year,
          photo_main_url,
          location_city,
          owner_id
        ),
        renter:profiles!renter_id (
          id,
          full_name,
          avatar_url,
          rating_avg
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      throw toError(error)
    }

    if (!data) {
      throw new Error('Booking not found')
    }

    return data
  }

  /**
   * Create a new booking
   */
  async create(input: CreateBookingInput): Promise<BookingDTO> {
    try {
      // Validate input
      const validData = CreateBookingInputSchema.parse(input)

      // Check car availability first
      const isAvailable = await this.checkAvailability({
        car_id: validData.car_id,
        start_date: validData.start_date,
        end_date: validData.end_date,
      })

      if (!isAvailable) {
        throw new Error('Car is not available for the selected dates')
      }

      const { data, error} = await this.supabase
        .from('bookings')
        .insert(validData as never) // Type assertion needed due to complex DB types
        .select()
        .single()

      if (error) {
        throw toError(error)
      }

      if (!data) {
        throw new Error('Failed to create booking')
      }

      return parseBooking(data)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Update booking
   */
  async update(id: string, input: UpdateBookingInput): Promise<BookingDTO> {
    // Validate input
    const validData = UpdateBookingInputSchema.parse(input)

    const { data, error } = await this.supabase
      .from('bookings')
      .update(validData as never) // Type assertion needed due to complex DB types
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw toError(error)
    }

    if (!data) {
      throw new Error('Failed to update booking')
    }

    return parseBooking(data)
  }

  /**
   * Cancel booking
   */
  async cancel(input: CancelBookingInput): Promise<BookingDTO> {
    // Validate input
    const validData = CancelBookingInputSchema.parse(input)

    // Calculate refund based on cancellation policy
    const booking = await this.getById(validData.booking_id)
    const refundAmount = this.calculateRefundAmount(booking, validData.cancelled_by)

    return this.execute(async () => {
      return await this.supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancelled_by: validData.cancelled_by,
          cancellation_reason: validData.cancellation_reason,
          refund_amount_cents: refundAmount,
        })
        .eq('id', validData.booking_id)
        .select()
        .single()
    })
  }

  /**
   * Confirm booking (owner action)
   */
  async confirm(input: ConfirmBookingInput): Promise<BookingDTO> {
    // Validate input
    const validData = ConfirmBookingInputSchema.parse(input)

    // Verify the user is the owner
    const booking = await this.getByIdWithDetails(validData.booking_id) as { car: { owner_id: string } }
    if (booking.car.owner_id !== validData.owner_id) {
      throw new Error('Only the car owner can confirm this booking')
    }

    return this.execute(async () => {
      return await this.supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', validData.booking_id)
        .select()
        .single()
    })
  }

  /**
   * Start booking (pickup)
   */
  async start(bookingId: string): Promise<BookingDTO> {
    return this.execute(async () => {
      return await this.supabase
        .from('bookings')
        .update({
          status: 'in_progress',
          actual_start_date: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .select()
        .single()
    })
  }

  /**
   * Complete booking (dropoff)
   */
  async complete(input: CompleteBookingInput): Promise<BookingDTO> {
    // Validate input
    const validData = CompleteBookingInputSchema.parse(input)

    return this.execute(async () => {
      return await this.supabase
        .from('bookings')
        .update({
          status: 'completed',
          actual_end_date: validData.actual_end_date,
          final_odometer_km: validData.final_odometer_km,
        })
        .eq('id', validData.booking_id)
        .select()
        .single()
    })
  }

  /**
   * Search bookings with filters
   */
  async search(filters: BookingSearchFilters): Promise<PaginatedResponse<BookingDTO>> {
    // Validate filters
    const validFilters = BookingSearchFiltersSchema.parse(filters)

    let query = this.supabase
      .from('bookings')
      .select('*', { count: 'exact' })

    // Apply filters
    if (validFilters.renter_id) {
      query = query.eq('renter_id', validFilters.renter_id)
    }

    if (validFilters.car_id) {
      query = query.eq('car_id', validFilters.car_id)
    }

    if (validFilters.status) {
      query = query.eq('status', validFilters.status)
    }

    if (validFilters.statuses && validFilters.statuses.length > 0) {
      query = query.in('status', validFilters.statuses)
    }

    if (validFilters.start_date_from) {
      query = query.gte('start_date', validFilters.start_date_from)
    }

    if (validFilters.start_date_to) {
      query = query.lte('start_date', validFilters.start_date_to)
    }

    if (validFilters.end_date_from) {
      query = query.gte('end_date', validFilters.end_date_from)
    }

    if (validFilters.end_date_to) {
      query = query.lte('end_date', validFilters.end_date_to)
    }

    if (validFilters.min_price_cents) {
      query = query.gte('total_price_cents', validFilters.min_price_cents)
    }

    if (validFilters.max_price_cents) {
      query = query.lte('total_price_cents', validFilters.max_price_cents)
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
      this.handleError(error, 'Booking search failed')
    }

    return this.createPaginatedResponse(
      (data ?? []) as unknown as BookingDTO[],
      count,
      validFilters.page,
      validFilters.pageSize
    )
  }

  /**
   * Get bookings for current user (as renter)
   */
  async getMyBookings(): Promise<BookingDTO[]> {
    const { data: { user } } = await this.supabase.auth.getUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    const { data, error } = await this.supabase
      .from('bookings')
      .select('*')
      .eq('renter_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      this.handleError(error, 'Failed to fetch user bookings')
    }

    return (data ?? []) as unknown as BookingDTO[]
  }

  /**
   * Get bookings for owner's cars
   */
  async getOwnerBookings(ownerId: string): Promise<BookingDTO[]> {
    const { data, error } = await this.supabase
      .from('bookings')
      .select(`
        *,
        car:cars!car_id (id, brand, model)
      `)
      .eq('cars.owner_id', ownerId)
      .order('created_at', { ascending: false })

    if (error) {
      this.handleError(error, 'Failed to fetch owner bookings')
    }

    return (data ?? []) as unknown as BookingDTO[]
  }

  /**
   * Check car availability
   */
  async checkAvailability(input: CheckAvailabilityInput): Promise<boolean> {
    // Validate input
    const validData = CheckAvailabilityInputSchema.parse(input)

    const { data, error } = await this.supabase.rpc('check_car_availability', {
      p_car_id: validData.car_id,
      p_start_date: validData.start_date,
      p_end_date: validData.end_date,
    })

    if (error) {
      this.handleError(error, 'Availability check failed')
    }

    return data || false
  }

  /**
   * Calculate booking price
   */
  async calculatePrice(input: CalculateBookingPriceInput): Promise<unknown> {
    // Validate input
    const validData = CalculateBookingPriceInputSchema.parse(input)

    const { data, error } = await this.supabase.rpc('calculate_dynamic_price', {
      p_car_id: validData.car_id,
      p_start_date: validData.start_date,
      p_end_date: validData.end_date,
      p_insurance_coverage: validData.insurance_coverage_level ?? 'none',
      p_extra_drivers: validData.extra_driver_count,
      p_extra_child_seats: validData.extra_child_seat_count,
      p_extra_gps: validData.extra_gps,
      p_promo_code: validData.promo_code,
    } as never)

    if (error) {
      this.handleError(error, 'Price calculation failed')
    }

    return data
  }

  /**
   * Calculate refund amount based on cancellation policy
   */
  private calculateRefundAmount(
    booking: BookingDTO,
    cancelledBy: 'renter' | 'owner' | 'admin'
  ): number {
    const totalPrice = booking.total_price_cents
    const startDate = booking.start_date
    const cancelPolicy = booking.cancel_policy

    // If cancelled by owner or admin, full refund
    if (cancelledBy === 'owner' || cancelledBy === 'admin') {
      return totalPrice
    }

    // Calculate time until booking
    const now = new Date()
    const bookingStartDate = new Date(startDate)
    const hoursUntilStart = (bookingStartDate.getTime() - now.getTime()) / (1000 * 60 * 60)

    // Apply cancellation policy
    switch (cancelPolicy) {
      case 'flexible':
        // Full refund if cancelled 24h before
        return hoursUntilStart >= 24 ? totalPrice : 0

      case 'moderate':
        // Full refund if 5 days before, 50% if 2 days before
        if (hoursUntilStart >= 120) {return totalPrice}
        if (hoursUntilStart >= 48) {return Math.floor(totalPrice * 0.5)}
        return 0

      case 'strict':
        // Full refund if 7 days before, no refund otherwise
        return hoursUntilStart >= 168 ? totalPrice : 0

      default:
        return 0
    }
  }
}

// Singleton instance
export const bookingSDK = new BookingSDK(supabase)
/* eslint-enable @typescript-eslint/no-unnecessary-condition -- Re-enable after SDK file */
