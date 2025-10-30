# Backend API Reference - AutoRentar

**IMPORTANT**: Este documento es la fuente de verdad para crear el frontend. Todos los tipos, servicios y SDKs están aquí documentados para evitar errores de tipos.

**Última actualización**: 30 Octubre 2025

---

## 📋 Tabla de Contenidos

1. [DTOs (Data Transfer Objects)](#dtos)
2. [Services (Business Logic)](#services)
3. [SDKs (Data Access Layer)](#sdks)
4. [Schemas (Input Validation)](#schemas)
5. [Database Types](#database-types)
6. [Error Handling](#error-handling)
7. [Examples](#examples)

---

## 1. DTOs (Data Transfer Objects)

### BookingDTO

```typescript
import { BookingDTOSchema } from '@/types/dto'
import type { BookingDTO } from '@/types/dto'

interface BookingDTO {
  id: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'expired'
  car_id: string
  renter_id: string
  owner_id: string
  start_date: string
  end_date: string
  pickup_location: string | null
  dropoff_location: string | null
  total_cost_cents: number
  base_price_cents: number
  insurance_cost_cents: number
  extra_driver_cost_cents: number
  extra_child_seat_cost_cents: number
  extra_gps_cost_cents: number
  platform_fee_cents: number
  taxes_cents: number
  deposit_amount_cents: number
  extra_driver_count: number
  extra_child_seat_count: number
  extra_gps: boolean
  insurance_coverage_level: 'none' | 'basic' | 'standard' | 'premium' | null
  promo_code: string | null
  discount_amount_cents: number
  odometer_start: number | null
  odometer_end: number | null
  fuel_level_start: number | null
  fuel_level_end: number | null
  special_requests: string | null
  cancellation_reason: string | null
  cancelled_by: string | null
  cancelled_at: string | null
  confirmed_at: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}
```

**Nota**: No existe `extra_wifi` field - fue removido del schema.

### CarDTO

```typescript
import { CarDTOSchema } from '@/types/dto'
import type { CarDTO } from '@/types/dto'

interface CarDTO {
  id: string
  owner_id: string
  status: 'draft' | 'active' | 'suspended' | 'maintenance'
  make: string
  model: string
  year: number
  color: string | null
  license_plate: string
  vin: string | null
  price_per_day_cents: number
  price_per_week_cents: number | null
  price_per_month_cents: number | null
  region_id: string | null
  latitude: number | null
  longitude: number | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  postal_code: string | null
  transmission: string | null
  fuel_type: 'nafta' | 'gasoil' | 'hibrido' | 'electrico' | null
  seats: number | null
  doors: number | null
  description: string | null
  rules: string | null
  amenities: string[] | null
  photos: string[] | null
  insurance_included: boolean
  min_rental_days: number | null
  max_rental_days: number | null
  cancel_policy: 'flex' | 'moderate' | 'strict' | null
  instant_book: boolean
  mileage_limit_km_per_day: number | null
  extra_km_cost_cents: number | null
  cleaning_fee_cents: number | null
  security_deposit_cents: number | null
  rating_avg: number | null
  rating_count: number
  total_bookings: number
  created_at: string
  updated_at: string
}
```

### ProfileDTO

```typescript
import { ProfileDTOSchema } from '@/types/dto'
import type { ProfileDTO } from '@/types/dto'

interface ProfileDTO {
  id: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  role: 'renter' | 'owner' | 'admin'
  kyc: 'not_started' | 'pending' | 'verified' | 'rejected' | null
  onboarding: 'incomplete' | 'complete' | null
  email_verified: boolean | null
  phone_verified: boolean | null
  rating_avg: number | null
  rating_count: number | null
  created_at: string
  updated_at: string
}
```

**IMPORTANTE**:
- Campo `kyc` (no `kyc_status`)
- Campo `onboarding` (no `onboarding_status`)
- Valores de `kyc`: 'verified' (no 'approved')

### PaymentDTO

```typescript
interface PaymentDTO {
  id: string
  booking_id: string
  user_id: string
  amount_cents: number
  currency: string
  status: 'requires_payment' | 'processing' | 'succeeded' | 'failed' | 'refunded' | 'partial_refund' | 'chargeback'
  provider: 'mercadopago' | 'stripe' | 'otro' | null
  provider_payment_id: string | null
  provider_customer_id: string | null
  payment_method: string | null
  refund_amount_cents: number
  refund_reason: string | null
  failure_reason: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}
```

### WalletDTO

```typescript
interface WalletDTO {
  user_id: string
  available_balance: number
  locked_balance: number
  currency: string
  non_withdrawable_floor: number
  created_at: string
  updated_at: string
}
```

### InsurancePolicyDTO

```typescript
interface InsurancePolicyDTO {
  id: string
  booking_id: string
  coverage_level: 'basic' | 'standard' | 'premium'
  premium_cents: number
  coverage_amount_cents: number
  deductible_cents: number
  status: 'active' | 'expired' | 'cancelled'
  valid_from: string
  valid_until: string
  created_at: string
  updated_at: string
}
```

### ReviewDTO

```typescript
interface ReviewDTO {
  id: string
  booking_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number // 1-5
  comment: string | null
  review_type: 'renter_to_owner' | 'owner_to_renter' | 'renter_to_car'
  created_at: string
  updated_at: string
}
```

---

## 2. Services (Business Logic)

### BookingService

**Ubicación**: `src/services/booking.service.ts`

**Métodos**:

```typescript
import { bookingService } from '@/services/booking.service'
import type { CreateBookingInput, UpdateBookingInput } from '@/types'

// Create booking with pricing calculation
async createBooking(input: CreateBookingInput): Promise<BookingDTO>

// Confirm booking (owner action)
async confirmBooking(bookingId: string, ownerId: string): Promise<BookingDTO>

// Cancel booking with refund calculation
async cancelBooking(bookingId: string, userId: string, reason?: string): Promise<BookingDTO>

// Start booking (pickup)
async startBooking(bookingId: string, renterId: string, odometer: number, fuelLevel: number): Promise<BookingDTO>

// Complete booking (dropoff)
async completeBooking(
  bookingId: string,
  renterId: string,
  odometer: number,
  fuelLevel: number
): Promise<BookingDTO>
```

**CreateBookingInput** (USAR ESTE, NO CreateBookingServiceInput):

```typescript
interface CreateBookingInput {
  car_id: string
  renter_id: string
  start_date: string // ISO 8601
  end_date: string   // ISO 8601
  extra_driver_count: number
  extra_child_seat_count: number
  extra_gps: boolean
  insurance_coverage_level?: 'none' | 'basic' | 'standard' | 'premium'
  promo_code?: string
}
```

### PaymentService

**Ubicación**: `src/services/payment.service.ts`

```typescript
import { paymentService } from '@/services/payment.service'

// Process payment with provider
async processPayment(
  bookingId: string,
  userId: string,
  amountCents: number,
  paymentMethodId: string
): Promise<PaymentDTO>

// Process refund
async processRefund(
  paymentId: string,
  amountCents: number,
  reason?: string
): Promise<PaymentDTO>

// Handle webhook from payment provider
async handleWebhook(
  provider: 'mercadopago' | 'stripe',
  event: unknown
): Promise<void>
```

### WalletService

**Ubicación**: `src/services/wallet.service.ts`

```typescript
import { walletService } from '@/services/wallet.service'

// Credit wallet (add funds)
async creditWallet(userId: string, amountCents: number, description: string): Promise<WalletDTO>

// Debit wallet (remove funds)
async debitWallet(userId: string, amountCents: number, description: string): Promise<WalletDTO>

// Hold funds for booking
async holdFunds(userId: string, amountCents: number, bookingId: string): Promise<WalletDTO>

// Release held funds
async releaseFunds(userId: string, amountCents: number, bookingId: string): Promise<WalletDTO>

// Get balance
async getBalance(userId: string): Promise<{ available: number; locked: number; total: number }>

// Freeze wallet (admin action)
async freezeWallet(userId: string, reason: string): Promise<WalletDTO>

// Unfreeze wallet
async unfreezeWallet(userId: string): Promise<WalletDTO>
```

### ProfileService

**Ubicación**: `src/services/profile.service.ts`

```typescript
import { profileService } from '@/services/profile.service'

// Register new user
async registerUser(input: {
  user_id: string
  email: string
  first_name: string
  last_name: string
  phone: string
}): Promise<ProfileDTO>

// Submit KYC documents
async submitKYC(userId: string, documents: { id_front: string; id_back: string; license: string }): Promise<ProfileDTO>

// Approve KYC (admin action)
async approveKYC(userId: string): Promise<ProfileDTO>

// Reject KYC (admin action)
async rejectKYC(userId: string, reason: string): Promise<ProfileDTO>

// Upgrade to owner
async becomeOwner(userId: string): Promise<ProfileDTO>
```

### CarService

**Ubicación**: `src/services/car.service.ts`

```typescript
import { carService } from '@/services/car.service'

// Publish car (activate)
async publishCar(carId: string, ownerId: string): Promise<CarDTO>

// Unpublish car (deactivate)
async unpublishCar(carId: string, ownerId: string): Promise<CarDTO>

// Get car with stats
async getCarWithStats(carId: string): Promise<CarDTO & {
  total_bookings: number
  revenue: number
  rating: number
  occupancy_rate: number
}>
```

### InsuranceService

**Ubicación**: `src/services/insurance.service.ts`

```typescript
import { insuranceService } from '@/services/insurance.service'

// Create policy for booking
async createPolicy(
  bookingId: string,
  coverageLevel: 'basic' | 'standard' | 'premium'
): Promise<InsurancePolicyDTO>

// Submit claim
async submitClaim(
  policyId: string,
  damageDescription: string,
  estimatedAmountCents: number,
  photos: string[]
): Promise<InsuranceClaimDTO>

// Approve claim (admin action)
async approveClaim(claimId: string, approvedAmountCents: number): Promise<InsuranceClaimDTO>

// Reject claim (admin action)
async rejectClaim(claimId: string, reason: string): Promise<InsuranceClaimDTO>
```

---

## 3. SDKs (Data Access Layer)

### BookingSDK

**Ubicación**: `src/lib/sdk/booking.sdk.ts`

```typescript
import { bookingSDK } from '@/lib/sdk/booking.sdk'

// Get by ID
async getById(id: string): Promise<BookingDTO>

// Create
async create(input: TablesInsert<'bookings'>): Promise<BookingDTO>

// Update
async update(id: string, updates: TablesUpdate<'bookings'>): Promise<BookingDTO>

// Search with filters
async search(filters: {
  renter_id?: string
  owner_id?: string
  car_id?: string
  status?: BookingStatus
  start_date_gte?: string
  end_date_lte?: string
}): Promise<BookingDTO[]>
```

### CarSDK

**Ubicación**: `src/lib/sdk/car.sdk.ts`

```typescript
import { carSDK } from '@/lib/sdk/car.sdk'

// Get by ID
async getById(id: string): Promise<CarDTO>

// Create
async create(input: TablesInsert<'cars'>): Promise<CarDTO>

// Update
async update(id: string, updates: TablesUpdate<'cars'>): Promise<CarDTO>

// Delete
async delete(id: string): Promise<void>

// Search
async search(filters: {
  owner_id?: string
  status?: CarStatus
  city?: string
  min_price_cents?: number
  max_price_cents?: number
}): Promise<CarDTO[]>

// Get nearby cars
async getNearby(lat: number, lng: number, radiusKm: number): Promise<CarDTO[]>

// Get available cars for dates
async getAvailable(startDate: string, endDate: string): Promise<CarDTO[]>
```

### ProfileSDK

**Ubicación**: `src/lib/sdk/profile.sdk.ts`

```typescript
import { profileSDK } from '@/lib/sdk/profile.sdk'

// Get by ID
async getById(id: string): Promise<ProfileDTO>

// Create
async create(input: TablesInsert<'profiles'>): Promise<ProfileDTO>

// Update (user-editable fields only)
async update(id: string, updates: TablesUpdate<'profiles'>): Promise<ProfileDTO>

// Admin update (includes kyc, role, etc.)
async adminUpdate(id: string, updates: TablesUpdate<'profiles'>): Promise<ProfileDTO>

// Search
async search(filters: {
  role?: 'renter' | 'owner' | 'admin'
  kyc?: KYCStatus
  email_verified?: boolean
}): Promise<ProfileDTO[]>

// Check if can become owner
async canBecomeOwner(id: string): Promise<boolean>
```

**IMPORTANTE**: Usar `adminUpdate()` para cambios de `kyc` o `role`.

### PaymentSDK, WalletSDK, InsuranceSDK, ReviewSDK

Siguen el mismo patrón: `getById`, `create`, `update`, `search`.

---

## 4. Schemas (Input Validation)

### CreateBookingInputSchema

```typescript
import { CreateBookingInputSchema } from '@/types/schemas'

const CreateBookingInputSchema = z.object({
  car_id: z.string().uuid(),
  renter_id: z.string().uuid(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  extra_driver_count: z.number().int().nonnegative().default(0),
  extra_child_seat_count: z.number().int().nonnegative().default(0),
  extra_gps: z.boolean().default(false),
  insurance_coverage_level: z.enum(['none', 'basic', 'standard', 'premium']).optional(),
  promo_code: z.string().optional(),
})

type CreateBookingInput = z.infer<typeof CreateBookingInputSchema>
```

### CreateCarInputSchema

```typescript
const CreateCarInputSchema = z.object({
  owner_id: z.string().uuid(),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  license_plate: z.string().min(1),
  price_per_day_cents: z.number().int().positive(),
  // ... más campos
})
```

### UpdateProfileInputSchema

```typescript
const UpdateProfileInputSchema = z.object({
  full_name: z.string().optional(),
  phone: z.string().optional(),
  avatar_url: z.string().url().optional(),
  // Nota: kyc y role NO están aquí (solo adminUpdate)
})
```

---

## 5. Database Types

### Tablas Principales

Importar desde `@/types/database.types`:

```typescript
import type { Database } from '@/types/database.types'

// Usar helpers tipados
import type { TablesInsert, TablesUpdate } from '@/types/db'

// Ejemplo
type BookingInsert = TablesInsert<'bookings'>
type BookingUpdate = TablesUpdate<'bookings'>
```

### Enums Importantes

```typescript
// Booking Status
type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'expired'

// Car Status
type CarStatus = 'draft' | 'active' | 'suspended' | 'maintenance'

// KYC Status
type KYCStatus = 'not_started' | 'pending' | 'verified' | 'rejected'

// Payment Status
type PaymentStatus = 'requires_payment' | 'processing' | 'succeeded' | 'failed' | 'refunded' | 'partial_refund' | 'chargeback'

// Insurance Coverage
type CoverageLevel = 'basic' | 'standard' | 'premium'

// User Role
type UserRole = 'renter' | 'owner' | 'admin'

// Onboarding Status
type OnboardingStatus = 'incomplete' | 'complete'
```

---

## 6. Error Handling

### Custom Error Classes

```typescript
import {
  BookingError,
  BookingErrorCode,
  PaymentError,
  PaymentErrorCode,
  InsuranceError,
  InsuranceErrorCode,
} from '@/services/...'

// Ejemplo de uso
try {
  await bookingService.createBooking(input)
} catch (error) {
  if (error instanceof BookingError) {
    console.error(error.code, error.message)
    // BookingErrorCode: BOOKING_NOT_FOUND, INVALID_DATES, etc.
  }
}
```

### Error Codes

**BookingErrorCode**:
- `BOOKING_NOT_FOUND`
- `CAR_NOT_AVAILABLE`
- `INVALID_DATES`
- `INSUFFICIENT_FUNDS`
- `UNAUTHORIZED`

**PaymentErrorCode**:
- `PAYMENT_NOT_FOUND`
- `PAYMENT_FAILED`
- `INSUFFICIENT_FUNDS`
- `INVALID_AMOUNT`

**InsuranceErrorCode**:
- `POLICY_NOT_FOUND`
- `CLAIM_ALREADY_PROCESSED`
- `INVALID_CLAIM_AMOUNT`

---

## 7. Examples

### Example 1: Create a Booking

```typescript
import { bookingService } from '@/services/booking.service'
import type { CreateBookingInput } from '@/types'

async function createBooking(userId: string, carId: string) {
  const input: CreateBookingInput = {
    car_id: carId,
    renter_id: userId,
    start_date: '2025-11-01T10:00:00Z',
    end_date: '2025-11-05T10:00:00Z',
    extra_driver_count: 1,
    extra_child_seat_count: 0,
    extra_gps: true,
    insurance_coverage_level: 'standard',
  }

  try {
    const booking = await bookingService.createBooking(input)
    console.log('Booking created:', booking.id)
    return booking
  } catch (error) {
    console.error('Failed to create booking:', error)
    throw error
  }
}
```

### Example 2: Search Available Cars

```typescript
import { carSDK } from '@/lib/sdk/car.sdk'

async function searchCars(startDate: string, endDate: string) {
  try {
    const cars = await carSDK.getAvailable(startDate, endDate)
    return cars.filter(car => car.status === 'active')
  } catch (error) {
    console.error('Failed to search cars:', error)
    return []
  }
}
```

### Example 3: Update Profile

```typescript
import { profileSDK } from '@/lib/sdk/profile.sdk'
import type { TablesUpdate } from '@/types/db'

async function updateUserProfile(userId: string) {
  const updates: TablesUpdate<'profiles'> = {
    full_name: 'John Doe',
    phone: '+549111234567',
  }

  try {
    const profile = await profileSDK.update(userId, updates)
    return profile
  } catch (error) {
    console.error('Failed to update profile:', error)
    throw error
  }
}
```

### Example 4: Admin Approve KYC

```typescript
import { profileService } from '@/services/profile.service'

async function approveUserKYC(userId: string) {
  try {
    // This uses adminUpdate internally
    const profile = await profileService.approveKYC(userId)
    console.log('KYC approved, status:', profile.kyc) // 'verified'
    return profile
  } catch (error) {
    console.error('Failed to approve KYC:', error)
    throw error
  }
}
```

---

## ⚠️ Common Pitfalls

### 1. Field Names

❌ **WRONG**:
```typescript
const profile = { kyc_status: 'approved' }
```

✅ **CORRECT**:
```typescript
const profile = { kyc: 'verified' }
```

### 2. Input Types

❌ **WRONG**:
```typescript
const input: CreateBookingServiceInput = { ... }
```

✅ **CORRECT**:
```typescript
const input: CreateBookingInput = { ... }
```

### 3. Admin Operations

❌ **WRONG**:
```typescript
await profileSDK.update(userId, { kyc: 'verified' }) // Will fail validation
```

✅ **CORRECT**:
```typescript
await profileSDK.adminUpdate(userId, { kyc: 'verified' })
// OR
await profileService.approveKYC(userId)
```

### 4. Removed Fields

❌ **WRONG**:
```typescript
const input = { extra_wifi: true } // This field no longer exists
```

✅ **CORRECT**:
```typescript
const input = { extra_gps: true }
```

---

## 🎯 Summary for Frontend Development

**When creating frontend components:**

1. ✅ Always import types from `@/types`
2. ✅ Use Services for business logic (not SDKs directly)
3. ✅ Use DTOs for displaying data
4. ✅ Use Input schemas for forms
5. ✅ Check this reference for available fields
6. ✅ Use proper field names (`kyc` not `kyc_status`)
7. ✅ Use proper enum values (`verified` not `approved`)
8. ✅ Handle errors with custom Error classes

**Files to always reference:**
- `src/types/dto.ts` - All DTOs
- `src/types/schemas.ts` - All input schemas
- `src/services/*.service.ts` - Business logic
- This document - Complete API reference

---

**Last updated**: 30 October 2025
**Version**: 1.0.0
**Maintainer**: Backend Team
