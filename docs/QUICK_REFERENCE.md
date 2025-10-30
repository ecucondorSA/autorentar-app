# Quick Reference - AutoRentar Types

**Para desarrollo rápido**: Copia y pega estos snippets según necesites.

---

## 📦 Imports Comunes

```typescript
// DTOs
import type {
  BookingDTO,
  CarDTO,
  ProfileDTO,
  PaymentDTO,
  WalletDTO,
  InsurancePolicyDTO,
  ReviewDTO,
} from '@/types/dto'

// Input Types
import type {
  CreateBookingInput,
  UpdateBookingInput,
  CreateCarInput,
  UpdateCarInput,
  UpdateProfileInput,
} from '@/types'

// Services
import { bookingService } from '@/services/booking.service'
import { carService } from '@/services/car.service'
import { profileService } from '@/services/profile.service'
import { paymentService } from '@/services/payment.service'
import { walletService } from '@/services/wallet.service'
import { insuranceService } from '@/services/insurance.service'

// SDKs (use sparingly)
import { bookingSDK } from '@/lib/sdk/booking.sdk'
import { carSDK } from '@/lib/sdk/car.sdk'
import { profileSDK } from '@/lib/sdk/profile.sdk'

// Database types
import type { TablesInsert, TablesUpdate } from '@/types/db'

// Error handling
import { toError } from '@/lib/errors'
```

---

## 🔄 Type Reference Cheat Sheet

### Booking Fields

```typescript
interface BookingDTO {
  // IDs
  id: string
  car_id: string
  renter_id: string
  owner_id: string

  // Status
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'expired'

  // Dates
  start_date: string        // ISO 8601
  end_date: string          // ISO 8601
  confirmed_at: string | null
  started_at: string | null
  completed_at: string | null

  // Costs (all in cents)
  total_cost_cents: number
  base_price_cents: number
  insurance_cost_cents: number
  platform_fee_cents: number
  deposit_amount_cents: number

  // Extras
  extra_driver_count: number
  extra_child_seat_count: number
  extra_gps: boolean
  // ❌ NO extra_wifi (removed)

  // Insurance
  insurance_coverage_level: 'none' | 'basic' | 'standard' | 'premium' | null

  // Other
  promo_code: string | null
  discount_amount_cents: number
  special_requests: string | null
}
```

### Car Fields

```typescript
interface CarDTO {
  // IDs
  id: string
  owner_id: string

  // Basic Info
  make: string
  model: string
  year: number
  color: string | null
  license_plate: string

  // Status
  status: 'draft' | 'active' | 'suspended' | 'maintenance'

  // Pricing (all in cents)
  price_per_day_cents: number
  price_per_week_cents: number | null
  price_per_month_cents: number | null
  cleaning_fee_cents: number | null
  security_deposit_cents: number | null

  // Location
  latitude: number | null
  longitude: number | null
  address: string | null
  city: string | null

  // Specs
  transmission: string | null
  fuel_type: 'nafta' | 'gasoil' | 'hibrido' | 'electrico' | null
  seats: number | null
  doors: number | null

  // Policies
  cancel_policy: 'flex' | 'moderate' | 'strict' | null
  instant_book: boolean
  min_rental_days: number | null
  max_rental_days: number | null

  // Stats
  rating_avg: number | null
  rating_count: number
  total_bookings: number
}
```

### Profile Fields

```typescript
interface ProfileDTO {
  id: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null

  // Role
  role: 'renter' | 'owner' | 'admin'

  // KYC ✅ NOT kyc_status
  kyc: 'not_started' | 'pending' | 'verified' | 'rejected' | null
  // ✅ 'verified' NOT 'approved'

  // Onboarding ✅ NOT onboarding_status
  onboarding: 'incomplete' | 'complete' | null

  // Verification
  email_verified: boolean | null
  phone_verified: boolean | null

  // Stats
  rating_avg: number | null
  rating_count: number | null

  created_at: string
  updated_at: string
}
```

---

## 🎯 Common Operations

### 1. Create Booking

```typescript
const input: CreateBookingInput = {
  car_id: 'uuid-here',
  renter_id: 'user-uuid',
  start_date: '2025-11-01T10:00:00Z',
  end_date: '2025-11-05T10:00:00Z',
  extra_driver_count: 1,
  extra_child_seat_count: 0,
  extra_gps: true,
  insurance_coverage_level: 'standard',
}

const booking = await bookingService.createBooking(input)
```

