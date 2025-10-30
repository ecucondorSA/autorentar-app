/* eslint-disable @typescript-eslint/no-unnecessary-condition -- SDK defensive programming pattern */
/**
 * Car SDK
 * Handles all car-related operations
 */

import {
  CreateCarInputSchema,
  UpdateCarInputSchema,
  CarSearchFiltersSchema,
  ActivateCarSchema,
  SearchCarsNearbySchema,
  type CarDTO,
  type CreateCarInput,
  type UpdateCarInput,
  type CarSearchFilters,
  type SearchCarsNearby,
  type PaginatedResponse,
  parseCar,
} from '@/types'

import { toError } from '../errors'
import { supabase } from '../supabase'

import { BaseSDK } from './base.sdk'

export class CarSDK extends BaseSDK {
  /**
   * Get car by ID
   */
  async getById(id: string): Promise<CarDTO> {
    try {
      const { data, error } = await this.supabase
        .from('cars')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {throw toError(error)}
      if (!data) {throw new Error('Car not found')}

      return parseCar(data)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Get car with owner details
   *
   * Note: Returns extended data with joins, which don't fit the standard CarDTO.
   * Consider creating a CarWithOwnerDTO in the future.
   */
  async getByIdWithOwner(id: string): Promise<unknown> {
    try {
      const { data, error } = await this.supabase
        .from('cars')
        .select(`
          *,
          owner:profiles!owner_id (
            id,
            full_name,
            avatar_url,
            rating_avg,
            total_bookings_as_owner
          )
        `)
        .eq('id', id)
        .single()

      if (error) {throw toError(error)}
      if (!data) {throw new Error('Car not found')}

      return data
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Create a new car
   */
  async create(input: CreateCarInput): Promise<CarDTO> {
    try {
      // Validate input
      const validData = CreateCarInputSchema.parse(input)

      const { data, error } = await this.supabase
        .from('cars')
        .insert(validData as never)
        .select()
        .single()

      if (error) {throw toError(error)}
      if (!data) {throw new Error('Failed to create car')}

      return parseCar(data)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Update car
   */
  async update(id: string, input: UpdateCarInput): Promise<CarDTO> {
    try {
      // Validate input
      const validData = UpdateCarInputSchema.parse(input)

      const { data, error } = await this.supabase
        .from('cars')
        .update(validData as never)
        .eq('id', id)
        .select()
        .single()

      if (error) {throw toError(error)}
      if (!data) {throw new Error('Failed to update car')}

      return parseCar(data)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Activate car (publish)
   * Validates that car meets requirements
   */
  async activate(id: string): Promise<CarDTO> {
    try {
      // Get current car data
      const car = await this.getById(id)

      // Validate activation requirements
      ActivateCarSchema.parse({ ...car, status: 'active' })

      const { data, error } = await this.supabase
        .from('cars')
        .update({ status: 'active' })
        .eq('id', id)
        .select()
        .single()

      if (error) {throw toError(error)}
      if (!data) {throw new Error('Failed to activate car')}

      return parseCar(data)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Deactivate car
   */
  async deactivate(id: string): Promise<CarDTO> {
    try {
      const { data, error } = await this.supabase
        .from('cars')
        .update({ status: 'suspended' })
        .eq('id', id)
        .select()
        .single()

      if (error) {throw toError(error)}
      if (!data) {throw new Error('Failed to deactivate car')}

      return parseCar(data)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Delete car (soft delete by setting status)
   */
  async delete(id: string): Promise<void> {
    await this.deactivate(id)
  }

  /**
   * Search cars with filters
   */
  async search(filters: CarSearchFilters): Promise<PaginatedResponse<CarDTO>> {
    try {
      // Validate filters
      const validFilters = CarSearchFiltersSchema.parse(filters)

      let query = this.supabase
        .from('cars')
        .select('*', { count: 'exact' })

      // Apply filters
      if (validFilters.city) {
        query = query.eq('location_city', validFilters.city)
      }

      if (validFilters.minPrice) {
        query = query.gte('price_per_day', validFilters.minPrice)
      }

      if (validFilters.maxPrice) {
        query = query.lte('price_per_day', validFilters.maxPrice)
      }

      if (validFilters.transmission) {
        query = query.eq('transmission', validFilters.transmission)
      }

      if (validFilters.fuelType) {
        query = query.eq('fuel_type', validFilters.fuelType)
      }

      if (validFilters.minSeats) {
        query = query.gte('seats', validFilters.minSeats)
      }

      if (validFilters.minYear) {
        query = query.gte('year', validFilters.minYear)
      }

      if (validFilters.hasGPS) {
        query = query.eq('has_gps', true)
      }

      if (validFilters.hasBluetooth) {
        query = query.eq('has_bluetooth', true)
      }

      if (validFilters.hasBackupCamera) {
        query = query.eq('has_backup_camera', true)
      }

      if (validFilters.hasAC) {
        query = query.eq('has_ac', true)
      }

      if (validFilters.instantBookOnly) {
        query = query.eq('instant_book', true)
      }

      if (validFilters.cancelPolicy) {
        query = query.eq('cancel_policy', validFilters.cancelPolicy)
      }

      if (validFilters.status) {
        query = query.eq('status', validFilters.status)
      } else {
        // Default to active cars only
        query = query.eq('status', 'active')
      }

      // Sorting
      switch (validFilters.sortBy) {
        case 'price_asc':
          query = query.order('price_per_day', { ascending: true })
          break
        case 'price_desc':
          query = query.order('price_per_day', { ascending: false })
          break
        case 'year_desc':
          query = query.order('year', { ascending: false })
          break
        case 'rating_desc':
          query = query.order('rating_avg', { ascending: false, nullsFirst: false })
          break
        case 'distance_asc':
          // Distance sorting handled by geospatial query
          query = query.order('created_at', { ascending: false })
          break
      }

      // Pagination
      const from = (validFilters.page - 1) * validFilters.pageSize
      const to = from + validFilters.pageSize - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {throw toError(error)}

      // Validate and parse all results
      // Filter out cars with null price_per_day_cents (incomplete data)
      const validatedData = (data ?? [])
        .map(parseCar)
        .filter(car => car.price_per_day_cents !== null)

      return this.createPaginatedResponse(
        validatedData,
        count,
        validFilters.page,
        validFilters.pageSize
      )
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Search cars nearby using PostGIS
   */
  async searchNearby(input: SearchCarsNearby): Promise<CarDTO[]> {
    try {
      // Validate input
      const validData = SearchCarsNearbySchema.parse(input)

      const { data, error } = await this.supabase.rpc('search_cars_nearby' as never, {
        user_lat: validData.user_lat,
        user_lng: validData.user_lng,
        radius: validData.radius,
        min_price: validData.min_price,
        max_price: validData.max_price,
        min_seats: validData.min_seats,
        transmission: validData.transmission,
        instant_book_only: validData.instant_book_only,
      } as never)

      if (error) {throw toError(error)}

      // Validate and parse all results
      const results = data as unknown[]
      return results.map(parseCar)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Get cars by owner
   */
  async getByOwner(ownerId: string): Promise<CarDTO[]> {
    try {
      const { data, error } = await this.supabase
        .from('cars')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false })

      if (error) {throw toError(error)}

      // Validate and parse all results
      return (data ?? []).map(parseCar)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Get car photos
   *
   * Note: Returns car_photos table data. Consider creating CarPhotoDTO in the future.
   */
  async getPhotos(carId: string): Promise<unknown[]> {
    try {
      const { data, error } = await this.supabase
        .from('car_photos')
        .select('*')
        .eq('car_id', carId)
        .order('sort_order', { ascending: true })

      if (error) {throw toError(error)}

      return data ?? []
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Upload car photo
   */
  async uploadPhoto(carId: string, photoUrl: string, isMain: boolean = false): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('car_photos')
        .insert({
          car_id: carId,
          url: photoUrl,
        } as never)
        .select()
        .single()

      if (error) {throw toError(error)}

      // If this is the main photo, update car
      if (isMain) {
        await this.update(carId, { photo_main_url: photoUrl })
      }
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Get car stats
   *
   * Note: Returns car_stats table data. Consider creating CarStatsDTO in the future.
   */
  async getStats(carId: string): Promise<unknown> {
    try {
      const { data, error } = await this.supabase
        .from('car_stats')
        .select('*')
        .eq('car_id', carId)
        .single()

      if (error) {
        // Stats might not exist yet - return default
        return {
          car_id: carId,
          total_bookings: 0,
          total_revenue_cents: 0,
          rating_avg: 0,
          total_reviews: 0,
        }
      }

      return data
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Check car availability for dates
   */
  async checkAvailability(
    carId: string,
    startDate: string,
    endDate: string
  ): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc('check_car_availability', {
        p_car_id: carId,
        p_start_date: startDate,
        p_end_date: endDate,
      })

      if (error) {throw toError(error)}

      return data ?? false
    } catch (e) {
      throw toError(e)
    }
  }
}

// Singleton instance
export const carSDK = new CarSDK(supabase)
/* eslint-enable @typescript-eslint/no-unnecessary-condition -- Re-enable after SDK file */
