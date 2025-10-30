/**
 * Zod Schemas para Car (Autos)
 * Validación runtime para inputs, updates y filtros
 */

import { z } from 'zod'

// ============================================
// ENUMS
// ============================================

export const CarStatusEnum = z.enum(['draft', 'active', 'suspended', 'maintenance'])
export const TransmissionEnum = z.enum(['manual', 'automatic'])
export const FuelTypeEnum = z.enum(['gasoline', 'diesel', 'electric', 'hybrid'])
export const CancelPolicyEnum = z.enum(['flex', 'moderate', 'strict'])

// ============================================
// CAR LOCATION VALIDATION
// ============================================

// const _LocationSchema = z.object({
//   lat: z.number().min(-90).max(90),
//   lng: z.number().min(-180).max(180),
// })

// ============================================
// CREATE CAR INPUT
// ============================================

/**
 * Schema para crear un auto nuevo
 * Usado en formularios de publicación
 */
export const CreateCarInputSchema = z.object({
  // Owner (requerido)
  owner_id: z.string().uuid('ID de propietario inválido'),

  // Basic Info (requerido)
  brand: z.string().min(2, 'Marca muy corta').max(50, 'Marca muy larga'),
  model: z.string().min(2, 'Modelo muy corto').max(50, 'Modelo muy largo'),
  year: z
    .number()
    .int('Año debe ser entero')
    .min(1980, 'Año muy antiguo')
    .max(new Date().getFullYear() + 1, 'Año muy futuro'),

  // Description
  description: z
    .string()
    .min(50, 'Descripción muy corta (mínimo 50 caracteres)')
    .max(2000, 'Descripción muy larga (máximo 2000 caracteres)')
    .optional(),

  // Pricing (requerido)
  price_per_day: z.number().positive('Precio debe ser positivo').min(1000, 'Precio mínimo: $1000'),

  // Vehicle Details
  seats: z.number().int().min(2).max(12).default(5),
  doors: z.number().int().min(2).max(6).default(4),
  transmission: TransmissionEnum,
  fuel_type: FuelTypeEnum,

  // Mileage
  odometer_km: z.number().int().min(0, 'Kilometraje no puede ser negativo').optional(),
  max_km_per_booking: z.number().int().min(50).max(5000).optional(),

  // Location (requerido)
  location_lat: z.number().min(-90).max(90),
  location_lng: z.number().min(-180).max(180),
  location_address: z.string().min(10).max(200),
  location_city: z.string().min(2).max(100),
  location_state: z.string().min(2).max(100).optional(),
  location_country: z.string().length(2, 'Código país debe ser ISO 2 letras').default('AR'),

  // Photos (opcional en creación, requerido antes de activar)
  photo_main_url: z.string().url('URL de foto inválida').optional(),
  photo_urls: z.array(z.string().url()).max(20, 'Máximo 20 fotos').optional(),

  // Features (opcional)
  has_gps: z.boolean().default(false),
  has_bluetooth: z.boolean().default(false),
  has_backup_camera: z.boolean().default(false),
  has_usb: z.boolean().default(false),
  has_aux: z.boolean().default(false),
  has_ac: z.boolean().default(false),

  // Policies
  instant_book: z.boolean().default(false),
  cancel_policy: CancelPolicyEnum.default('moderate'),

  // Status
  status: CarStatusEnum.default('draft'),

  // Minimum rental days
  min_rental_days: z.number().int().min(1).max(30).default(1),
  max_rental_days: z.number().int().min(1).max(180).default(30),
})

export type CreateCarInput = z.infer<typeof CreateCarInputSchema>

// ============================================
// UPDATE CAR INPUT
// ============================================

/**
 * Schema para actualizar un auto existente
 * Todos los campos son opcionales
 */
export const UpdateCarInputSchema = CreateCarInputSchema.partial().extend({
  // No se permite cambiar owner_id
  owner_id: z.never().optional(),
})

export type UpdateCarInput = z.infer<typeof UpdateCarInputSchema>

// ============================================
// CAR SEARCH FILTERS
// ============================================

/**
 * Schema para filtros de búsqueda de autos
 */
export const CarSearchFiltersSchema = z.object({
  // Location-based search
  city: z.string().min(2).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  radius: z.number().min(100).max(50000).default(5000), // metros

  // Price range
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),

  // Vehicle specs
  transmission: TransmissionEnum.optional(),
  fuelType: FuelTypeEnum.optional(),
  minSeats: z.number().int().min(2).max(12).optional(),
  minYear: z.number().int().min(1980).optional(),

  // Features
  hasGPS: z.boolean().optional(),
  hasBluetooth: z.boolean().optional(),
  hasBackupCamera: z.boolean().optional(),
  hasAC: z.boolean().optional(),

  // Policies
  instantBookOnly: z.boolean().optional(),
  cancelPolicy: CancelPolicyEnum.optional(),

  // Status
  status: CarStatusEnum.optional(),

  // Sorting
  sortBy: z
    .enum(['price_asc', 'price_desc', 'year_desc', 'rating_desc', 'distance_asc'])
    .default('distance_asc'),

  // Pagination
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
})

export type CarSearchFilters = z.infer<typeof CarSearchFiltersSchema>

// ============================================
// ACTIVATE CAR VALIDATION
// ============================================

/**
 * Schema para validar que un auto está listo para ser activado
 * Requiere campos que son opcionales en creación
 */
export const ActivateCarSchema = z.object({
  id: z.string().uuid(),
  brand: z.string().min(2),
  model: z.string().min(2),
  year: z.number().int().min(1980),
  description: z.string().min(50),
  price_per_day: z.number().positive().min(1000),
  location_lat: z.number(),
  location_lng: z.number(),
  location_address: z.string().min(10),
  location_city: z.string().min(2),
  photo_main_url: z.string().url('Foto principal requerida para activar'),
  photo_urls: z.array(z.string().url()).min(3, 'Mínimo 3 fotos para activar'),
  status: z.literal('active'),
})

export type ActivateCar = z.infer<typeof ActivateCarSchema>

// ============================================
// NEARBY SEARCH INPUT
// ============================================

/**
 * Schema para búsqueda geoespacial (RPC search_cars_nearby)
 */
export const SearchCarsNearbySchema = z.object({
  user_lat: z.number().min(-90).max(90),
  user_lng: z.number().min(-180).max(180),
  radius: z.number().min(100).max(50000).default(5000), // metros
  min_price: z.number().positive().optional(),
  max_price: z.number().positive().optional(),
  min_seats: z.number().int().min(2).optional(),
  transmission: TransmissionEnum.optional(),
  instant_book_only: z.boolean().default(false),
})

export type SearchCarsNearby = z.infer<typeof SearchCarsNearbySchema>
