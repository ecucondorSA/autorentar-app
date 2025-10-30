/* eslint-disable @typescript-eslint/no-unnecessary-condition, eslint-comments/disable-enable-pair -- Service layer: Defensive programming for business logic safety */
/**
 * SearchService
 * Business logic layer for search operations
 *
 * Responsibilities:
 * - Full-text search across cars
 * - Advanced filtering (location, price, dates, features)
 * - Autocomplete suggestions
 * - Search analytics and popular searches
 */

import { carSDK, type CarSDK } from '@/lib/sdk/car.sdk'
import type { CarDTO } from '@/types'

import { toError } from '../lib/errors'

// ============================================
// SEARCH SERVICE TYPES
// ============================================

export interface SearchFilters {
  // Location filters
  location?: {
    lat: number
    lng: number
    radius: number // in km
  }

  // Price filters
  priceRange?: {
    min: number // in cents
    max: number // in cents
  }

  // Date availability
  dates?: {
    start: string // ISO 8601
    end: string // ISO 8601
  }

  // Car features
  features?: {
    transmission?: 'manual' | 'automatic'
    fuel_type?: 'nafta' | 'gasoil' | 'hibrido' | 'electrico'
    seats?: number
    doors?: number
  }

  // Only instant book cars (feature not yet implemented in DB)
  // instant_book?: boolean

  // Sort by
  sortBy?:
    | 'price_asc'
    | 'price_desc'
    | 'rating_desc'
    | 'distance_asc'
    | 'year_desc'

  // Pagination
  limit?: number
  offset?: number
}

export interface SearchResult {
  cars: CarDTO[]
  total: number
  has_more: boolean
}

// ============================================
// SEARCH SERVICE ERRORS
// ============================================

export enum SearchErrorCode {
  INVALID_QUERY = 'INVALID_QUERY',
  INVALID_LOCATION = 'INVALID_LOCATION',
  INVALID_DATE_RANGE = 'INVALID_DATE_RANGE',
  SEARCH_FAILED = 'SEARCH_FAILED',
}

export class SearchError extends Error {
  constructor(
    message: string,
    public code: SearchErrorCode,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'SearchError'
    Object.setPrototypeOf(this, SearchError.prototype)
  }
}

// ============================================
// SEARCH SERVICE
// ============================================

// Fuel type mapping: Spanish (filter) to English (DB)
const FUEL_TYPE_MAP: Record<string, string> = {
  nafta: 'gasoline',
  gasoil: 'diesel',
  hibrido: 'hybrid',
  electrico: 'electric',
}

export class SearchService {
  constructor(private readonly carSDK: CarSDK) {}

  /**
   * Full-text search for cars
   */
  async searchCars(query: string): Promise<CarDTO[]> {
    try {
      if (!query || query.trim().length < 2) {
        throw new SearchError(
          'Search query must be at least 2 characters',
          SearchErrorCode.INVALID_QUERY,
          400
        )
      }

      // Search in make, model, and location fields
      const response = await this.carSDK.search({
        status: 'active',
        radius: 50, // Default 50km radius
        sortBy: 'price_asc',
        page: 1,
        pageSize: 100,
      })

      const cars = response.data

      // Filter by query (simple client-side search)
      // TODO: Implement full-text search in database
      const filtered = cars.filter((car) => {
        const searchText = `${car.brand} ${car.model} ${car.location_city ?? ''} ${car.location_country ?? ''}`.toLowerCase()
        return searchText.includes(query.toLowerCase())
      })

      return filtered
    } catch (error) {
      if (error instanceof SearchError) {
        throw error
      }
      throw toError(error)
    }
  }

  /**
   * Advanced search with filters
   */
  async searchWithFilters(filters: SearchFilters): Promise<SearchResult> {
    try {
      let cars: CarDTO[] = []

      // 1. Location-based search
      if (filters.location) {
        const { lat, lng, radius } = filters.location

        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          throw new SearchError(
            'Invalid location coordinates',
            SearchErrorCode.INVALID_LOCATION,
            400
          )
        }

        // Use search with location parameters
        const response = await this.carSDK.search({
          status: 'active',
          radius,
          sortBy: filters.sortBy ?? 'distance_asc',
          page: 1,
          pageSize: 100,
          // TODO: Add lat/lng parameters when SDK supports it
        })
        cars = response.data
      } else {
        // Get all active cars
        const response = await this.carSDK.search({
          status: 'active',
          radius: 50,
          sortBy: filters.sortBy ?? 'price_asc',
          page: 1,
          pageSize: 100,
        })
        cars = response.data
      }

      // 2. Date availability filter
      if (filters.dates) {
        const { start, end } = filters.dates

        // Validate dates
        const startDate = new Date(start)
        const endDate = new Date(end)

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new SearchError(
            'Invalid date format',
            SearchErrorCode.INVALID_DATE_RANGE,
            400
          )
        }

        if (endDate <= startDate) {
          throw new SearchError(
            'End date must be after start date',
            SearchErrorCode.INVALID_DATE_RANGE,
            400
          )
        }

        // TODO: Implement date availability check when getAvailable() method is added to SDK
        // For now, we skip date filtering
        // const availableCars = await this.carSDK.getAvailable(start, end)
        // const availableIds = new Set(availableCars.map((c) => c.id))
        // cars = cars.filter((car) => availableIds.has(car.id))
      }

