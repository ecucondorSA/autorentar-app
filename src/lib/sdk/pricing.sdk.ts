/**
 * Pricing SDK
 * Handles dynamic pricing calculations
 */

import {
  CalculatePricingSchema,
  ValidatePromoCodeSchema,
  PricingConstants,
  type CalculatePricing,
  type ValidatePromoCode,
  type PricingCalculationResponse,
} from '@/types'

import { supabase } from '../supabase'

import { BaseSDK } from './base.sdk'

export class PricingSDK extends BaseSDK {
  /**
   * Calculate booking price with all factors
   */
  async calculate(input: CalculatePricing): Promise<PricingCalculationResponse> {
    // Validate input
    const validData = CalculatePricingSchema.parse(input)

    // Get car details if not provided
    const { data: car } = await this.supabase
      .from('cars')
      .select('price_per_day')
      .eq('id', validData.car_id)
      .single()

    if (!car) {
      throw new Error('Car not found')
    }

    const basePricePerDay = validData.base_price_per_day_cents ?? car.price_per_day
    const rentalDays = validData.rental_days

    // Base calculation
    const baseSubtotal = basePricePerDay * rentalDays

    // Calculate multipliers
    const multipliers = {
      region_multiplier: await this.getRegionMultiplier(validData.region_id),
      demand_multiplier: await this.getDemandMultiplier(validData.start_date, validData.end_date),
      seasonality_multiplier: this.getSeasonalityMultiplier(validData.start_date),
      duration_discount: this.getDurationDiscount(rentalDays),
    }

    // Apply multipliers
    let subtotal = baseSubtotal
    subtotal *= multipliers.region_multiplier
    subtotal *= multipliers.demand_multiplier
    subtotal *= multipliers.seasonality_multiplier
    subtotal *= multipliers.duration_discount

    // Calculate discounts
    const discounts = {
      duration_discount_cents: Math.floor(baseSubtotal - (baseSubtotal * multipliers.duration_discount)),
      promo_discount_cents: 0,
      early_bird_discount_cents: 0,
      total_discounts_cents: 0,
    }

    // Early bird discount
    const daysUntilBooking = this.getDaysUntil(validData.start_date)
    if (daysUntilBooking >= 30) {
      discounts.early_bird_discount_cents = Math.floor(subtotal * (PricingConstants.EARLY_BIRD_DISCOUNT / 100))
    }

    // Promo code
    if (validData.promo_code) {
      const promoDiscount = await this.validatePromoCode({
        promo_code: validData.promo_code,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- user_id validated by CalculatePriceInputSchema
        user_id: validData.user_id!,
        car_id: validData.car_id,
        booking_total_cents: Math.floor(subtotal),
        booking_start: validData.start_date,
      })
      discounts.promo_discount_cents = promoDiscount
    }

    discounts.total_discounts_cents =
      discounts.duration_discount_cents +
      discounts.promo_discount_cents +
      discounts.early_bird_discount_cents

    // Calculate addons
    const addons = {
      insurance_cents: this.getInsuranceCost(validData.insurance_coverage_level, rentalDays),
      extra_drivers_cents: validData.extra_driver_count * PricingConstants.EXTRA_DRIVER_PER_DAY_CENTS * rentalDays,
      extra_equipment_cents: this.getExtraEquipmentCost(validData, rentalDays),
      total_addons_cents: 0,
    }

    addons.total_addons_cents =
      addons.insurance_cents + addons.extra_drivers_cents + addons.extra_equipment_cents

    // Apply override multiplier if present
    if (validData.override_multiplier) {
      subtotal *= validData.override_multiplier
    }

    // Calculate fees
    const serviceFee = Math.floor(subtotal * (PricingConstants.DEFAULT_SERVICE_FEE_PERCENTAGE / 100))
    const tax = Math.floor(subtotal * (PricingConstants.DEFAULT_TAX_PERCENTAGE / 100))

    // Total
    const totalCents = Math.floor(subtotal - discounts.total_discounts_cents + addons.total_addons_cents + serviceFee + tax)

    // Create breakdown
    const breakdown = [
      { label: `Alquiler base (${rentalDays} días)`, amount_cents: baseSubtotal, is_discount: false },
      ...(multipliers.region_multiplier !== 1.0 ? [{ label: 'Ajuste regional', amount_cents: Math.floor(baseSubtotal * (multipliers.region_multiplier - 1)), is_discount: false }] : []),
      ...(multipliers.demand_multiplier !== 1.0 ? [{ label: 'Ajuste por demanda', amount_cents: Math.floor(baseSubtotal * (multipliers.demand_multiplier - 1)), is_discount: false }] : []),
      ...(discounts.duration_discount_cents > 0 ? [{ label: 'Descuento por duración', amount_cents: discounts.duration_discount_cents, is_discount: true }] : []),
      ...(discounts.early_bird_discount_cents > 0 ? [{ label: 'Descuento early bird', amount_cents: discounts.early_bird_discount_cents, is_discount: true }] : []),
      ...(discounts.promo_discount_cents > 0 ? [{ label: 'Descuento promocional', amount_cents: discounts.promo_discount_cents, is_discount: true }] : []),
      ...(addons.insurance_cents > 0 ? [{ label: 'Seguro', amount_cents: addons.insurance_cents, is_discount: false }] : []),
      ...(addons.extra_drivers_cents > 0 ? [{ label: 'Conductores adicionales', amount_cents: addons.extra_drivers_cents, is_discount: false }] : []),
      ...(addons.extra_equipment_cents > 0 ? [{ label: 'Equipamiento extra', amount_cents: addons.extra_equipment_cents, is_discount: false }] : []),
      { label: 'Comisión de servicio', amount_cents: serviceFee, is_discount: false },
      { label: 'IVA', amount_cents: tax, is_discount: false },
    ]

    return {
      calculation_id: crypto.randomUUID(),
      base_price_cents: basePricePerDay,
      rental_days: rentalDays,
      base_subtotal_cents: baseSubtotal,
      multipliers,
      discounts,
      addons,
      service_fee_cents: serviceFee,
      tax_cents: tax,
      subtotal_cents: Math.floor(subtotal),
      total_cents: totalCents,
      breakdown,
      calculated_at: new Date().toISOString(),
      valid_until: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
    }
  }

