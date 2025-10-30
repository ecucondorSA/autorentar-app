/**
 * Car Compatibility Layer
 *
 * Maps between DTO types (used in the app) and real DB types.
 *
 * DTO uses: brand (string), model (string)
 * DB requires: brand_id, brand_text_backup, model_id, model_text_backup, fuel, title, transmission, price_per_day
 */

import type { Database } from '@/types/supabase.generated'

type CarsTable = Database['public']['Tables']['cars']
export type CarInsertDB = CarsTable['Insert']
export type CarUpdateDB = CarsTable['Update']

/**
 * DTO type (what the app uses)
 * Note: Fuel types are normalized to DB enum values: 'gasoline'→'nafta', 'diesel'→'gasoil', etc.
 */
export interface CarDTO {
  owner_id?: string | undefined  // Can be undefined from UpdateCarInput (z.never().optional())
  brand?: string | undefined
  model?: string | undefined
  year?: number | undefined
  // Fuel type mapping: gasoline→nafta, diesel→gasoil, electric→electrico, hybrid→hibrido
  fuel_type?: 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'nafta' | 'gasoil' | 'electrico' | 'hibrido' | undefined
  transmission?: 'manual' | 'automatic' | undefined
  price_per_day?: number | undefined // DB stores as numeric (not cents)
  location_city?: string | undefined
  location_country?: string | undefined
  status?: 'draft' | 'active' | 'suspended' | 'maintenance' | undefined
  description?: string | undefined
  seats?: number | undefined
  doors?: number | undefined
  color?: string | undefined
  features?: Record<string, unknown> | undefined
  photo_urls?: string[] | undefined
  location_lat?: number | undefined
  location_lng?: number | undefined
  location_formatted_address?: string | undefined
  // Add other optional fields as needed
}

/**
 * Normalize fuel type from app enum to DB enum
 * App uses: gasoline, diesel, electric, hybrid
 * DB expects: nafta, gasoil, electrico, hibrido
 */
function normalizeFuelType(fuelType: string | undefined): 'nafta' | 'gasoil' | 'electrico' | 'hibrido' {
  const fuelMap: Record<string, 'nafta' | 'gasoil' | 'electrico' | 'hibrido'> = {
    'gasoline': 'nafta',
    'diesel': 'gasoil',
    'electric': 'electrico',
    'hybrid': 'hibrido',
  }
  return fuelMap[fuelType ?? ''] ?? 'nafta' // Default to nafta if not found or undefined
}

/**
 * Type-safe insert input (requires all mandatory fields)
 * Matches CreateCarInputSchema field types exactly
 */
interface CarInsertInput {
  owner_id: string
  brand: string
  model: string
  year: number
  fuel_type: string
  transmission: 'manual' | 'automatic'
  price_per_day: number
  location_city: string
  location_country: string
  status?: 'draft' | 'active' | 'suspended' | 'maintenance'
  description?: string | undefined
  seats?: number
  doors?: number
  color?: string
  features?: Record<string, unknown>
  photo_urls?: string[] | undefined
  location_lat?: number
  location_lng?: number
  location_formatted_address?: string
}

/**
 * Convert Insert Input to DB Insert type
 *
 * TODO: Replace 'unknown' brand_id/model_id with lookups to car_brands/car_models tables
 * For now using 'unknown' as placeholder until brand/model management is implemented
 */
export function toDBCarInsert(input: CarInsertInput): CarInsertDB {
  // Generate title from brand, model, year
  const title = `${input.brand} ${input.model} ${input.year}`

  return {
    owner_id: input.owner_id,
    // TODO: Lookup in car_brands table by name
    brand_id: 'unknown',                 // ← Placeholder, needs brand lookup
    brand_text_backup: input.brand,      // ← Store original text
    brand: input.brand,
    // TODO: Lookup in car_models table by name
    model_id: 'unknown',                 // ← Placeholder, needs model lookup
    model_text_backup: input.model,      // ← Store original text
    model: input.model,
    year: input.year,
    fuel: normalizeFuelType(input.fuel_type),
    transmission: input.transmission,
    price_per_day: input.price_per_day, // ← Mapped directly (numeric field)
    title,
    status: input.status ?? ('draft' as Database['public']['Enums']['car_status']),
    description: input.description ?? null,
    seats: input.seats ?? null,
    doors: input.doors ?? null,
    color: input.color ?? null,
    features: (input.features ?? {}) as unknown as Database['public']['Tables']['cars']['Row']['features'],
    location_city: input.location_city,
    location_country: input.location_country,
    location_lat: input.location_lat ?? null,
    location_lng: input.location_lng ?? null,
    location_formatted_address: input.location_formatted_address ?? null,
    currency: 'ARS', // Default currency for Argentina
  }
}

/**
 * Convert DTO to DB Update type (all fields optional)
 */
export function toDBCarUpdate(dto: Partial<CarDTO>): CarUpdateDB {
  const update: CarUpdateDB = {}

  if (dto.brand) {
    update.brand = dto.brand
    update.brand_text_backup = dto.brand
    // TODO: Lookup brand_id from car_brands table
  }
  if (dto.model) {
    update.model = dto.model
    update.model_text_backup = dto.model
    // TODO: Lookup model_id from car_models table
  }
  if (dto.year !== undefined) {update.year = dto.year}
  if (dto.fuel_type) {
    update.fuel = normalizeFuelType(dto.fuel_type)
  }
  if (dto.transmission) {update.transmission = dto.transmission}
  if (dto.price_per_day !== undefined) {
    update.price_per_day = dto.price_per_day
  }
  if (dto.status) {update.status = dto.status}
  if (dto.description !== undefined) {update.description = dto.description}
  if (dto.seats !== undefined) {update.seats = dto.seats}
  if (dto.doors !== undefined) {update.doors = dto.doors}
  if (dto.color !== undefined) {update.color = dto.color}
  if (dto.features) {update.features = dto.features as unknown as Database['public']['Tables']['cars']['Row']['features']}
  if (dto.location_city !== undefined) {update.location_city = dto.location_city}
  if (dto.location_country !== undefined) {update.location_country = dto.location_country}
  if (dto.location_lat !== undefined) {update.location_lat = dto.location_lat}
  if (dto.location_lng !== undefined) {update.location_lng = dto.location_lng}
  if (dto.location_formatted_address !== undefined) {
    update.location_formatted_address = dto.location_formatted_address
  }

  // Regenerate title if brand, model, or year changed
  if (dto.brand || dto.model || dto.year) {
    const brand = dto.brand ?? '[Brand]'
    const model = dto.model ?? '[Model]'
    const year = dto.year ?? new Date().getFullYear()
    update.title = `${brand} ${model} ${year}`
  }

  return update
}