### 2. Search Cars

```typescript
// Available cars
const cars = await carSDK.getAvailable('2025-11-01', '2025-11-05')

// Nearby cars
const nearbyCars = await carSDK.getNearby(-34.6037, -58.3816, 10) // Buenos Aires, 10km radius

// Filter by status
const activeCars = await carSDK.search({ status: 'active' })
```

### 3. Update Profile

```typescript
// Regular update (user-editable fields)
const updates: TablesUpdate<'profiles'> = {
  full_name: 'John Doe',
  phone: '+549111234567',
}
const profile = await profileSDK.update(userId, updates)

// Admin update (includes kyc, role)
const adminUpdates: TablesUpdate<'profiles'> = {
  kyc: 'verified',
  role: 'owner',
}
const adminProfile = await profileSDK.adminUpdate(userId, adminUpdates)
```

### 4. Handle Payment

```typescript
const payment = await paymentService.processPayment(
  booking.id,
  userId,
  booking.total_cost_cents,
  paymentMethodId
)
```

### 5. Get Wallet Balance

```typescript
const balance = await walletService.getBalance(userId)
// Returns: { available: 10000, locked: 2000, total: 12000 }
```

---

## ⚠️ Common Mistakes - AVOID

### ❌ WRONG

```typescript
// Wrong type
const input: CreateBookingServiceInput = { ... }

// Wrong field name
profile.kyc_status = 'approved'

// Wrong enum value
profile.kyc = 'approved'

// Removed field
booking.extra_wifi = true

// Using SDK instead of Service
const booking = await bookingSDK.create(input)
```

### ✅ CORRECT

```typescript
// Correct type
const input: CreateBookingInput = { ... }

// Correct field name
profile.kyc = 'verified'

// Correct enum value
profile.kyc = 'verified'

// Correct field
booking.extra_gps = true

// Using Service
const booking = await bookingService.createBooking(input)
```

---

## 🔐 Auth Helpers

```typescript
// Get current user
import { supabase } from '@/lib/supabase'

const { data: { user }, error } = await supabase.auth.getUser()
if (error || !user) throw new Error('Not authenticated')

const userId = user.id
const userEmail = user.email
```

---

## 💰 Price Formatting

```typescript
// Convert cents to dollars/pesos
const formatPrice = (cents: number): string => {
  return `$${(cents / 100).toFixed(2)}`
}

// Example
const price = formatPrice(booking.total_cost_cents) // "$125.50"
```

---

## 📅 Date Formatting

```typescript
// Parse ISO date
const date = new Date(booking.start_date)

// Format for display
const formatDate = (isoString: string): string => {
  const date = new Date(isoString)
  return date.toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Example
const formatted = formatDate('2025-11-01T10:00:00Z') // "1 de noviembre de 2025"
```

---

## 🎨 Status Colors

```typescript
const getStatusColor = (status: BookingStatus): string => {
  const colors: Record<BookingStatus, string> = {
    pending: 'yellow',
    confirmed: 'blue',
    in_progress: 'purple',
    completed: 'green',
    cancelled: 'red',
    no_show: 'orange',
    expired: 'gray',
  }
  return colors[status]
}
```

---

## 🔄 Enum Values

### Booking Status
```typescript
'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'expired'
```

### Car Status
```typescript
'draft' | 'active' | 'suspended' | 'maintenance'
```

### KYC Status
```typescript
'not_started' | 'pending' | 'verified' | 'rejected'
```

### Payment Status
```typescript
'requires_payment' | 'processing' | 'succeeded' | 'failed' | 'refunded' | 'partial_refund' | 'chargeback'
```

### Insurance Coverage
```typescript
'none' | 'basic' | 'standard' | 'premium'
```

### User Role
```typescript
'renter' | 'owner' | 'admin'
```

### Fuel Type
```typescript
'nafta' | 'gasoil' | 'hibrido' | 'electrico'
```

### Cancel Policy
```typescript
'flex' | 'moderate' | 'strict'
```

---

## 📚 More Info

- **Complete API**: `docs/BACKEND_API_REFERENCE.md`
- **Development Guide**: `docs/FRONTEND_DEVELOPMENT_GUIDE.md`
- **Type Definitions**: `src/types/dto.ts`
- **Input Schemas**: `src/types/schemas.ts`

---

**Last updated**: 30 October 2025
