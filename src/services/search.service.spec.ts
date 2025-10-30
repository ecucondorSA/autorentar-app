/**
 * SearchService Tests (Feature Horizontal)
 * Tests completos para búsqueda de autos con filtros avanzados
 *
 * Validaciones de negocio:
 * - Full-text search (brand, model, location)
 * - Filtering avanzado (precio, features, fechas)
 * - Sorting y paginación
 * - Autocomplete suggestions
 * - Validación de parámetros
 */

import type { CarSDK } from '@/lib/sdk/car.sdk'
import type { CarDTO } from '@/types'

import {
  SearchError,
  SearchErrorCode,
  SearchService,
  type SearchFilters,
} from './search.service'

describe('SearchService (Feature Horizontal)', () => {
  let service: SearchService
  let mockCarSDK: jasmine.SpyObj<CarSDK>

  // Mock car data
  const mockCars: CarDTO[] = [
    {
      id: 'car-1',
      owner_id: 'user-1',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2023,
      fuel_type: 'gasoline',
      transmission: 'automatic',
      price_per_day: 5000,
      price_per_day_cents: 500000,
      location_city: 'Buenos Aires',
      location_country: 'Argentina',
      status: 'active',
      rating_avg: 4.8,
      rating_count: 12,
      seats: 5,
      doors: 4,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      photo_main_url: 'https://example.com/car1.jpg',
    } as CarDTO,
    {
      id: 'car-2',
      owner_id: 'user-2',
      brand: 'Honda',
      model: 'Civic',
      year: 2022,
      fuel_type: 'diesel',
      transmission: 'manual',
      price_per_day: 4500,
      price_per_day_cents: 450000,
      location_city: 'Córdoba',
      location_country: 'Argentina',
      status: 'active',
      rating_avg: 4.5,
      rating_count: 8,
      seats: 5,
      doors: 4,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      photo_main_url: 'https://example.com/car2.jpg',
    } as CarDTO,
    {
      id: 'car-3',
      owner_id: 'user-3',
      brand: 'Volkswagen',
      model: 'Gol',
      year: 2024,
      fuel_type: 'electric',
      transmission: 'automatic',
      price_per_day: 6000,
      price_per_day_cents: 600000,
      location_city: 'Buenos Aires',
      location_country: 'Argentina',
      status: 'active',
      rating_avg: 4.9,
      rating_count: 15,
      seats: 5,
      doors: 4,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      photo_main_url: 'https://example.com/car3.jpg',
    } as CarDTO,
  ]

  beforeEach(() => {
    // Create CarSDK mock
    mockCarSDK = jasmine.createSpyObj<CarSDK>('CarSDK', ['search'])

    // Setup default return value
    mockCarSDK.search.and.returnValue(
      Promise.resolve({
        data: mockCars,
        count: mockCars.length,
        page: 1,
        pageSize: 100,
        hasMore: false,
      })
    )

    service = new SearchService(mockCarSDK)
  })

  // ============================================
  // SEARCH CARS TESTS
  // ============================================

  describe('searchCars()', () => {
    it('should search cars by brand successfully', async () => {
      // Act
      const result = await service.searchCars('Toyota')

      // Assert
      expect(result.length).toBe(1)
      expect(result.some((car) => car.brand === 'Toyota')).toBe(true)
    })

    it('should search cars by model successfully', async () => {
      // Act
      const result = await service.searchCars('Civic')

      // Assert
      expect(result.length).toBe(1)
      expect(result.some((car) => car.model === 'Civic')).toBe(true)
    })

    it('should search cars by location', async () => {
      // Act
      const result = await service.searchCars('Córdoba')

      // Assert
      expect(result.length).toBe(1)
      expect(result.some((car) => car.location_city === 'Córdoba')).toBe(true)
    })

    it('should be case-insensitive', async () => {
      // Act
      const result = await service.searchCars('toyota')

      // Assert
      expect(result.length).toBe(1)
      expect(result.some((car) => car.brand === 'Toyota')).toBe(true)
    })

    it('should throw error when query is less than 2 characters', async () => {
      // Act & Assert
      await expectAsync(service.searchCars('T')).toBeRejectedWithError(
        SearchError,
        'Search query must be at least 2 characters'
      )
    })

    it('should throw error when query is empty', async () => {
      // Act & Assert
      await expectAsync(service.searchCars('')).toBeRejectedWithError(
        SearchError,
        'Search query must be at least 2 characters'
      )
    })

    it('should return empty array when no matches found', async () => {
      // Act
      const result = await service.searchCars('Porsche')

      // Assert
      expect(result).toEqual([])
    })
  })

  // ============================================
  // SEARCH WITH FILTERS TESTS
  // ============================================

  describe('searchWithFilters()', () => {
    it('should search with price range filter', async () => {
      // Arrange
      const filters: SearchFilters = {
        priceRange: {
          min: 450000,
          max: 550000, // 4500-5500 ARS per day
        },
      }

      // Act
      const result = await service.searchWithFilters(filters)

      // Assert
      expect(result.cars.length).toBe(2)
      expect(result.cars.every((car) => car.price_per_day_cents >= 450000 && car.price_per_day_cents <= 550000)).toBe(true)
    })

    it('should search with transmission filter', async () => {
      // Arrange
      const filters: SearchFilters = {
        features: {
          transmission: 'automatic',
        },
      }

      // Act
      const result = await service.searchWithFilters(filters)

      // Assert
      expect(result.cars.length).toBe(2)
      expect(result.cars.every((car) => car.transmission === 'automatic')).toBe(
        true
      )
    })

    it('should search with fuel type filter', async () => {
      // Arrange
      const filters: SearchFilters = {
        features: {
          fuel_type: 'electrico',
        },
      }

      // Act
      const result = await service.searchWithFilters(filters)

      // Assert
      expect(result.cars.length).toBe(1)
      expect(result.cars.every((car) => car.fuel_type === 'electric')).toBe(true)
    })

    it('should search with seats filter (minimum seats)', async () => {
      // Arrange
      const filters: SearchFilters = {
        features: {
          seats: 5,
        },
      }

      // Act
      const result = await service.searchWithFilters(filters)

      // Assert
      expect(result.cars.length).toBe(3)
      expect(result.cars.every((car) => car.seats >= 5)).toBe(true)
    })

    it('should sort results by price ascending', async () => {
      // Arrange
      const filters: SearchFilters = {
        sortBy: 'price_asc',
      }

      // Act
      const result = await service.searchWithFilters(filters)

      // Assert
      expect(result.cars.length).toBe(3)
      expect(result.cars.map((car) => car.id)).toEqual(['car-2', 'car-1', 'car-3'])
    })

    it('should sort results by price descending', async () => {
      // Arrange
      const filters: SearchFilters = {
        sortBy: 'price_desc',
      }

      // Act
      const result = await service.searchWithFilters(filters)

      // Assert
      expect(result.cars.length).toBe(3)
      expect(result.cars.map((car) => car.id)).toEqual(['car-3', 'car-1', 'car-2'])
    })

    it('should sort results by rating descending', async () => {
      // Arrange
      const filters: SearchFilters = {
        sortBy: 'rating_desc',
      }

      // Act
      const result = await service.searchWithFilters(filters)

      // Assert
      expect(result.cars.length).toBe(3)
      expect(result.cars.map((car) => car.id)).toEqual(['car-3', 'car-1', 'car-2'])
    })

    it('should handle pagination with limit and offset', async () => {
      // Arrange
      const filters: SearchFilters = {
        limit: 2,
        offset: 1,
      }

      // Act
      const result = await service.searchWithFilters(filters)

      // Assert
      expect(result.cars.length).toBe(2)
      expect(result.cars.map((car) => car.id)).toEqual(['car-2', 'car-3'])
      expect(result.has_more).toBe(false)
    })

    it('should return correct has_more flag', async () => {
      // Arrange
      const filters: SearchFilters = {
        limit: 2,
        offset: 0,
      }

      // Act
      const result = await service.searchWithFilters(filters)

      // Assert
      expect(result.has_more).toBe(true)
      expect(result.total).toBe(3)
    })

    it('should combine multiple filters', async () => {
      // Arrange
      const filters: SearchFilters = {
        priceRange: {
          min: 400000,
          max: 550000,
        },
        features: {
          transmission: 'automatic',
        },
      }

      // Act
      const result = await service.searchWithFilters(filters)

      // Assert
      expect(result.cars.length).toBe(1)
      expect(result.cars.some((car) => car.id === 'car-1')).toBe(true)
    })

    it('should validate date range - throw error on invalid dates', async () => {
      // Arrange
      const filters: SearchFilters = {
        dates: {
          start: 'invalid-date',
          end: '2025-12-31',
        },
      }

      // Act & Assert
      await expectAsync(service.searchWithFilters(filters)).toBeRejectedWithError(
        SearchError,
        'Invalid date format'
      )
    })

    it('should validate date range - throw error when end date <= start date', async () => {
      // Arrange
      const filters: SearchFilters = {
        dates: {
          start: '2025-12-31',
          end: '2025-12-31',
        },
      }

      // Act & Assert
      await expectAsync(service.searchWithFilters(filters)).toBeRejectedWithError(
        SearchError,
        'End date must be after start date'
      )
    })

    it('should validate location - throw error on invalid coordinates', async () => {
      // Arrange
      const filters: SearchFilters = {
        location: {
          lat: 95, // Invalid: > 90
          lng: 0,
          radius: 50,
        },
      }

      // Act & Assert
      await expectAsync(service.searchWithFilters(filters)).toBeRejectedWithError(
        SearchError,
        'Invalid location coordinates'
      )
    })
  })

  // ============================================
  // AUTOCOMPLETE TESTS
  // ============================================

  describe('autocomplete()', () => {
    it('should suggest car brands', async () => {
      // Act
      const result = await service.autocomplete('Toy')

      // Assert
      expect(result).toContain('Toyota')
    })

    it('should suggest full car models', async () => {
      // Act
      const result = await service.autocomplete('Ci')

      // Assert
      expect(result).toContain('Honda Civic')
    })

    it('should suggest locations', async () => {
      // Act
      const result = await service.autocomplete('Bue')

      // Assert
      expect(result).toContain('Buenos Aires')
    })

    it('should be case-insensitive', async () => {
      // Act
      const result = await service.autocomplete('toyota')

      // Assert
      expect(result).toContain('Toyota')
    })

    it('should return unique suggestions', async () => {
      // Act
      const result = await service.autocomplete('a')

      // Assert
      expect(new Set(result).size).toBe(result.length)
    })

    it('should limit suggestions to 10', async () => {
      // Act
      const result = await service.autocomplete('a')

      // Assert
      expect(result.length).toBeLessThanOrEqual(10)
    })

    it('should return empty array for query < 2 characters', async () => {
      // Act
      const result = await service.autocomplete('T')

      // Assert
      expect(result).toEqual([])
    })

    it('should return empty array for empty query', async () => {
      // Act
      const result = await service.autocomplete('')

      // Assert
      expect(result).toEqual([])
    })

    it('should return empty array when no matches found', async () => {
      // Act
      const result = await service.autocomplete('ZZZ')

      // Assert
      expect(result).toEqual([])
    })
  })

  // ============================================
  // POPULAR SEARCHES TESTS
  // ============================================

  describe('getPopularSearches()', () => {
    it('should return popular searches', () => {
      // Act
      const result = service.getPopularSearches()

      // Assert
      expect(result).toContain('Toyota Corolla')
      expect(result).toContain('Honda Civic')
      expect(result).toContain('Buenos Aires')
    })

    it('should return array of strings', () => {
      // Act
      const result = service.getPopularSearches()

      // Assert
      expect(Array.isArray(result)).toBe(true)
      expect(result.every((s) => typeof s === 'string')).toBe(true)
    })
  })

  // ============================================
  // ERROR HANDLING TESTS
  // ============================================

  describe('Error handling', () => {
    it('should propagate SDK errors during search', async () => {
      // Arrange
      mockCarSDK.search.and.returnValue(Promise.reject(new Error('SDK Error')))

      // Act & Assert
      await expectAsync(service.searchCars('Toyota')).toBeRejected()
    })

    it('should propagate SDK errors during filtered search', async () => {
      // Arrange
      mockCarSDK.search.and.returnValue(Promise.reject(new Error('SDK Error')))

      // Act & Assert
      await expectAsync(
        service.searchWithFilters({ priceRange: { min: 0, max: 1000000 } })
      ).toBeRejected()
    })

    it('should create SearchError with correct code', async () => {
      // Act
      try {
        await service.searchCars('A')
        fail('Should have thrown')
      } catch (error) {
        // Assert
        expect(error).toBeInstanceOf(SearchError)
        expect((error as SearchError).code).toBe(SearchErrorCode.INVALID_QUERY)
      }
    })
  })

  // ============================================
  // EDGE CASES TESTS
  // ============================================

  describe('Edge cases', () => {
    it('should handle empty search results', async () => {
      // Arrange
      mockCarSDK.search.and.returnValue(
        Promise.resolve({
          data: [],
          count: 0,
          page: 1,
          pageSize: 100,
          hasMore: false,
        })
      )

      // Act
      const result = await service.searchCars('Nonexistent')

      // Assert
      expect(result).toEqual([])
    })

    it('should handle very long search query', async () => {
      // Arrange
      const longQuery = 'A'.repeat(1000)

      // Act
      const result = await service.searchCars(longQuery)

      // Assert
      expect(result).toEqual([])
    })

    it('should handle special characters in search', async () => {
      // Act
      const result = await service.searchCars('Toy@ta')

      // Assert
      expect(result).toEqual([])
    })

    it('should handle null location city', async () => {
      // Arrange
      const carsWithNullCity: CarDTO[] = [
        { ...mockCars[0], location_city: null } as CarDTO,
      ]
      mockCarSDK.search.and.returnValue(
        Promise.resolve({
          data: carsWithNullCity,
          count: 1,
          page: 1,
          pageSize: 100,
          hasMore: false,
        })
      )

      // Act
      const result = await service.searchCars('test')

      // Assert
      expect(result.length).toBe(1)
    })

    it('should handle zero offset', async () => {
      // Arrange
      const filters: SearchFilters = {
        limit: 10,
        offset: 0,
      }

      // Act
      const result = await service.searchWithFilters(filters)

      // Assert
      expect(result.cars.length).toBeGreaterThan(0)
    })

    it('should handle offset greater than total items', async () => {
      // Arrange
      const filters: SearchFilters = {
        limit: 10,
        offset: 100,
      }

      // Act
      const result = await service.searchWithFilters(filters)

      // Assert
      expect(result.cars).toEqual([])
      expect(result.has_more).toBe(false)
    })

    it('should handle filter with zero price', async () => {
      // Arrange
      const filters: SearchFilters = {
        priceRange: {
          min: 0,
          max: 1000000,
        },
      }

      // Act
      const result = await service.searchWithFilters(filters)

      // Assert
      expect(result.cars.length).toBeGreaterThan(0)
    })
  })
})