      // 3. Price range filter
      if (filters.priceRange) {
        const { min, max } = filters.priceRange
        cars = cars.filter(
          (car) =>
            car.price_per_day_cents >= min && car.price_per_day_cents <= max
        )
      }

      // 4. Features filter
      if (filters.features) {
        if (filters.features.transmission) {
          cars = cars.filter(
            (car) => car.transmission === filters.features?.transmission
          )
        }

        if (filters.features.fuel_type) {
          // Map Spanish fuel type to English DB enum
          const dbFuelType = FUEL_TYPE_MAP[filters.features.fuel_type]
          if (dbFuelType) {
            cars = cars.filter((car) => car.fuel_type === dbFuelType)
          }
        }

        if (filters.features.seats) {
          cars = cars.filter((car) => (car.seats ?? 0) >= (filters.features?.seats ?? 0))
        }

        if (filters.features.doors) {
          cars = cars.filter((car) => (car.doors ?? 0) >= (filters.features?.doors ?? 0))
        }
      }

      // 5. Instant book filter
      // TODO: Feature not yet implemented in DB schema
      // if (filters.instant_book) {
      //   cars = cars.filter((car) => car.instant_book)
      // }

      // 6. Sort results
      const sortedCars = this.sortCars(cars, filters.sortBy)

      // 7. Pagination
      const limit = filters.limit ?? 20
      const offset = filters.offset ?? 0
      const paginatedCars = sortedCars.slice(offset, offset + limit)

      return {
        cars: paginatedCars,
        total: sortedCars.length,
        has_more: offset + limit < sortedCars.length,
      }
    } catch (error) {
      if (error instanceof SearchError) {
        throw error
      }
      throw toError(error)
    }
  }

  /**
   * Autocomplete suggestions
   */
  async autocomplete(query: string): Promise<string[]> {
    try {
      if (!query || query.trim().length < 2) {
        return []
      }

      const response = await this.carSDK.search({
        status: 'active',
        radius: 50,
        sortBy: 'price_asc',
        page: 1,
        pageSize: 100,
      })

      const cars = response.data

      // Extract unique suggestions
      const suggestions = new Set<string>()

      cars.forEach((car) => {
        const queryLower = query.toLowerCase()

        // Add brand suggestions
        if (car.brand?.toLowerCase().includes(queryLower)) {
          suggestions.add(car.brand)
        }

        // Add model suggestions
        if (car.model?.toLowerCase().includes(queryLower)) {
          suggestions.add(`${car.brand} ${car.model}`)
        }

        // Add location suggestions
        if (car.location_city?.toLowerCase().includes(queryLower)) {
          suggestions.add(car.location_city)
        }
      })

      return Array.from(suggestions).slice(0, 10)
    } catch (error) {
      throw toError(error)
    }
  }

  /**
   * Get popular searches
   */
  getPopularSearches(): string[] {
    // TODO: Track search queries and return most popular
    // For now, return hardcoded popular searches
    return [
      'Toyota Corolla',
      'Honda Civic',
      'Volkswagen Gol',
      'Ford Focus',
      'Chevrolet Cruze',
      'Automatic',
      'Electric',
      'Buenos Aires',
      'Córdoba',
      'Rosario',
    ]
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  /**
   * Sort cars by specified criteria
   */
  private sortCars(cars: CarDTO[], sortBy?: string): CarDTO[] {
    const sorted = [...cars]

    switch (sortBy) {
      case 'price_asc':
        return sorted.sort(
          (a, b) => a.price_per_day_cents - b.price_per_day_cents
        )

      case 'price_desc':
        return sorted.sort(
          (a, b) => b.price_per_day_cents - a.price_per_day_cents
        )

      case 'rating_desc':
        return sorted.sort(
          (a, b) => (b.rating_avg ?? 0) - (a.rating_avg ?? 0)
        )

      case 'year_desc':
        return sorted.sort(
          (a, b) => b.year - a.year
        )

      case 'distance_asc':
        // TODO: Implement distance sorting
        // Requires storing user location and using calculateDistance()
        return sorted

      default:
        return sorted
    }
  }

  // Commented out: unused function (will be needed for distance_asc sorting)
  // /**
  //  * Calculate distance between two coordinates (Haversine formula)
  //  */
  // private calculateDistance(
  //   lat1: number,
  //   lng1: number,
  //   lat2: number,
  //   lng2: number
  // ): number {
  //   const R = 6371 // Earth radius in km
  //   const dLat = this.toRadians(lat2 - lat1)
  //   const dLng = this.toRadians(lng2 - lng1)
  //
  //   const a =
  //     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
  //     Math.cos(this.toRadians(lat1)) *
  //       Math.cos(this.toRadians(lat2)) *
  //       Math.sin(dLng / 2) *
  //       Math.sin(dLng / 2)
  //
  //   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  //   return R * c
  // }
  //
  // private toRadians(degrees: number): number {
  //   return degrees * (Math.PI / 180)
  // }
}

// Singleton instance
export const searchService = new SearchService(carSDK)
