/**
 * Type Helpers para facilitar el uso de Database Types
 * Auto-generado desde la base de datos de producción
 */

import type { Database } from './database.types'

// ============================================
// HELPERS GENÉRICOS
// ============================================

/**
 * Extrae el tipo Row de una tabla
 * @example type Car = Tables<'cars'>
 */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

/**
 * Extrae el tipo Insert de una tabla
 * @example type CarInsert = TablesInsert<'cars'>
 */
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

/**
 * Extrae el tipo Update de una tabla
 * @example type CarUpdate = TablesUpdate<'cars'>
 */
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

/**
 * Extrae el tipo de una función RPC
 * @example type CreateReviewFn = Functions<'create_review'>
 */
export type Functions<T extends keyof Database['public']['Functions']> =
  Database['public']['Functions'][T]

/**
 * Extrae el tipo de un enum
 * @example type CarStatus = Enums<'car_status'>
 */
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]

// ============================================
// TYPES ESPECÍFICOS - CORE
// ============================================

// Profiles (Usuarios)
export type Profile = Tables<'profiles'>
export type ProfileInsert = TablesInsert<'profiles'>
export type ProfileUpdate = TablesUpdate<'profiles'>

// Cars (Autos)
export type Car = Tables<'cars'>
export type CarInsert = TablesInsert<'cars'>
export type CarUpdate = TablesUpdate<'cars'>

// Bookings (Reservas)
export type Booking = Tables<'bookings'>
export type BookingInsert = TablesInsert<'bookings'>
export type BookingUpdate = TablesUpdate<'bookings'>

// Wallets (Billeteras)
export type UserWallet = Tables<'user_wallets'>
export type WalletTransaction = Tables<'wallet_transactions'>
export type WalletLedger = Tables<'wallet_ledger'>

// Payments (Pagos)
export type Payment = Tables<'payments'>
export type PaymentSplit = Tables<'payment_splits'>
export type PaymentIntent = Tables<'payment_intents'>

// ============================================
// TYPES ESPECÍFICOS - FEATURES
// ============================================

// Reviews (Reseñas)
export type Review = Tables<'reviews'>
export type UserStats = Tables<'user_stats'>
export type CarStats = Tables<'car_stats'>

// Insurance (Seguros)
export type InsurancePolicy = Tables<'insurance_policies'>
export type InsuranceClaim = Tables<'insurance_claims'>
export type InsuranceAddon = Tables<'insurance_addons'>

// Pricing (Precios)
export type PricingRegion = Tables<'pricing_regions'>
export type PricingCalculation = Tables<'pricing_calculations'>
export type PricingOverride = Tables<'pricing_overrides'>

// Messaging (Chat)
export type Message = Tables<'messages'>

// Documents (Documentos)
export type UserDocument = Tables<'user_documents'>
export type VehicleDocument = Tables<'vehicle_documents'>

// Tracking (Ubicación en tiempo real)
export type CarTrackingPoint = Tables<'car_tracking_points'>
export type CarTrackingSession = Tables<'car_tracking_sessions'>

// Photos (Fotos)
export type CarPhoto = Tables<'car_photos'>

// FGO (Fondo de Garantía Operativa)
export type FGOSubfund = Tables<'fgo_subfunds'>
export type FGOMovement = Tables<'fgo_movements'>
export type FGOMetric = Tables<'fgo_metrics'>

// Risk (Sistema de Riesgos)
export type BookingRiskSnapshot = Tables<'booking_risk_snapshot'>

// Disputes (Disputas)
export type Dispute = Tables<'disputes'>
export type DisputeEvidence = Tables<'dispute_evidence'>

// Inspections (Inspecciones)
export type BookingInspection = Tables<'booking_inspections'>
export type VehicleInspection = Tables<'vehicle_inspections'>

// Notifications (Notificaciones)
export type Notification = Tables<'notifications'>
export type PushToken = Tables<'push_tokens'>

// Car Metadata
export type CarBrand = Tables<'car_brands'>
export type CarModel = Tables<'car_models'>
export type CarLocation = Tables<'car_locations'>

// Promos & Fees
export type Promo = Tables<'promos'>
export type Fee = Tables<'fees'>

// Exchange Rates
export type ExchangeRate = Tables<'exchange_rates'>

// ============================================
// ENUMS
// ============================================

export type UserRole = Enums<'user_role'>
export type KYCStatus = Enums<'kyc_status'>
export type OnboardingStatus = Enums<'onboarding_status'>
export type CarStatus = Enums<'car_status'>
export type BookingStatus = Enums<'booking_status'>
export type Transmission = Enums<'transmission'>
export type FuelType = Enums<'fuel_type'>
export type CancelPolicy = Enums<'cancel_policy'>

// ============================================
// RPC FUNCTIONS (más usadas)
// ============================================

export type CreateReviewArgs = Functions<'create_review'>['Args']
export type CreateReviewReturn = Functions<'create_review'>['Returns']

// ============================================
// UTILITY TYPES
// ============================================

/**
 * Tipo para paginación
 */
export interface PaginatedResponse<T> {
  data: T[]
  count: number | null
  page: number
  pageSize: number
  hasMore: boolean
}

/**
 * Tipo para respuestas de API con error handling
 */
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string }

/**
 * Tipo para filtros de búsqueda de autos
 */
export interface CarSearchFilters {
  city?: string
  minPrice?: number
  maxPrice?: number
  transmission?: Transmission
  fuelType?: FuelType
  minSeats?: number
  status?: CarStatus
  lat?: number
  lng?: number
  radius?: number // en metros
}

/**
 * Tipo para filtros de búsqueda de bookings
 */
export interface BookingSearchFilters {
  status?: BookingStatus
  startDate?: string
  endDate?: string
  carId?: string
  renterId?: string
}

/**
 * Tipo para Car con información extendida (joins)
 */
export interface CarWithOwner extends Car {
  owner: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'rating_avg'>
}

/**
 * Tipo para Booking con información extendida
 */
export interface BookingWithDetails extends Booking {
  car: Pick<Car, 'id' | 'brand' | 'model' | 'year' | 'location_city'>
  renter: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
}

/**
 * Tipo para coordenadas geográficas
 */
export interface Coordinates {
  lat: number
  lng: number
}

/**
 * Tipo para tracking point con coordenadas parseadas
 */
export interface TrackingPointWithCoords extends Omit<CarTrackingPoint, 'location'> {
  coordinates: Coordinates
}