  /**
   * Validate promo code
   */
  async validatePromoCode(input: ValidatePromoCode): Promise<number> {
    // Validate input
    const validData = ValidatePromoCodeSchema.parse(input)

    const { data: promo, error } = await this.supabase
      .from('promos')
      .select('*')
      .eq('code', validData.promo_code)
      .eq('is_active', true)
      .gte('valid_until', new Date().toISOString())
      .single()

    if (error ?? !promo) {
      return 0 // Invalid promo
    }

    // Check if user already used it
    const { count } = await this.supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('renter_id', validData.user_id)
      .eq('promo_code', validData.promo_code)

    if (count && count >= (promo.max_uses_per_user ?? 1)) {
      return 0 // Already used
    }

    // Calculate discount
    if (promo.discount_type === 'percentage') {
      return Math.floor(validData.booking_total_cents * (promo.discount_value / 100))
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- promo.discount_value from DB type, TODO: create PromoCodeDTO
      return Math.min(promo.discount_value, validData.booking_total_cents)
    }
  }

  // Helper methods

  private async getRegionMultiplier(regionId?: string): Promise<number> {
    if (!regionId) {return 1.0}

    const { data } = await this.supabase
      .from('pricing_regions')
      .select('base_multiplier')
      .eq('id', regionId)
      .single()

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- data.base_multiplier from DB type, TODO: create PricingRegionDTO
    return data?.base_multiplier ?? 1.0
  }

  private getDemandMultiplier(startDate: string, _endDate: string): Promise<number> {
    // Simple implementation - would be more complex in production
    const start = new Date(startDate)
    const dayOfWeek = start.getDay()

    // Weekend booking
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      return 1.2
    }

    return 1.0
  }

  private getSeasonalityMultiplier(startDate: string): number {
    const date = new Date(startDate)
    const month = date.getMonth() + 1

    // High season: Jan, Feb, Jul, Dec
    if ([1, 2, 7, 12].includes(month)) {
      return 1.2
    }

    // Low season: Mar, Apr, May, Aug, Sep, Oct
    return 0.9
  }

  private getDurationDiscount(days: number): number {
    if (days >= PricingConstants.MONTHLY_RENTAL_MIN_DAYS) {
      return 1 - PricingConstants.MONTHLY_DISCOUNT / 100
    }

    if (days >= PricingConstants.WEEKLY_RENTAL_MIN_DAYS) {
      return 1 - PricingConstants.WEEKLY_DISCOUNT / 100
    }

    return 1.0
  }

  private getInsuranceCost(level: string, days: number): number {
    switch (level) {
      case 'basic':
        return PricingConstants.BASIC_INSURANCE_PER_DAY_CENTS * days
      case 'standard':
        return PricingConstants.STANDARD_INSURANCE_PER_DAY_CENTS * days
      case 'premium':
        return PricingConstants.PREMIUM_INSURANCE_PER_DAY_CENTS * days
      default:
        return 0
    }
  }

  private getExtraEquipmentCost(input: CalculatePricing, days: number): number {
    let cost = 0

    if (input.extra_child_seat_count) {
      cost += input.extra_child_seat_count * PricingConstants.CHILD_SEAT_PER_DAY_CENTS * days
    }

    if (input.extra_gps) {
      cost += PricingConstants.GPS_PER_DAY_CENTS * days
    }

    if (input.extra_wifi) {
      cost += PricingConstants.WIFI_PER_DAY_CENTS * days
    }

    return cost
  }

  private getDaysUntil(dateStr: string): number {
    const target = new Date(dateStr)
    const now = new Date()
    const diff = target.getTime() - now.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }
}

// Singleton instance
export const pricingSDK = new PricingSDK(supabase)
